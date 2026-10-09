import React from 'react';
import { SecurityState, SeverityLevel } from '../../types';
import { Activity, TrendingUp, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface TriadStatusBannerProps {
  whatIsHappening: string;
  whatMayHappenNext: string;
  recommendedAction: string;
  currentState?: SecurityState;
  predictedNextState?: SecurityState;
  severity?: SeverityLevel;
}

export const TriadStatusBanner: React.FC<TriadStatusBannerProps> = ({
  whatIsHappening,
  whatMayHappenNext,
  recommendedAction,
  currentState = 'NORMAL',
  predictedNextState = 'NORMAL',
  severity = 'LOW',
}) => {
  const getSeverityBorder = () => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-rose-500/40 bg-rose-950/15';
      case 'HIGH':
        return 'border-orange-500/40 bg-orange-950/15';
      case 'MEDIUM':
        return 'border-amber-500/40 bg-amber-950/15';
      case 'LOW':
      default:
        return 'border-slate-800/90 bg-[#0f172a]';
    }
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${getSeverityBorder()} transition-all`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
        {/* 1. What is happening right now? */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              1. What Is Happening
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {whatIsHappening}
            </p>
          </div>
        </div>

        {/* 2. What may happen next? */}
        <div className="flex items-start gap-3 pt-3 md:pt-0 md:pl-4">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 mt-0.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              2. What May Happen Next
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {whatMayHappenNext}
            </p>
          </div>
        </div>

        {/* 3. What action should the user take? */}
        <div className="flex items-start gap-3 pt-3 md:pt-0 md:pl-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              3. Recommended Action
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {recommendedAction}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
