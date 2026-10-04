import {
  SecurityDecision,
  SecurityAlert,
  TimelineObservation,
  SystemHealthStatus,
  NetworkGraphSnapshot,
  MitreMapping,
  ExplainabilityData,
} from '../types/prediction';
import { MOCK_SCENARIOS } from '../data/mockScenarios';

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

// Generates fallback mock topology for demo visualization when in verified demo mode
function getDemoNetworkGraph(scenarioKey: string): NetworkGraphSnapshot {
  const isAttack = scenarioKey.toUpperCase().includes('ATTACK') || scenarioKey.toUpperCase().includes('DDOS');
  const isElevated = scenarioKey.toUpperCase().includes('ELEVATED') || scenarioKey.toUpperCase().includes('SCAN');

  return {
    timestamp: Date.now(),
    num_nodes: isAttack ? 6 : isElevated ? 4 : 3,
    num_edges: isAttack ? 8 : isElevated ? 5 : 2,
    density: isAttack ? 0.72 : isElevated ? 0.45 : 0.25,
    max_degree_node: isAttack ? '192.168.1.105' : '192.168.1.1',
    max_degree: isAttack ? 5 : isElevated ? 3 : 2,
    star_score: isAttack ? 0.88 : isElevated ? 0.62 : 0.20,
    nodes: [
      { id: '192.168.1.100', degree: 2, in_degree: 1, out_degree: 1, bytes_sent: 450000, bytes_recv: 120000 },
      { id: '192.168.1.105', degree: isAttack ? 5 : 2, in_degree: isAttack ? 4 : 1, out_degree: 1, bytes_sent: isAttack ? 9500000 : 34000, bytes_recv: 45000 },
      { id: '10.0.0.1', degree: 3, in_degree: 2, out_degree: 1, bytes_sent: 120000, bytes_recv: isAttack ? 9800000 : 450000 },
      { id: '10.0.0.50', degree: 1, in_degree: 1, out_degree: 0, bytes_sent: 0, bytes_recv: 320000 },
      ...(isAttack ? [
        { id: '172.16.0.4', degree: 2, in_degree: 1, out_degree: 1, bytes_sent: 3400000, bytes_recv: 12000 },
        { id: '172.16.0.99', degree: 1, in_degree: 0, out_degree: 1, bytes_sent: 2100000, bytes_recv: 0 },
      ] : []),
    ],
    edges: [
      { source: '192.168.1.105', target: '10.0.0.1', weight: isAttack ? 8500000 : 45000, packet_count: isAttack ? 25000 : 300, flow_count: isAttack ? 180 : 12, protocol: 'TCP' },
      { source: '192.168.1.100', target: '10.0.0.1', weight: 450000, packet_count: 550, flow_count: 15, protocol: 'TCP' },
      { source: '10.0.0.1', target: '10.0.0.50', weight: 320000, packet_count: 220, flow_count: 8, protocol: 'UDP' },
      ...(isAttack ? [
        { source: '172.16.0.4', target: '10.0.0.1', weight: 3400000, packet_count: 14000, flow_count: 95, protocol: 'TCP' },
        { source: '172.16.0.99', target: '10.0.0.1', weight: 2100000, packet_count: 9800, flow_count: 70, protocol: 'UDP' },
      ] : []),
    ],
  };
}

function getDemoMitreMapping(scenarioKey: string): MitreMapping {
  const upper = scenarioKey.toUpperCase();
  if (upper.includes('ATTACK') || upper.includes('DDOS') || upper.includes('SYN')) {
    return {
      tactic: 'Impact',
      tactic_id: 'TA0040',
      technique: 'Network Denial of Service',
      technique_id: 'T1498',
      confidence: 0.95,
      evidence: [
        'Volumetric packet surge exceeding 35k pkts/sec',
        'Extreme bandwidth saturation (40+ MB/s)',
        'Asymmetric TCP SYN/ACK ratio',
      ],
      mitigations: [
        'Activate upstream BGP scrubbing centers and Anycast routing.',
        'Enforce SYN cookies on perimeter edge gateways.',
        'Blackhole malicious source CIDR blocks.',
      ],
    };
  } else if (upper.includes('SUSPICIOUS') || upper.includes('BEACON')) {
    return {
      tactic: 'Command and Control',
      tactic_id: 'TA0011',
      technique: 'Application Layer Protocol: Web Protocols',
      technique_id: 'T1071.001',
      confidence: 0.88,
      evidence: [
        'Persistent periodic connection bursts (jitter < 5%)',
        'Low bytes per packet with uniform cadence',
      ],
      mitigations: [
        'Isolate suspected host 192.168.1.105 via VLAN segmentation.',
        'Block external C2 destination IPs at border firewall.',
        'Trigger endpoint memory inspection.',
      ],
    };
  } else if (upper.includes('ELEVATED') || upper.includes('SCAN')) {
    return {
      tactic: 'Reconnaissance',
      tactic_id: 'TA0043',
      technique: 'Active Scanning',
      technique_id: 'T1595',
      confidence: 0.82,
      evidence: [
        'Rapid horizontal port enumeration across ephemeral range',
        'High destination port Shannon entropy (> 3.5)',
      ],
      mitigations: [
        'Deploy network rate-limiting for half-open connection attempts.',
        'Verify firewall port-forwarding rules and honeypot traps.',
      ],
    };
  }
  return {
    tactic: 'Reconnaissance',
    tactic_id: 'TA0043',
    technique: 'Active Scanning',
    technique_id: 'T1595',
    confidence: 0.40,
    evidence: ['Baseline normal traffic observations'],
    mitigations: ['Maintain standard baseline security posture.'],
  };
}

function getDemoExplainability(scenarioKey: string): ExplainabilityData {
  const isAttack = scenarioKey.toUpperCase().includes('ATTACK') || scenarioKey.toUpperCase().includes('DDOS');
  return {
    important_features: isAttack
      ? ['packet_rate', 'byte_rate', 'connection_frequency', 'syn_count', 'byte_asymmetry']
      : ['flow_duration', 'bytes_per_packet', 'port_entropy', 'inter_arrival_time'],
    feature_contributions: isAttack
      ? { packet_rate: 1.0, byte_rate: 0.94, connection_frequency: 0.86, syn_count: 0.72, byte_asymmetry: 0.65 }
      : { flow_duration: 0.45, bytes_per_packet: 0.38, port_entropy: 0.22, inter_arrival_time: -0.12 },
    explanation: isAttack
      ? `Threat state is heavily driven by abnormal volumetric spikes in packet_rate (+1.00) and byte_rate (+0.94) exceeding historical baseline.`
      : `Network metrics remain within standard statistical tolerance; slight variance in flow_duration (+0.45).`,
  };
}

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
   * Safe read-only polling endpoint: fetches current telemetry, health, and pipeline status.
   */
  public static async fetchDashboardData(
    scenarioKey: string = 'NORMAL',
    forceLiveMode: boolean = true
  ): Promise<FetchResult> {
    // Offline Demo Mode
    if (!forceLiveMode) {
      const fallback = MOCK_SCENARIOS[scenarioKey] || MOCK_SCENARIOS.NORMAL;
      return {
        decision: fallback.decision,
        alerts: fallback.alerts,
        timeline: fallback.timeline,
        health: {
          isBackendConnected: false,
          modelLoaded: true,
          inferenceLatencyMs: 0,
          pipelineLatencyMs: 0,
          dataSource: 'VERIFIED_DEMO',
          lastUpdated: new Date().toLocaleTimeString(),
        },
        network_graph: getDemoNetworkGraph(scenarioKey),
        mitre_mapping: getDemoMitreMapping(scenarioKey),
        explainability: getDemoExplainability(scenarioKey),
        pipeline_status: {
          'Traffic ingestion': 'READY',
          'Preprocessing & Cleaning': 'READY',
          'Feature Engineering': 'READY',
          'Network Graph Generation': 'READY',
          'Temporal Windowing': 'READY',
          'AI World Model': 'READY',
          'Risk & Stage Forecasting': 'READY',
          'MITRE ATT&CK Mapping': 'READY',
          'Explainable AI (XAI)': 'READY',
          'Alert Engine': 'READY',
          'Security Dashboard & API Integration': 'READY',
        },
        rawJson: { scenario: scenarioKey, decision: fallback.decision },
      };
    }

    // Live Mode: query real backend
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
