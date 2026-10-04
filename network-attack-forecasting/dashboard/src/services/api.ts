import { SecurityDecision, SecurityAlert, TimelineObservation, SystemHealthStatus } from '../types/prediction';
import { MOCK_SCENARIOS } from '../data/mockScenarios';

const API_BASE_URL = '/api';

export interface FetchResult {
  decision: SecurityDecision;
  alerts: SecurityAlert[];
  timeline: TimelineObservation[];
  health: SystemHealthStatus;
  error?: string;
}

const SCENARIO_API_MAP: Record<string, string> = {
  'NORMAL': 'normal',
  'ELEVATED': 'scanning',
  'SUSPICIOUS': 'beaconing',
  'PREDICTED ATTACK': 'mixed',
  'ATTACK': 'ddos',
  'RECOVERY': 'recovery',
};

export class DashboardService {
  /**
   * Fetches dashboard data.
   * - In DEMO mode (!forceLiveMode): Uses verified offline scenarios for standalone evaluation.
   * - In LIVE mode (forceLiveMode): Strictly queries the real FastAPI backend + GRU World Model.
   *   NEVER silently masks backend failures with mock data in live mode.
   */
  public static async fetchDashboardData(
    scenarioKey: string = 'NORMAL',
    forceLiveMode: boolean = false
  ): Promise<FetchResult> {
    const fallbackScenario = MOCK_SCENARIOS[scenarioKey] || MOCK_SCENARIOS.NORMAL;

    // DEMO / OFFLINE MODE: Clearly marked as VERIFIED_DEMO
    if (!forceLiveMode) {
      return {
        decision: fallbackScenario.decision,
        alerts: fallbackScenario.alerts,
        timeline: fallbackScenario.timeline,
        health: {
          isBackendConnected: false,
          modelLoaded: true,
          inferenceLatencyMs: 0,
          dataSource: 'VERIFIED_DEMO',
          lastUpdated: new Date().toLocaleTimeString(),
        }
      };
    }

    // LIVE MODEL MODE: Must connect to real backend; no fake fallbacks allowed
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response: Response;
      const backendScenario = SCENARIO_API_MAP[scenarioKey];

      if (backendScenario) {
        // Run live simulation through the complete backend AI pipeline
        response = await fetch(`${API_BASE_URL}/simulate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ scenario: backendScenario, rows: 35 }),
          signal: controller.signal,
        });
      } else {
        // Query current live stream state
        response = await fetch(`${API_BASE_URL}/predict/current`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FastAPI responded with HTTP status ${response.status} (${response.statusText})`);
      }

      const realData = await response.json();

      // Extract real decision payload supporting both root and nested formats
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
      };

      const alerts: SecurityAlert[] = Array.isArray(realData.alerts) ? realData.alerts : [];
      const timeline: TimelineObservation[] = Array.isArray(realData.timeline)
        ? realData.timeline
        : [];

      // Measured inference latency reported by backend AI World Model
      const measuredLatency = Number(
        realData.inferenceLatencyMs ??
        realData.inference_latency_ms ??
        rawDecision.inference_latency_ms ??
        realData.latency_ms ??
        0
      );

      return {
        decision,
        alerts,
        timeline,
        health: {
          isBackendConnected: true,
          modelLoaded: rawDecision.current_state !== 'MODEL_UNAVAILABLE',
          inferenceLatencyMs: measuredLatency,
          dataSource: 'LIVE_MODEL',
          lastUpdated: new Date().toLocaleTimeString(),
        }
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Backend connection error';

      // DO NOT mask failure with mock data in live mode!
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
            `LIVE MODEL UNAVAILABLE: ${errorMessage}`,
            'Ensure the FastAPI backend server is running on http://127.0.0.1:8000',
            'Run: python -m uvicorn api.app:app --port 8000 --reload',
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
          dataSource: 'LIVE_MODEL',
          lastUpdated: new Date().toLocaleTimeString(),
        },
        error: `LIVE MODEL UNAVAILABLE: ${errorMessage}. Live model inference cannot be performed while backend is offline.`
      };
    }
  }

  /**
   * Live health check endpoint
   */
  public static async checkBackendHealth(): Promise<{ isOnline: boolean; modelLoaded: boolean; latencyMs: number }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return { isOnline: false, modelLoaded: false, latencyMs: 0 };
      const data = await res.json();
      return {
        isOnline: true,
        modelLoaded: Boolean(data.modelLoaded),
        latencyMs: Number(data.inferenceLatencyMs || 0),
      };
    } catch {
      return { isOnline: false, modelLoaded: false, latencyMs: 0 };
    }
  }
}
