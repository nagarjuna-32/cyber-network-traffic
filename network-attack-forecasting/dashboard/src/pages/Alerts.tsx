import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { threatApi } from '../services/threatApi';
import { Alert, SeverityLevel } from '../types';
import { SeverityBadge, StateBadge } from '../components/common/Badge';
import { TriadStatusBanner } from '../components/common/TriadStatusBanner';
import { formatTime } from '../utils';
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { TableSkeleton } from '../components/common/Skeleton';

export const Alerts: React.FC = () => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const { data: alertsData, isLoading } = usePolling(
    () => threatApi.getAlerts(),
    8000
  );

  const toggleReviewed = (id: string) => {
    setReviewedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAllReviewed = () => {
    if (alertsData) {
      setReviewedIds(new Set(alertsData.map((a) => a.id)));
    }
  };

  const filteredAlerts = (alertsData || []).filter((a) => {
    const isReviewed = reviewedIds.has(a.id) || a.reviewed;
    const matchSev = filterSeverity === 'ALL' || a.severity === filterSeverity;
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && !isReviewed) ||
      (filterStatus === 'REVIEWED' && isReviewed);
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.source_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.destination_ip.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSev && matchStatus && matchSearch;
  });

  const activeAlerts = (alertsData || []).filter((a) => !reviewedIds.has(a.id) && !a.reviewed);
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'CRITICAL');

  const getRecommendedAction = (alert: Alert) => {
    if (alert.severity === 'CRITICAL') {
      return 'Immediate Action: Isolate target endpoint and apply firewall rate-limiting to source IP.';
    }
    if (alert.severity === 'HIGH') {
      return 'Action: Inspect recent flow burst headers and monitor for unauthorized lateral connection attempts.';
    }
    if (alert.severity === 'MEDIUM') {
      return 'Action: Verify source authentication logs and correlate with network access history.';
    }
    return 'Action: Normal telemetry baseline tracking; no containment necessary.';
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Mark All Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Security Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time proactive notifications, early-warning triggers, and incident responses
          </p>
        </div>

        {alertsData && alertsData.length > 0 && (
          <button
            onClick={markAllReviewed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All Reviewed</span>
          </button>
        )}
      </div>

      {/* Triad Banner: What is happening, What may happen next, Recommended action */}
      <TriadStatusBanner
        whatIsHappening={
          criticalAlerts.length > 0
            ? `${criticalAlerts.length} critical priority alerts requiring urgent triage.`
            : activeAlerts.length > 0
            ? `${activeAlerts.length} unresolved notifications flagged for SOC analyst review.`
            : 'Zero active security incidents. All prior notifications have been reviewed or mitigated.'
        }
        whatMayHappenNext={
          criticalAlerts.length > 0
            ? 'Unmitigated critical vectors may transition into active data exfiltration or service disruption.'
            : activeAlerts.length > 0
            ? 'Continued monitoring recommended to verify that suspicious probes do not escalate.'
            : 'Network parameters are expected to remain within standard baseline bounds.'
        }
        recommendedAction={
          criticalAlerts.length > 0
            ? 'Prioritize investigating critical alerts below and trigger endpoint isolation.'
            : activeAlerts.length > 0
            ? 'Review flagged alerts, verify source IPs, and mark as reviewed once cleared.'
            : 'No action required. All systems are operating normally.'
        }
        currentState={criticalAlerts.length > 0 ? 'ATTACK' : activeAlerts.length > 0 ? 'SUSPICIOUS' : 'NORMAL'}
        predictedNextState={criticalAlerts.length > 0 ? 'ATTACK' : 'NORMAL'}
        severity={criticalAlerts.length > 0 ? 'CRITICAL' : activeAlerts.length > 0 ? 'MEDIUM' : 'LOW'}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a] border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by IP or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300">
            <span className="text-slate-400">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Severities</option>
              <option value="CRITICAL" className="bg-slate-900">Critical</option>
              <option value="HIGH" className="bg-slate-900">High</option>
              <option value="MEDIUM" className="bg-slate-900">Medium</option>
              <option value="LOW" className="bg-slate-900">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300">
            <span className="text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Alerts</option>
              <option value="ACTIVE" className="bg-slate-900">Active Only</option>
              <option value="REVIEWED" className="bg-slate-900">Reviewed Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Feed List */}
      {isLoading ? (
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5">
          <TableSkeleton rows={5} />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-slate-800 bg-[#0f172a]/50">
          <ShieldCheck className="w-12 h-12 text-emerald-400/80 mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Security Alerts Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {searchTerm || filterSeverity !== 'ALL' || filterStatus !== 'ALL'
              ? 'No alerts match your current search and filter criteria.'
              : 'Network traffic is currently operating within normal parameters. No active threat alerts.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isReviewed = reviewedIds.has(alert.id) || alert.reviewed;
            const isExpanded = expandedAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`rounded-xl border transition-all ${
                  isReviewed
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    : alert.severity === 'CRITICAL'
                    ? 'bg-[#0f172a] border-rose-500/30 shadow-sm'
                    : alert.severity === 'HIGH'
                    ? 'bg-[#0f172a] border-orange-500/30 shadow-sm'
                    : 'bg-[#0f172a] border-slate-800/90 shadow-sm'
                }`}
              >
                {/* Main Alert Header Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white tracking-wide">
                        {alert.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="font-mono text-slate-300">
                          {alert.source_ip} → {alert.destination_ip}
                        </span>
                        <span>•</span>
                        <span>{formatTime(alert.timestamp)}</span>
                        {alert.mitre_id && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400 font-mono">MITRE {alert.mitre_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => toggleReviewed(alert.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        isReviewed
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isReviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
                    </button>

                    <button
                      onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                      className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title={isExpanded ? 'Collapse' : 'View Recommended Actions'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progressive Disclosure: Expanded Details & Recommended Actions */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/40 text-xs space-y-3">
                    <div>
                      <span className="text-slate-400 block font-medium mb-1">
                        Recommended SOC Response:
                      </span>
                      <p className="text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                        {getRecommendedAction(alert)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                      <div>
                        <span className="text-slate-500 block">Current State:</span>
                        <span className="text-slate-200">{alert.current_state}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Forecast Next:</span>
                        <span className="text-slate-200">{alert.predicted_next_state}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Confidence:</span>
                        <span className="text-emerald-400">{Math.round((alert.confidence || 0.85) * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Status:</span>
                        <span className="text-slate-200">{alert.status}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
