/**
 * NetForecast AI — Frontend Type Definitions
 * Strictly aligned with Backend Orchestrator & Prediction Engine schemas.
 */

export type WorldModelState = 
  | 'NORMAL'
  | 'ELEVATED'
  | 'SUSPICIOUS'
  | 'PREDICTED ATTACK'
  | 'ATTACK'
  | 'RECOVERY'
  | 'MODEL_UNAVAILABLE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export type AttackStage = 
  | 'Baseline'
  | 'Reconnaissance'
  | 'Scanning'
  | 'Initial Access'
  | 'Command and Control'
  | 'Lateral Movement'
  | 'Exfiltration'
  | 'Impact'
  | 'Recovery'
  | 'Unavailable';

export type DashboardTab = 'overview' | 'live-logs' | 'network-graph' | 'mitre-intelligence' | 'xai-pipeline';

export interface LiveLogEntry {
  id: string;
  timestamp: string;
  category: 'WORLD_MODEL' | 'TOPOLOGY' | 'MITRE' | 'XAI' | 'PIPELINE' | 'ALERT';
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
  message: string;
  details?: Record<string, any>;
}

export interface ForecastStep {
  step: number;
  time?: string;
  horizon_seconds?: number;
  state: string;
  stage: string;
  threat_score: number;
  confidence: number;
  risk_level?: RiskLevel;
}

export interface NetworkFeatures {
  packet_rate?: number;
  byte_rate?: number;
  connection_frequency?: number;
  flow_duration?: number;
  packet_count?: number;
  byte_count?: number;
  inter_arrival_time?: number;
  syn_count?: number;
  ack_count?: number;
  fin_count?: number;
  rst_count?: number;
  syn_ack_ratio?: number;
  failed_conn_ratio?: number;
  byte_asymmetry?: number;
  port_entropy?: number;
  dst_ip_diversity?: number;
  active_connections?: number;
  [key: string]: any;
}

export interface SecurityDecision {
  timestamp: string;
  current_state: WorldModelState | string;
  current_stage?: AttackStage | string;
  threat_type: string;
  threat_score: number;
  risk_level?: RiskLevel | string;
  confidence: number;
  predicted_next_state: WorldModelState | string;
  predicted_stage?: AttackStage | string;
  prediction_confidence: number;
  evidence: string[];
  forecast?: ForecastStep[];
  features?: NetworkFeatures;
  current_state_prob?: Record<string, number>;
  next_state_prob?: Record<string, number>;
  inference_latency_ms?: number;
  pipeline_latency_ms?: number;
  forecast_method?: string;
}

export interface SecurityAlert {
  id?: string;
  alert_id?: string;
  timestamp: string;
  severity: RiskLevel | string;
  title: string;
  description?: string;
  stage?: string;
  attack_stage?: string;
  risk_score?: number;
  confidence?: number;
  evidence?: string[];
  recommended_action?: string;
  recommended_context?: string;
  mitre_technique_id?: string;
  mitre_tactic?: string;
}

export interface TimelineObservation {
  time: string;
  timestamp: string;
  packetRate: number;
  threatScore: number;
  state: WorldModelState | string;
  isForecast?: boolean;
}

export interface SystemHealthStatus {
  isBackendConnected: boolean;
  modelLoaded: boolean;
  inferenceLatencyMs: number;
  pipelineLatencyMs?: number;
  dataSource: 'LIVE_MODEL' | 'VERIFIED_DEMO';
  lastUpdated: string;
}

export interface NetworkGraphNode {
  id: string;
  degree: number;
  in_degree: number;
  out_degree: number;
  bytes_sent: number;
  bytes_recv: number;
}

export interface NetworkGraphEdge {
  source: string;
  target: string;
  weight: number;
  packet_count: number;
  flow_count: number;
  protocol: string;
}

export interface NetworkGraphSnapshot {
  timestamp?: number | string;
  num_nodes: number;
  num_edges: number;
  density: number;
  max_degree_node: string;
  max_degree: number;
  star_score: number;
  nodes: NetworkGraphNode[];
  edges: NetworkGraphEdge[];
}

export interface MitreMapping {
  tactic: string;
  tactic_id: string;
  technique: string;
  technique_id: string;
  confidence: number;
  evidence?: string[];
  mitigations?: string[];
}

export interface ExplainabilityData {
  important_features: string[];
  feature_contributions: Record<string, number>;
  explanation: string;
}
