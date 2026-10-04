/**
 * Types strictly adhering to the NetForecast AI integration contract
 * Standardized prediction object from Shreenisha's schemas.py:
 * - timestamp
 * - current_state
 * - threat_type
 * - threat_score
 * - confidence
 * - predicted_next_state
 * - prediction_confidence
 * - evidence
 */

export type WorldModelState = 
  | 'NORMAL'
  | 'ELEVATED'
  | 'SUSPICIOUS'
  | 'PREDICTED ATTACK'
  | 'ATTACK'
  | 'RECOVERY';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AttackStage = 
  | 'Baseline'
  | 'Reconnaissance'
  | 'Scanning'
  | 'Initial Access'
  | 'Command and Control'
  | 'Lateral Movement'
  | 'Exfiltration'
  | 'Impact'
  | 'Recovery';

export interface ForecastStep {
  step: number;
  time: string;
  horizon_seconds: number;
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
  syn_count?: number;
  failed_conn_ratio?: number;
  byte_asymmetry?: number;
  port_entropy?: number;
  dst_ip_diversity?: number;
  active_connections?: number;
  protocol_breakdown?: {
    tcp: number;
    udp: number;
    icmp: number;
    other: number;
  };
}

export interface ThreatThread {
  id: string;
  sourceIp: string;
  destIp: string;
  destPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  threatStatus: 'BENIGN' | 'SUSPICIOUS' | 'ATTACK' | 'ANOMALOUS';
  flowRate: number; // pkts/s
  matchedPattern: string;
  lastSeen: string;
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
  threat_threads?: ThreatThread[];
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: RiskLevel;
  title: string;
  description: string;
  stage: string;
  recommended_action: string;
}

export interface TimelineObservation {
  time: string;
  timestamp: string;
  packetRate: number;
  threatScore: number;
  state: WorldModelState | string;
  isForecast?: boolean;
  confidence?: number;
}

export interface DatabaseConfig {
  engine: 'sqlite' | 'postgresql' | 'timescaledb' | 'influxdb' | 'mysql' | 'rest_stream';
  host: string;
  port: number;
  databaseName: string;
  tableName: string;
  username: string;
  password?: string;
  isConnected: boolean;
  lastPingMs: number;
  ssl: boolean;
}

export interface DatabaseFlowRecord {
  id: string;
  timestamp: string;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  flowDuration: number; // ms
  packetRate: number; // pkts/sec
  byteRate: number; // bytes/sec
  currentState: WorldModelState;
  threatType: string;
  threatScore: number;
  confidence: number;
  predictedNextState: WorldModelState;
  predictionConfidence: number;
  evidence: string;
}

export interface SystemHealthStatus {
  isBackendConnected: boolean;
  modelLoaded: boolean;
  inferenceLatencyMs: number;
  dataSource: 'LIVE_MODEL' | 'VERIFIED_DEMO' | 'DATABASE_INJECTED' | 'DATABASE_CONNECTED';
  lastUpdated: string;
}

