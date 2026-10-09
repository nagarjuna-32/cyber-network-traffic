import React from 'react';
import { Activity, Shield, Bell, TrendingUp } from 'lucide-react';
import { SeverityLevel } from '../../types';
import { formatNumber, formatBytes } from '../../utils';

interface EssentialMetricCardsProps {
  packetsPerSec?: number;
  bytesPerSec?: number;
  threatLevel?: SeverityLevel;
  threatScore?: number;
  activeAlertCount?: number;
  attackProbability?: number | null;
}

export const EssentialMetricCards: React.FC<EssentialMetricCardsProps> = ({
  packetsPerSec,
  bytesPerSec,
  threatLevel = 'LOW',
  threatScore,
  activeAlertCount = 0,
  attackProbability,
}) => {
  const getThreatColor = (lvl: SeverityLevel) => {
    switch (lvl) {
      case 'CRITICAL':
        return 'text-rose-400';
      case 'HIGH':
        return 'text-orange-400';
      case 'MEDIUM':
        return 'text-amber-400';
      case 'LOW':
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Network Traffic */}
      <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Network Traffic
          </span>
          <Activity className="w-4 h-4 text-blue-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {packetsPerSec !== undefined ? formatNumber(Math.round(packetsPerSec)) : '--'}
            <span className="text-xs font-normal text-slate-400 ml-1 font-sans">pkts/s</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/70 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Throughput</span>
          <span className="text-slate-300 font-mono">
            {bytesPerSec !== undefined ? `${formatBytes(bytesPerSec)}/s` : 'Normal rate'}
          </span>
        </div>
      </div>

      {/* Card 2: Threat Level */}
      <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Threat Level
          </span>
          <Shield className={`w-4 h-4 ${getThreatColor(threatLevel)}`} />
        </div>
        <div className="my-2">
          <div className={`text-2xl font-bold tracking-tight font-mono ${getThreatColor(threatLevel)}`}>
            {threatLevel}
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/70 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Score</span>
          <span className="text-slate-300 font-mono">
            {threatScore !== undefined ? `${threatScore} / 100` : 'Assessed'}
          </span>
        </div>
      </div>

      {/* Card 3: Active Alerts */}
      <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Active Alerts
          </span>
          <Bell className={`w-4 h-4 ${activeAlertCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {activeAlertCount}
            <span className="text-xs font-normal text-slate-400 ml-1 font-sans">
              {activeAlertCount === 1 ? 'alert' : 'alerts'}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/70 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Status</span>
          <span className={activeAlertCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
            {activeAlertCount > 0 ? 'Needs review' : 'No active alerts'}
          </span>
        </div>
      </div>

      {/* Card 4: Attack Probability */}
      <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Attack Probability
          </span>
          <TrendingUp className="w-4 h-4 text-blue-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {attackProbability !== null && attackProbability !== undefined ? (
              `${Math.round(attackProbability * 100)}%`
            ) : (
              'N/A'
            )}
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/70 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Projected risk</span>
          <span className="text-slate-300">
            {attackProbability !== null && attackProbability !== undefined
              ? attackProbability > 0.5
                ? 'Elevated risk'
                : 'Low probability'
              : 'Normal traffic'}
          </span>
        </div>
      </div>
    </div>
  );
};
