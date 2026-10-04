"""
FastAPI REST API for NetForecast AI.

Provides real-time serving endpoints for:
- Current security decisions and early warnings (/api/predict/current)
- Traffic stream ingestion & end-to-end analysis (/api/traffic/analyze)
- Attack scenario simulation on demand (/api/simulate)
- MITRE ATT&CK technique catalog (/api/mitre/techniques)
- System health and pipeline status checks (/health, /api/health, /api/pipeline/status)
"""

from __future__ import annotations

import logging
from pathlib import Path
import sys
import time
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd

# Project root on path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from mitre.attack_mapping import MITRE_TECHNIQUES
from pipeline.orchestrator import EndToEndPipeline, PipelineRunResult
from simulation.attack_simulator import SCENARIO_GENERATORS, add_tcp_flags

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("netforecast.api")

# Initialize Master Pipeline
pipeline = EndToEndPipeline()

# In-memory session state caching latest result
LATEST_RESULT: Optional[PipelineRunResult] = None


def generate_flows_for_scenario(scenario: str, rows: int = 30, seed: Optional[int] = None) -> List[Dict[str, Any]]:
    """Helper to call scenario generators, flatten sequences, and annotate TCP flags."""
    rng = np.random.default_rng(seed if seed is not None else int(time.time() * 1000) % 100000)
    gen = SCENARIO_GENERATORS[scenario]
    sequences = gen(rng, rows)
    flat_rows = []
    for seq in sequences:
        flat_rows.extend(seq)
    for r in flat_rows:
        add_tcp_flags(r, rng, scenario)
    return flat_rows


def generate_initial_state():
    """Generates initial normal operating state on application startup."""
    global LATEST_RESULT
    try:
        normal_flows = generate_flows_for_scenario("normal", rows=25, seed=42)
        df_normal = pd.DataFrame(normal_flows)
        LATEST_RESULT = pipeline.run(df_normal, scenario_name="normal")
        logger.info("Initialized baseline normal network state.")
    except Exception as e:
        logger.warning(f"Could not generate baseline state: {e}")


# Generate baseline telemetry
generate_initial_state()

app = FastAPI(
    title="NetForecast AI — API",
    description="Proactive Temporal Network Security & Attack Forecasting API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# Request Schemas
# -------------------------------------------------------------
class FlowRecordModel(BaseModel):
    timestamp: Optional[float] = None
    src_ip: Optional[str] = "192.168.1.100"
    dst_ip: Optional[str] = "10.0.0.1"
    src_port: Optional[int] = 49152
    dst_port: Optional[int] = 80
    protocol: Optional[str] = "TCP"
    flow_duration: Optional[float] = 1.0
    packet_count: Optional[int] = 10
    byte_count: Optional[int] = 1500
    packet_rate: Optional[float] = 10.0
    byte_rate: Optional[float] = 1500.0
    inter_arrival_time: Optional[float] = 0.1
    connection_frequency: Optional[float] = 1.0


class TrafficAnalyzeRequest(BaseModel):
    source: str = Field(default="live_stream", description="Identifier for traffic source")
    flows: List[FlowRecordModel] = Field(..., description="List of observed flow records")


class SimulateScenarioRequest(BaseModel):
    scenario: str = Field(
        default="scanning",
        description="Scenario to simulate: normal, scanning, syn_flood, ddos, beaconing, udp_attack, mixed",
    )
    rows: int = Field(default=30, ge=10, le=1000, description="Number of flow records to simulate")


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------
@app.get("/", tags=["System"])
def root():
    return {
        "service": "NetForecast AI API",
        "tagline": "From Reactive Attack Detection to Predictive Network Security",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
    }


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def get_health():
    is_model_loaded = pipeline.world_model is not None and pipeline.scaler is not None
    latency_ms = LATEST_RESULT.inference_latency_ms if LATEST_RESULT else 0.0
    return {
        "isBackendConnected": True,
        "modelLoaded": is_model_loaded,
        "inferenceLatencyMs": latency_ms,
        "pipelineLatencyMs": LATEST_RESULT.pipeline_latency_ms if LATEST_RESULT else 0.0,
        "dataSource": "LIVE_MODEL" if is_model_loaded else "MODEL_UNAVAILABLE",
        "lastUpdated": time.strftime("%H:%M:%S", time.gmtime()),
    }


@app.get("/api/predict/current", tags=["Prediction"])
def get_current_prediction():
    """
    Returns the latest SecurityDecision formatted for the React dashboard.
    """
    global LATEST_RESULT
    if LATEST_RESULT is None:
        generate_initial_state()

    if LATEST_RESULT is None:
        raise HTTPException(status_code=503, detail="MODEL_UNAVAILABLE: No active prediction state available.")

    res = LATEST_RESULT
    decision_payload = dict(res.decision)
    decision_payload["decision"] = res.decision
    decision_payload["alerts"] = res.alerts
    decision_payload["timeline"] = res.timeline
    decision_payload["network_graph"] = res.network_graph
    decision_payload["mitre_mapping"] = res.mitre_mapping
    decision_payload["explainability"] = res.explainability
    decision_payload["inferenceLatencyMs"] = res.inference_latency_ms
    decision_payload["pipelineLatencyMs"] = res.pipeline_latency_ms
    decision_payload["latency_ms"] = res.pipeline_latency_ms

    return decision_payload


@app.post("/api/traffic/analyze", tags=["Pipeline"])
def analyze_traffic(request: TrafficAnalyzeRequest):
    """
    Ingests network traffic records and executes the complete pipeline:
    Extraction -> Preprocessing -> Windowing -> Graph -> World Model -> Forecasting -> MITRE -> XAI -> Alert
    """
    global LATEST_RESULT
    if not request.flows:
        raise HTTPException(status_code=400, detail="Flows list cannot be empty.")

    records = [f.model_dump() for f in request.flows]
    df = pd.DataFrame(records)

    try:
        result = pipeline.run(df, scenario_name=request.source)
        LATEST_RESULT = result
        resp = result.to_dict()
        for k, v in result.decision.items():
            if k not in resp:
                resp[k] = v
        resp["latency_ms"] = result.pipeline_latency_ms
        resp["inferenceLatencyMs"] = result.inference_latency_ms
        resp["pipelineLatencyMs"] = result.pipeline_latency_ms
        return resp
    except Exception as e:
        logger.error(f"Error during traffic analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pipeline processing error: {str(e)}")


@app.post("/api/simulate", tags=["Simulation"])
def simulate_and_forecast(request: SimulateScenarioRequest):
    """
    Generates synthetic attack scenario flows and runs through the complete forecasting pipeline.
    """
    global LATEST_RESULT
    scenario = request.scenario.lower()
    if scenario not in SCENARIO_GENERATORS:
        valid = list(SCENARIO_GENERATORS.keys())
        raise HTTPException(status_code=400, detail=f"Invalid scenario '{scenario}'. Valid options: {valid}")

    try:
        flows = generate_flows_for_scenario(scenario, rows=request.rows)
        df = pd.DataFrame(flows)
        result = pipeline.run(df, scenario_name=scenario)
        LATEST_RESULT = result
        resp = result.to_dict()
        for k, v in result.decision.items():
            if k not in resp:
                resp[k] = v
        resp["latency_ms"] = result.pipeline_latency_ms
        resp["inferenceLatencyMs"] = result.inference_latency_ms
        resp["pipelineLatencyMs"] = result.pipeline_latency_ms
        return resp
    except Exception as e:
        logger.error(f"Error during simulation execution: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@app.get("/api/mitre/techniques", tags=["Threat Intelligence"])
def get_mitre_techniques():
    """Returns the MITRE ATT&CK technique catalog."""
    return MITRE_TECHNIQUES


@app.get("/api/pipeline/status", tags=["System"])
def get_pipeline_status():
    """
    Reports the operational status of every stage across the end-to-end pipeline.
    """
    global LATEST_RESULT
    if LATEST_RESULT and LATEST_RESULT.pipeline_status:
        stage_status = LATEST_RESULT.pipeline_status
    else:
        stage_status = {
            "Traffic ingestion": "READY",
            "Preprocessing & Cleaning": "READY",
            "Feature Engineering": "READY",
            "Network Graph Generation": "READY",
            "Temporal Windowing": "READY",
            "AI World Model": "READY" if pipeline.world_model is not None else "STANDBY",
            "Risk & Stage Forecasting": "READY",
            "MITRE ATT&CK Mapping": "READY",
            "Explainable AI (XAI)": "READY",
            "Alert Engine": "READY",
            "Security Dashboard & API Integration": "READY",
        }

    return {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "overall_status": "HEALTHY",
        "stages": stage_status,
    }
