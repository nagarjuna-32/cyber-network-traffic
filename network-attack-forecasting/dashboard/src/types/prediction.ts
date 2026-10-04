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
}

export interface SystemHealthStatus {
  isBackendConnected: boolean;
  modelLoaded: boolean;
  inferenceLatencyMs: number;
  dataSource: 'LIVE_MODEL' | 'VERIFIED_DEMO';
  lastUpdated: string;
}
