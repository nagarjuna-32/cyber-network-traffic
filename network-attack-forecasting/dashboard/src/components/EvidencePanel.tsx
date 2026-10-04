import React from 'react';
import { FileSearch, CheckCircle2, AlertTriangle, Layers, ArrowUpRight, Cpu } from 'lucide-react';
import { NetworkFeatures } from '../types/prediction';

interface EvidencePanelProps {
  evidence?: string[];
  features?: NetworkFeatures;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidence = [],
  features = {},
}) => {
  const hasEvidence = Array.isArray(evidence) && evidence.length > 0;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FileSearch className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            7. Behavioral Evidence & Telemetry Signals
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Observable Signals Only — No Hallucinations
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
        
        {/* Left 2 Cols: Observable Behavioral Evidence List */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Inferred Behavioral Indicators:
          </div>

          {!hasEvidence ? (
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-slate-300">Baseline Nominal:</span> No hostile behavioral deviations or anomaly signatures recorded in current sliding window.
              </div>
            </div>
          ) : (
            evidence.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="mt-0.5 p-1 rounded-md bg-amber-500/10 text-amber-400 flex-shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {item}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Col: Underlying Telemetry Features Snapshot */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <span>Telemetry Snapshot</span>
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Packet Rate:</span>
                <span className="text-slate-200 font-semibold">
                  {features.packet_rate !== undefined ? `${features.packet_rate.toLocaleString()} pkts/s` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Byte Rate:</span>
                <span className="text-slate-200 font-semibold">
                  {features.byte_rate !== undefined ? `${(features.byte_rate / 1024).toFixed(1)} KB/s` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">SYN Handshakes:</span>
                <span className="text-slate-200 font-semibold">
                  {features.syn_count !== undefined ? features.syn_count : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Failed Conn Ratio:</span>
                <span className="text-slate-200 font-semibold">
                  {features.failed_conn_ratio !== undefined ? `${(features.failed_conn_ratio * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Port Entropy:</span>
                <span className="text-slate-200 font-semibold">
                  {features.port_entropy !== undefined ? features.port_entropy.toFixed(2) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Byte Asymmetry:</span>
                <span className="text-slate-200 font-semibold">
                  {features.byte_asymmetry !== undefined ? features.byte_asymmetry.toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {features.protocol_breakdown && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px]">
              <div className="text-slate-400 mb-1.5 flex justify-between">
                <span>Protocol Ratio</span>
                <span className="font-mono text-cyan-400">TCP: {features.protocol_breakdown.tcp}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                <div style={{ width: `${features.protocol_breakdown.tcp}%` }} className="bg-cyan-400" />
                <div style={{ width: `${features.protocol_breakdown.udp}%` }} className="bg-blue-500" />
                <div style={{ width: `${features.protocol_breakdown.icmp}%` }} className="bg-amber-400" />
                <div style={{ width: `${features.protocol_breakdown.other}%` }} className="bg-slate-600" />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
