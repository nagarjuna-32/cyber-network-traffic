import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Zap, 
  BookOpen, 
  FileText 
} from 'lucide-react';
import { MitreMapping, SecurityDecision } from '../types/prediction';

interface MitreIntelligenceViewProps {
  mitreMapping?: MitreMapping;
  decision?: SecurityDecision | null;
}

const KILL_CHAIN_STAGES = [
  { id: 'TA0043', name: 'Reconnaissance', desc: 'Active scanning, host/port discovery' },
  { id: 'TA0001', name: 'Initial Access', desc: 'Exploit public app, brute force' },
  { id: 'TA0002', name: 'Execution', desc: 'Commandline, script interpreter' },
  { id: 'TA0003', name: 'Persistence', desc: 'Account manipulation, scheduled task' },
  { id: 'TA0005', name: 'Defense Evasion', desc: 'Obfuscation, indicator removal' },
  { id: 'TA0007', name: 'Discovery', desc: 'Network service scanning, system info' },
  { id: 'TA0008', name: 'Lateral Movement', desc: 'Remote services, internal pivoting' },
  { id: 'TA0011', name: 'Command & Control', desc: 'Web protocols, encrypted beaconing' },
  { id: 'TA0010', name: 'Exfiltration', desc: 'Data transfer over C2 channel' },
  { id: 'TA0040', name: 'Impact', desc: 'Denial of Service, data destruction' },
];

export const MitreIntelligenceView: React.FC<MitreIntelligenceViewProps> = ({
  mitreMapping,
  decision,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeStageFilter, setActiveStageFilter] = useState<string | null>(null);

  const fallbackTactic = decision?.current_stage || 'Reconnaissance';
  const tacticName = mitreMapping?.tactic || fallbackTactic;
  const tacticId = mitreMapping?.tactic_id || 'TA0043';
  const techniqueName = mitreMapping?.technique || 'Active Scanning / Service Enumeration';
  const techniqueId = mitreMapping?.technique_id || 'T1595';
  const confidence = mitreMapping?.confidence ?? decision?.confidence ?? 0.85;

  const evidenceList = mitreMapping?.evidence && mitreMapping.evidence.length > 0 
    ? mitreMapping.evidence 
    : (decision?.evidence && decision.evidence.length > 0 ? decision.evidence : [
        'Anomalous TCP SYN packet burst exceeding 10x baseline',
        'Continuous probe sequence targeting privileged internal ports',
        'High entropy destination distribution across subnet'
      ]);

  const mitigations = mitreMapping?.mitigations && mitreMapping.mitigations.length > 0
    ? mitreMapping.mitigations
    : [
        'Enforce stateless TCP SYN cookies on perimeter routers (RFC 4987).',
        'Dynamic rate-limiting on border firewall for half-open connection attempts.',
        'Quarantine affected source IP addresses into blackhole routing tables.',
        'Deploy behavioral honeypot lures on sensitive ephemeral service ports.'
      ];

  const handleCopyMitigation = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Crosshair className="h-4 w-4" />
              <span>Cyber Threat Intelligence &bull; MITRE ATT&CK Framework</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              Tactical Kill-Chain & Adversary Mapping
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                v14.1 Enterprise Matrix
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Automatic correlation of NetForecast AI state transitions into standardized MITRE tactics, techniques, and machine-actionable incident playbooks.
            </p>
          </div>

          {/* Active Technique Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center space-x-4">
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Active Detected Technique</div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span className="text-cyan-400">{techniqueId}</span>
                <span>: {techniqueName}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Tactic: <span className="text-amber-400 font-semibold">{tacticName}</span> ({tacticId}) &bull; AI Confidence: <span className="text-emerald-400 font-mono font-bold">{Math.round(confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Kill Chain Stage Progression Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>Adversary Kill-Chain Progression</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Detected Phase: <span className="text-cyan-400 font-bold">{tacticName}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {KILL_CHAIN_STAGES.map((stage) => {
            const isCurrent = stage.name.toLowerCase() === tacticName.toLowerCase() || 
                             stage.id === tacticId ||
                             (tacticName.toLowerCase().includes('recon') && stage.name.includes('Recon')) ||
                             (tacticName.toLowerCase().includes('impact') && stage.name.includes('Impact')) ||
                             (tacticName.toLowerCase().includes('lateral') && stage.name.includes('Lateral'));

            return (
              <div
                key={stage.id}
                onClick={() => setActiveStageFilter(stage.id)}
                className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-b from-red-950/60 to-slate-900 border-red-500/80 shadow-lg shadow-red-500/20 ring-1 ring-red-400'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-red-400' : 'text-slate-400'}`}>
                  {stage.id}
                </div>
                <div className={`text-xs font-semibold mt-1 truncate ${isCurrent ? 'text-white' : 'text-slate-300'}`} title={stage.name}>
                  {stage.name}
                </div>
                <div className="mt-2 flex justify-center">
                  <div className={`h-1.5 w-6 rounded-full ${
                    isCurrent ? 'bg-red-400 animate-pulse' : 'bg-slate-800'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Deep-Dive Grid: Evidence & SOC Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Technique Telemetry & Observed Evidence */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <FileText className="h-4 w-4 text-cyan-400" />
                <span>Forensic Evidence Corroboration</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                {evidenceList.length} Indicators Found
              </span>
            </div>

            <div className="space-y-3">
              {evidenceList.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-3 hover:border-slate-700 transition-colors"
                >
                  <div className="mt-0.5 p-1 rounded-full bg-cyan-950 text-cyan-400 flex-shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MITRE Reference External Card */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="text-slate-400">
              Official Reference: <span className="font-mono text-cyan-400">https://attack.mitre.org/techniques/{techniqueId}/</span>
            </div>
            <a 
              href={`https://attack.mitre.org/techniques/${techniqueId.replace('.', '/')}`} 
              target="_blank" 
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors font-mono text-[11px]"
            >
              <span>View MITRE</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Right: SOC Incident Playbook & Remediation */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Machine-Actionable SOC Containment Playbook</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              Standard Operating Procedure
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Recommended automated defensive counter-measures prioritized by risk score ({decision?.threat_score ?? 75}/100):
          </p>

          <div className="space-y-3">
            {mitigations.map((step, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start space-x-3">
                  <div className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed">
                    {step}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyMitigation(step, idx)}
                  className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex-shrink-0"
                  title="Copy mitigation rule"
                >
                  {copiedIndex === idx ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Quick Terminal Command */}
          <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 mb-1.5 border-b border-slate-800/60">
              <div className="flex items-center space-x-1.5 text-cyan-400">
                <Terminal className="h-3.5 w-3.5" />
                <span>Quick Firewall Rule Generation (iptables / nftables)</span>
              </div>
            </div>
            <code className="text-emerald-400 select-all block break-all">
              sudo iptables -A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST SYN -m limit --limit 50/s --limit-burst 100 -j ACCEPT
            </code>
          </div>
        </div>

      </div>
    </div>
  );
};
