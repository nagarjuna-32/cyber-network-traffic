"""
schemas.py – Data contracts for the Prediction Engine and Threat Scoring module.

This module defines three input structures and one output structure.

Input structures (World Model → Prediction Engine):
----------------------------------------------------
  CurrentObservation  – The current network window's feature snapshot and
                        the raw state label produced by the upstream model.
  ModelPredictions    – Probability distributions over current and next
                        states, plus a predicted next-state label and its
                        associated confidence value.
  WorldModelOutput    – Top-level envelope that binds a timestamp to a
                        CurrentObservation and ModelPredictions pair.

Output structure (Prediction Engine → consumers):
-------------------------------------------------
  SecurityDecision    – The standardised security decision object emitted
                        by this module.  All eight required fields are
                        represented; the class provides both dict and JSON
                        serialisation helpers.

No third-party dependencies are used in this file.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional


# ---------------------------------------------------------------------------
# Allowed state names (lowest risk → highest risk).
# ---------------------------------------------------------------------------

VALID_STATES = frozenset({"NORMAL", "ELEVATED", "SUSPICIOUS", "ATTACK"})

# Human-readable threat type labels keyed on the *current* security state.
STATE_THREAT_TYPE: Dict[str, str] = {
    "NORMAL":     "NO_THREAT",
    "ELEVATED":   "ELEVATED_ACTIVITY",
    "SUSPICIOUS": "SUSPICIOUS_TRAFFIC",
    "ATTACK":     "ACTIVE_ATTACK",
}


# ---------------------------------------------------------------------------
# Input schemas
# ---------------------------------------------------------------------------

@dataclass
class CurrentObservation:
    """
    Represents a single temporal observation window as produced by the
    upstream feature engineering / world model pipeline.

    Attributes
    ----------
    state : str
        The most likely state label assigned by the upstream model for the
        current window.  Must be one of NORMAL | ELEVATED | SUSPICIOUS | ATTACK.
    scenario : str
        A free-text label describing the simulation scenario or data source
        (e.g. "normal", "ddos", "mixed_escalation").  Used for logging only.
    features : dict
        Key network traffic statistics extracted for this window.  The
        following keys are used by the scoring engine when present:

            packet_rate         – Packets per second.
            byte_rate           – Bytes per second.
            connection_frequency – Connections attempted per second.
            inter_arrival_time  – Mean inter-packet arrival time (seconds).
            packet_count        – Total packets in the window.
            flow_duration       – Duration of the aggregated flow (seconds).

        Unknown keys are silently ignored, enabling forward-compatibility.
    """

    state: str
    scenario: str = "unknown"
    features: Dict[str, float] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.state not in VALID_STATES:
            raise ValueError(
                f"CurrentObservation.state must be one of {sorted(VALID_STATES)}, "
                f"got '{self.state}'"
            )

    @classmethod
    def from_dict(cls, data: dict) -> "CurrentObservation":
        return cls(
            state=data["state"],
            scenario=data.get("scenario", "unknown"),
            features={k: float(v) for k, v in data.get("features", {}).items()},
        )


@dataclass
class ModelPredictions:
    """
    Probability distributions and point estimates produced by the temporal
    World Model.

    Attributes
    ----------
    current_state_prob : dict
        Probability mass over {NORMAL, ELEVATED, SUSPICIOUS, ATTACK} for the
        *current* observation window.  Values should sum to approximately 1.0.
    predicted_next_state : str
        The argmax state label forecast for the *next* window.
    prediction_confidence : float
        The model's self-assessed confidence in the next-state prediction,
        expressed in [0.0, 1.0].  This is the model's own uncertainty
        estimate; it is NOT the same as the final SecurityDecision.confidence.
    next_state_prob : dict
        Full probability distribution over states for the next window.
        May be empty if the upstream model only provides a point estimate.
    """

    current_state_prob: Dict[str, float] = field(default_factory=dict)
    predicted_next_state: str = "NORMAL"
    prediction_confidence: float = 0.5
    next_state_prob: Dict[str, float] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.predicted_next_state not in VALID_STATES:
            raise ValueError(
                f"ModelPredictions.predicted_next_state must be one of "
                f"{sorted(VALID_STATES)}, got '{self.predicted_next_state}'"
            )
        self.prediction_confidence = float(
            max(0.0, min(1.0, self.prediction_confidence))
        )

    @classmethod
    def from_dict(cls, data: dict) -> "ModelPredictions":
        return cls(
            current_state_prob={
                k: float(v)
                for k, v in data.get("current_state_prob", {}).items()
            },
            predicted_next_state=data.get("predicted_next_state", "NORMAL"),
            prediction_confidence=float(data.get("prediction_confidence", 0.5)),
            next_state_prob={
                k: float(v)
                for k, v in data.get("next_state_prob", {}).items()
            },
        )

    def prob(self, state: str) -> float:
        """Return the current-window probability for *state*; 0.0 if absent."""
        return self.current_state_prob.get(state, 0.0)

    def next_prob(self, state: str) -> float:
        """Return the next-window probability for *state*; 0.0 if absent."""
        return self.next_state_prob.get(state, 0.0)


@dataclass
class WorldModelOutput:
    """
    Top-level input envelope expected by the Prediction Engine.

    Attributes
    ----------
    timestamp : str
        ISO-8601 timestamp of the observation window (e.g. "2026-10-03T21:50:00Z").
    current_observation : CurrentObservation
        Feature snapshot and state label for the current window.
    model_predictions : ModelPredictions
        Probabilistic state forecasts for the current and next windows.
    """

    timestamp: str
    current_observation: CurrentObservation
    model_predictions: ModelPredictions

    @classmethod
    def from_dict(cls, data: dict) -> "WorldModelOutput":
        return cls(
            timestamp=data["timestamp"],
            current_observation=CurrentObservation.from_dict(
                data["current_observation"]
            ),
            model_predictions=ModelPredictions.from_dict(
                data.get("model_predictions", {})
            ),
        )


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

@dataclass
class SecurityDecision:
    """
    Standardised security decision object emitted by the Prediction Engine.

    This is the **only** output type that should cross the module boundary;
    downstream consumers (API layer, dashboard, alert engine) must accept
    this schema.

    Fields
    ------
    timestamp : str
        ISO-8601 timestamp – carried through from the WorldModelOutput.
    current_state : str
        The engine's assessed security state for the current window,
        incorporating temporal hysteresis.  One of NORMAL | ELEVATED |
        SUSPICIOUS | ATTACK.
    threat_type : str
        Human-readable threat category derived from current_state.
    threat_score : int
        Composite risk score in the inclusive range [0, 100].
        This is NOT model probability.  It is a multi-factor score combining:
          • Model probability across all state classes  (30 %)
          • State persistence across recent windows     (20 %)
          • Escalation trend in traffic metrics         (20 %)
          • Abnormal traffic indicator deviation        (20 %)
          • Predicted next-state severity impact        (10 %)
    confidence : float
        Engine's aggregate confidence in the *current* state assessment,
        expressed in [0.0, 1.0].  Derived from the model's current-state
        probability mass on the assessed state.
    predicted_next_state : str
        The engine's (non-guaranteed) forecast of the next security state.
    prediction_confidence : float
        Confidence associated with predicted_next_state, in [0.0, 1.0].
        Reflects uncertainty – a value of 0.5 means near-equal probability
        across possible transitions.
    evidence : list[str]
        A list of human-readable evidence statements.  Each statement
        is grounded in an observable feature anomaly, trend, or model
        signal.  Statements are never invented; they are suppressed when
        the underlying signal is absent or below threshold.
    """

    timestamp: str
    current_state: str
    threat_type: str
    threat_score: int
    confidence: float
    predicted_next_state: str
    prediction_confidence: float
    evidence: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Return a plain dict suitable for JSON serialisation."""
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        """Return a formatted JSON string."""
        return json.dumps(self.to_dict(), indent=indent)

    def __post_init__(self) -> None:
        # Hard-clamp score into [0, 100] – belt-and-suspenders safety.
        self.threat_score = int(max(0, min(100, self.threat_score)))
        self.confidence = round(float(max(0.0, min(1.0, self.confidence))), 4)
        self.prediction_confidence = round(
            float(max(0.0, min(1.0, self.prediction_confidence))), 4
        )
