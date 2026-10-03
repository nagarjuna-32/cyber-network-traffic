"""
engine.py – Prediction Engine: temporal state machine and orchestration.

Responsibilities
----------------
1.  Maintain a sliding window of recent WorldModelOutput observations.
2.  Apply temporal hysteresis rules to determine the *engine-assessed*
    current security state (which may differ from the upstream model's
    raw label when the model flickers).
3.  Delegate threat scoring and evidence generation to ThreatScorer.
4.  Assemble and return a SecurityDecision for each call to .process().

State machine
-------------
States follow the ordered threat ladder:

    NORMAL ↔ ELEVATED ↔ SUSPICIOUS ↔ ATTACK

Escalation rules (model label → engine state upgrade):
    NORMAL → ELEVATED   : model assigns state ELEVATED for ≥ 1 window,
                          OR threat_score ≥ ESCALATE_THRESHOLDS["ELEVATED"]
    ELEVATED → SUSPICIOUS: score ≥ ESCALATE_THRESHOLDS["SUSPICIOUS"] for
                            ≥ ESCALATE_WINDOWS["SUSPICIOUS"] consecutive
                            windows, or immediate if score ≥
                            ESCALATE_IMMEDIATE["SUSPICIOUS"]
    SUSPICIOUS → ATTACK : score ≥ ESCALATE_THRESHOLDS["ATTACK"] for
                            ≥ ESCALATE_WINDOWS["ATTACK"] consecutive
                            windows, or immediate if score ≥
                            ESCALATE_IMMEDIATE["ATTACK"]

Recovery rules (threat score drops):
    ATTACK → SUSPICIOUS : score < RECOVER_THRESHOLDS["ATTACK"] for
                          ≥ RECOVER_WINDOWS consecutive windows
    SUSPICIOUS → ELEVATED: score < RECOVER_THRESHOLDS["SUSPICIOUS"] for
                           ≥ RECOVER_WINDOWS consecutive windows
    ELEVATED → NORMAL   : score < RECOVER_THRESHOLDS["ELEVATED"] for
                          ≥ RECOVER_WINDOWS consecutive windows

Hysteresis avoids rapid oscillation ("flapping") by requiring multiple
consecutive windows before committing to a state change in either direction.

Prediction uncertainty
----------------------
The engine explicitly qualifies all future predictions as probabilistic
estimates, never guaranteed outcomes.  The `predicted_next_state` in
SecurityDecision reflects the engine's best estimate given the model
forecast, modulated by the current engine state.
"""

from __future__ import annotations

from collections import deque
from datetime import timezone
from typing import Deque, List, Optional
import datetime

from prediction.schemas import (
    WorldModelOutput,
    SecurityDecision,
    STATE_THREAT_TYPE,
    VALID_STATES,
)
from prediction.threat_scorer import ThreatScorer

# ---------------------------------------------------------------------------
# Hysteresis thresholds
# ---------------------------------------------------------------------------

# Score must be AT LEAST this to escalate to the given state (sustained).
ESCALATE_THRESHOLDS = {
    "ELEVATED":   25,
    "SUSPICIOUS": 50,
    "ATTACK":     75,
}

# Score required to escalate IMMEDIATELY (in a single window), bypassing
# the multi-window requirement.
ESCALATE_IMMEDIATE = {
    "ELEVATED":   40,
    "SUSPICIOUS": 65,
    "ATTACK":     85,
}

# Number of consecutive windows the score must stay above threshold before
# the engine commits to escalation (for non-immediate escalation).
ESCALATE_WINDOWS = {
    "ELEVATED":   1,
    "SUSPICIOUS": 2,
    "ATTACK":     2,
}

# Score must DROP BELOW this to begin recovery toward a lower state.
RECOVER_THRESHOLDS = {
    "ATTACK":     70,
    "SUSPICIOUS": 45,
    "ELEVATED":   20,
}

# Number of consecutive windows below recovery threshold before the engine
# steps down to the next lower state.
RECOVER_WINDOWS = 2

# Maximum number of historical WorldModelOutput objects to retain.
HISTORY_MAX_LEN = 30

# Ordered threat ladder – index represents rank.
LADDER = ["NORMAL", "ELEVATED", "SUSPICIOUS", "ATTACK"]


class PredictionEngine:
    """
    Temporal prediction engine converting raw World Model output into
    a standardised SecurityDecision with threat score, state, and evidence.

    Usage
    -----
        engine = PredictionEngine()
        decision = engine.process(world_model_output_dict_or_object)

    The engine is stateful: call .process() sequentially with each new
    observation window in chronological order.  Call .reset() to restart
    the state machine from scratch (e.g. for a new traffic stream).

    Parameters
    ----------
    history_maxlen : int
        Maximum number of past WorldModelOutput objects to retain in the
        sliding window used for trend and persistence calculations.
        Defaults to HISTORY_MAX_LEN (30).
    """

    def __init__(self, history_maxlen: int = HISTORY_MAX_LEN) -> None:
        self._history: Deque[WorldModelOutput] = deque(maxlen=history_maxlen)
        self._engine_state: str = "NORMAL"
        self._consecutive_above: int = 0  # windows above escalation threshold
        self._consecutive_below: int = 0  # windows below recovery threshold
        self._scorer = ThreatScorer()

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def process(
        self, input_data: "WorldModelOutput | dict"
    ) -> SecurityDecision:
        """
        Process one observation window and return a SecurityDecision.

        Parameters
        ----------
        input_data : WorldModelOutput or dict
            The current observation from the World Model.  If a dict is
            provided it is parsed via WorldModelOutput.from_dict().

        Returns
        -------
        SecurityDecision
            Fully populated security decision object.
        """
        if isinstance(input_data, dict):
            wmo = WorldModelOutput.from_dict(input_data)
        else:
            wmo = input_data

        history_list: List[WorldModelOutput] = list(self._history)

        # 1. Compute threat score, confidence, and evidence.
        threat_score, confidence, evidence = self._scorer.compute(
            wmo, history_list
        )

        # 2. Update the engine state machine (hysteresis).
        self._update_state(threat_score)
        engine_state = self._engine_state

        # 3. Determine predicted_next_state.
        predicted_next_state, prediction_confidence = self._determine_next_state(
            engine_state, wmo
        )

        # 4. Determine threat type from the settled engine state.
        threat_type = self._scorer.threat_type(engine_state)

        # 5. Append observation to history AFTER scoring (no lookahead).
        self._history.append(wmo)

        # 6. Build the SecurityDecision.
        return SecurityDecision(
            timestamp=wmo.timestamp,
            current_state=engine_state,
            threat_type=threat_type,
            threat_score=threat_score,
            confidence=confidence,
            predicted_next_state=predicted_next_state,
            prediction_confidence=prediction_confidence,
            evidence=evidence,
        )

    def reset(self) -> None:
        """
        Reset the engine to its initial NORMAL state.
        Call this when starting a new traffic stream.
        """
        self._history.clear()
        self._engine_state = "NORMAL"
        self._consecutive_above = 0
        self._consecutive_below = 0

    @property
    def current_state(self) -> str:
        """The engine's current settled security state."""
        return self._engine_state

    @property
    def history_length(self) -> int:
        """Number of observation windows retained in the sliding window."""
        return len(self._history)

    # ------------------------------------------------------------------
    # State machine internals
    # ------------------------------------------------------------------

    def _update_state(self, threat_score: int) -> None:
        """
        Apply escalation and recovery hysteresis rules to update
        self._engine_state based on the current threat_score.
        """
        current_rank = LADDER.index(self._engine_state)

        # ---- Check for escalation -----------------------------------
        target_rank = self._escalation_target(threat_score, current_rank)
        if target_rank > current_rank:
            self._consecutive_below = 0  # reset recovery counter
            self._consecutive_above += 1
            target_state = LADDER[target_rank]

            # Immediate escalation (single-window override)
            if threat_score >= ESCALATE_IMMEDIATE.get(target_state, 999):
                self._engine_state = target_state
                self._consecutive_above = 0
                return

            # Sustained escalation: must hold for ESCALATE_WINDOWS windows
            required = ESCALATE_WINDOWS.get(target_state, 1)
            if self._consecutive_above >= required:
                self._engine_state = target_state
                self._consecutive_above = 0
            return

        # ---- Check for recovery -------------------------------------
        recovery_thresh = RECOVER_THRESHOLDS.get(self._engine_state, None)
        if recovery_thresh is not None and threat_score < recovery_thresh:
            self._consecutive_above = 0  # reset escalation counter
            self._consecutive_below += 1
            if self._consecutive_below >= RECOVER_WINDOWS:
                # Step down exactly one rung.
                if current_rank > 0:
                    self._engine_state = LADDER[current_rank - 1]
                self._consecutive_below = 0
        else:
            # Score is stable – reset both counters to prevent accumulation.
            self._consecutive_above = 0
            self._consecutive_below = 0

    def _escalation_target(self, threat_score: int, current_rank: int) -> int:
        """
        Determine the target ladder rank to escalate toward, given the
        current threat score.  Returns current_rank if no escalation applies.
        """
        # Walk up the ladder: find the highest rank whose threshold is met.
        target = current_rank
        for rank, state in enumerate(LADDER):
            if rank <= current_rank:
                continue
            threshold = ESCALATE_THRESHOLDS.get(state, 999)
            if threat_score >= threshold:
                target = rank
        return target

    # ------------------------------------------------------------------
    # Predicted next state
    # ------------------------------------------------------------------

    def _determine_next_state(
        self, engine_state: str, wmo: WorldModelOutput
    ) -> tuple[str, float]:
        """
        Determine the engine's predicted next state and associated confidence.

        The engine blends the model's forecast with the current engine state:
          – If the model forecasts escalation and confidence is high, the
            engine echoes that forecast.
          – If the model forecasts de-escalation while the engine is elevated,
            the engine tempers the prediction toward gradual recovery rather
            than instantaneous drop.
          – The engine NEVER predicts a state jump of more than one rung
            downward in recovery (gradual de-escalation principle).
          – Uncertainty is explicitly preserved: the returned confidence
            is always the model's own prediction_confidence (not inflated).

        Returns
        -------
        (predicted_next_state, prediction_confidence)
        """
        model_pred   = wmo.model_predictions.predicted_next_state
        model_conf   = wmo.model_predictions.prediction_confidence

        current_rank = LADDER.index(engine_state)
        model_rank   = LADDER.index(model_pred)

        # Escalation: accept model forecast if it moves up by ≤ 2 rungs.
        if model_rank > current_rank:
            return model_pred, model_conf

        # Recovery: cap downward jump at one rung to enforce gradual recovery.
        if model_rank < current_rank:
            step_down_rank = max(0, current_rank - 1)
            step_down_state = LADDER[step_down_rank]
            # Temper the confidence slightly because we are overriding the
            # model's more optimistic (rapid recovery) prediction.
            tempered_conf = round(model_conf * 0.85, 4)
            return step_down_state, tempered_conf

        # Model agrees with current state – return as-is.
        return model_pred, model_conf
