import React from 'react';
import { 
  ArrowRight, 
  Clock, 
  Crosshair, 
  ShieldAlert, 
  Cpu, 
  Sparkles,
  TrendingUp,
  AlertTriangle 
} from 'lucide-react';
import { SecurityDecision, ForecastStep } from '../types/prediction';

interface PredictiveForecastProps {
  decision: SecurityDecision | null;
}

export const PredictiveForecast: React.FC<PredictiveForecastProps> = ({ decision }) => {
  const currentStep = {
    step: 0,
    time: 'CURRENT',
    state: (decision?.current_state || 'NORMAL').toUpperCase(),
    stage: decision?.current_stage || 'Baseline',
    threat_score: decision?.threat_score ?? 0,
    risk_level: (decision?.risk_level || 'LOW').toUpperCase(),
    confidence: decision?.confidence ?? 0.85,
    isCurrent: true,
  };

  const rawForecast = decision?.forecast || [];
  
  // Format the 3 future forecast steps (+5s, +10s, +15s)
  const forecastSteps = [1, 2, 3].map((stepIdx) => {
    const matched = rawForecast.find((f: any) => f.step === stepIdx);
    if (matched) {
      return {
        step: stepIdx,
        time: `+${stepIdx * 5} sec`,
        state: matched.state.toUpperCase(),
        stage: matched.stage,
        threat_score: matched.threat_score,
        risk_level: (matched.risk_level || (matched.threat_score >= 70 ? 'CRITICAL' : matched.threat_score >= 40 ? 'MEDIUM' : 'LOW')).toUpperCase(),
        confidence: matched.confidence,
        isCurrent: false,
      };
    }
    // Fallback computed from predicted next state if forecast array is empty
    const nextState = (decision?.predicted_next_state || 'NORMAL').toUpperCase();
    const nextStage = decision?.predicted_stage || 'Baseline';
    const nextConf = decision?.prediction_confidence ?? 0.70;
    const isAtt = nextState === 'ATTACK';
    const computedScore = isAtt ? Math.min(100, (decision?.threat_score ?? 0) + (stepIdx * 5)) : Math.max(5, (decision?.threat_score ?? 0) - (stepIdx * 5));

    return {
      step: stepIdx,
      time: `+${stepIdx * 5} sec`,
      state: nextState,
      stage: nextStage,
      threat_score: computedScore,
      risk_level: computedScore >= 70 ? 'CRITICAL' : computedScore >= 40 ? 'MEDIUM' : 'LOW',
      confidence: Math.max(0.3, nextConf - (stepIdx * 0.08)),
      isCurrent: false,
    };
  });

  const allSteps = [currentStep, ...forecastSteps];

  const getStepColor = (state: string) => {
    switch (state) {
      case 'ATTACK':
        return { 
          card: 'bg-red-950/30 border-red-800/80', 
          badge: 'bg-red-500/20 text-red-300 border-red-700', 
          text: 'text-red-400',
          meter: 'bg-red-500' 
        };
      case 'SUSPICIOUS':
        return { 
          card: 'bg-orange-950/30 border-orange-800/80', 
          badge: 'bg-orange-500/20 text-orange-300 border-orange-700', 
          text: 'text-orange-400',
          meter: 'bg-orange-500' 
        };
      case 'ELEVATED':
        return { 
          card: 'bg-amber-950/30 border-amber-800/80', 
          badge: 'bg-amber-500/20 text-amber-300 border-amber-700', 
          text: 'text-amber-400',
          meter: 'bg-amber-500' 
        };
      default:
        return { 
          card: 'bg-emerald-950/30 border-emerald-800/80', 
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-700', 
          text: 'text-emerald-400',
          meter: 'bg-emerald-500' 
        };
    }
  };

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
            <Cpu className="h-4 w-4" />
            <span>Multi-Horizon Lookahead Projection</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            PREDICTIVE FORECAST
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold uppercase">
              AI FORECAST
            </span>
          </h2>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 font-mono">
            Model: <span className="text-cyan-400 font-semibold">Dual-Head PyTorch GRU</span>
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        <strong className="text-cyan-300">AI FORECAST:</strong> The timeline below displays actual current observation followed by multi-step neural state forecasting to enable proactive containment:
      </p>

      {/* 4-Step Timeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {allSteps.map((s, idx) => {
          const theme = getStepColor(s.state);

          return (
            <div
              key={s.time}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${theme.card} ${
                s.isCurrent ? 'ring-1 ring-cyan-400/40 shadow-lg' : ''
              }`}
            >
              <div>
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    s.isCurrent ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {s.time}
                  </span>

                  {!s.isCurrent && (
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                      PREDICTION
                    </span>
                  )}
                </div>

                {/* State Name */}
                <div className={`text-xl font-extrabold font-mono tracking-tight ${theme.text}`}>
                  {s.state}
                </div>

                {/* Attack Stage */}
                <div className="text-xs text-slate-300 font-mono mt-0.5 truncate">
                  Stage: <span className="font-semibold text-white">{s.stage}</span>
                </div>
              </div>

              {/* Metrics Bottom */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Threat Score:</span>
                  <span className={`font-bold ${theme.text}`}>
                    {s.threat_score} / 100
                  </span>
                </div>

                {/* Score bar */}
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${theme.meter}`}
                    style={{ width: `${Math.max(s.threat_score, 4)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400">
                  <span>Risk: <span className="text-slate-200 font-semibold">{s.risk_level}</span></span>
                  <span>Conf: <span className="text-cyan-300 font-semibold">{(s.confidence * 100).toFixed(0)}%</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
