"""
End-to-End Pipeline Integration Tests for NetForecast AI.

Verifies that sample network traffic travels through the complete pipeline:
Input -> Extraction -> Preprocessing -> Windowing -> Feature State + Graph ->
World Model -> K-Step Forecast -> Risk / Attack Stage -> MITRE Mapping ->
XAI Attribution -> Alert Engine -> API Response.
"""

import sys
import unittest
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.app import app, generate_flows_for_scenario
from pipeline.orchestrator import EndToEndPipeline


class TestEndToEndPipeline(unittest.TestCase):
    """
    Validates end-to-end pipeline execution from traffic inputs to security alerts.
    """

    @classmethod
    def setUpClass(cls):
        cls.pipeline = EndToEndPipeline()
        cls.client = TestClient(app)

    def test_pipeline_normal_traffic(self):
        flows = generate_flows_for_scenario("normal", rows=30, seed=42)
        df = pd.DataFrame(flows)

        result = self.pipeline.run(df, scenario_name="normal")

        # 1. Output structure
        self.assertIsNotNone(result)
        self.assertIn("decision", result.to_dict())
        self.assertIn("network_graph", result.to_dict())
        self.assertIn("timeline", result.to_dict())
        self.assertIn("pipeline_status", result.to_dict())

        # 2. Decision fields
        decision = result.decision
        self.assertIn(decision["current_state"], ["NORMAL", "ELEVATED", "SUSPICIOUS", "ATTACK"])
        self.assertGreaterEqual(decision["threat_score"], 0)
        self.assertLessEqual(decision["threat_score"], 100)

        # 3. Graph structure
        graph = result.network_graph
        self.assertGreater(graph["num_nodes"], 0)
        self.assertGreater(graph["num_edges"], 0)

        # 4. Pipeline stages all passed
        status = result.pipeline_status
        for stage, state in status.items():
            self.assertEqual(state, "PASS", f"Stage '{stage}' failed!")

    def test_pipeline_attack_traffic(self):
        flows = generate_flows_for_scenario("syn_flood", rows=40, seed=123)
        df = pd.DataFrame(flows)

        result = self.pipeline.run(df, scenario_name="syn_flood")

        # Attack scenario should elevate threat score and generate alert or evidence
        decision = result.decision
        self.assertIn(decision["risk_level"], ["LOW", "MEDIUM", "HIGH", "CRITICAL"])
        self.assertIsInstance(decision["evidence"], list)

        # MITRE mapping
        mitre = result.mitre_mapping
        self.assertTrue(mitre["technique_id"].startswith("T"))
        self.assertTrue(len(mitre["tactic"]) > 0)

        # XAI
        xai = result.explainability
        self.assertGreater(len(xai["important_features"]), 0)
        self.assertIsInstance(xai["feature_contributions"], dict)

        # Forecast steps
        self.assertEqual(len(result.forecast_steps), self.pipeline.forecast_horizon)
        for step in result.forecast_steps:
            self.assertIn("threat_score", step)
            self.assertIn("state", step)
            self.assertIn("stage", step)

    def test_api_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["isBackendConnected"])
        self.assertIn("modelLoaded", data)

    def test_api_predict_current(self):
        res = self.client.get("/api/predict/current")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("current_state", data)
        self.assertIn("threat_score", data)
        self.assertIn("timeline", data)
        self.assertIn("network_graph", data)

    def test_api_simulate_endpoint(self):
        payload = {"scenario": "scanning", "rows": 25}
        res = self.client.post("/api/simulate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("decision", data)
        self.assertIn("alerts", data)
        self.assertIn("mitre_mapping", data)
        self.assertEqual(data["mitre_mapping"]["technique_id"], "T1046")

    def test_api_traffic_analyze_endpoint(self):
        flows = generate_flows_for_scenario("normal", rows=20, seed=99)
        payload = {"source": "test_stream", "flows": flows}

        res = self.client.post("/api/traffic/analyze", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("decision", data)
        self.assertIn("pipeline_status", data)
        self.assertIn("latency_ms", data)

    def test_api_pipeline_status(self):
        res = self.client.get("/api/pipeline/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["overall_status"], "HEALTHY")
        self.assertIn("stages", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
