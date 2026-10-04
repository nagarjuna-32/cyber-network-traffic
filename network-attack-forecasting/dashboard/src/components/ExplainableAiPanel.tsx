import React from 'react';
import { BrainCircuit, Info, BarChart3, HelpCircle } from 'lucide-react';
import { ExplainabilityData, SecurityDecision } from '../types/prediction';

interface ExplainableAiPanelProps {
  explainability?: ExplainabilityData;
  decision?: SecurityDecision | null;
}

export const ExplainableAiPanel: React.FC<ExplainableAiPanelProps> = ({ explainability, decision }) => {
  const explanation = explainability?.explanation || 
    `Prediction of ${decision?.current_state || 'NORMAL'} (Threat Score: ${decision?.threat_score ?? 0}) is driven by statistical network feature vectors and World Model dynamics.`;

  const featureContributions = explainability?.feature_contributions || {};

  const sortedFeatures = Object.entries(featureContributions)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 6);

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-400">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold text-purple-400 uppercase tracking-wider block">
              Model Interpretability & SHAP Analysis
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Why did the AI make this prediction?
            </h3>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
          Neural Weights
        </span>
      </div>

      {/* Backend Natural Language Explanation Text */}
      <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-800/40 text-xs text-purple-200 leading-relaxed mb-4">
        <span className="font-bold text-purple-300">Model Explanation: </span>
        {explanation}
      </div>

      {/* Feature Contributions Horizontal Bars */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <span>Feature Contribution (+Threat / -Baseline)</span>
          <span>Weight</span>
        </div>

        {sortedFeatures.length === 0 ? (
          <div className="py-5 text-center text-xs font-mono text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            Awaiting XAI feature attribution weights from active inference pipeline...
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedFeatures.map(([feat, val]) => {
              const isPos = val >= 0;
              const absVal = Math.min(Math.abs(val), 1.0);
              const percent = Math.round(absVal * 100);

              return (
                <div key={feat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">{feat}</span>
                    <span className={`font-bold ${isPos ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isPos ? `+${val.toFixed(2)}` : val.toFixed(2)}
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPos ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.max(percent, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
