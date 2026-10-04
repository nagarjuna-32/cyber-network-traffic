import React from 'react';
import { 
  PlayCircle, 
  FlaskConical, 
  RefreshCw, 
  ShieldCheck, 
  Radar, 
  Flame, 
  Radio, 
  Zap, 
  Layers 
} from 'lucide-react';

interface AttackSimulationLabProps {
  currentScenario: string;
  onSelectScenario: (scenario: string) => void;
  isLoading: boolean;
}

const SCENARIOS = [
  { id: 'normal', label: 'NORMAL', desc: 'Baseline Traffic', icon: ShieldCheck, color: 'hover:border-emerald-500 hover:text-emerald-300 active-emerald' },
  { id: 'scanning', label: 'SCANNING', desc: 'Port / Host Probes', icon: Radar, color: 'hover:border-blue-500 hover:text-blue-300 active-blue' },
  { id: 'syn_flood', label: 'SYN FLOOD', desc: 'Handshake Flood', icon: Zap, color: 'hover:border-amber-500 hover:text-amber-300 active-amber' },
  { id: 'ddos', label: 'DDOS', desc: 'Volumetric Attack', icon: Flame, color: 'hover:border-red-500 hover:text-red-300 active-red' },
  { id: 'beaconing', label: 'BEACONING', desc: 'C2 Command Traffic', icon: Radio, color: 'hover:border-purple-500 hover:text-purple-300 active-purple' },
  { id: 'udp_attack', label: 'UDP ATTACK', desc: 'High-Rate Flood', icon: Zap, color: 'hover:border-rose-500 hover:text-rose-300 active-rose' },
  { id: 'mixed', label: 'MIXED', desc: 'Multi-Vector Vector', icon: Layers, color: 'hover:border-indigo-500 hover:text-indigo-300 active-indigo' },
];

export const AttackSimulationLab: React.FC<AttackSimulationLabProps> = ({
  currentScenario,
  onSelectScenario,
  isLoading,
}) => {
  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-4 shadow-xl relative overflow-hidden">
      
      {/* Top Header Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              Attack Simulation Lab
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                POST /api/simulate
              </span>
            </h3>
          </div>
        </div>

        {/* Operational Status Label */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 font-bold uppercase tracking-wider">
            CONTROLLED TESTBED / LIVE INFERENCE
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 mt-2 mb-3">
        Inject controlled synthetic network traffic vectors into the active AI World Model to test real-time state transitions, multi-step forward forecasts, and MITRE mitigations:
      </p>

      {/* Scenario Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {SCENARIOS.map((item) => {
          const Icon = item.icon;
          const isActive = currentScenario.toLowerCase() === item.id.toLowerCase();

          return (
            <button
              key={item.id}
              onClick={() => onSelectScenario(item.id)}
              disabled={isLoading}
              className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group disabled:opacity-50 ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400'
                  : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-mono font-bold tracking-wide ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                  {item.label}
                </span>
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
              </div>

              <div className="text-[10px] text-slate-400 truncate">
                {item.desc}
              </div>

              {/* Active Indicator dot */}
              {isActive && (
                <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Loading Banner when analyzing */}
      {isLoading && (
        <div className="mt-3 p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-200 text-xs font-mono flex items-center justify-center space-x-2 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
          <span className="font-bold tracking-wider">ANALYZING NETWORK TRAFFIC... (POST /api/simulate)</span>
        </div>
      )}

    </div>
  );
};
