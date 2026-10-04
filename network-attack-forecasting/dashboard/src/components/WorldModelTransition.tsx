import React from 'react';
import { ChevronRight, ArrowRight, ShieldCheck, Search, AlertTriangle, Crosshair, Flame, RefreshCcw } from 'lucide-react';
import { WorldModelState } from '../types/prediction';

interface WorldModelTransitionProps {
  currentState: string;
  predictedNextState: string;
  predictionConfidence: number;
  currentConfidence: number;
}

interface StateNodeConfig {
  key: WorldModelState;
  label: string;
  sublabel: string;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeGlow: string;
  icon: React.ElementType;
}

const STATES_LADDER: StateNodeConfig[] = [
  {
    key: 'NORMAL',
    label: 'NORMAL',
    sublabel: 'Baseline Telemetry',
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/20',
    activeBorder: 'border-emerald-500',
    activeGlow: 'glow-normal',
    icon: ShieldCheck,
  },
  {
    key: 'ELEVATED',
    label: 'ELEVATED',
    sublabel: 'Reconnaissance / Sweep',
    color: 'text-amber-400',
    activeBg: 'bg-amber-500/20',
    activeBorder: 'border-amber-500',
    activeGlow: 'glow-elevated',
    icon: Search,
  },
  {
    key: 'SUSPICIOUS',
    label: 'SUSPICIOUS',
    sublabel: 'Initial Access / C2',
    color: 'text-orange-400',
    activeBg: 'bg-orange-500/20',
    activeBorder: 'border-orange-500',
    activeGlow: 'glow-suspicious',
    icon: AlertTriangle,
  },
  {
    key: 'PREDICTED ATTACK',
    label: 'PREDICTED ATTACK',
    sublabel: 'Imminent Horizon Lead',
    color: 'text-pink-400',
    activeBg: 'bg-pink-500/20',
    activeBorder: 'border-pink-500',
    activeGlow: 'glow-predicted',
    icon: Crosshair,
  },
  {
    key: 'ATTACK',
    label: 'ATTACK',
    sublabel: 'Impact / Exfiltration',
    color: 'text-red-400',
    activeBg: 'bg-red-500/20',
    activeBorder: 'border-red-500',
    activeGlow: 'glow-attack',
    icon: Flame,
  },
  {
    key: 'RECOVERY',
    label: 'RECOVERY',
    sublabel: 'Dampening & Normalize',
    color: 'text-purple-400',
    activeBg: 'bg-purple-500/20',
    activeBorder: 'border-purple-500',
    activeGlow: 'glow-recovery',
    icon: RefreshCcw,
  },
];

export const WorldModelTransition: React.FC<WorldModelTransitionProps> = ({
  currentState = 'NORMAL',
  predictedNextState = 'NORMAL',
  predictionConfidence = 0.0,
  currentConfidence = 0.0,
}) => {
  const normCurrent = (currentState || '').toUpperCase();
  const normPredicted = (predictedNextState || '').toUpperCase();

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Concept Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Network World Model — Temporal State Transition Dynamics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Models continuous transitional probabilities <span className="font-mono text-cyan-300">P(S&#123;t+K&#125; | S&#123;t&#125;)</span> rather than evaluating isolated, memoryless packet snapshots.
          </p>
        </div>

        {/* Transition Summary Pill */}
        <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
          <span className="text-slate-400">Projected Transition:</span>
          <span className="font-bold text-cyan-300">{normCurrent || 'UNKNOWN'}</span>
          <ArrowRight className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span className="font-bold text-pink-400">{normPredicted || 'UNKNOWN'}</span>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[11px]">
            {Math.round((predictionConfidence || 0) * 100)}% Conf
          </span>
        </div>
      </div>

      {/* Progression Ladder Nodes */}
      <div className="pt-6 pb-4 overflow-x-auto">
        <div className="min-w-[760px] flex items-center justify-between gap-2 px-2">
          {STATES_LADDER.map((node, index) => {
            const isCurrent = normCurrent === node.key;
            const isPredicted = normPredicted === node.key;
            const Icon = node.icon;

            return (
              <React.Fragment key={node.key}>
                {/* State Card */}
                <div
                  className={`relative flex-1 rounded-xl p-3 border transition-all duration-300 ${
                    isCurrent
                      ? `${node.activeBg} ${node.activeBorder} ${node.activeGlow} scale-105 z-20`
                      : isPredicted
                      ? 'bg-slate-800/80 border-dashed border-pink-500/80 shadow-md shadow-pink-500/20 z-10'
                      : 'bg-slate-950/50 border-slate-800/80 opacity-60 hover:opacity-80'
                  }`}
                >
                  {/* Status Badges */}
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-ping" />
                      <span>OBSERVED (t)</span>
                    </div>
                  )}

                  {!isCurrent && isPredicted && (
                    <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      FORECAST (t+K)
                    </div>
                  )}

                  <div className="flex items-center space-x-2 mb-1.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isCurrent ? 'bg-slate-900/90 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isCurrent ? node.color : ''}`} />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Step {index + 1}</span>
                  </div>

                  <div className={`font-bold text-xs tracking-tight ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                    {node.label}
                  </div>
                  
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={node.sublabel}>
                    {node.sublabel}
                  </div>

                  {/* Confidence metrics inside cards */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono flex justify-between items-center text-slate-400">
                    <span>Certainty</span>
                    <span className="font-semibold text-slate-300">
                      {isCurrent 
                        ? `${Math.round((currentConfidence || 0) * 100)}%` 
                        : isPredicted 
                        ? `${Math.round((predictionConfidence || 0) * 100)}%` 
                        : '--'}
                    </span>
                  </div>
                </div>

                {/* Transition Arrow (except after last item) */}
                {index < STATES_LADDER.length - 1 && (
                  <div className="flex-shrink-0 px-1 text-slate-600">
                    <ChevronRight className={`h-4 w-4 ${isCurrent ? 'text-cyan-400 animate-pulse' : 'text-slate-700'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Trajectory Insight Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-mono">Transition Vector:</span>
          <span className="text-slate-300">
            {normCurrent === 'NORMAL' && 'System at equilibrium baseline. Monitoring for exploratory scans.'}
            {normCurrent === 'ELEVATED' && 'Reconnaissance activity observed. Proactive mitigation window open.'}
            {normCurrent === 'SUSPICIOUS' && 'Precursor signatures detected. Threat actor establishing foothold.'}
            {normCurrent === 'PREDICTED ATTACK' && 'World Model forecasting imminent state compromise. Early warning active.'}
            {normCurrent === 'ATTACK' && 'Critical state violation in progress. Automated response required.'}
            {normCurrent === 'RECOVERY' && 'Post-incident stabilization in progress. Dampening oscillation risk.'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-cyan-400">
          Cycle: NORMAL &#8594; ELEVATED &#8594; SUSPICIOUS &#8594; PREDICTED ATTACK &#8594; ATTACK &#8594; RECOVERY &#8594; NORMAL
        </div>
      </div>
    </div>
  );
};
