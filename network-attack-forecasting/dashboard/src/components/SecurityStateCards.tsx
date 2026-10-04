import React from 'react';
import { Shield, AlertOctagon, TrendingUp, Gauge, Crosshair, Sparkles } from 'lucide-react';
import { SecurityDecision } from '../types/prediction';

interface SecurityStateCardsProps {
  decision?: Partial<SecurityDecision>;
}

export const SecurityStateCards: React.FC<SecurityStateCardsProps> = ({ decision = {} }) => {
  // Graceful field handling
  const currentState = decision.current_state || 'UNKNOWN';
  const currentStage = decision.current_stage || 'Unassigned';
  const threatType = decision.threat_type || 'None Identified';
  const threatScore = typeof decision.threat_score === 'number' ? Math.max(0, Math.min(100, Math.round(decision.threat_score))) : 0;
  const currentConfidence = typeof decision.confidence === 'number' ? Math.max(0, Math.min(1, decision.confidence)) : 0.0;
  const predictedNextState = decision.predicted_next_state || 'NORMAL';
  const predictedStage = decision.predicted_stage || 'Baseline';
  const predictionConfidence = typeof decision.prediction_confidence === 'number' ? Math.max(0, Math.min(1, decision.prediction_confidence)) : 0.0;
  const riskLevel = decision.risk_level || (threatScore > 80 ? 'CRITICAL' : threatScore > 60 ? 'HIGH' : threatScore > 25 ? 'MEDIUM' : 'LOW');

  // Colors based on state
  const getStateColor = (state: string) => {
    switch (state.toUpperCase()) {
      case 'NORMAL':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
      case 'ELEVATED':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      case 'SUSPICIOUS':
        return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
      case 'PREDICTED ATTACK':
        return { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' };
      case 'ATTACK':
        return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
      case 'RECOVERY':
        return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
      default:
        return { text: 'text-slate-400', bg: 'bg-slate-800/40', border: 'border-slate-700' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bar: 'bg-red-500', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
    if (score >= 60) return { bar: 'bg-orange-500', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
    if (score >= 25) return { bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  };

  const currentColor = getStateColor(currentState);
  const predictedColor = getStateColor(predictedNextState);
  const scoreColors = getScoreColor(threatScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      
      {/* 1. CURRENT SECURITY STATE */}
      <div className={`p-4 rounded-xl border ${currentColor.border} ${currentColor.bg} backdrop-blur-sm relative overflow-hidden transition-all shadow-md`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            1. Current Security State
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700/60">
            Window: t
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className={`text-2xl font-black tracking-tight ${currentColor.text}`}>
              {currentState}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">
              Stage: <span className="text-slate-200 font-semibold">{currentStage}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase border ${scoreColors.badge}`}>
              {riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* 2. THREAT TYPE */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm relative overflow-hidden transition-all shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="h-3.5 w-3.5 text-cyan-400" />
            2. Threat Type
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            Classification
          </span>
        </div>
        <div className="mt-3">
          <div className="text-lg font-bold text-slate-100 tracking-tight truncate" title={threatType}>
            {threatType}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>Behavioral signature heuristics & MITRE alignment</span>
          </div>
        </div>
      </div>

      {/* 3. THREAT SCORE (0 - 100 COMPOSITE) */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm relative overflow-hidden transition-all shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-amber-400" />
            3. Threat Score [0–100]
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Composite Metric
          </span>
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <div className={`text-3xl font-black font-mono tracking-tight ${scoreColors.text}`}>
              {threatScore}<span className="text-sm font-normal text-slate-500">/100</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Distinct from raw probability
            </div>
          </div>
          <div className="w-28 text-right">
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
              <div
                className={`h-full ${scoreColors.bar} transition-all duration-500 rounded-full`}
                style={{ width: `${threatScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. CURRENT CONFIDENCE */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm relative overflow-hidden transition-all shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            4. Current Confidence
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            P(S_t)
          </span>
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-slate-100">
              {(currentConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Model classification certainty at t
            </div>
          </div>
          <div className="w-24 text-right">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-cyan-400 transition-all duration-500 rounded-full"
                style={{ width: `${currentConfidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. PREDICTED NEXT STATE */}
      <div className={`p-4 rounded-xl border ${predictedColor.border} ${predictedColor.bg} backdrop-blur-sm relative overflow-hidden transition-all shadow-md`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-pink-400" />
            5. Predicted Next State
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-800/60">
            Horizon: t+K
          </span>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-black tracking-tight ${predictedColor.text}`}>
            {predictedNextState}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 font-medium">
            Projected Stage: <span className="text-slate-200 font-semibold">{predictedStage}</span>
          </div>
        </div>
      </div>

      {/* 6. PREDICTION CONFIDENCE */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm relative overflow-hidden transition-all shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-pink-400" />
            6. Prediction Confidence
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            P(S_{'{t+K}'} | S_t)
          </span>
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-pink-300">
              {(predictionConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              World Model lookahead certainty
            </div>
          </div>
          <div className="w-24 text-right">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-pink-500 transition-all duration-500 rounded-full"
                style={{ width: `${predictionConfidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
