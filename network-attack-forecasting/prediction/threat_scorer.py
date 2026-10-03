"""
threat_scorer.py – Multi-factor threat scoring and evidence generation.

Design principles
-----------------
1.  The threat score is NOT model probability.
    It is a composite integer in [0, 100] assembled from five independent
    factors, each contributing a normalised sub-score.

2.  Evidence statements are grounded in observable signals only.
    A statement is never emitted unless the corresponding metric or model
    signal exceeds the documented threshold.

3.  All arithmetic is deterministic given the same inputs; there is no
    randomness or external state inside this class.

4.  Baseline thresholds are drawn from the simulation anchor values defined
    in simulation/common.py (MIXED_ANCHORS "NORMAL" tier), so the scorer
    understands what "normal" looks like for this dataset family.

Scoring formula
---------------
    ThreatScore = clamp(
        w_model   * S_model   +
        w_persist * S_persist +
        w_trend   * S_trend   +
        w_anomaly * S_anomaly +
        w_predict * S_predict,
        0, 100
    )

    Weights:  model=30, persist=20, trend=20, anomaly=20, predict=10
    All sub-scores are in the normalised range [0, 100] before weighting.

Evidence-grounding rules
------------------------
    Anomaly evidence      – emitted when a metric deviates ≥ ANOMALY_THRESHOLD
                            above or below normal baseline values.
    Trend evidence        – emitted only when at least two historical windows
                            are available and the metric shows consistent
                            directional change across them.
    Persistence evidence  – emitted only after at least PERSIST_MIN_WINDOWS
                            consecutive elevated windows.
    Prediction evidence   – emitted only when the model's predicted next state
                            is more severe than current and prediction
                            confidence ≥ PRED_CONF_THRESHOLD.
"""

from __future__ import annotations

from typing import List, Tuple, Dict

from prediction.schemas import (
    WorldModelOutput,
    VALID_STATES,
    STATE_THREAT_TYPE,
)

# ---------------------------------------------------------------------------
# Scoring weights (must sum to 100)
# ---------------------------------------------------------------------------

W_MODEL   = 30
W_PERSIST = 20
W_TREND   = 20
W_ANOMALY = 20
W_PREDICT = 10

assert W_MODEL + W_PERSIST + W_TREND + W_ANOMALY + W_PREDICT == 100

# ---------------------------------------------------------------------------
# Baseline "NORMAL" traffic thresholds
# Derived from simulation/common.py MIXED_ANCHORS "NORMAL" anchor values.
# ---------------------------------------------------------------------------

BASELINE = {
    "packet_rate":           15.0,    # packets/sec  (55 packets / ~3.7s typical)
    "byte_rate":            12000.0,  # bytes/sec
    "connection_frequency":   0.60,   # connections/sec
    "inter_arrival_time":     0.50,   # seconds (higher is calmer)
    "packet_count":          55.0,    # packets per flow window
    "flow_duration":         10.0,    # seconds
}

# Ratio above baseline that triggers an anomaly evidence statement.
ANOMALY_RATIO_HIGH = 2.5   # metric > baseline * 2.5  → elevated
ANOMALY_RATIO_IAT  = 0.3   # inter_arrival_time < baseline * 0.3 → suspiciously fast

# Minimum trend change (% of baseline) across two consecutive windows to
# emit a trend evidence statement.
TREND_MIN_DELTA_PCT = 15.0

# Minimum number of consecutive non-NORMAL windows before we emit a
# persistence evidence statement.
PERSIST_MIN_WINDOWS = 2

# Minimum model prediction confidence to emit a prediction-based evidence item.
PRED_CONF_THRESHOLD = 0.60

# State index for severity comparison.
STATE_RANK: Dict[str, int] = {
    "NORMAL":     0,
    "ELEVATED":   1,
    "SUSPICIOUS": 2,
    "ATTACK":     3,
}


class ThreatScorer:
    """
    Stateless threat scorer.

    A single instance can be reused across many calls.  All history-dependent
    context (persistence, trend windows) is passed in as arguments, keeping
    this class free of mutable state.
    """

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def compute(
        self,
        wmo: WorldModelOutput,
        history: List[WorldModelOutput],
    ) -> Tuple[int, float, List[str]]:
        """
        Compute the composite threat score, overall engine confidence,
        and evidence list for *wmo* given recent *history*.

        Parameters
        ----------
        wmo : WorldModelOutput
            The current observation window to score.
        history : list[WorldModelOutput]
            Ordered list of previous WorldModelOutput objects (oldest first,
            most recent last).  May be empty on the first call.

        Returns
        -------
        threat_score : int
            Integer in [0, 100].
        confidence : float
            Engine confidence in the current-state assessment, in [0.0, 1.0].
        evidence : list[str]
            Human-readable, grounded evidence statements.
        """
        obs   = wmo.current_observation
        preds = wmo.model_predictions
        feats = obs.features

        evidence: List[str] = []

        # --- Factor 1: model probability sub-score ---------------------
        s_model = self._score_model_probs(preds, evidence)

        # --- Factor 2: persistence sub-score --------------------------
        consecutive = self._count_consecutive_elevated(history)
        s_persist   = self._score_persistence(consecutive, obs.state, evidence)

        # --- Factor 3: escalation trend sub-score ---------------------
        s_trend = self._score_trend(feats, history, evidence)

        # --- Factor 4: anomaly indicator sub-score --------------------
        s_anomaly = self._score_anomalies(feats, evidence)

        # --- Factor 5: predicted next-state impact sub-score ----------
        s_predict = self._score_prediction(obs.state, preds, evidence)

        # --- Composite score ------------------------------------------
        raw_score = (
            W_MODEL   * s_model   / 100.0 +
            W_PERSIST * s_persist / 100.0 +
            W_TREND   * s_trend   / 100.0 +
            W_ANOMALY * s_anomaly / 100.0 +
            W_PREDICT * s_predict / 100.0
        )
        threat_score = int(max(0, min(100, round(raw_score))))

        # --- Confidence: model's probability on the current assessed state ---
        assessed_state = obs.state
        confidence = preds.prob(assessed_state)
        if confidence == 0.0:
            # Fall back to max probability mass if upstream omitted breakdown.
            confidence = max(preds.current_state_prob.values(), default=0.5)
        confidence = round(float(max(0.0, min(1.0, confidence))), 4)

        # Deduplicate while preserving insertion order.
        seen = set()
        unique_evidence: List[str] = []
        for e in evidence:
            if e not in seen:
                seen.add(e)
                unique_evidence.append(e)

        return threat_score, confidence, unique_evidence

    def threat_type(self, current_state: str) -> str:
        """Return the human-readable threat category for *current_state*."""
        return STATE_THREAT_TYPE.get(current_state, "UNKNOWN")

    # ------------------------------------------------------------------
    # Factor 1 – Model probability sub-score
    # ------------------------------------------------------------------

    def _score_model_probs(self, preds, evidence: List[str]) -> float:
        """
        Weight each state's probability by its threat severity level and
        return a score in [0, 100].

        NORMAL     → contributes 0 to score
        ELEVATED   → contributes 33 * P(ELEVATED)
        SUSPICIOUS → contributes 66 * P(SUSPICIOUS)
        ATTACK     → contributes 100 * P(ATTACK)

        If no probability distribution is available, fall back to a
        state-rank heuristic on current_state_prob keys.
        """
        probs = preds.current_state_prob
        if not probs:
            return 0.0

        score = (
            probs.get("ELEVATED",   0.0) * 33.0 +
            probs.get("SUSPICIOUS", 0.0) * 66.0 +
            probs.get("ATTACK",     0.0) * 100.0
        )
        return float(min(100.0, score))

    # ------------------------------------------------------------------
    # Factor 2 – Persistence sub-score
    # ------------------------------------------------------------------

    def _count_consecutive_elevated(
        self, history: List[WorldModelOutput]
    ) -> int:
        """
        Count consecutive trailing windows in *history* where the observed
        state was non-NORMAL (ELEVATED, SUSPICIOUS, or ATTACK).
        Returns an integer ≥ 0.
        """
        count = 0
        for wmo in reversed(history):
            if wmo.current_observation.state != "NORMAL":
                count += 1
            else:
                break
        return count

    def _score_persistence(
        self,
        consecutive: int,
        current_state: str,
        evidence: List[str],
    ) -> float:
        """
        Convert consecutive-window count into a sub-score in [0, 100].
        Evidence is emitted only once the count meets PERSIST_MIN_WINDOWS.

        Sub-score grows linearly from 0 at 0 windows to 100 at 10 windows.
        """
        if consecutive == 0:
            return 0.0

        # Scale: 1 window=12, 2=24, 4=48, 6=72, 8=96, 9+=100.
        # Uses a slightly faster ramp (12 per window) so that 8+ attack
        # windows reliably saturate this factor.
        score = min(100.0, consecutive * 12.0)

        if consecutive >= PERSIST_MIN_WINDOWS:
            evidence.append(
                f"Persistent suspicious behavior observed over "
                f"{consecutive} consecutive elevated window"
                f"{'s' if consecutive != 1 else ''}"
            )

        return score

    # ------------------------------------------------------------------
    # Factor 3 – Escalation trend sub-score
    # ------------------------------------------------------------------

    def _score_trend(
        self,
        feats: Dict[str, float],
        history: List[WorldModelOutput],
        evidence: List[str],
    ) -> float:
        """
        Measure directional change in key metrics between the current window
        and the most recent historical window.

        Sub-score in [0, 100]:
          – No history → 0.0
          – % increase above TREND_MIN_DELTA_PCT drives the score linearly
            up to 100 at 5× baseline threshold.

        Evidence is emitted per-metric when the absolute percentage change
        exceeds TREND_MIN_DELTA_PCT.
        """
        if not history:
            return 0.0

        prev_feats = history[-1].current_observation.features
        if not prev_feats:
            return 0.0

        trend_score_components: List[float] = []

        rising_metrics = [
            ("packet_rate",           "Traffic (packet rate)"),
            ("byte_rate",             "Traffic (byte rate)"),
            ("connection_frequency",  "Connection frequency"),
        ]
        falling_is_bad = [
            ("inter_arrival_time",    "Inter-arrival time"),
        ]

        for key, label in rising_metrics:
            curr_val = feats.get(key, 0.0)
            prev_val = prev_feats.get(key, 0.0)
            if prev_val <= 0:
                continue
            delta_pct = ((curr_val - prev_val) / prev_val) * 100.0
            if delta_pct >= TREND_MIN_DELTA_PCT:
                evidence.append(
                    f"{label} increasing over consecutive windows "
                    f"(+{delta_pct:.1f}% increase)"
                )
                trend_score_components.append(min(100.0, delta_pct * 2.0))

        for key, label in falling_is_bad:
            curr_val = feats.get(key, None)
            prev_val = prev_feats.get(key, None)
            if curr_val is None or prev_val is None or prev_val <= 0:
                continue
            delta_pct = ((prev_val - curr_val) / prev_val) * 100.0  # drop is bad
            if delta_pct >= TREND_MIN_DELTA_PCT:
                evidence.append(
                    f"{label} dropping over consecutive windows "
                    f"(-{delta_pct:.1f}% decrease, packets arriving faster)"
                )
                trend_score_components.append(min(100.0, delta_pct * 1.5))

        if not trend_score_components:
            return 0.0
        return float(min(100.0, sum(trend_score_components) / len(trend_score_components)))

    # ------------------------------------------------------------------
    # Factor 4 – Anomaly indicator sub-score
    # ------------------------------------------------------------------

    def _score_anomalies(
        self,
        feats: Dict[str, float],
        evidence: List[str],
    ) -> float:
        """
        Compare current feature values against the NORMAL baseline.
        Each anomalous metric contributes additively to the sub-score.
        Sub-score is capped at 100.
        """
        import math
        score = 0.0

        # High-side anomalies: packet_rate, byte_rate, connection_frequency.
        # Contribution uses log2(ratio) so that very extreme values (100x+) saturate
        # toward the per-metric cap without requiring an arbitrarily large multiplier.
        # max contribution per metric: 40 pts  ->  3 metrics = 120 -> clamped to 100.
        #   ratio=2.5  -> log2=1.32 -> 10.6
        #   ratio=10   -> log2=3.32 -> 26.6
        #   ratio=50   -> log2=5.64 -> 45.1 -> clamped to 40
        #   ratio=333  -> log2=8.38 -> 67.1 -> clamped to 40
        rising_checks = [
            ("packet_rate",          BASELINE["packet_rate"],          "Abnormal packet rate detected"),
            ("byte_rate",            BASELINE["byte_rate"],            "Abnormal byte rate detected"),
            ("connection_frequency", BASELINE["connection_frequency"],  "Abnormal connection frequency detected"),
        ]

        for key, baseline_val, label in rising_checks:
            val = feats.get(key, None)
            if val is None:
                continue
            if baseline_val > 0 and val > baseline_val * ANOMALY_RATIO_HIGH:
                ratio = val / baseline_val
                contribution = min(40.0, math.log2(ratio) * 8.0)
                score += contribution
                evidence.append(
                    f"{label} ({val:.2f} vs baseline {baseline_val:.2f}, "
                    f"{ratio:.1f}x normal)"
                )

        # Low-side anomaly: inter_arrival_time (very small = packets arriving fast).
        iat = feats.get("inter_arrival_time", None)
        if iat is not None:
            baseline_iat = BASELINE["inter_arrival_time"]
            if iat < baseline_iat * ANOMALY_RATIO_IAT and iat > 0:
                ratio_iat = baseline_iat / iat
                contribution = min(40.0, math.log2(ratio_iat) * 8.0)
                score += contribution
                evidence.append(
                    f"Unusually low inter-arrival time detected "
                    f"({iat:.4f}s vs baseline {baseline_iat:.2f}s), "
                    f"indicating rapid packet bursting"
                )

        return float(min(100.0, score))


    # ------------------------------------------------------------------
    # Factor 5 – Predicted next-state impact sub-score
    # ------------------------------------------------------------------

    def _score_prediction(
        self,
        current_state: str,
        preds,
        evidence: List[str],
    ) -> float:
        """
        Add a score bonus when the model forecasts a transition to a more
        severe state with sufficient confidence.

        IMPORTANT: The engine does not treat predictions as guaranteed.
        Evidence is explicitly qualified with confidence level.

        Sub-score:
          – No escalation predicted → 0
          – Predicted escalation by 1 step with conf ≥ threshold → 50
          – Predicted escalation by 2 steps                        → 75
          – Predicted escalation by 3 steps (to ATTACK)            → 100
          – Scaled down proportionally when conf < 1.0
        """
        predicted = preds.predicted_next_state
        conf      = preds.prediction_confidence

        if conf < PRED_CONF_THRESHOLD:
            return 0.0

        curr_rank = STATE_RANK.get(current_state, 0)
        next_rank = STATE_RANK.get(predicted,      0)
        delta     = next_rank - curr_rank

        if delta <= 0:
            return 0.0

        base_score = {1: 50.0, 2: 75.0}.get(delta, 100.0)
        scaled     = base_score * conf

        evidence.append(
            f"Predicted transition toward {predicted} state "
            f"(model confidence: {conf:.2f})"
        )
        return float(min(100.0, scaled))
