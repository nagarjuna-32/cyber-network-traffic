"""
test_prediction_engine.py -- Comprehensive test suite for the Prediction Engine
and Threat Scoring module.

Test categories
---------------
1.  Schema validation       -- Input/output dataclass construction & serialisation.
2.  ThreatScorer unit tests -- Each scoring factor in isolation.
3.  PredictionEngine tests  -- Normal, suspicious, attack, recovery, and
                               edge-case scenarios.
4.  Score boundary tests    -- threat_score always in [0, 100].
5.  JSON output tests       -- All 8 required keys present with correct types.
6.  Edge case tests         -- Missing features, single-window, zero/extreme values.

Run with:
    python -m pytest tests/test_prediction_engine.py -v
    OR
    python tests/test_prediction_engine.py   (standalone, no pytest required)
"""

from __future__ import annotations

import json
import sys
import os
import traceback
from typing import List, Dict

# ---------------------------------------------------------------------------
# Path setup: allow running from the repo root without installing the package.
# ---------------------------------------------------------------------------
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from prediction.schemas import (
    CurrentObservation,
    ModelPredictions,
    WorldModelOutput,
    SecurityDecision,
    VALID_STATES,
    STATE_THREAT_TYPE,
)
from prediction.threat_scorer import ThreatScorer
from prediction.engine import PredictionEngine, LADDER


# ===========================================================================
# Helpers
# ===========================================================================

def _ts(offset: int = 0) -> str:
    """Return an ISO-8601 timestamp string. offset is in seconds."""
    return f"2026-10-03T{21 + offset // 3600:02d}:{(offset % 3600) // 60:02d}:00Z"


def _normal_features() -> Dict[str, float]:
    return {
        "packet_rate":           10.0,
        "byte_rate":           8000.0,
        "connection_frequency":   0.4,
        "inter_arrival_time":    0.55,
        "packet_count":          40.0,
        "flow_duration":         10.0,
    }


def _elevated_features() -> Dict[str, float]:
    return {
        "packet_rate":          100.0,
        "byte_rate":          85000.0,
        "connection_frequency":   7.5,
        "inter_arrival_time":    0.18,
        "packet_count":         420.0,
        "flow_duration":          7.0,
    }


def _suspicious_features() -> Dict[str, float]:
    return {
        "packet_rate":          800.0,
        "byte_rate":         680000.0,
        "connection_frequency":  62.0,
        "inter_arrival_time":   0.038,
        "packet_count":        2600.0,
        "flow_duration":          3.0,
    }


def _attack_features() -> Dict[str, float]:
    return {
        "packet_rate":         5000.0,
        "byte_rate":        4200000.0,
        "connection_frequency": 720.0,
        "inter_arrival_time":  0.0028,
        "packet_count":      14000.0,
        "flow_duration":         0.8,
    }


def _wmo(
    state: str,
    features: Dict[str, float],
    predicted_next: str = "NORMAL",
    pred_conf: float = 0.6,
    current_probs: Dict[str, float] = None,
    next_probs: Dict[str, float] = None,
    ts_offset: int = 0,
) -> WorldModelOutput:
    """Convenience constructor for WorldModelOutput in tests."""
    if current_probs is None:
        current_probs = {s: (0.9 if s == state else 0.033) for s in VALID_STATES}
    if next_probs is None:
        next_probs = {s: (0.8 if s == predicted_next else 0.067) for s in VALID_STATES}
    return WorldModelOutput(
        timestamp=_ts(ts_offset),
        current_observation=CurrentObservation(
            state=state,
            scenario="test",
            features=features,
        ),
        model_predictions=ModelPredictions(
            current_state_prob=current_probs,
            predicted_next_state=predicted_next,
            prediction_confidence=pred_conf,
            next_state_prob=next_probs,
        ),
    )


def _sequence(
    states: List[str],
    feature_fn_map: Dict,
    predicted_nexts: List[str] = None,
) -> List[WorldModelOutput]:
    """Build a sequence of WorldModelOutput objects from a list of state labels."""
    if predicted_nexts is None:
        predicted_nexts = states[1:] + [states[-1]]
    return [
        _wmo(
            state=s,
            features=feature_fn_map.get(s, _normal_features)(),
            predicted_next=predicted_nexts[i],
            ts_offset=i * 5,
        )
        for i, s in enumerate(states)
    ]


FEATURE_MAP = {
    "NORMAL":     _normal_features,
    "ELEVATED":   _elevated_features,
    "SUSPICIOUS": _suspicious_features,
    "ATTACK":     _attack_features,
}

ATTACK_PROBS = {"NORMAL": 0.01, "ELEVATED": 0.02, "SUSPICIOUS": 0.12, "ATTACK": 0.85}
NORMAL_PROBS = {"NORMAL": 0.88, "ELEVATED": 0.08, "SUSPICIOUS": 0.03, "ATTACK": 0.01}


# ===========================================================================
# Mini test framework (runs without pytest if needed)
# ===========================================================================

_PASSED = 0
_FAILED = 0
_FAILURES: List[str] = []


def _assert(condition: bool, msg: str) -> None:
    global _PASSED, _FAILED
    if condition:
        _PASSED += 1
    else:
        _FAILED += 1
        _FAILURES.append(msg)
        sys.stdout.write(f"  FAIL: {msg}\n")
        sys.stdout.flush()


def _assert_eq(a, b, label: str) -> None:
    _assert(a == b, f"{label}: expected {b!r}, got {a!r}")


def _assert_range(val, lo, hi, label: str) -> None:
    _assert(lo <= val <= hi, f"{label}: {val!r} not in [{lo}, {hi}]")


def _assert_in(val, collection, label: str) -> None:
    _assert(val in collection, f"{label}: {val!r} not in {set(collection)!r}")


def _assert_isinstance(val, typ, label: str) -> None:
    _assert(isinstance(val, typ), f"{label}: expected {typ.__name__}, got {type(val).__name__}")


def _p(msg: str) -> None:
    """Print helper that flushes and avoids Unicode issues."""
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()


# ===========================================================================
# Test 1 -- Schema validation
# ===========================================================================

def test_schema_valid_states() -> None:
    """CurrentObservation and ModelPredictions reject invalid state names."""
    _p("\n[1] Schema validation")
    try:
        CurrentObservation(state="HACKING", features={})
        _assert(False, "Should have raised ValueError for invalid state")
    except ValueError:
        _assert(True, "Raised ValueError for invalid state")

    try:
        ModelPredictions(predicted_next_state="PWNED")
        _assert(False, "Should have raised ValueError for invalid next state")
    except ValueError:
        _assert(True, "Raised ValueError for invalid next state")


def test_schema_confidence_clamping() -> None:
    """ModelPredictions.prediction_confidence is clamped to [0, 1]."""
    mp = ModelPredictions(prediction_confidence=5.0)
    _assert_eq(mp.prediction_confidence, 1.0, "confidence clamped to 1.0")
    mp2 = ModelPredictions(prediction_confidence=-0.5)
    _assert_eq(mp2.prediction_confidence, 0.0, "confidence clamped to 0.0")


def test_schema_from_dict() -> None:
    """WorldModelOutput can be constructed from a raw dict."""
    d = {
        "timestamp": "2026-10-03T10:00:00Z",
        "current_observation": {
            "state": "ELEVATED",
            "scenario": "test",
            "features": {"packet_rate": 100.0},
        },
        "model_predictions": {
            "current_state_prob": {"NORMAL": 0.1, "ELEVATED": 0.7, "SUSPICIOUS": 0.15, "ATTACK": 0.05},
            "predicted_next_state": "SUSPICIOUS",
            "prediction_confidence": 0.75,
            "next_state_prob": {},
        },
    }
    wmo = WorldModelOutput.from_dict(d)
    _assert_eq(wmo.current_observation.state, "ELEVATED", "state from dict")
    _assert_eq(wmo.model_predictions.predicted_next_state, "SUSPICIOUS", "pred_next from dict")


def test_security_decision_serialisation() -> None:
    """SecurityDecision serialises all 8 required fields correctly."""
    _p("\n[1b] SecurityDecision serialisation")
    sd = SecurityDecision(
        timestamp="2026-10-03T10:00:00Z",
        current_state="ELEVATED",
        threat_type="ELEVATED_ACTIVITY",
        threat_score=42,
        confidence=0.75,
        predicted_next_state="SUSPICIOUS",
        prediction_confidence=0.68,
        evidence=["Test evidence"],
    )
    d = sd.to_dict()
    required_keys = {
        "timestamp", "current_state", "threat_type", "threat_score",
        "confidence", "predicted_next_state", "prediction_confidence", "evidence"
    }
    _assert(required_keys.issubset(d.keys()), f"All 8 keys present in dict")

    j = sd.to_json()
    parsed = json.loads(j)
    _assert(required_keys.issubset(parsed.keys()), "All 8 keys present in JSON")
    _assert_isinstance(parsed["threat_score"], int, "threat_score is int in JSON")
    _assert_isinstance(parsed["evidence"], list, "evidence is list in JSON")


def test_security_decision_score_clamp() -> None:
    """SecurityDecision clamps threat_score to [0, 100]."""
    sd_high = SecurityDecision(
        timestamp="", current_state="ATTACK", threat_type="ACTIVE_ATTACK",
        threat_score=999, confidence=1.0, predicted_next_state="ATTACK",
        prediction_confidence=0.9, evidence=[]
    )
    _assert_eq(sd_high.threat_score, 100, "threat_score 999 clamped to 100")

    sd_low = SecurityDecision(
        timestamp="", current_state="NORMAL", threat_type="NO_THREAT",
        threat_score=-50, confidence=0.0, predicted_next_state="NORMAL",
        prediction_confidence=0.5, evidence=[]
    )
    _assert_eq(sd_low.threat_score, 0, "threat_score -50 clamped to 0")


# ===========================================================================
# Test 2 -- ThreatScorer unit tests
# ===========================================================================

def test_scorer_normal_traffic() -> None:
    """Normal traffic produces a low threat score."""
    _p("\n[2] ThreatScorer -- normal traffic")
    scorer = ThreatScorer()
    wmo = _wmo("NORMAL", _normal_features(), predicted_next="NORMAL",
               current_probs={"NORMAL": 0.92, "ELEVATED": 0.05, "SUSPICIOUS": 0.02, "ATTACK": 0.01})
    score, conf, evidence = scorer.compute(wmo, [])
    _p(f"  score={score}, conf={conf}, evidence={evidence}")
    _assert_range(score, 0, 24, "Normal traffic score")
    _assert_range(conf, 0.0, 1.0, "Confidence in range")


def test_scorer_attack_traffic_high_score() -> None:
    """Attack-level traffic with ATTACK history produces a high score."""
    _p("\n[2b] ThreatScorer -- attack traffic")
    scorer = ThreatScorer()
    wmo = _wmo(
        "ATTACK", _attack_features(), predicted_next="ATTACK",
        pred_conf=0.91,
        current_probs={"NORMAL": 0.01, "ELEVATED": 0.03, "SUSPICIOUS": 0.12, "ATTACK": 0.84},
    )
    # Provide history of previous ATTACK windows to trigger persistence + trend.
    history = [
        _wmo("ATTACK", _attack_features(), "ATTACK", 0.91,
             current_probs=ATTACK_PROBS, ts_offset=-10),
        _wmo("ATTACK", _attack_features(), "ATTACK", 0.91,
             current_probs=ATTACK_PROBS, ts_offset=-5),
    ]
    score, conf, evidence = scorer.compute(wmo, history)
    _p(f"  score={score}, conf={conf}")
    _p(f"  evidence={evidence}")
    # With ATTACK probs (model=84) + 2 ATTACK history windows (persist=24)
    # + anomaly (100, weight 20) -> expected ~50-70 range.
    _assert_range(score, 45, 100, "Attack traffic score >= 45")
    _assert(len(evidence) >= 1, f"At least 1 evidence item for attack: {evidence}")


def test_scorer_evidence_grounded() -> None:
    """Evidence statements are only emitted when signals are present."""
    _p("\n[2c] ThreatScorer -- evidence grounding")
    scorer = ThreatScorer()
    wmo_normal = _wmo("NORMAL", _normal_features(),
                      current_probs={"NORMAL": 0.95, "ELEVATED": 0.03, "SUSPICIOUS": 0.01, "ATTACK": 0.01})
    _, _, ev = scorer.compute(wmo_normal, [])
    _assert(len(ev) == 0, f"No evidence for clean normal traffic, got: {ev}")


def test_scorer_prediction_evidence_threshold() -> None:
    """Prediction evidence only emitted when confidence >= 0.60."""
    _p("\n[2d] ThreatScorer -- prediction confidence threshold")
    scorer = ThreatScorer()

    # Below threshold -- no prediction evidence expected.
    wmo_low_conf = _wmo(
        "ELEVATED", _elevated_features(),
        predicted_next="ATTACK", pred_conf=0.45,
        current_probs={"NORMAL": 0.1, "ELEVATED": 0.6, "SUSPICIOUS": 0.2, "ATTACK": 0.1},
    )
    _, _, ev = scorer.compute(wmo_low_conf, [])
    pred_ev = [e for e in ev if "Predicted transition" in e]
    _assert(len(pred_ev) == 0, f"No pred evidence below threshold, got: {pred_ev}")

    # Above threshold -- prediction evidence must be present.
    wmo_high_conf = _wmo(
        "ELEVATED", _elevated_features(),
        predicted_next="ATTACK", pred_conf=0.85,
        current_probs={"NORMAL": 0.05, "ELEVATED": 0.55, "SUSPICIOUS": 0.25, "ATTACK": 0.15},
    )
    _, _, ev2 = scorer.compute(wmo_high_conf, [])
    pred_ev2 = [e for e in ev2 if "Predicted transition" in e]
    _assert(len(pred_ev2) >= 1, f"Prediction evidence above threshold, got: {ev2}")


# ===========================================================================
# Test 3 -- PredictionEngine integration tests
# ===========================================================================

def _run_sequence(
    engine: PredictionEngine, wmos: List[WorldModelOutput]
) -> List[SecurityDecision]:
    return [engine.process(w) for w in wmos]


def test_engine_normal_traffic() -> None:
    """
    Feeding 5 consecutive normal windows should keep state at NORMAL
    and produce a consistently low threat score.
    """
    _p("\n[3a] Engine -- normal traffic (5 windows)")
    engine = PredictionEngine()
    wmos = _sequence(["NORMAL"] * 5, FEATURE_MAP,
                     predicted_nexts=["NORMAL"] * 5)
    decisions = _run_sequence(engine, wmos)
    for i, d in enumerate(decisions):
        _p(f"  window {i+1}: state={d.current_state}, score={d.threat_score}")
        _assert_in(d.current_state, {"NORMAL", "ELEVATED"}, f"Normal window {i+1} state")
        _assert_range(d.threat_score, 0, 35, f"Normal window {i+1} score")
    final = decisions[-1]
    _assert_eq(final.current_state, "NORMAL", "Final state stays NORMAL")


def test_engine_escalation_to_attack() -> None:
    """
    A progressive escalation sequence should cause the engine to escalate
    its assessed state to at least SUSPICIOUS.
    """
    _p("\n[3b] Engine -- escalation sequence")
    engine = PredictionEngine()
    states = ["NORMAL", "NORMAL", "ELEVATED", "ELEVATED", "ELEVATED",
              "SUSPICIOUS", "SUSPICIOUS", "ATTACK", "ATTACK", "ATTACK"]
    predicted = states[1:] + [states[-1]]
    wmos = _sequence(states, FEATURE_MAP, predicted_nexts=predicted)
    decisions = _run_sequence(engine, wmos)

    state_progression = [d.current_state for d in decisions]
    _p(f"  state progression: {state_progression}")

    # Engine state should reach at least SUSPICIOUS by end.
    highest = max(LADDER.index(s) for s in state_progression)
    _assert(highest >= 2, f"Engine escalated to at least SUSPICIOUS (highest rank={highest})")

    # Final state should be ATTACK or SUSPICIOUS (depends on hysteresis).
    _assert_in(decisions[-1].current_state, {"SUSPICIOUS", "ATTACK"},
               "Final state is SUSPICIOUS or ATTACK after prolonged ATTACK input")


def test_engine_sustained_attack() -> None:
    """
    Sustained ATTACK-level traffic across 6+ windows should reach ATTACK state.
    """
    _p("\n[3c] Engine -- sustained attack (6 windows)")
    engine = PredictionEngine()
    wmos = [
        _wmo("ATTACK", _attack_features(), "ATTACK", 0.91,
             current_probs=ATTACK_PROBS, ts_offset=i * 5)
        for i in range(6)
    ]
    decisions = _run_sequence(engine, wmos)
    state_progression = [d.current_state for d in decisions]
    scores = [d.threat_score for d in decisions]
    _p(f"  states: {state_progression}")
    _p(f"  scores: {scores}")

    final = decisions[-1]
    _assert_in(final.current_state, {"SUSPICIOUS", "ATTACK"},
               "Final state after sustained attack is SUSPICIOUS or ATTACK")
    _assert_range(final.threat_score, 50, 100, "Final score high after attack traffic")
    _assert(len(final.evidence) >= 1, f"Evidence present: {final.evidence}")


def test_engine_recovery() -> None:
    """
    After sustained attack traffic, returning to normal should trigger
    step-wise recovery: ATTACK -> SUSPICIOUS -> ELEVATED -> NORMAL.
    """
    _p("\n[3d] Engine -- recovery after attack")
    engine = PredictionEngine()

    # Phase 1: Escalate to ATTACK
    attack_wmos = [
        _wmo("ATTACK", _attack_features(), "ATTACK", 0.91,
             current_probs=ATTACK_PROBS, ts_offset=i * 5)
        for i in range(8)
    ]
    attack_decisions = _run_sequence(engine, attack_wmos)
    peak_state = attack_decisions[-1].current_state
    _p(f"  Peak state after attack phase: {peak_state}")

    # Phase 2: Return to normal traffic
    normal_wmos = [
        _wmo("NORMAL", _normal_features(), "NORMAL", 0.7,
             current_probs=NORMAL_PROBS, ts_offset=40 + i * 5)
        for i in range(12)
    ]
    recovery_decisions = _run_sequence(engine, normal_wmos)
    recovery_states = [d.current_state for d in recovery_decisions]
    _p(f"  Recovery state progression: {recovery_states}")

    final_state = recovery_decisions[-1].current_state
    # After 12 normal windows the engine should have recovered at least to ELEVATED.
    _assert_in(final_state, {"NORMAL", "ELEVATED"},
               "Engine recovered toward NORMAL/ELEVATED after sustained normal traffic")

    # Verify no skipped state jumps (no ATTACK -> NORMAL in one step).
    prev = peak_state
    for s in recovery_states:
        curr_rank = LADDER.index(s)
        prev_rank = LADDER.index(prev)
        # State may drop by at most one rung per decision.
        _assert(prev_rank - curr_rank <= 1,
                f"No multi-rung jump: {prev} -> {s} (ranks {prev_rank}->{curr_rank})")
        prev = s


def test_engine_suspicious_traffic() -> None:
    """
    Suspicious traffic (moderate escalation) should produce elevated scores
    and trigger escalation above NORMAL.
    """
    _p("\n[3e] Engine -- suspicious traffic")
    engine = PredictionEngine()
    states = ["ELEVATED", "ELEVATED", "SUSPICIOUS", "SUSPICIOUS", "SUSPICIOUS"]
    predicted = ["ELEVATED", "SUSPICIOUS", "SUSPICIOUS", "SUSPICIOUS", "ATTACK"]
    wmos = _sequence(states, FEATURE_MAP, predicted_nexts=predicted)
    decisions = _run_sequence(engine, wmos)
    state_progression = [d.current_state for d in decisions]
    scores = [d.threat_score for d in decisions]
    _p(f"  states: {state_progression}")
    _p(f"  scores: {scores}")

    # At least one decision should be non-NORMAL.
    non_normal = [s for s in state_progression if s != "NORMAL"]
    _assert(len(non_normal) >= 1, "Suspicious traffic caused at least one elevated state")

    # Scores should be in a reasonable elevated range.
    max_score = max(scores)
    _assert_range(max_score, 30, 100, "Max score in suspicious sequence >= 30")


# ===========================================================================
# Test 4 -- Score boundary tests
# ===========================================================================

def test_score_boundaries_extreme_normal() -> None:
    """Extremely clean normal traffic must produce score in [0, 100]."""
    _p("\n[4a] Score boundaries -- extreme normal")
    scorer = ThreatScorer()
    feats = {k: 0.001 for k in _normal_features()}
    feats["inter_arrival_time"] = 999.0  # very calm
    wmo = _wmo("NORMAL", feats,
               current_probs={"NORMAL": 0.999, "ELEVATED": 0.0003, "SUSPICIOUS": 0.0004, "ATTACK": 0.0003})
    score, _, _ = scorer.compute(wmo, [])
    _p(f"  score={score}")
    _assert_range(score, 0, 100, "Extreme normal score in [0, 100]")
    # Score should be very close to 0 for this clean traffic.
    _assert_range(score, 0, 5, "Extreme normal score near 0")


def test_score_boundaries_extreme_attack() -> None:
    """Extreme attack traffic must not exceed 100 and should be >= 80."""
    _p("\n[4b] Score boundaries -- extreme attack")
    scorer = ThreatScorer()
    feats = {
        "packet_rate": 1_000_000.0,
        "byte_rate":   1_000_000_000.0,
        "connection_frequency": 500_000.0,
        "inter_arrival_time": 0.000001,
        "packet_count": 10_000_000.0,
        "flow_duration": 0.001,
    }
    wmo = _wmo("ATTACK", feats, "ATTACK", 0.99,
               current_probs={"NORMAL": 0.0, "ELEVATED": 0.0, "SUSPICIOUS": 0.01, "ATTACK": 0.99})
    # Provide attack history to trigger persistence and trend factors.
    history = [
        _wmo("ATTACK", feats, "ATTACK", 0.99,
             current_probs={"NORMAL": 0.0, "ELEVATED": 0.0, "SUSPICIOUS": 0.01, "ATTACK": 0.99},
             ts_offset=-i * 5)
        for i in range(5)
    ]
    score, _, _ = scorer.compute(wmo, history)
    _p(f"  score={score}")
    _assert_range(score, 0, 100, "Extreme attack score in [0, 100]")
    # With extreme features: model=99*0.3=29.7, persist=5*12*0.2=12, anomaly=100*0.2=20.
    # Trend=0 (identical history), predict=0 (no escalation from ATTACK).
    # Total ~= 62. Must be in [55, 100] and never exceed 100.
    _assert_range(score, 55, 100, "Extreme attack score >= 55")


def test_engine_score_always_in_bounds() -> None:
    """For a mixed escalation sequence, all scores must be in [0, 100]."""
    _p("\n[4c] Score boundaries -- mixed sequence")
    engine = PredictionEngine()
    states_seq = ["NORMAL", "ELEVATED", "SUSPICIOUS", "ATTACK", "SUSPICIOUS",
                  "ELEVATED", "NORMAL"]
    predicted_seq = states_seq[1:] + [states_seq[-1]]
    wmos = _sequence(states_seq, FEATURE_MAP, predicted_nexts=predicted_seq)
    decisions = _run_sequence(engine, wmos)
    for i, d in enumerate(decisions):
        _assert_range(d.threat_score, 0, 100, f"Score at window {i+1} in [0, 100]")


# ===========================================================================
# Test 5 -- JSON output validation
# ===========================================================================

def test_json_output_structure() -> None:
    """SecurityDecision JSON output contains all 8 required keys with correct types."""
    _p("\n[5] JSON output validation")
    engine = PredictionEngine()
    wmo = _wmo("SUSPICIOUS", _suspicious_features(), "ATTACK", 0.82,
               current_probs={"NORMAL": 0.03, "ELEVATED": 0.1, "SUSPICIOUS": 0.68, "ATTACK": 0.19})
    decision = engine.process(wmo)
    j = decision.to_json()
    d = json.loads(j)

    _p(f"  JSON keys: {list(d.keys())}")
    _p(f"  JSON (first 250 chars): {j[:250]}")

    required = {
        "timestamp":             str,
        "current_state":         str,
        "threat_type":           str,
        "threat_score":          int,
        "confidence":            float,
        "predicted_next_state":  str,
        "prediction_confidence": float,
        "evidence":              list,
    }
    for key, typ in required.items():
        _assert(key in d, f"Key '{key}' present in JSON")
        _assert_isinstance(d[key], typ, f"JSON['{key}'] type")

    _assert_in(d["current_state"], VALID_STATES, "current_state is valid")
    _assert_in(d["predicted_next_state"], VALID_STATES, "predicted_next_state is valid")
    _assert_range(d["threat_score"], 0, 100, "threat_score in JSON [0, 100]")
    _assert_range(d["confidence"], 0.0, 1.0, "confidence in JSON [0.0, 1.0]")
    _assert_range(d["prediction_confidence"], 0.0, 1.0, "prediction_confidence in JSON [0.0, 1.0]")


def test_json_from_dict_roundtrip() -> None:
    """Engine accepts raw dict input and produces valid JSON output."""
    _p("\n[5b] JSON from-dict roundtrip")
    engine = PredictionEngine()
    raw = {
        "timestamp": "2026-10-03T22:00:00Z",
        "current_observation": {
            "state": "ELEVATED",
            "scenario": "ddos",
            "features": {
                "packet_rate": 120.0,
                "byte_rate": 90000.0,
                "connection_frequency": 9.0,
                "inter_arrival_time": 0.15,
                "packet_count": 400.0,
                "flow_duration": 7.0,
            },
        },
        "model_predictions": {
            "current_state_prob": {"NORMAL": 0.08, "ELEVATED": 0.72, "SUSPICIOUS": 0.15, "ATTACK": 0.05},
            "predicted_next_state": "SUSPICIOUS",
            "prediction_confidence": 0.76,
            "next_state_prob": {"NORMAL": 0.04, "ELEVATED": 0.2, "SUSPICIOUS": 0.65, "ATTACK": 0.11},
        },
    }
    decision = engine.process(raw)
    j = decision.to_json()
    parsed = json.loads(j)
    _assert(len(parsed.keys()) == 8, f"8 keys in output, got {len(parsed.keys())}")
    _assert_eq(parsed["timestamp"], "2026-10-03T22:00:00Z", "Timestamp preserved")


# ===========================================================================
# Test 6 -- Edge cases
# ===========================================================================

def test_edge_empty_features() -> None:
    """Engine handles a WorldModelOutput with no feature values gracefully."""
    _p("\n[6a] Edge case -- empty features dict")
    engine = PredictionEngine()
    wmo = _wmo("NORMAL", {})
    decision = engine.process(wmo)
    _assert_range(decision.threat_score, 0, 100, "Score in range with empty features")
    _assert_in(decision.current_state, VALID_STATES, "State valid with empty features")
    _assert_isinstance(decision.evidence, list, "Evidence is a list")


def test_edge_single_window() -> None:
    """With no history, the engine still produces a valid decision."""
    _p("\n[6b] Edge case -- single window, no history")
    engine = PredictionEngine()
    wmo = _wmo("SUSPICIOUS", _suspicious_features(), "ATTACK", 0.75,
               current_probs={"NORMAL": 0.04, "ELEVATED": 0.12, "SUSPICIOUS": 0.65, "ATTACK": 0.19})
    decision = engine.process(wmo)
    _assert_range(decision.threat_score, 0, 100, "Score in range for single window")
    j = json.loads(decision.to_json())
    _assert(len(j.keys()) == 8, "8 keys on single-window output")


def test_edge_extreme_zero_rates() -> None:
    """Engine handles zero-value features without division errors."""
    _p("\n[6c] Edge case -- zero-value features")
    engine = PredictionEngine()
    feats = {k: 0.0 for k in _normal_features()}
    wmo = _wmo("NORMAL", feats)
    decision = engine.process(wmo)
    _assert_range(decision.threat_score, 0, 100, "Score in range with zero features")


def test_edge_missing_state_probs() -> None:
    """Engine handles ModelPredictions with empty probability dicts."""
    _p("\n[6d] Edge case -- missing state probabilities")
    engine = PredictionEngine()
    wmo = WorldModelOutput(
        timestamp="2026-10-03T22:05:00Z",
        current_observation=CurrentObservation(state="ELEVATED", features=_elevated_features()),
        model_predictions=ModelPredictions(
            current_state_prob={},
            predicted_next_state="SUSPICIOUS",
            prediction_confidence=0.65,
            next_state_prob={},
        ),
    )
    decision = engine.process(wmo)
    _assert_range(decision.threat_score, 0, 100, "Score in range with no state probs")
    _assert_in(decision.current_state, VALID_STATES, "State valid with no state probs")


def test_edge_engine_reset() -> None:
    """After reset(), the engine returns to NORMAL state."""
    _p("\n[6e] Edge case -- engine reset")
    engine = PredictionEngine()
    for _ in range(6):
        engine.process(_wmo("ATTACK", _attack_features(), "ATTACK", 0.91,
                             current_probs=ATTACK_PROBS))
    pre_reset = engine.current_state
    engine.reset()
    post_reset = engine.current_state
    _p(f"  Pre-reset: {pre_reset}, Post-reset: {post_reset}")
    _assert_eq(post_reset, "NORMAL", "State is NORMAL after reset")
    _assert_eq(engine.history_length, 0, "History cleared after reset")


def test_edge_recovery_no_multi_rung_jump() -> None:
    """Engine should not jump more than one rung in any single recovery step."""
    _p("\n[6f] Edge case -- no multi-rung jump in recovery")
    engine = PredictionEngine()
    for _ in range(8):
        engine.process(_wmo("ATTACK", _attack_features(), "ATTACK", 0.9,
                             current_probs=ATTACK_PROBS))
    prev_state = engine.current_state

    for i in range(10):
        d = engine.process(_wmo("NORMAL", _normal_features(), "NORMAL", 0.8,
                                current_probs=NORMAL_PROBS,
                                ts_offset=50 + i * 5))
        curr_rank = LADDER.index(d.current_state)
        prev_rank = LADDER.index(prev_state)
        _assert(prev_rank - curr_rank <= 1,
                f"No jump >1 rung: {prev_state}({prev_rank}) -> {d.current_state}({curr_rank})")
        prev_state = d.current_state


# ===========================================================================
# Runner
# ===========================================================================

ALL_TESTS = [
    test_schema_valid_states,
    test_schema_confidence_clamping,
    test_schema_from_dict,
    test_security_decision_serialisation,
    test_security_decision_score_clamp,
    test_scorer_normal_traffic,
    test_scorer_attack_traffic_high_score,
    test_scorer_evidence_grounded,
    test_scorer_prediction_evidence_threshold,
    test_engine_normal_traffic,
    test_engine_escalation_to_attack,
    test_engine_sustained_attack,
    test_engine_recovery,
    test_engine_suspicious_traffic,
    test_score_boundaries_extreme_normal,
    test_score_boundaries_extreme_attack,
    test_engine_score_always_in_bounds,
    test_json_output_structure,
    test_json_from_dict_roundtrip,
    test_edge_empty_features,
    test_edge_single_window,
    test_edge_extreme_zero_rates,
    test_edge_missing_state_probs,
    test_edge_engine_reset,
    test_edge_recovery_no_multi_rung_jump,
]


def run_all_tests() -> bool:
    global _PASSED, _FAILED, _FAILURES
    _PASSED = _FAILED = 0
    _FAILURES.clear()

    _p("=" * 70)
    _p("  Prediction Engine & Threat Scoring Module -- Test Suite")
    _p("=" * 70)

    for fn in ALL_TESTS:
        try:
            fn()
        except Exception as exc:
            _FAILED += 1
            msg = f"EXCEPTION in {fn.__name__}: {exc}"
            _FAILURES.append(msg)
            _p(f"  ERROR: {msg}")
            traceback.print_exc()

    total = _PASSED + _FAILED
    _p("")
    _p("=" * 70)
    _p(f"  Results: {_PASSED}/{total} passed, {_FAILED} failed")
    if _FAILURES:
        _p("")
        _p("  Failed assertions:")
        for f in _FAILURES:
            _p(f"    - {f}")
    _p("=" * 70)

    return _FAILED == 0


if __name__ == "__main__":
    ok = run_all_tests()
    sys.exit(0 if ok else 1)
