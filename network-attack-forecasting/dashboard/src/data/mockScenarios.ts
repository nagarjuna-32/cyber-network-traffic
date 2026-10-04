import { SecurityDecision, SecurityAlert, TimelineObservation } from '../types/prediction';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  decision: SecurityDecision;
  alerts: SecurityAlert[];
  timeline: TimelineObservation[];
}

export const MOCK_SCENARIOS: Record<string, DemoScenario> = {
  NORMAL: {
    id: 'NORMAL',
    name: 'Normal Baseline Traffic',
    description: 'Clean day-to-day enterprise network communications with steady flow rates.',
    decision: {
      timestamp: new Date().toISOString(),
      current_state: 'NORMAL',
      current_stage: 'Baseline',
      threat_type: 'Benign Operational Traffic',
      threat_score: 8,
      risk_level: 'LOW',
      confidence: 0.98,
      predicted_next_state: 'NORMAL',
      predicted_stage: 'Baseline',
      prediction_confidence: 0.95,
      evidence: [
        'Flow telemetry conforms to expected baseline Poisson distribution',
        'SYN-to-ACK handshake ratio balanced (1.02:1)',
        'Zero unusual port dispersion or sweep sequences detected'
      ],
      features: {
        packet_rate: 420.5,
        byte_rate: 215000.0,
        connection_frequency: 34.0,
        syn_count: 42,
        failed_conn_ratio: 0.02,
        byte_asymmetry: 0.12,
        port_entropy: 0.85,
        dst_ip_diversity: 14,
        active_connections: 182,
        protocol_breakdown: { tcp: 72, udp: 24, icmp: 2, other: 2 }
      },
      forecast: [
        { step: 1, time: '+1 min', horizon_seconds: 60, state: 'NORMAL', stage: 'Baseline', threat_score: 9, confidence: 0.94, risk_level: 'LOW' },
        { step: 2, time: '+2 min', horizon_seconds: 120, state: 'NORMAL', stage: 'Baseline', threat_score: 8, confidence: 0.91, risk_level: 'LOW' },
        { step: 3, time: '+3 min', horizon_seconds: 180, state: 'NORMAL', stage: 'Baseline', threat_score: 9, confidence: 0.88, risk_level: 'LOW' }
      ]
    },
    alerts: [],
    timeline: [
      { time: '-15m', timestamp: '10:45', packetRate: 410, threatScore: 7, state: 'NORMAL' },
      { time: '-10m', timestamp: '10:50', packetRate: 430, threatScore: 9, state: 'NORMAL' },
      { time: '-5m', timestamp: '10:55', packetRate: 415, threatScore: 8, state: 'NORMAL' },
      { time: 'Now', timestamp: '11:00', packetRate: 420, threatScore: 8, state: 'NORMAL' },
      { time: '+1m', timestamp: '11:01', packetRate: 425, threatScore: 9, state: 'NORMAL', isForecast: true },
      { time: '+2m', timestamp: '11:02', packetRate: 420, threatScore: 8, state: 'NORMAL', isForecast: true },
      { time: '+3m', timestamp: '11:03', packetRate: 415, threatScore: 9, state: 'NORMAL', isForecast: true },
    ]
  },

  ELEVATED: {
    id: 'ELEVATED',
    name: 'Elevated (Reconnaissance & Scan)',
    description: 'Adversary executing multi-host port sweeping and service enumeration.',
    decision: {
      timestamp: new Date().toISOString(),
      current_state: 'ELEVATED',
      current_stage: 'Scanning',
      threat_type: 'Horizontal Subnet Port Scan (T1046)',
      threat_score: 38,
      risk_level: 'MEDIUM',
      confidence: 0.91,
      predicted_next_state: 'SUSPICIOUS',
      predicted_stage: 'Initial Access',
      prediction_confidence: 0.84,
      evidence: [
        'Destination port entropy elevated (3.82 vs 0.85 nominal baseline)',
        'Rapid succession of SYN probes targeting 48 distinct internal IPs',
        'Abnormal ratio of TCP RST packets received from non-listening endpoints'
      ],
      features: {
        packet_rate: 1150.0,
        byte_rate: 450000.0,
        connection_frequency: 142.0,
        syn_count: 520,
        failed_conn_ratio: 0.44,
        byte_asymmetry: 0.41,
        port_entropy: 3.82,
        dst_ip_diversity: 68,
        active_connections: 410,
        protocol_breakdown: { tcp: 89, udp: 8, icmp: 3, other: 0 }
      },
      forecast: [
        { step: 1, time: '+1 min', horizon_seconds: 60, state: 'ELEVATED', stage: 'Scanning', threat_score: 45, confidence: 0.88, risk_level: 'MEDIUM' },
        { step: 2, time: '+2 min', horizon_seconds: 120, state: 'SUSPICIOUS', stage: 'Initial Access', threat_score: 58, confidence: 0.84, risk_level: 'MEDIUM' },
        { step: 3, time: '+3 min', horizon_seconds: 180, state: 'SUSPICIOUS', stage: 'Initial Access', threat_score: 64, confidence: 0.79, risk_level: 'HIGH' }
      ]
    },
    alerts: [
      {
        id: 'alt-el-1',
        timestamp: '11:00:15',
        severity: 'MEDIUM',
        title: 'Network Service Discovery Anomaly',
        description: 'Host 192.168.1.104 emitting high frequency SYN sweeps across port range 20-1024.',
        stage: 'Scanning (T1046)',
        recommended_action: 'Apply rate limiting on source IP 192.168.1.104 and monitor boundary firewalls.'
      }
    ],
    timeline: [
      { time: '-15m', timestamp: '10:45', packetRate: 420, threatScore: 10, state: 'NORMAL' },
      { time: '-10m', timestamp: '10:50', packetRate: 580, threatScore: 18, state: 'NORMAL' },
      { time: '-5m', timestamp: '10:55', packetRate: 980, threatScore: 32, state: 'ELEVATED' },
      { time: 'Now', timestamp: '11:00', packetRate: 1150, threatScore: 38, state: 'ELEVATED' },
      { time: '+1m', timestamp: '11:01', packetRate: 1320, threatScore: 45, state: 'ELEVATED', isForecast: true },
      { time: '+2m', timestamp: '11:02', packetRate: 1580, threatScore: 58, state: 'SUSPICIOUS', isForecast: true },
      { time: '+3m', timestamp: '11:03', packetRate: 1800, threatScore: 64, state: 'SUSPICIOUS', isForecast: true },
    ]
  },

  SUSPICIOUS: {
    id: 'SUSPICIOUS',
    name: 'Suspicious (C2 Beaconing & Lateral Move)',
    description: 'Persistence established; regular outbound heartbeat traffic to unclassified external IP.',
    decision: {
      timestamp: new Date().toISOString(),
      current_state: 'SUSPICIOUS',
      current_stage: 'Command and Control',
      threat_type: 'Encrypted C2 Beaconing (T1071)',
      threat_score: 66,
      risk_level: 'HIGH',
      confidence: 0.89,
      predicted_next_state: 'PREDICTED ATTACK',
      predicted_stage: 'Lateral Movement',
      prediction_confidence: 0.86,
      evidence: [
        'Periodic low-jitter outbound TCP beaconing at exact 45s intervals',
        'Failed authentication handshake surge on internal Kerberos/SMB ports',
        'Egress payload entropy spikes indicative of encrypted exfiltration staging'
      ],
      features: {
        packet_rate: 1980.0,
        byte_rate: 980000.0,
        connection_frequency: 188.0,
        syn_count: 810,
        failed_conn_ratio: 0.68,
        byte_asymmetry: 0.82,
        port_entropy: 4.31,
        dst_ip_diversity: 42,
        active_connections: 680,
        protocol_breakdown: { tcp: 94, udp: 4, icmp: 1, other: 1 }
      },
      forecast: [
        { step: 1, time: '+1 min', horizon_seconds: 60, state: 'SUSPICIOUS', stage: 'Command and Control', threat_score: 72, confidence: 0.87, risk_level: 'HIGH' },
        { step: 2, time: '+2 min', horizon_seconds: 120, state: 'PREDICTED ATTACK', stage: 'Lateral Movement', threat_score: 79, confidence: 0.86, risk_level: 'HIGH' },
        { step: 3, time: '+3 min', horizon_seconds: 180, state: 'ATTACK', stage: 'Impact', threat_score: 88, confidence: 0.81, risk_level: 'CRITICAL' }
      ]
    },
    alerts: [
      {
        id: 'alt-sus-1',
        timestamp: '11:00:20',
        severity: 'HIGH',
        title: 'C2 Beaconing Channel Identified',
        description: 'Repeated fixed-interval payloads outbound to external untrusted node 198.51.100.42.',
        stage: 'Command & Control (T1071)',
        recommended_action: 'Isolate internal host 10.0.4.15 and drop egress traffic to 198.51.100.42.'
      },
      {
        id: 'alt-sus-2',
        timestamp: '10:58:45',
        severity: 'MEDIUM',
        title: 'Lateral Movement Kerberos Ticket Request',
        description: 'Anomalous ticket granting requests targeting domain controller.',
        stage: 'Lateral Movement (T1021)',
        recommended_action: 'Enforce credential invalidation for compromised service account.'
      }
    ],
    timeline: [
      { time: '-15m', timestamp: '10:45', packetRate: 480, threatScore: 18, state: 'NORMAL' },
      { time: '-10m', timestamp: '10:50', packetRate: 1100, threatScore: 39, state: 'ELEVATED' },
      { time: '-5m', timestamp: '10:55', packetRate: 1650, threatScore: 56, state: 'SUSPICIOUS' },
      { time: 'Now', timestamp: '11:00', packetRate: 1980, threatScore: 66, state: 'SUSPICIOUS' },
      { time: '+1m', timestamp: '11:01', packetRate: 2300, threatScore: 72, state: 'SUSPICIOUS', isForecast: true },
      { time: '+2m', timestamp: '11:02', packetRate: 2850, threatScore: 79, state: 'PREDICTED ATTACK', isForecast: true },
      { time: '+3m', timestamp: '11:03', packetRate: 3500, threatScore: 88, state: 'ATTACK', isForecast: true },
    ]
  },

  'PREDICTED ATTACK': {
    id: 'PREDICTED ATTACK',
    name: 'Predicted Attack (Imminent Threat Horizon)',
    description: 'Temporal World Model forecasts high-certainty transition to active attack state.',
    decision: {
      timestamp: new Date().toISOString(),
      current_state: 'PREDICTED ATTACK',
      current_stage: 'Exfiltration',
      threat_type: 'Imminent Coordinated Disruption',
      threat_score: 82,
      risk_level: 'HIGH',
      confidence: 0.88,
      predicted_next_state: 'ATTACK',
      predicted_stage: 'Impact',
      prediction_confidence: 0.93,
      evidence: [
        'World Model sequential trajectory projects high probability transition to ATTACK (+2 steps)',
        'Egress bandwidth acceleration rate exceeding 4.2 MB/s on non-standard ports',
        'Staged data archive transfers detected between internal file server and DMZ jump host',
        'Synchronized preparation signals matching known Ransomware / DoS precursor profiles'
      ],
      features: {
        packet_rate: 3400.0,
        byte_rate: 2200000.0,
        connection_frequency: 245.0,
        syn_count: 1450,
        failed_conn_ratio: 0.77,
        byte_asymmetry: 0.89,
        port_entropy: 4.65,
        dst_ip_diversity: 92,
        active_connections: 920,
        protocol_breakdown: { tcp: 91, udp: 6, icmp: 2, other: 1 }
      },
      forecast: [
        { step: 1, time: '+1 min', horizon_seconds: 60, state: 'PREDICTED ATTACK', stage: 'Exfiltration', threat_score: 86, confidence: 0.91, risk_level: 'HIGH' },
        { step: 2, time: '+2 min', horizon_seconds: 120, state: 'ATTACK', stage: 'Impact', threat_score: 94, confidence: 0.93, risk_level: 'CRITICAL' },
        { step: 3, time: '+3 min', horizon_seconds: 180, state: 'ATTACK', stage: 'Impact', threat_score: 98, confidence: 0.95, risk_level: 'CRITICAL' }
      ]
    },
    alerts: [
      {
        id: 'alt-pred-1',
        timestamp: '11:00:25',
        severity: 'HIGH',
        title: 'Early Warning: Imminent Full Attack Escalation',
        description: 'World Model predicts critical attack execution within next 120 seconds.',
        stage: 'Pre-Attack Horizon Warning',
        recommended_action: 'Pre-emptively trigger automated border ingress throttling and initiate snapshot backups.'
      },
      {
        id: 'alt-pred-2',
        timestamp: '10:59:10',
        severity: 'HIGH',
        title: 'Rapid Data Exfiltration Staging',
        description: 'Large file transfer initiated over port 8443 to external destination.',
        stage: 'Exfiltration (T1048)',
        recommended_action: 'Sever active connection socket #89412 immediately.'
      }
    ],
    timeline: [
      { time: '-15m', timestamp: '10:45', packetRate: 600, threatScore: 22, state: 'NORMAL' },
      { time: '-10m', timestamp: '10:50', packetRate: 1350, threatScore: 48, state: 'ELEVATED' },
      { time: '-5m', timestamp: '10:55', packetRate: 2100, threatScore: 68, state: 'SUSPICIOUS' },
      { time: 'Now', timestamp: '11:00', packetRate: 3400, threatScore: 82, state: 'PREDICTED ATTACK' },
      { time: '+1m', timestamp: '11:01', packetRate: 4800, threatScore: 86, state: 'PREDICTED ATTACK', isForecast: true },
      { time: '+2m', timestamp: '11:02', packetRate: 7200, threatScore: 94, state: 'ATTACK', isForecast: true },
      { time: '+3m', timestamp: '11:03', packetRate: 9800, threatScore: 98, state: 'ATTACK', isForecast: true },
    ]
  },

  ATTACK: {
    id: 'ATTACK',
    name: 'Attack (Volumetric SYN Flood & Disruption)',
    description: 'Active, high-severity attack in progress impacting network throughput and availability.',
    decision: {
      timestamp: new Date().toISOString(),
      current_state: 'ATTACK',
      current_stage: 'Impact',
      threat_type: 'Distributed SYN Flood & Resource Exhaustion (T1499)',
      threat_score: 96,
      risk_level: 'CRITICAL',
      confidence: 0.97,
      predicted_next_state: 'ATTACK',
      predicted_stage: 'Impact',
      prediction_confidence: 0.89,
      evidence: [
        'Volumetric packet surge: 8,450 pkts/sec (20x above baseline)',
        'Over 3,800 half-open SYN handshakes per minute overflowing TCP connection backlog',
        'Severe egress asymmetry (0.96) causing 38% packet drop on internal boundary router',
        'Critical service latency exceeding 1,200ms threshold'
      ],
      features: {
        packet_rate: 8450.0,
        byte_rate: 5800000.0,
        connection_frequency: 580.0,
        syn_count: 3820,
        failed_conn_ratio: 0.89,
        byte_asymmetry: 0.96,
        port_entropy: 4.88,
        dst_ip_diversity: 140,
        active_connections: 2150,
        protocol_breakdown: { tcp: 96, udp: 2, icmp: 2, other: 0 }
      },
      forecast: [
        { step: 1, time: '+1 min', horizon_seconds: 60, state: 'ATTACK', stage: 'Impact', threat_score: 96, confidence: 0.95, risk_level: 'CRITICAL' },
        { step: 2, time: '+2 min', horizon_seconds: 120, state: 'ATTACK', stage: 'Impact', threat_score: 94, confidence: 0.91, risk_level: 'CRITICAL' },
        { step: 3, time: '+3 min', horizon_seconds: 180, state: 'RECOVERY', stage: 'Recovery', threat_score: 72, confidence: 0.78, risk_level: 'HIGH' }
      ]
    },
    alerts: [
      {
        id: 'alt-atk-1',
        timestamp: '11:00:30',
        severity: 'CRITICAL',
        title: 'CRITICAL: Volumetric DoS / Resource Starvation',
        description: 'Active SYN flood saturation across edge interface eth0.',
        stage: 'Impact (T1499)',
        recommended_action: 'Engage upstream ISP Scrubbing Center, enable SYN Cookies, and isolate subnet.'
      },
      {
        id: 'alt-atk-2',
        timestamp: '11:00:10',
        severity: 'CRITICAL',
        title: 'Service Health Degradation',
        description: 'Application tier response timeouts exceeding SLA threshold.',
        stage: 'Impact (T1499)',
        recommended_action: 'Reroute critical traffic to failover standby cluster.'
      }
    ],
    timeline: [
      { time: '-15m', timestamp: '10:45', packetRate: 800, threatScore: 30, state: 'NORMAL' },
      { time: '-10m', timestamp: '10:50', packetRate: 1900, threatScore: 55, state: 'SUSPICIOUS' },
      { time: '-5m', timestamp: '10:55', packetRate: 4600, threatScore: 84, state: 'PREDICTED ATTACK' },
      { time: 'Now', timestamp: '11:00', packetRate: 8450, threatScore: 96, state: 'ATTACK' },
      { time: '+1m', timestamp: '11:01', packetRate: 8600, threatScore: 96, state: 'ATTACK', isForecast: true },
      { time: '+2m', timestamp: '11:02', packetRate: 7900, threatScore: 94, state: 'ATTACK', isForecast: true },
      { time: '+3m', timestamp: '11:03', packetRate: 5200, threatScore: 72, state: 'RECOVERY', isForecast: true },
    ]
  },

  RECOVERY: {
    id: 'RECOVERY',
    name: 'Recovery (Incident Dampening & Normalization)',
    description: 'Defensive mitigations deployed; network state stabilizing back toward baseline.',
    decision: {
      timestamp: new Date().toISOString(),
      current_state: 'RECOVERY',
      current_stage: 'Recovery',
      threat_type: 'Post-Attack Stabilization',
      threat_score: 24,
      risk_level: 'LOW',
      confidence: 0.94,
      predicted_next_state: 'NORMAL',
      predicted_stage: 'Baseline',
      prediction_confidence: 0.91,
      evidence: [
        'Automated firewall mitigation filtered malicious CIDR ranges',
        'TCP SYN packet velocity decreased to 65 pkts/min (+12% above nominal)',
        'System latency recovered from 1,200ms to 28ms nominal level',
        'State machine dampening timer active to prevent oscillation'
      ],
      features: {
        packet_rate: 510.0,
        byte_rate: 280000.0,
        connection_frequency: 48.0,
        syn_count: 65,
        failed_conn_ratio: 0.05,
        byte_asymmetry: 0.18,
        port_entropy: 1.12,
        dst_ip_diversity: 22,
        active_connections: 230,
        protocol_breakdown: { tcp: 76, udp: 21, icmp: 2, other: 1 }
      },
      forecast: [
        { step: 1, time: '+1 min', horizon_seconds: 60, state: 'RECOVERY', stage: 'Recovery', threat_score: 18, confidence: 0.93, risk_level: 'LOW' },
        { step: 2, time: '+2 min', horizon_seconds: 120, state: 'NORMAL', stage: 'Baseline', threat_score: 12, confidence: 0.94, risk_level: 'LOW' },
        { step: 3, time: '+3 min', horizon_seconds: 180, state: 'NORMAL', stage: 'Baseline', threat_score: 9, confidence: 0.96, risk_level: 'LOW' }
      ]
    },
    alerts: [
      {
        id: 'alt-rec-1',
        timestamp: '11:00:35',
        severity: 'LOW',
        title: 'Network Stability Restored',
        description: 'Post-incident traffic telemetry confirmed nominal for 3 consecutive windows.',
        stage: 'Recovery',
        recommended_action: 'Archive incident telemetry PCAP for forensic retrospective.'
      }
    ],
    timeline: [
      { time: '-15m', timestamp: '10:45', packetRate: 7800, threatScore: 92, state: 'ATTACK' },
      { time: '-10m', timestamp: '10:50', packetRate: 4200, threatScore: 68, state: 'ATTACK' },
      { time: '-5m', timestamp: '10:55', packetRate: 1100, threatScore: 42, state: 'RECOVERY' },
      { time: 'Now', timestamp: '11:00', packetRate: 510, threatScore: 24, state: 'RECOVERY' },
      { time: '+1m', timestamp: '11:01', packetRate: 460, threatScore: 18, state: 'RECOVERY', isForecast: true },
      { time: '+2m', timestamp: '11:02', packetRate: 430, threatScore: 12, state: 'NORMAL', isForecast: true },
      { time: '+3m', timestamp: '11:03', packetRate: 418, threatScore: 9, state: 'NORMAL', isForecast: true },
    ]
  },

  // Test Edge Cases as required:
  EMPTY_DATASET: {
    id: 'EMPTY_DATASET',
    name: 'Empty Dataset / No Traffic',
    description: 'Telemetry stream is idle or interface tap has zero packets.',
    decision: {
      timestamp: new Date().toISOString(),
      current_state: 'NORMAL',
      current_stage: 'Baseline',
      threat_type: 'No Active Flows',
      threat_score: 0,
      risk_level: 'LOW',
      confidence: 1.0,
      predicted_next_state: 'NORMAL',
      predicted_stage: 'Baseline',
      prediction_confidence: 1.0,
      evidence: [],
      features: {
        packet_rate: 0,
        byte_rate: 0,
        connection_frequency: 0,
        syn_count: 0,
        failed_conn_ratio: 0,
        byte_asymmetry: 0,
        port_entropy: 0,
        dst_ip_diversity: 0,
        active_connections: 0
      },
      forecast: []
    },
    alerts: [],
    timeline: []
  },

  MISSING_FIELDS: {
    id: 'MISSING_FIELDS',
    name: 'Missing Fields / Malformed Payload',
    description: 'Demonstrates UI resilience when backend sends partial or missing schema fields.',
    decision: {
      timestamp: new Date().toISOString(),
      current_state: 'SUSPICIOUS',
      // current_stage missing
      threat_type: '', // empty threat type
      threat_score: undefined as unknown as number, // missing threat score
      confidence: undefined as unknown as number, // missing confidence
      predicted_next_state: 'PREDICTED ATTACK',
      prediction_confidence: undefined as unknown as number,
      evidence: undefined as unknown as string[], // missing evidence array
    },
    alerts: [],
    timeline: []
  }
};
