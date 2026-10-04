import React from 'react';
import { Crosshair, ShieldAlert, CheckCircle2, ExternalLink, Zap } from 'lucide-react';
import { MitreMapping, SecurityDecision } from '../types/prediction';

interface MitreAttackPanelProps {
  mitreMapping?: MitreMapping;
  decision?: SecurityDecision | null;
}

export const MitreAttackPanel: React.FC<MitreAttackPanelProps> = ({ mitreMapping, decision }) => {
  const tactic = mitreMapping?.tactic || decision?.current_stage || 'Reconnaissance';
  const tacticId = mitreMapping?.tactic_id || 'TA0043';
  const technique = mitreMapping?.technique || 'Active Scanning';
  const techniqueId = mitreMapping?.technique_id || 'T1595';
  const confidence = Number(mitreMapping?.confidence ?? decision?.confidence ?? 0);

  const evidence = mitreMapping?.evidence && mitreMapping.evidence.length > 0 
    ? mitreMapping.evidence 
    : (decision?.evidence && decision.evidence.length > 0 ? decision.evidence : ['Baseline operational traffic observed.']);

  const mitigations = mitreMapping?.mitigations && mitreMapping.mitigations.length > 0
    ? mitreMapping.mitigations
    : ['Standard baseline monitoring active. No mitigation required.'];

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-orange-950/80 border border-orange-800 text-orange-400">
            <Crosshair className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold text-orange-400 uppercase tracking-wider block">
              Threat Intelligence Correlation
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              MITRE ATT&CK Mapping
            </h3>
          </div>
        </div>

        <a 
          href={`https://attack.mitre.org/techniques/${techniqueId.replace('.', '/')}`} 
          target="_blank" 
          rel="noreferrer"
          className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
        >
          <span>Matrix v14</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Prominent Technique ID Badge */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Technique ID</span>
          <div className="text-2xl font-black font-mono text-cyan-300 tracking-wider">
            {techniqueId}
          </div>
          <div className="text-xs font-bold text-white mt-0.5 font-mono">
            {technique}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Tactic</span>
          <span className="text-sm font-bold text-amber-400 font-mono block">
            {tactic} ({tacticId})
          </span>
          <span className="text-xs font-mono text-emerald-400 block mt-0.5">
            Confidence: {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Evidence & Mitigations */}
      <div className="space-y-3 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">Observed Evidence:</span>
          <div className="space-y-1">
            {evidence.slice(0, 3).map((item, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-slate-300 flex items-start space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">Recommended Countermeasures:</span>
          <div className="space-y-1">
            {mitigations.slice(0, 2).map((item, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-slate-300 flex items-start space-x-2">
                <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
