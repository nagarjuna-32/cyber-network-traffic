import React, { useState } from 'react';
import { BellRing, ShieldCheck, AlertCircle, AlertTriangle, ShieldX, Terminal, Cpu, Network, Radio, Filter } from 'lucide-react';
import { SecurityAlert, RiskLevel, ThreatThread } from '../types/prediction';

interface AlertsFeedProps {
  alerts?: SecurityAlert[];
  threads?: ThreatThread[];
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts = [], threads = [] }) => {
  const [activeTab, setActiveTab] = useState<'threads' | 'alerts'>('threads');
  const [threatsOnly, setThreatsOnly] = useState<boolean>(false);

  const hasAlerts = Array.isArray(alerts) && alerts.length > 0;
  const hasThreads = Array.isArray(threads) && threads.length > 0;

  const filteredThreads = threatsOnly
    ? threads.filter((t) => t.threatStatus !== 'BENIGN')
    : threads;

  const getSeverityStyle = (severity: RiskLevel | string) => {
    switch ((severity || '').toUpperCase()) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
          border: 'border-red-900/50 hover:border-red-500/60',
          icon: ShieldX,
          iconColor: 'text-red-400',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          border: 'border-orange-900/50 hover:border-orange-500/60',
          icon: AlertTriangle,
          iconColor: 'text-orange-400',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          border: 'border-amber-900/50 hover:border-amber-500/60',
          icon: AlertCircle,
          iconColor: 'text-amber-400',
        };
      default:
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          border: 'border-emerald-900/50 hover:border-emerald-500/60',
          icon: ShieldCheck,
          iconColor: 'text-emerald-400',
        };
    }
  };

  const getThreadBadge = (status: ThreatThread['threatStatus']) => {
    switch (status) {
      case 'ATTACK':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'ANOMALOUS':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'SUSPICIOUS':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          {activeTab === 'threads' ? (
            <Network className="h-4 w-4 text-cyan-400" />
          ) : (
            <BellRing className="h-4 w-4 text-pink-400" />
          )}
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            9. {activeTab === 'threads' ? 'Live Detected Threat Threads & Sockets' : 'Early Warning Alerts & Response Playbooks'}
          </h3>
        </div>

        {/* Tab Controls & Filter */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('threads')}
              className={`px-3 py-1 rounded-lg font-mono font-medium flex items-center space-x-1.5 transition-all ${
                activeTab === 'threads'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
              <span>Live Threads ({threads.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1 rounded-lg font-mono font-medium flex items-center space-x-1.5 transition-all ${
                activeTab === 'alerts'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BellRing className="h-3 w-3 text-pink-400" />
              <span>Alerts ({alerts.length})</span>
            </button>
          </div>

          {activeTab === 'threads' && hasThreads && (
            <button
              onClick={() => setThreatsOnly(!threatsOnly)}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono border transition-all flex items-center space-x-1 ${
                threatsOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Show only suspicious or attack threads"
            >
              <Filter className="h-3 w-3" />
              <span>Threats Only</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content: Live Detected Threads */}
      {activeTab === 'threads' && (
        <div className="mt-4">
          {!hasThreads ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <Cpu className="h-6 w-6 text-slate-600 mb-2" />
              <div className="text-sm font-bold text-slate-300">
                No Active Network Flow Threads
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Zero active connection threads monitored in current observation window.
              </p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <ShieldCheck className="h-6 w-6 text-emerald-400 mb-2" />
              <div className="text-sm font-bold text-slate-300">
                All Active Threads Are Benign
              </div>
              <p className="text-xs text-slate-500 mt-1">
                No active threats detected matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="pb-2.5 pl-3">Thread ID</th>
                    <th className="pb-2.5">Flow (Source &#8594; Target)</th>
                    <th className="pb-2.5">Port / Proto</th>
                    <th className="pb-2.5">Rate</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Pattern Detection Trigger</th>
                    <th className="pb-2.5 pr-3 text-right">Last Monitored</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredThreads.map((thread) => {
                    const isThreat = thread.threatStatus !== 'BENIGN';
                    return (
                      <tr
                        key={thread.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isThreat ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-2.5 pl-3 font-bold text-slate-300">
                          {thread.id}
                        </td>
                        <td className="py-2.5 text-slate-200">
                          <span className="text-cyan-300">{thread.sourceIp}</span>
                          <span className="text-slate-500 mx-1.5">&#8594;</span>
                          <span className="text-slate-300">{thread.destIp}</span>
                        </td>
                        <td className="py-2.5 text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {thread.destPort}/{thread.protocol}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-200">
                          {thread.flowRate.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">pkts/s</span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getThreadBadge(
                              thread.threatStatus
                            )}`}
                          >
                            {thread.threatStatus}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300 font-sans text-xs">
                          {thread.matchedPattern}
                        </td>
                        <td className="py-2.5 pr-3 text-right text-slate-400 text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                            {thread.lastSeen}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Early Warning Alerts */}
      {activeTab === 'alerts' && (
        <div className="mt-4 space-y-3">
          {!hasAlerts ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="text-sm font-bold text-slate-200">
                No Active Security Alerts
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                All monitored telemetry flows are nominal. Early warning engine stands by for exploratory scans or state escalation.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const style = getSeverityStyle(alert.severity);
              const Icon = style.icon;

              return (
                <div
                  key={alert.id || Math.random().toString()}
                  className={`p-3.5 rounded-xl bg-slate-950/70 border ${style.border} transition-all space-y-2`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${style.iconColor} flex-shrink-0`} />
                      <span className="text-xs font-bold text-slate-100">
                        {alert.title || 'Security Warning'}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${style.badge}`}>
                        {alert.severity || 'INFO'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                      <span>Stage: <span className="text-slate-300 font-semibold">{alert.stage || 'N/A'}</span></span>
                      <span>•</span>
                      <span>{alert.timestamp || 'Just now'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-6">
                    {alert.description || 'Behavioral alert emitted by temporal threat scoring engine.'}
                  </p>

                  {alert.recommended_action && (
                    <div className="ml-6 p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start space-x-2 text-xs">
                      <Terminal className="h-3.5 w-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-mono text-cyan-300 font-semibold">Recommended Playbook: </span>
                        <span className="text-slate-300">{alert.recommended_action}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
