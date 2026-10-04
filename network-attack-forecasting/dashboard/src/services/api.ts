import {
  SecurityDecision,
  SecurityAlert,
  TimelineObservation,
  SystemHealthStatus,
  NetworkGraphSnapshot,
  MitreMapping,
  ExplainabilityData,
} from '../types/prediction';

/**
 * Dynamic API Base URL resolution:
 * - If VITE_API_URL is configured (e.g. deployed cloud backend: https://api.example.com),
 *   it will be used as the base, ensuring /api is appended if not present.
 * - In local dev or containerized Nginx with proxying, defaults to '/api'.
 */
const rawEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
const ENV_API_URL = rawEnv.VITE_API_URL ? String(rawEnv.VITE_API_URL).trim() : '';

export const API_BASE_URL = ENV_API_URL
  ? (ENV_API_URL.replace(/\/+$/, '') + (ENV_API_URL.endsWith('/api') ? '' : '/api'))
  : '/api';

export interface FetchResult {
  decision: SecurityDecision;
  alerts: SecurityAlert[];
  timeline: TimelineObservation[];
  health: SystemHealthStatus;
  network_graph?: NetworkGraphSnapshot;
  mitre_mapping?: MitreMapping;
  explainability?: ExplainabilityData;
  pipeline_status?: Record<string, string>;
  rawJson?: any;
  error?: string;
}

export const SCENARIO_API_MAP: Record<string, string> = {
  'NORMAL': 'normal',
  'SCANNING': 'scanning',
  'SYN_FLOOD': 'syn_flood',
  'SYN FLOOD': 'syn_flood',
  'DDOS': 'ddos',
  'BEACONING': 'beaconing',
  'UDP_ATTACK': 'udp_attack',
  'UDP ATTACK': 'udp_attack',
  'MIXED': 'mixed',
  'ELEVATED': 'scanning',
  'SUSPICIOUS': 'beaconing',
  'PREDICTED ATTACK': 'mixed',
  'ATTACK': 'ddos',
};

export class DashboardService {
  /**
   * Helper to normalize raw API responses into clean TypeScript models
   */
  public static parseApiResponse(realData: any): FetchResult {
    const rawDecision = realData.decision || realData;
    const decision: SecurityDecision = {
      timestamp: rawDecision.timestamp || new Date().toISOString(),
      current_state: rawDecision.current_state || 'NORMAL',
      current_stage: rawDecision.current_stage || 'Baseline',
      threat_type: rawDecision.threat_type || 'Normal Operations',
      threat_score: Number(rawDecision.threat_score ?? 0),
      risk_level: rawDecision.risk_level || 'LOW',
      confidence: Number(rawDecision.confidence ?? 0.0),
      predicted_next_state: rawDecision.predicted_next_state || 'NORMAL',
      predicted_stage: rawDecision.predicted_stage || 'Baseline',
      prediction_confidence: Number(rawDecision.prediction_confidence ?? 0.0),
      evidence: Array.isArray(rawDecision.evidence) ? rawDecision.evidence : [],
      forecast: rawDecision.forecast || realData.forecast_steps || [],
      features: rawDecision.features || {},
      current_state_prob: rawDecision.current_state_prob || realData.current_probabilities,
      next_state_prob: rawDecision.next_state_prob,
      inference_latency_ms: Number(rawDecision.inference_latency_ms ?? realData.inferenceLatencyMs ?? 0),
      pipeline_latency_ms: Number(rawDecision.pipeline_latency_ms ?? realData.pipelineLatencyMs ?? 0),
      forecast_method: rawDecision.forecast_method || 'Controlled Horizon Projection (GRU Dual-Head + State Dynamics)',
    };

    const alerts: SecurityAlert[] = Array.isArray(realData.alerts) ? realData.alerts : [];
    const timeline: TimelineObservation[] = Array.isArray(realData.timeline) ? realData.timeline : [];

    const measuredLatency = Number(
      realData.pipelineLatencyMs ??
      realData.latency_ms ??
      rawDecision.pipeline_latency_ms ??
      realData.inferenceLatencyMs ??
      0
    );

    return {
      decision,
      alerts,
      timeline,
      health: {
        isBackendConnected: true,
        modelLoaded: rawDecision.current_state !== 'MODEL_UNAVAILABLE',
        inferenceLatencyMs: Number(rawDecision.inference_latency_ms ?? realData.inferenceLatencyMs ?? 0),
        pipelineLatencyMs: measuredLatency,
        dataSource: 'LIVE_MODEL',
        lastUpdated: new Date().toLocaleTimeString(),
      },
      network_graph: realData.network_graph || undefined,
      mitre_mapping: realData.mitre_mapping || undefined,
      explainability: realData.explainability || undefined,
      pipeline_status: realData.pipeline_status || undefined,
      rawJson: realData,
    };
  }

  /**
   * Executes a controlled attack simulation against POST /api/simulate
   */
  public static async simulateScenario(scenario: string, rows: number = 30): Promise<FetchResult> {
    const scenarioKey = scenario.toLowerCase().replace(/\s+/g, '_');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_BASE_URL}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ scenario: scenarioKey, rows }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Simulation failed: HTTP ${response.status} (${response.statusText})`);
      }

      const realData = await response.json();
      return this.parseApiResponse(realData);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Queries the latest read-only prediction frame from GET /api/predict/current
   */
  public static async fetchCurrentPrediction(): Promise<FetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`${API_BASE_URL}/predict/current`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GET /api/predict/current failed: HTTP ${response.status}`);
      }

      const realData = await response.json();
      return this.parseApiResponse(realData);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Safe read-only polling endpoint: queries current real-time prediction telemetry.
   */
  public static async fetchDashboardData(): Promise<FetchResult> {
    try {
      return await this.fetchCurrentPrediction();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Backend connection error';
      return {
        decision: {
          timestamp: new Date().toISOString(),
          current_state: 'MODEL_UNAVAILABLE',
          current_stage: 'Unavailable',
          threat_type: 'Live Backend Disconnected',
          threat_score: 0,
          risk_level: 'LOW',
          confidence: 0,
          predicted_next_state: 'MODEL_UNAVAILABLE',
          predicted_stage: 'Unavailable',
          prediction_confidence: 0,
          evidence: [
            `BACKEND OFFLINE: ${errorMessage}`,
            'Ensure the FastAPI backend server is running on http://127.0.0.1:8000',
            'Run: python -m uvicorn api.app:app --host 127.0.0.1 --port 8000',
          ],
          features: {},
          forecast: [],
        },
        alerts: [],
        timeline: [],
        health: {
          isBackendConnected: false,
          modelLoaded: false,
          inferenceLatencyMs: 0,
          pipelineLatencyMs: 0,
          dataSource: 'LIVE_MODEL',
          lastUpdated: new Date().toLocaleTimeString(),
        },
        error: `BACKEND OFFLINE: Unable to connect to AI prediction service (${errorMessage}).`,
      };
    }
  }

  /**
   * Live health check endpoint GET /health or GET /api/health
   */
  public static async checkBackendHealth(): Promise<{ isOnline: boolean; modelLoaded: boolean; latencyMs: number; statusText: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return { isOnline: false, modelLoaded: false, latencyMs: 0, statusText: 'OFFLINE' };
      const data = await res.json();
      return {
        isOnline: true,
        modelLoaded: Boolean(data.modelLoaded),
        latencyMs: Number(data.pipelineLatencyMs || data.inferenceLatencyMs || 0),
        statusText: data.modelLoaded ? 'ONLINE' : 'MODEL_STANDBY',
      };
    } catch {
      return { isOnline: false, modelLoaded: false, latencyMs: 0, statusText: 'OFFLINE' };
    }
  }

  /**
   * Fetches pipeline operational status from GET /api/pipeline/status
   */
  public static async fetchPipelineStatus(): Promise<Record<string, string>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE_URL}/pipeline/status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return {};
      const data = await res.json();
      return data.stages || {};
    } catch {
      return {};
    }
  }
}
