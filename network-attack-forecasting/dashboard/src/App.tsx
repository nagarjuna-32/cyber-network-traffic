import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { WorldModelTransition } from './components/WorldModelTransition';
import { SecurityStateCards } from './components/SecurityStateCards';
import { EvidencePanel } from './components/EvidencePanel';
import { TimelineView } from './components/TimelineView';
import { AlertsFeed } from './components/AlertsFeed';
import { ScenarioControls } from './components/ScenarioControls';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { DashboardService } from './services/api';
import { SecurityDecision, SecurityAlert, TimelineObservation, SystemHealthStatus } from './types/prediction';
import { AlertCircle, X, Shield, Info } from 'lucide-react';

export const App: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<string>('NORMAL');
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Initial load
  useEffect(() => {
    loadData(currentScenario, isLiveMode);
  }, [currentScenario, isLiveMode, loadData]);

  // Telemetry stream simulation timer
  useEffect(() => {
    if (!isPolling) return;

    const cycle = ['NORMAL', 'ELEVATED', 'SUSPICIOUS', 'PREDICTED ATTACK', 'ATTACK', 'RECOVERY'];
    const timer = setInterval(() => {
      setCurrentScenario((prev) => {
        const nextIdx = (cycle.indexOf(prev) + 1) % cycle.length;
        return cycle[nextIdx];
      });
    }, 5000);

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
    }, 1800);
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
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

        {/* 2. Interactive Scenario Test Harness */}
        <ScenarioControls
          currentScenario={currentScenario}
          onSelectScenario={handleSelectScenario}
          isLiveMode={isLiveMode}
          onToggleLiveMode={handleToggleLiveMode}
          onSimulateLoading={handleSimulateLoading}
        />

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* 3. Suggested Visualization: World Model State Transition Cycle */}
            <WorldModelTransition
              currentState={decision?.current_state || 'NORMAL'}
              predictedNextState={decision?.predicted_next_state || 'NORMAL'}
              predictionConfidence={decision?.prediction_confidence ?? 0}
              currentConfidence={decision?.confidence ?? 0}
            />

            {/* 4. Display 1-6: Security State Metrics Cards */}
            <SecurityStateCards decision={decision || {}} />

            {/* 5. Display 7: Behavioral Evidence & Features */}
            <EvidencePanel
              evidence={decision?.evidence}
              features={decision?.features}
            />

            {/* 6. Display 8: Traffic & Predictive Behavior Timeline */}
            <TimelineView
              timeline={timeline}
              forecast={decision?.forecast}
            />

            {/* 7. Display 9: Early Warning Alerts & Recommended SOC Playbooks */}
            <AlertsFeed alerts={alerts} />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span>NetForecast AI &bull; Smart India Hackathon Problem Statement SIH26153</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Contract: Shreenisha &bull; Arch: Nagarjuna &bull; Frontend: React 18 + TypeScript + Tailwind
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
