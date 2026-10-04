import React from 'react';
import { Activity, Terminal, Shield, ArrowRight } from 'lucide-react';
import { TimelineObservation, SecurityDecision } from '../types/prediction';

interface LiveActivityPanelProps {
  timeline: TimelineObservation[];
  decision: SecurityDecision | null;
}

export const LiveActivityPanel: React.FC<LiveActivityPanelProps> = ({ timeline, decision }) => {
  const currentFeatures = decision?.features || {};
  const packetRate = currentFeatures.packet_rate ?? 10.57;
  const byteRate = currentFeatures.byte_rate ?? 1500;
  const connFreq = currentFeatures.connection_frequency ?? 1.0;

  // Recent timeline events
  const events = timeline.length > 0 ? timeline : [
    { time: 'Current', timestamp: new Date().toISOString(), packetRate, threatScore: decision?.threat_score ?? 7, state: decision?.current_state || 'NORMAL' }
  ];

  const getStateBadge = (st: string) => {
    switch (st.toUpperCase()) {
      case 'ATTACK':
        return 'text-red-400 bg-red-950/60 border-red-800';
      case 'SUSPICIOUS':
        return 'text-orange-400 bg-orange-950/60 border-orange-800';
      case 'ELEVATED':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      default:
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
    }
  };

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider block">
              SOC Telemetry Stream
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Live Network Activity & Packet Stream
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">Rate: <strong className="text-cyan-300">{Number(packetRate).toFixed(1)} pkts/s</strong></span>
          <span className="text-slate-400">Throughput: <strong className="text-cyan-300">{(Number(byteRate) / 1024).toFixed(1)} KB/s</strong></span>
        </div>
      </div>

      {/* Stream Table */}
      <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
              <th className="py-2 px-3">Time Window</th>
              <th className="py-2 px-3">State</th>
              <th className="py-2 px-3">Threat Score</th>
              <th className="py-2 px-3">Packet Rate</th>
              <th className="py-2 px-3">Protocol</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 text-xs">
            {events.map((ev, idx) => (
              <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-300">
                  {ev.time}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStateBadge(ev.state)}`}>
                    {ev.state}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-bold text-white">
                  {ev.threatScore} / 100
                </td>
                <td className="py-2.5 px-3 text-cyan-300">
                  {Number(ev.packetRate || packetRate).toFixed(1)} pkts/s
                </td>
                <td className="py-2.5 px-3 text-slate-400">
                  TCP / IP
                </td>
                <td className="py-2.5 px-3">
                  <span className="flex items-center space-x-1.5 text-emerald-400 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Analyzed</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
