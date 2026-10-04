import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Crosshair, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';
import { SecurityAlert, SecurityDecision } from '../types/prediction';

interface AlertCenterProps {
  alerts: SecurityAlert[];
  decision: SecurityDecision | null;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ alerts, decision }) => {
  const hasAlerts = alerts && alerts.length > 0;

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-700 ring-1 ring-red-500/50';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-700';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-700';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-700';
    }
  };

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-800 text-red-400">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold text-red-400 uppercase tracking-wider block">
              Incident Response & Dispatch
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Security Alert Center
            </h3>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
          hasAlerts ? 'bg-red-950 text-red-300 border-red-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
        }`}>
          {hasAlerts ? `${alerts.length} ACTIVE` : 'CLEAN'}
        </span>
      </div>

      {/* Alert Body */}
      {!hasAlerts ? (
        <div className="py-8 px-4 text-center rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="h-10 w-10 mx-auto rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold text-slate-200">
            ✓ No active security alerts
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Network behavior is operating within baseline statistical parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
          {alerts.map((al, idx) => {
            const sev = (al.severity || 'HIGH').toUpperCase();
            const alertId = al.alert_id || al.id || `ALT-${idx + 101}`;
            const riskScore = al.risk_score ?? decision?.threat_score ?? 0;
            const confidence = al.confidence ?? decision?.prediction_confidence ?? 0;
            const stage = al.attack_stage || al.stage || decision?.current_stage || 'Active Monitoring';
            const mitre = al.mitre_technique_id || 'N/A';
            const action = al.recommended_action || 'Inspect incoming packet trace and maintain endpoint security posture.';

            return (
              <div 
                key={alertId}
                className="p-4 rounded-xl bg-red-950/20 border border-red-800/80 shadow-md flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top line: Alert ID & Severity */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getSeverityBadge(sev)}`}>
                      {sev}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {alertId}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="text-sm font-bold text-white tracking-tight mt-1">
                    {al.title}
                  </div>

                  {/* Key Stats Bar */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400">Risk Score: </span>
                      <span className="text-red-400 font-bold">{riskScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Confidence: </span>
                      <span className="text-cyan-300 font-bold">{(confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">MITRE: </span>
                      <span className="text-amber-400 font-bold">{mitre} &bull; Stage: {stage}</span>
                    </div>
                  </div>

                  {/* Evidence list if present */}
                  {al.evidence && al.evidence.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-300">
                      <span className="font-mono text-slate-400 block text-[10px] uppercase">Evidence:</span>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-300">
                        {al.evidence.slice(0, 2).map((ev, i) => (
                          <li key={i} className="truncate">{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Recommended Action */}
                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-cyan-400 font-bold block text-[10px] uppercase mb-0.5">Recommended Action:</span>
                  <span className="leading-relaxed">{action}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
