import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Crosshair, 
  Zap, 
  Info,
  Layers
} from 'lucide-react';
import { SecurityDecision } from '../types/prediction';

interface ThreatStatusPanelProps {
  decision: SecurityDecision | null;
}

const STATES = [
  { name: 'NORMAL', label: '1. Normal', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/30 active-emerald' },
  { name: 'ELEVATED', label: '2. Elevated', color: 'border-amber-500 text-amber-400 bg-amber-950/30 active-amber' },
  { name: 'SUSPICIOUS', label: '3. Suspicious', color: 'border-orange-500 text-orange-400 bg-orange-950/30 active-orange' },
  { name: 'ATTACK', label: '4. Attack', color: 'border-red-500 text-red-400 bg-red-950/30 active-red' },
];

export const ThreatStatusPanel: React.FC<ThreatStatusPanelProps> = ({ decision }) => {
  const currentState = (decision?.current_state || 'NORMAL').toUpperCase();
  const currentStage = decision?.current_stage || 'Baseline';
  const threatScore = decision?.threat_score ?? 0;
  const riskLevel = (decision?.risk_level || 'LOW').toUpperCase();
  const confidence = Number(decision?.confidence ?? 0);
  const threatType = decision?.threat_type || 'Normal Operations';

  const getSeverityBadge = (s: string) => {
    switch (s) {
      case 'ATTACK':
        return 'bg-red-500/20 text-red-300 border-red-700/80 ring-1 ring-red-500/50';
      case 'SUSPICIOUS':
        return 'bg-orange-500/20 text-orange-300 border-orange-700/80';
      case 'ELEVATED':
        return 'bg-amber-500/20 text-amber-300 border-amber-700/80';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-700/80';
    }
  };

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-4">
        <div>
          <span className="text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider block">
            AI World Model &bull; Security State Machine
          </span>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            CURRENT NETWORK STATE
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border uppercase ${getSeverityBadge(currentState)}`}>
            {currentState} &bull; {riskLevel} RISK
          </span>
        </div>
      </div>

      {/* 4-State Progression Track */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {STATES.map((st) => {
          const isCurrent = currentState === st.name;
          return (
            <div
              key={st.name}
              className={`p-3 rounded-xl border text-center transition-all ${
                isCurrent
                  ? `${st.color} shadow-lg ring-1 ring-current font-bold`
                  : 'bg-slate-900/60 border-slate-800/80 opacity-60 text-slate-400'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider">
                {st.label}
              </div>
              <div className="text-xs font-bold mt-1 font-mono">
                {st.name}
              </div>
              <div className="mt-2 flex justify-center">
                <div className={`h-1.5 w-8 rounded-full ${
                  isCurrent ? 'bg-current animate-pulse' : 'bg-slate-800'
                }`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* State Detail Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase">Attack Stage</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{currentStage}</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block uppercase">Threat Score</span>
          <span className={`text-sm font-bold mt-0.5 block ${
            threatScore >= 70 ? 'text-red-400' : threatScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {threatScore} / 100
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block uppercase">Model Confidence</span>
          <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block uppercase">Threat Classification</span>
          <span className="text-xs font-semibold text-slate-200 mt-0.5 block truncate" title={threatType}>
            {threatType}
          </span>
        </div>
      </div>

    </div>
  );
};
