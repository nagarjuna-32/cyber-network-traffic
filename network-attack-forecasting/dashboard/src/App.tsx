import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header, DashboardViewMode } from './components/Header';
import { TopKpiCards } from './components/TopKpiCards';
import { AttackSimulationLab } from './components/AttackSimulationLab';
import { ThreatStatusPanel } from './components/ThreatStatusPanel';
import { PredictiveForecast } from './components/PredictiveForecast';
import { ThreatScoreGraph } from './components/ThreatScoreGraph';
import { NetworkTopologyGraph } from './components/NetworkTopologyGraph';
import { NetworkGraphView } from './components/NetworkGraphView';
import { LiveActivityPanel } from './components/LiveActivityPanel';
import { AlertCenter } from './components/AlertCenter';
import { MitreAttackPanel } from './components/MitreAttackPanel';
import { MitreIntelligenceView } from './components/MitreIntelligenceView';
import { ExplainableAiPanel } from './components/ExplainableAiPanel';
import { XaiPipelineView } from './components/XaiPipelineView';
import { PipelineStatusPanel } from './components/PipelineStatusPanel';
import { LiveLogsView } from './components/LiveLogsView';
import { DashboardService, FetchResult } from './services/api';
import { 
  SecurityDecision, 
  SecurityAlert, 
  TimelineObservation, 
  SystemHealthStatus,
  NetworkGraphSnapshot,
  MitreMapping,
  ExplainabilityData,
  LiveLogEntry 
} from './types/prediction';
import { WifiOff, RefreshCw, Shield } from 'lucide-react';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<DashboardViewMode>('overview');
  const [currentScenario, setCurrentScenario] = useState<string>('normal');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Telemetry state directly driven by backend API responses
  const [decision, setDecision] = useState<SecurityDecision | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [timeline, setTimeline] = useState<TimelineObservation[]>([]);
  const [networkGraph, setNetworkGraph] = useState<NetworkGraphSnapshot | undefined>(undefined);
  const [mitreMapping, setMitreMapping] = useState<MitreMapping | undefined>(undefined);
  const [explainability, setExplainability] = useState<ExplainabilityData | undefined>(undefined);
  const [pipelineStatus, setPipelineStatus] = useState<Record<string, string> | undefined>(undefined);
  const [rawBackendJson, setRawBackendJson] = useState<any>(null);

  // Rolling SIEM Log Stream
  const [logs, setLogs] = useState<LiveLogEntry[]>([]);
  const logSeqRef = useRef<number>(0);

  const [health, setHealth] = useState<SystemHealthStatus>({
    isBackendConnected: false,
    modelLoaded: true,
    inferenceLatencyMs: 0,
    pipelineLatencyMs: 0,
    dataSource: 'LIVE_MODEL',
    lastUpdated: '',
  });

  // Helper to record structured events
  const pushLog = (category: LiveLogEntry['category'], level: LiveLogEntry['level'], message: string) => {
    logSeqRef.current += 1;
    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const entry: LiveLogEntry = {
      id: `ev-${Date.now()}-${logSeqRef.current}`,
      timestamp: timeStr,
      category,
      level,
      message,
    };
    setLogs((prev) => [entry, ...prev.slice(0, 199)]);
  };

  // Update telemetry from a FetchResult
  const applyFetchResult = useCallback((res: FetchResult) => {
    setDecision(res.decision);
    setAlerts(res.alerts);
    setTimeline(res.timeline);
    setHealth(res.health);
    if (res.network_graph) setNetworkGraph(res.network_graph);
    if (res.mitre_mapping) setMitreMapping(res.mitre_mapping);
    if (res.explainability) setExplainability(res.explainability);
    if (res.pipeline_status) setPipelineStatus(res.pipeline_status);
    setRawBackendJson(res.rawJson || res.decision);

    // Telemetry log events
    const state = res.decision.current_state || 'NORMAL';
    const threatScore = res.decision.threat_score ?? 0;
    const isCritical = state === 'ATTACK' || threatScore >= 70;

    pushLog(
      'WORLD_MODEL',
      isCritical ? 'CRITICAL' : 'INFO',
      `State: ${state} (${res.decision.current_stage || 'Stage'}) | Threat Score: ${threatScore}/100 | Confidence: ${(res.decision.confidence * 100).toFixed(1)}%`
    );

    if (res.network_graph) {
      pushLog(
        'TOPOLOGY',
        'INFO',
        `Network topology: ${res.network_graph.num_nodes} nodes, ${res.network_graph.num_edges} edges | Star score: ${res.network_graph.star_score.toFixed(2)}`
      );
    }

    if (res.mitre_mapping) {
      pushLog(
        'MITRE',
        isCritical ? 'CRITICAL' : 'INFO',
        `MITRE Technique: ${res.mitre_mapping.technique_id} - ${res.mitre_mapping.technique} (${res.mitre_mapping.tactic})`
      );
    }
  }, []);

  // 1. Initial Load & Read-Only Refresh (GET /api/predict/current, GET /api/health, GET /api/pipeline/status)
  const fetchCurrentState = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [predResult, healthResult, statusResult] = await Promise.all([
        DashboardService.fetchCurrentPrediction(),
        DashboardService.checkBackendHealth(),
        DashboardService.fetchPipelineStatus(),
      ]);

      applyFetchResult(predResult);
      setHealth((prev) => ({
        ...prev,
        isBackendConnected: healthResult.isOnline,
        modelLoaded: healthResult.modelLoaded,
        pipelineLatencyMs: healthResult.latencyMs || prev.pipelineLatencyMs,
        lastUpdated: new Date().toLocaleTimeString(),
      }));

      if (Object.keys(statusResult).length > 0) {
        setPipelineStatus(statusResult);
      }
      setBackendError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setBackendError(msg);
      setHealth((prev) => ({
        ...prev,
        isBackendConnected: false,
        lastUpdated: new Date().toLocaleTimeString(),
      }));
      pushLog('ALERT', 'CRITICAL', `Backend connection exception: ${msg}`);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [applyFetchResult]);

  // Initial mount
  useEffect(() => {
    fetchCurrentState(false);
  }, [fetchCurrentState]);

  // 2. Safe Auto-Refresh (Polling safe read-only endpoints every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCurrentState(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchCurrentState]);

  // 3. User Triggered Attack Simulation (POST /api/simulate)
  const handleSelectScenario = async (scenarioId: string) => {
    setCurrentScenario(scenarioId);
    setIsLoading(true);
    setBackendError(null);

    pushLog('WORLD_MODEL', 'INFO', `Operator triggered Attack Simulation: ${scenarioId.toUpperCase()} (POST /api/simulate)`);

    try {
      const simResult = await DashboardService.simulateScenario(scenarioId, 30);
      applyFetchResult(simResult);
      setBackendError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation request failed';
      setBackendError(`Simulation failed: ${msg}`);
      pushLog('ALERT', 'CRITICAL', `Simulation request failure: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-w-[320px] min-h-screen bg-[#070a12] text-slate-100 cyber-grid flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* 1. Top Header with Navigation Tabs */}
      <Header
        health={health}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onManualRefresh={() => fetchCurrentState(false)}
        isLoading={isLoading}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Backend Offline / Error Banner */}
        {backendError && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <WifiOff className="h-5 w-5 text-red-400 flex-shrink-0 animate-pulse" />
              <div>
                <span className="font-bold text-red-300 block uppercase font-mono tracking-wider">
                  BACKEND OFFLINE / CONNECTION WARNING
                </span>
                <span className="text-slate-300">
                  {backendError}. Ensure the backend server is running on <code className="bg-black/50 px-1 py-0.5 rounded text-cyan-300">http://127.0.0.1:8000</code>.
                </span>
              </div>
            </div>
            <button
              onClick={() => fetchCurrentState(false)}
              className="px-3 py-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-white font-mono text-xs flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* 2. Attack Simulation Lab (Controlled Testing Panel) */}
        <AttackSimulationLab
          currentScenario={currentScenario}
          onSelectScenario={handleSelectScenario}
          isLoading={isLoading}
        />

        {/* 3. Top 5 Major KPI Cards (Persistent across all views) */}
        <TopKpiCards
          decision={decision}
          health={health}
        />

        {/* 4. Modular View Switcher */}
        
        {/* View 1: Unified SOC Command Center (All Cards at a glance) */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Primary Telemetry & Visualizations (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <ThreatStatusPanel decision={decision} />
              <PredictiveForecast decision={decision} />
              <ThreatScoreGraph decision={decision} />
              <NetworkTopologyGraph
                graph={networkGraph}
                currentState={decision?.current_state || 'NORMAL'}
              />
              <LiveActivityPanel
                timeline={timeline}
                decision={decision}
              />
            </div>

            {/* Right Column: Intelligence, Explanations & Alerts (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <AlertCenter
                alerts={alerts}
                decision={decision}
              />
              <MitreAttackPanel
                mitreMapping={mitreMapping}
                decision={decision}
              />
              <ExplainableAiPanel
                explainability={explainability}
                decision={decision}
              />
              <PipelineStatusPanel
                pipelineStatus={pipelineStatus}
              />
            </div>

          </div>
        )}

        {/* View 2: Fullscreen Network Topology Map */}
        {activeView === 'topology' && (
          <div className="space-y-5">
            <NetworkGraphView 
              graph={networkGraph} 
              currentState={decision?.current_state || 'NORMAL'} 
            />
          </div>
        )}

        {/* View 3: Fullscreen MITRE ATT&CK Matrix */}
        {activeView === 'mitre' && (
          <div className="space-y-5">
            <MitreIntelligenceView
              mitreMapping={mitreMapping}
              decision={decision}
            />
          </div>
        )}

        {/* View 4: Fullscreen Explainable AI & Health */}
        {activeView === 'xai' && (
          <div className="space-y-5">
            <XaiPipelineView
              explainability={explainability}
              decision={decision}
              pipelineStatus={pipelineStatus}
              health={health}
            />
          </div>
        )}

        {/* View 5: Live SOC SIEM Terminal & Raw Backend JSON Inspector */}
        {activeView === 'logs' && (
          <div className="space-y-5">
            <LiveLogsView
              logs={logs}
              rawBackendJson={rawBackendJson}
              onClearLogs={() => setLogs([])}
              isStreaming={autoRefresh}
              onToggleStreaming={() => setAutoRefresh(!autoRefresh)}
              health={health}
              decision={decision}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] py-3.5 mt-8">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-300 font-semibold">CyberGuard AI &bull; Predictive Network Security</span>
            <span className="text-slate-400">|</span>
            <span>Problem Statement SIH26153</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            PyTorch GRU World Model &bull; 11-Stage Pipeline &bull; MITRE ATT&CK Matrix &bull; SHAP Explainability
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
