import React from 'react';
import { 
  Shield, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Cpu, 
  Clock,
  LayoutDashboard,
  Network,
  Crosshair,
  BrainCircuit,
  Terminal
} from 'lucide-react';
import { SystemHealthStatus } from '../types/prediction';

export type DashboardViewMode = 'overview' | 'topology' | 'mitre' | 'xai' | 'logs';

interface HeaderProps {
  health: SystemHealthStatus;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  isLoading: boolean;
  activeView: DashboardViewMode;
  onSelectView: (view: DashboardViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  autoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  isLoading,
  activeView,
  onSelectView,
}) => {
  const isOnline = health.isBackendConnected;
  const isModelLoaded = health.modelLoaded;

  const viewTabs: { id: DashboardViewMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'SOC Command Center', icon: LayoutDashboard },
    { id: 'topology', label: 'Network Topology', icon: Network },
    { id: 'mitre', label: 'MITRE ATT&CK Matrix', icon: Crosshair },
    { id: 'xai', label: 'Explainable AI & Health', icon: BrainCircuit },
    { id: 'logs', label: 'Live SIEM Terminal & JSON', icon: Terminal },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40">
      
      {/* Top Bar */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                CyberGuard AI
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
                SOC v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Predictive Network Security &bull; <span className="text-slate-300 italic">"Don't just detect the attack — predict what happens next."</span>
            </p>
          </div>
        </div>

        {/* Center / Right: Real Telemetry Badges */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 text-xs font-mono">
          
          {/* Backend Connection Status (Real /health) */}
          <div className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 transition-all ${
            isOnline
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 shadow-sm shadow-emerald-500/10'
              : 'bg-red-950/60 text-red-300 border-red-800/80 animate-pulse'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-semibold tracking-wide">
              {isOnline ? '● SYSTEM ONLINE' : '● BACKEND OFFLINE'}
            </span>
          </div>

          {/* AI Model Status */}
          <div className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 transition-all ${
            isModelLoaded
              ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/80'
              : 'bg-amber-950/40 text-amber-300 border-amber-800/80'
          }`}>
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-semibold tracking-wide">
              {isModelLoaded ? '● AI MODEL LOADED' : '● MODEL STANDBY'}
            </span>
          </div>

          {/* Pipeline Latency */}
          {isOnline && (
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-400">Latency:</span>
              <span className="text-cyan-300 font-bold">
                {health.pipelineLatencyMs ? `${health.pipelineLatencyMs.toFixed(1)}ms` : health.inferenceLatencyMs ? `${health.inferenceLatencyMs.toFixed(1)}ms` : '<10ms'}
              </span>
            </div>
          )}

          {/* Auto Refresh Polling Toggle */}
          <button
            onClick={onToggleAutoRefresh}
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all ${
              autoRefresh
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Auto-refresh read-only monitoring telemetry every 5s"
          >
            <Activity className={`h-3.5 w-3.5 ${autoRefresh ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{autoRefresh ? 'AUTO: 5s' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onManualRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Fetch latest prediction state immediately"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Last Updated Timestamp */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 text-slate-400 text-[11px]">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{health.lastUpdated || '--:--:--'}</span>
          </div>
        </div>

      </div>

      {/* Navigation Sub-bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 overflow-x-auto py-1">
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectView(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 border whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-semibold shadow-sm shadow-cyan-500/10'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </header>
  );
};
