import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { WorldModelTransition } from './components/WorldModelTransition';
import { SecurityStateCards } from './components/SecurityStateCards';
import { EvidencePanel } from './components/EvidencePanel';
import { TimelineView } from './components/TimelineView';
import { AlertsFeed } from './components/AlertsFeed';
import { ScenarioControls } from './components/ScenarioControls';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { DatabaseIngestionModal } from './components/DatabaseIngestionModal';
import { DashboardService } from './services/api';
import { 
  SecurityDecision, 
  SecurityAlert, 
  TimelineObservation, 
  SystemHealthStatus,
  DatabaseConfig,
  DatabaseFlowRecord
} from './types/prediction';
import { AlertCircle, X, Shield, Info, CheckCircle } from 'lucide-react';

const defaultDbConfig: DatabaseConfig = {
  engine: 'sqlite',
  host: 'localhost',
  port: 5432,
  databaseName: 'store.db',
  tableName: 'network_flows_telemetry',
  username: 'soc_analyst',
  isConnected: true,
  lastPingMs: 3,
  ssl: true,
};

const defaultSeedRecords: DatabaseFlowRecord[] = [
  {
    id: 'DB-100401',
    timestamp: new Date(Date.now() - 360000).toISOString(),
    sourceIp: '192.168.1.15',
    sourcePort: 49152,
    destIp: '192.168.1.254',
    destPort: 443,
    protocol: 'TCP',
    flowDuration: 2400,
    packetRate: 15.2,
    byteRate: 18200,
    currentState: 'NORMAL',
    threatType: 'Standard Enterprise HTTPS Session',
    threatScore: 4.8,
    confidence: 0.96,
    predictedNextState: 'NORMAL',
    predictionConfidence: 0.95,
    evidence: 'Standard TLS 1.3 handshake with symmetric cipher negotiation.'
  },
  {
    id: 'DB-100402',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    sourceIp: '10.0.12.84',
    sourcePort: 38290,
    destIp: '192.168.1.50',
    destPort: 135,
    protocol: 'TCP',
    flowDuration: 180,
    packetRate: 45.0,
    byteRate: 4800,
    currentState: 'ELEVATED',
    threatType: 'RPC Endpoint Mapper Reconnaissance',
    threatScore: 38.5,
    confidence: 0.86,
    predictedNextState: 'SUSPICIOUS',
    predictionConfidence: 0.81,
    evidence: 'Sequential RPC binding probes against internal domain services.'
  },
  {
    id: 'DB-100403',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    sourceIp: '10.0.12.84',
    sourcePort: 4444,
    destIp: '192.168.1.105',
    destPort: 445,
    protocol: 'TCP',
    flowDuration: 320,
    packetRate: 128.4,
    byteRate: 54000,
    currentState: 'SUSPICIOUS',
    threatType: 'Lateral SMB Credential Spray (T1021)',
    threatScore: 72.4,
    confidence: 0.91,
    predictedNextState: 'PREDICTED ATTACK',
    predictionConfidence: 0.87,
    evidence: 'High-frequency Kerberos authentication attempts with elevated port entropy.'
  },
  {
    id: 'DB-100404',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    sourceIp: '203.0.113.88',
    sourcePort: 55432,
    destIp: '192.168.1.1',
    destPort: 80,
    protocol: 'UDP',
    flowDuration: 40,
    packetRate: 2150.0,
    byteRate: 780000,
    currentState: 'ATTACK',
    threatType: 'Volumetric UDP Flood Saturation (T1498)',
    threatScore: 92.5,
    confidence: 0.97,
    predictedNextState: 'ATTACK',
    predictionConfidence: 0.93,
    evidence: 'Gateway bandwidth capacity exceeded (>780 KB/s); buffer saturation alert.'
  },
  {
    id: 'DB-100405',
    timestamp: new Date().toISOString(),
    sourceIp: '10.0.12.84',
    sourcePort: 4444,
    destIp: '192.168.1.105',
    destPort: 445,
    protocol: 'TCP',
    flowDuration: 80,
    packetRate: 0.0,
    byteRate: 0,
    currentState: 'RECOVERY',
    threatType: 'Ingress ACL Isolation & Traffic Dampening',
    threatScore: 22.0,
    confidence: 0.94,
    predictedNextState: 'NORMAL',
    predictionConfidence: 0.91,
    evidence: 'Host isolated via dynamic switch ACL; traffic returned to safe baseline.'
  }
];

export const App: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<string>('NORMAL');
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [decision, setDecision] = useState<SecurityDecision | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [timeline, setTimeline] = useState<TimelineObservation[]>([]);
  const [health, setHealth] = useState<SystemHealthStatus>({
    isBackendConnected: false,
    modelLoaded: true,
    inferenceLatencyMs: 14,
    dataSource: 'VERIFIED_DEMO',
    lastUpdated: '',
  });

  // Database Ingestion Hub State
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [dbModalTab, setDbModalTab] = useState<'input' | 'config' | 'table'>('input');
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(defaultDbConfig);
  const [dbRecords, setDbRecords] = useState<DatabaseFlowRecord[]>(defaultSeedRecords);

  // Fetch or update dashboard telemetry
  const loadData = useCallback(async (scenarioKey: string, live: boolean) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await DashboardService.fetchDashboardData(scenarioKey, live);
      setDecision(res.decision);
      setAlerts(res.alerts);
      setTimeline(res.timeline);
      setHealth(res.health);
      if (res.error) {
        setApiError(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setApiError(`Failed to load data: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load & scenario changes
  useEffect(() => {
    loadData(currentScenario, isLiveMode);
  }, [currentScenario, isLiveMode, loadData]);

  // Live telemetry streaming simulation (live tracking ticker)
  useEffect(() => {
    if (!isPolling) return;

    const cycle = ['NORMAL', 'ELEVATED', 'SUSPICIOUS', 'PREDICTED ATTACK', 'ATTACK', 'RECOVERY'];
    const timer = setInterval(() => {
      setCurrentScenario((prev) => {
        const nextIdx = (cycle.indexOf(prev) + 1) % cycle.length;
        return cycle[nextIdx];
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isPolling]);

  // Handlers
  const handleSelectScenario = (key: string) => {
    setIsLiveMode(false);
    setCurrentScenario(key);
  };

  const handleToggleLiveMode = () => {
    const nextMode = !isLiveMode;
    setIsLiveMode(nextMode);
  };

  const handleSimulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleApplyCustomJson = (jsonString: string) => {
    try {
      const customDecision: SecurityDecision = JSON.parse(jsonString);
      setDecision(customDecision);
      setIsLiveMode(false);
      setApiError(null);
      setNotificationMsg("Custom JSON telemetry successfully loaded into active pipeline!");
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : 'Invalid JSON input');
    }
  };

  // Open Database Modal
  const handleOpenDatabaseModal = (tab: 'input' | 'config' | 'table' = 'input') => {
    setDbModalTab(tab);
    setIsDbModalOpen(true);
  };

  // Inject Database Record into Pipeline
  const handleInjectDatabaseRecord = (record: DatabaseFlowRecord) => {
    // 1. Prepend to records buffer
    setDbRecords((prev) => [record, ...prev]);

    // 2. Map directly to Shreenisha's standardized prediction object schema:
    // timestamp, current_state, threat_type, threat_score, confidence, predicted_next_state, prediction_confidence, evidence
    const updatedDecision: SecurityDecision = {
      timestamp: record.timestamp,
      current_state: record.currentState,
      threat_type: record.threatType,
      threat_score: record.threatScore,
      confidence: record.confidence,
      predicted_next_state: record.predictedNextState,
      prediction_confidence: record.predictionConfidence,
      evidence: [
        record.evidence,
        `Observed Socket: ${record.sourceIp}:${record.sourcePort} ➔ ${record.destIp}:${record.destPort} [${record.protocol}]`,
        `Ingested via DB Engine: ${dbConfig.engine.toUpperCase()} (${dbConfig.databaseName}.${dbConfig.tableName})`,
        `Telemetry: Rate = ${record.packetRate.toFixed(1)} pkts/s, Volume = ${(record.byteRate / 1024).toFixed(1)} KB/s, Session = ${record.flowDuration}ms`
      ],
      features: {
        packet_rate: record.packetRate,
        byte_rate: record.byteRate,
        connection_frequency: +(record.packetRate / 8).toFixed(1),
        syn_count: record.protocol === 'TCP' ? Math.floor(record.packetRate * 0.35) : 0,
        active_connections: 1,
        protocol_breakdown: {
          tcp: record.protocol === 'TCP' ? 100 : 0,
          udp: record.protocol === 'UDP' ? 100 : 0,
          icmp: record.protocol === 'ICMP' ? 100 : 0,
          other: 0
        }
      },
      threat_threads: [
        {
          id: `TH-${record.id}`,
          sourceIp: record.sourceIp,
          destIp: record.destIp,
          destPort: record.destPort,
          protocol: record.protocol,
          threatStatus: 
            record.currentState === 'ATTACK' ? 'ATTACK' :
            record.currentState === 'SUSPICIOUS' ? 'SUSPICIOUS' :
            record.currentState === 'ELEVATED' ? 'ANOMALOUS' : 'BENIGN',
          flowRate: record.packetRate,
          matchedPattern: record.threatType,
          lastSeen: 'Just now'
        },
        ...(decision?.threat_threads?.slice(0, 3) || [])
      ]
    };

    setDecision(updatedDecision);
    setCurrentScenario(record.currentState);

    // 3. Update timeline observations
    const newTimelinePoint: TimelineObservation = {
      time: 'Now (DB)',
      timestamp: record.timestamp,
      packetRate: record.packetRate,
      threatScore: record.threatScore,
      state: record.currentState,
      isForecast: false,
      confidence: record.confidence
    };
    setTimeline((prev) => [...prev.slice(1), newTimelinePoint]);

    // 4. Update health data source
    setHealth((prev) => ({
      ...prev,
      dataSource: 'DATABASE_INJECTED',
      inferenceLatencyMs: 6,
      lastUpdated: new Date().toLocaleTimeString()
    }));

    // 5. Generate high priority alert if threat score exceeds threshold
    if (record.threatScore > 50 || record.currentState === 'ATTACK' || record.currentState === 'PREDICTED ATTACK') {
      const newAlert: SecurityAlert = {
        id: `DB-ALT-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        severity: record.threatScore > 80 ? 'CRITICAL' : 'HIGH',
        title: `DB Ingestion Alert: ${record.threatType}`,
        description: `Direct database record '${record.id}' triggered escalation to ${record.currentState}. ${record.evidence}`,
        stage: record.currentState,
        recommended_action: `Inspect traffic on socket ${record.sourceIp}:${record.sourcePort} and enforce network ACL.`
      };
      setAlerts((prev) => [newAlert, ...prev.slice(0, 8)]);
    }

    setNotificationMsg(`Database record '${record.id}' successfully injected into ${dbConfig.databaseName}.${dbConfig.tableName}! World Model state transitioned to ${record.currentState}.`);
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  const handleSeedDatabaseRecords = () => {
    setDbRecords(defaultSeedRecords);
    setNotificationMsg("Database records buffer reset to verified reference seed datasets.");
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleClearDatabaseRecords = () => {
    setDbRecords([]);
    setNotificationMsg("Database records buffer cleared.");
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  return (
    <div className="min-w-[320px] min-h-screen bg-[#07090e] text-slate-100 cyber-grid flex flex-col font-sans">
      {/* 1. Header Bar */}
      <Header
        health={health}
        isPolling={isPolling}
        onTogglePolling={() => setIsPolling(!isPolling)}
        onRefresh={() => loadData(currentScenario, isLiveMode)}
        isLoading={isLoading}
        onOpenDatabaseModal={handleOpenDatabaseModal}
        dbEngine={dbConfig.engine}
        dbRecordsCount={dbRecords.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Success / Notification Banner if any */}
        {notificationMsg && (
          <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/80 text-cyan-200 text-xs flex items-center justify-between shadow-lg shadow-cyan-950/40 animate-in fade-in">
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <span>{notificationMsg}</span>
            </div>
            <button
              onClick={() => setNotificationMsg(null)}
              className="p-1 hover:bg-cyan-900/60 rounded text-cyan-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Error / API Alert Banner if any */}
        {apiError && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="p-1 hover:bg-amber-900/60 rounded text-amber-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 2. Sample Input Presets, Database Ingestion Trigger & Live Controls */}
        <ScenarioControls
          currentScenario={currentScenario}
          onSelectScenario={handleSelectScenario}
          isLiveMode={isLiveMode}
          onToggleLiveMode={handleToggleLiveMode}
          onSimulateLoading={handleSimulateLoading}
          onApplyCustomJson={handleApplyCustomJson}
          isPolling={isPolling}
          onTogglePolling={() => setIsPolling(!isPolling)}
          onOpenDatabaseModal={handleOpenDatabaseModal}
        />

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* 3. World Model State Transition Dynamics (Cycle: NORMAL -> ELEVATED -> SUSPICIOUS -> PREDICTED ATTACK -> ATTACK -> RECOVERY -> NORMAL) */}
            <WorldModelTransition
              currentState={decision?.current_state || 'NORMAL'}
              predictedNextState={decision?.predicted_next_state || 'NORMAL'}
              predictionConfidence={decision?.prediction_confidence ?? 0}
              currentConfidence={decision?.confidence ?? 0}
            />

            {/* 4. Displays 1-6: Security State Metrics Cards */}
            <SecurityStateCards decision={decision || {}} />

            {/* 5. Display 8: Traffic & Predictive Behavior Timeline (Nice Smooth Time-Series Graph + Live Tracking) */}
            <TimelineView
              timeline={timeline}
              forecast={decision?.forecast}
            />

            {/* 6. Display 9: Live Detected Threat Threads & Sockets + Early Warning Alerts */}
            <AlertsFeed
              alerts={alerts}
              threads={decision?.threat_threads}
            />

            {/* 7. Display 7: Behavioral Evidence & Telemetry Signals */}
            <EvidencePanel
              evidence={decision?.evidence}
              features={decision?.features}
            />
          </>
        )}

      </main>

      {/* Database & Ingestion Hub Modal */}
      <DatabaseIngestionModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        config={dbConfig}
        onUpdateConfig={(newCfg) => setDbConfig(newCfg)}
        records={dbRecords}
        onInjectRecord={handleInjectDatabaseRecord}
        onSeedRecords={handleSeedDatabaseRecords}
        onClearRecords={handleClearDatabaseRecords}
        initialTab={dbModalTab}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3.5 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span>NetForecast AI &bull; SIH26153 Network Attack Forecasting</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Ownership: feature/dashboard &bull; Shreenisha Prediction Contract &bull; Database Telemetry Ingestion Hub Active
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
