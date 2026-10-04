import React from 'react';
import { BellRing, ShieldCheck, AlertCircle, AlertTriangle, ShieldX, Terminal, ArrowRight } from 'lucide-react';
import { SecurityAlert, RiskLevel } from '../types/prediction';

interface AlertsFeedProps {
  alerts?: SecurityAlert[];
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts = [] }) => {
  const hasAlerts = Array.isArray(alerts) && alerts.length > 0;

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

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <BellRing className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            9. Early Warning Alerts & Recommended SOC Playbooks
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Queue: {alerts.length} Active
        </span>
      </div>

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
                className={`p-4 rounded-xl bg-slate-950/70 border ${style.border} transition-all space-y-2.5`}
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
                  <div className="ml-6 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start space-x-2 text-xs">
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
    </div>
  );
};
