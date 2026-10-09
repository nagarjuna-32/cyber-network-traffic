import React from 'react';
import { SecurityState, SeverityLevel, ForecastStep } from '../../types';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

interface NetworkSecurityOverviewProps {
  currentState?: SecurityState;
  threatLevel?: SeverityLevel;
  predictedNextState?: SecurityState;
  forecastHorizon?: number;
  explanation?: string;
  predictionConfidence?: number;
  forecastSteps?: ForecastStep[];
}

export const NetworkSecurityOverview: React.FC<NetworkSecurityOverviewProps> = ({
  currentState = 'NORMAL',
  threatLevel = 'LOW',
  predictedNextState,
  forecastHorizon = 3,
  explanation,
  predictionConfidence,
  forecastSteps = [],
}) => {
  // Map internal states to the 3 user-facing primary statuses: NORMAL / WARNING / ATTACK
  const getDisplayStatus = (state: SecurityState): {
    label: 'NORMAL' | 'WARNING' | 'ATTACK';
    badgeClass: string;
    icon: React.ReactNode;
  } => {
    switch (state) {
      case 'ATTACK':
        return {
          label: 'ATTACK',
          badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
        };
      case 'SUSPICIOUS':
      case 'ELEVATED':
        return {
          label: 'WARNING',
          badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        };
      case 'NORMAL':
      default:
        return {
          label: 'NORMAL',
          badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        };
    }
  };

  const statusMeta = getDisplayStatus(currentState);

  const getThreatLevelBadge = (level: SeverityLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'LOW':
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  // Clean, plain-English summary sentence
  const getSummarySentence = () => {
    if (explanation && explanation.trim()) {
      // Clean up technical jargon like (+1.00) or formula symbols if present
      const cleaned = explanation
        .replace(/\(\+?[0-9.]+\)/g, '')
        .replace(/primarily driven by abnormal elevation in:/i, 'driven by unusual activity in')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned;
    }

    if (currentState === 'ATTACK') {
      return 'Active attack pattern identified. Immediate containment actions are recommended.';
    }
    if (currentState === 'SUSPICIOUS' || currentState === 'ELEVATED') {
      return 'Unusual traffic activity detected. The model predicts an increased risk of escalation.';
    }
    return 'Network is operating within normal baseline activity. No anomalous threat precursors detected.';
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Network Security Overview
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white tracking-tight">
              Network Status:
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-semibold tracking-wide ${statusMeta.badgeClass}`}
            >
              {statusMeta.icon}
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* Right Status Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Threat Level */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Threat Level:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${getThreatLevelBadge(
                threatLevel
              )}`}
            >
              {threatLevel}
            </span>
          </div>

          {/* Predicted Next State */}
          {predictedNextState && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Predicted Next:</span>
              <span className="font-semibold text-slate-200">{predictedNextState}</span>
            </div>
          )}

          {/* Forecast Horizon */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            <span>Forecast Horizon:</span>
            <span className="font-semibold text-blue-400">{forecastHorizon} Steps</span>
          </div>

          {/* Prediction Confidence (only when genuinely available) */}
          {predictionConfidence !== undefined && predictionConfidence > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              <span>Confidence:</span>
              <span className="font-semibold text-emerald-400">
                {Math.round(predictionConfidence * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Sentence */}
      <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          "{getSummarySentence()}"
        </p>

        {/* Small Forecast Visualization */}
        {forecastSteps && forecastSteps.length > 0 && (
          <div className="flex items-center gap-2 text-xs shrink-0 self-start md:self-auto bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">Trajectory:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                currentState === 'NORMAL'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : currentState === 'ATTACK'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              Now
            </span>
            {forecastSteps.slice(0, 3).map((step, idx) => (
              <React.Fragment key={idx}>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    step.state === 'NORMAL'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : step.state === 'ATTACK'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  +{step.step}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
