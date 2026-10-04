import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Zap, 
  Crosshair, 
  Timer, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { SecurityDecision, SystemHealthStatus } from '../types/prediction';

interface TopKpiCardsProps {
  decision: SecurityDecision | null;
  health: SystemHealthStatus;
}

export const TopKpiCards: React.FC<TopKpiCardsProps> = ({ decision, health }) => {
  const threatScore = decision?.threat_score ?? 0;
  const state = (decision?.current_state || 'NORMAL').toUpperCase();
  const riskLevel = (decision?.risk_level || 'LOW').toUpperCase();
  
  // Model prediction confidence (favor prediction_confidence if > 0, fallback to confidence)
  const confidenceVal = decision?.prediction_confidence && decision.prediction_confidence > 0 
    ? decision.prediction_confidence 
    : Number(decision?.confidence ?? 0);
  const confidencePercent = (confidenceVal * 100).toFixed(1);

  // Latency from API
  const latency = decision?.pipeline_latency_ms && decision.pipeline_latency_ms > 0
    ? decision.pipeline_latency_ms
    : (health.pipelineLatencyMs || health.inferenceLatencyMs || 0);

  // Severity color mapping
  const getStateColor = (s: string) => {
    switch (s) {
      case 'ATTACK':
        return { text: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-800/80', badge: 'bg-red-500/20 text-red-300' };
      case 'SUSPICIOUS':
        return { text: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-800/80', badge: 'bg-orange-500/20 text-orange-300' };
      case 'ELEVATED':
        return { text: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/80', badge: 'bg-amber-500/20 text-amber-300' };
      default:
        return { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/80', badge: 'bg-emerald-500/20 text-emerald-300' };
    }
  };

  const getRiskColor = (r: string) => {
    switch (r) {
      case 'CRITICAL':
        return { text: 'text-red-400', badge: 'bg-red-500/20 border-red-800 text-red-300' };
      case 'HIGH':
        return { text: 'text-orange-400', badge: 'bg-orange-500/20 border-orange-800 text-orange-300' };
      case 'MEDIUM':
        return { text: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-800 text-amber-300' };
      default:
        return { text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-800 text-emerald-300' };
    }
  };

  const stateTheme = getStateColor(state);
  const riskTheme = getRiskColor(riskLevel);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      
      {/* 1. Current Threat Score */}
      <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="uppercase tracking-wider">Threat Score</span>
          <ShieldAlert className={`h-4 w-4 ${threatScore >= 70 ? 'text-red-400 animate-pulse' : threatScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}`} />
        </div>
        
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
            threatScore >= 70 ? 'text-red-400' : threatScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {threatScore}
          </span>
          <span className="text-xs font-mono text-slate-400">/ 100</span>
        </div>

        {/* Linear progress bar */}
        <div className="mt-3 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              threatScore >= 70 
                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                : threatScore >= 40 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                  : 'bg-gradient-to-r from-teal-500 to-emerald-400'
            }`}
            style={{ width: `${Math.max(threatScore, 4)}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex justify-between font-mono">
          <span>0 (Safe)</span>
          <span>100 (Critical)</span>
        </div>
      </div>

      {/* 2. Current Network State */}
      <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="uppercase tracking-wider">Network State</span>
          <Activity className="h-4 w-4 text-cyan-400" />
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${stateTheme.text}`}>
            {state}
          </span>
        </div>

        <div className="mt-2.5 flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${stateTheme.badge}`}>
            Stage: {decision?.current_stage || 'Baseline'}
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 truncate">
          {decision?.threat_type || 'Normal Operations'}
        </div>
      </div>

      {/* 3. Risk Level */}
      <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="uppercase tracking-wider">Risk Level</span>
          <Zap className={`h-4 w-4 ${riskTheme.text}`} />
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${riskTheme.text}`}>
            {riskLevel}
          </span>
        </div>

        <div className="mt-2.5">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${riskTheme.badge}`}>
            Priority: {riskLevel === 'CRITICAL' ? 'P1 Urgent' : riskLevel === 'HIGH' ? 'P2 Elevate' : 'P3 Routine'}
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400">
          SOC Policy Escalation
        </div>
      </div>

      {/* 4. Prediction Confidence */}
      <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="uppercase tracking-wider">Prediction Confidence</span>
          <Crosshair className="h-4 w-4 text-cyan-400" />
        </div>

        <div className="flex items-baseline space-x-1">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300 tracking-tight">
            {confidencePercent}
          </span>
          <span className="text-sm font-mono text-cyan-400">%</span>
        </div>

        <div className="mt-3 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(Number(confidencePercent), 5)}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex justify-between font-mono">
          <span>Dual-Head GRU</span>
          <span className="text-cyan-400">P(y | x)</span>
        </div>
      </div>

      {/* 5. Pipeline Latency */}
      <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="uppercase tracking-wider">Pipeline Latency</span>
          <Timer className="h-4 w-4 text-purple-400" />
        </div>

        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-300 tracking-tight">
            {latency.toFixed(2)}
          </span>
          <span className="text-xs font-mono text-purple-400">ms</span>
        </div>

        <div className="mt-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800/60">
            Real-Time Processing
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Inference: {decision?.inference_latency_ms ? `${decision.inference_latency_ms.toFixed(1)}ms` : '<10ms'}</span>
          <span className="text-emerald-400">FastAPI</span>
        </div>
      </div>

    </div>
  );
};
