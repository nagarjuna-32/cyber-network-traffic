import React from 'react';
import { Shield, ShieldAlert, Activity, Wifi, WifiOff, RefreshCw, Cpu, Database } from 'lucide-react';
import { SystemHealthStatus } from '../types/prediction';

interface HeaderProps {
  health: SystemHealthStatus;
  isPolling: boolean;
  onTogglePolling: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  isPolling,
  onTogglePolling,
  onRefresh,
  isLoading
}) => {
  const isDemo = health.dataSource === 'VERIFIED_DEMO';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Branding & Problem Statement ID */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                NetForecast AI
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-mono font-medium">
                  SIH26153
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              AI-based Network Attack Forecasting from Network Traffic Data
            </p>
          </div>
        </div>

        {/* Center: Real vs Mock Badge & Health */}
        <div className="flex items-center space-x-3">
          {/* Data Source Badge */}
          <div className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-2 border transition-all ${
            isDemo 
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/60' 
              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 shadow-sm shadow-emerald-500/20'
          }`}>
            <Database className="h-3.5 w-3.5" />
            <span>
              {isDemo ? 'VERIFIED DEMO DATASET' : 'LIVE MODEL INFERENCE'}
            </span>
          </div>

          {/* Backend Status */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 font-mono">
            {health.isBackendConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span>API: ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-slate-400" />
                <span>API: STANDALONE</span>
              </>
            )}
          </div>

          {/* Latency */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>{health.inferenceLatencyMs > 0 ? `${health.inferenceLatencyMs}ms` : '< 1ms'}</span>
          </div>
        </div>

        {/* Right: Controls & Time */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onTogglePolling}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all ${
              isPolling
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle continuous telemetry streaming simulation"
          >
            <Activity className={`h-3.5 w-3.5 ${isPolling ? 'animate-pulse text-cyan-400' : ''}`} />
            <span>{isPolling ? 'STREAMING' : 'PAUSED'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh prediction frame"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <div className="text-right pl-2 hidden lg:block">
            <div className="text-[11px] font-mono text-slate-400 leading-none">
              Updated: {health.lastUpdated || '--:--:--'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono leading-none mt-1">
              Dual-Head GRU / State Machine
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
