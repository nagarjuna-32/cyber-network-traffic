import React from 'react';
import { NetworkGraphState } from '../../types';
import { formatNumber, formatBytes } from '../../utils';
import { Network, Server, ArrowRight, Share2, Activity } from 'lucide-react';

interface TopologicalNetworkGraphProps {
  graph?: NetworkGraphState;
}

export const TopologicalNetworkGraph: React.FC<TopologicalNetworkGraphProps> = ({ graph }) => {
  if (!graph || graph.num_nodes === 0) {
    return (
      <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-6 text-center text-xs text-slate-400">
        <Network className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
        No active topological graph state for current sequence window.
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            Topological Network Graph State
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            NetworkX graph modeling host communication topology, star score, and degree centrality
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Density: {(graph.density * 100).toFixed(1)}%
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Star Score: {graph.star_score.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-0.5">Graph Nodes</span>
          <span className="text-base font-bold font-mono text-white">{graph.num_nodes}</span>
          <span className="text-[10px] text-slate-500 block">Communicating hosts</span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-0.5">Graph Edges</span>
          <span className="text-base font-bold font-mono text-blue-400">{graph.num_edges}</span>
          <span className="text-[10px] text-slate-500 block">Active socket channels</span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-0.5">Hub / Max Degree Host</span>
          <span className="text-xs font-bold font-mono text-amber-400 truncate block">
            {graph.max_degree_node || 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">Degree: {graph.max_degree}</span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-0.5">Topological Pattern</span>
          <span className="text-xs font-semibold text-emerald-400 block">
            {graph.star_score > 0.7 ? 'Star / Scanner Hub' : 'Distributed Mesh'}
          </span>
          <span className="text-[10px] text-slate-500 block">Anomaly metric</span>
        </div>
      </div>

      {/* Graph Edges / Flow Channels List */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-medium text-slate-400 block">
          Active Host Communication Channels ({graph.edges.length} edges):
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {graph.edges.map((edge, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-200">{edge.source}</span>
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="text-slate-200">{edge.target}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {edge.protocol}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {formatNumber(edge.packet_count)} pkts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
