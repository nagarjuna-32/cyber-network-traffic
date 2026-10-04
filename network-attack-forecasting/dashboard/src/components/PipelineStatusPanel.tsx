import React from 'react';
import { GitBranch, CheckCircle, XCircle } from 'lucide-react';

interface PipelineStatusPanelProps {
  pipelineStatus?: Record<string, string>;
}

const STAGES = [
  'Traffic ingestion',
  'Preprocessing & Cleaning',
  'Feature Engineering',
  'Network Graph Generation',
  'Temporal Windowing',
  'AI World Model',
  'Risk & Stage Forecasting',
  'MITRE ATT&CK Mapping',
  'Explainable AI (XAI)',
  'Alert Engine',
  'Security Dashboard & API Integration',
];

export const PipelineStatusPanel: React.FC<PipelineStatusPanelProps> = ({ pipelineStatus }) => {
  const allPass = STAGES.every((stage) => {
    const st = pipelineStatus?.[stage] || 'PASS';
    return st.toUpperCase().includes('PASS') || st.toUpperCase().includes('READY');
  });

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider block">
              End-to-End Orchestrator
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Pipeline Operational Status
            </h3>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
          allPass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-red-950 text-red-300 border-red-800'
        }`}>
          {allPass ? '11/11 HEALTHY' : 'DEGRADED'}
        </span>
      </div>

      {/* 11 Stages List */}
      <div className="space-y-1.5 font-mono text-xs">
        {STAGES.map((stage, idx) => {
          const liveStatus = pipelineStatus?.[stage] || 'PASS';
          const isPass = liveStatus.toUpperCase().includes('PASS') || liveStatus.toUpperCase().includes('READY');

          return (
            <div
              key={stage}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-bold">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="text-slate-200">{stage}</span>
              </div>

              <div>
                {isPass ? (
                  <span className="flex items-center space-x-1 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>✓ PASS</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-red-400 font-bold text-[11px]">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>✕ FAIL</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
