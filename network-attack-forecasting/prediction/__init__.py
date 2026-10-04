"""
Prediction Engine and Threat Scoring Module
============================================

Public API
----------
    from prediction import PredictionEngine, ThreatScorer
    from prediction.schemas import WorldModelOutput, SecurityDecision

Usage
-----
    engine = PredictionEngine()
    decision = engine.process(world_model_output_dict)
    print(decision.to_json())
"""

from prediction.engine import PredictionEngine
from prediction.threat_scorer import ThreatScorer
from prediction.schemas import (
    WorldModelOutput,
    CurrentObservation,
    ModelPredictions,
    SecurityDecision,
)

__all__ = [
    "PredictionEngine",
    "ThreatScorer",
    "WorldModelOutput",
    "CurrentObservation",
    "ModelPredictions",
    "SecurityDecision",
]
