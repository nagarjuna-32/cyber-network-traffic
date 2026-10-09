import React from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../types';
import { SeverityBadge } from '../common/Badge';
import { formatTime } from '../../utils';
import { ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface RecentAlertsTableProps {
  alerts?: Alert[];
  onSelectAlert?: (alert: Alert) => void;
}

export const RecentAlertsTable: React.FC<RecentAlertsTableProps> = ({
  alerts = [],
  onSelectAlert,
}) => {
  const topAlerts = alerts.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Mitigated':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Under Investigation':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'New':
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white">
            Recent Security Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Most recent early-warning notices requiring attention
          </p>
        </div>

        <Link
          to="/alerts"
          className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
        >
          <span>View All Alerts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {topAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-slate-800/80 bg-slate-950/30">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2" />
          <h3 className="text-xs font-semibold text-slate-200">No Active Security Alerts</h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
            Network traffic is operating within normal parameters. No active threats detected.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 font-medium">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Alert</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">
                    {formatTime(alert.timestamp)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-200 group-hover:text-white">
                      {alert.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {alert.source_ip} → {alert.destination_ip}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <SeverityBadge severity={alert.severity} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(
                        alert.status
                      )}`}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {onSelectAlert ? (
                      <button
                        onClick={() => onSelectAlert(alert)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Details
                      </button>
                    ) : (
                      <Link
                        to="/alerts"
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Details
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
