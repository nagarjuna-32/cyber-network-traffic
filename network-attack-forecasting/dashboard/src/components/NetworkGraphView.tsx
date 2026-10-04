import React, { useState } from 'react';
import { NetworkGraphSnapshot, NetworkGraphNode } from '../types/prediction';
import { Network, Share2, Server, Activity, ShieldAlert, Cpu, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface NetworkGraphViewProps {
  graph?: NetworkGraphSnapshot;
  currentState?: string;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({
  graph,
  currentState = 'NORMAL',
}) => {
  const [selectedNode, setSelectedNode] = useState<NetworkGraphNode | null>(null);

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800">
        <Network className="h-12 w-12 text-slate-600 mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-300">Network Topology Graph Awaiting Stream</h3>
        <p className="text-xs text-slate-500 mt-1">
          Topological network state G(t) generates automatically as flow records are ingested.
        </p>
      </div>
    );
  }

  const isAttack = currentState.toUpperCase() === 'ATTACK';
  const isElevated = currentState.toUpperCase() === 'ELEVATED' || currentState.toUpperCase() === 'SUSPICIOUS';

  // SVG layout coordinates calculation
  const width = 680;
  const height = 380;
  const centerX = width / 2;
  const centerY = height / 2;

  // Node position map
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const maxNode = graph.max_degree_node;

  // Place max degree node at center
  nodePositions[maxNode] = { x: centerX, y: centerY };

  // Place other nodes in an orbital ring
  const otherNodes = graph.nodes.filter(n => n.id !== maxNode);
  const angleStep = (2 * Math.PI) / Math.max(1, otherNodes.length);
  const radius = 135;

  otherNodes.forEach((node, idx) => {
    const angle = idx * angleStep - Math.PI / 2;
    nodePositions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-3 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Server className="h-3.5 w-3.5 text-cyan-400" />
            <span>Active Hosts (|V|)</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-white">
            {graph.num_nodes}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Discovered IP endpoints</div>
        </div>

        <div className="glass-card rounded-xl p-3 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Flow Links (|E|)</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {graph.num_edges}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active transport paths</div>
        </div>

        <div className="glass-card rounded-xl p-3 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Activity className="h-3.5 w-3.5 text-amber-400" />
            <span>Network Density</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-300">
            {(graph.density * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Topological cohesion</div>
        </div>

        <div className="glass-card rounded-xl p-3 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>Star Score</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-300">
            {(graph.star_score * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Centralization index</div>
        </div>
      </div>

      {/* 2. Visual Topology Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Network Map (2 columns on lg) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Topological Graph State G(t)
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> TCP
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> UDP
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" /> Attack Hub
              </span>
            </div>
          </div>

          <div className="w-full flex justify-center items-center py-2 bg-slate-950/40 rounded-xl border border-slate-900 overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full max-w-[680px] h-[340px] select-none"
            >
              <defs>
                <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Edge Links */}
              {graph.edges.map((edge, idx) => {
                const src = nodePositions[edge.source] || { x: centerX, y: centerY };
                const dst = nodePositions[edge.target] || { x: centerX, y: centerY };
                const strokeColor = edge.protocol === 'UDP' ? '#f59e0b' : '#06b6d4';
                const strokeWidth = Math.min(4, Math.max(1.5, Math.log10(edge.weight || 10) / 2));

                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={dst.x}
                      y2={dst.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity="0.6"
                      strokeDasharray={edge.protocol === 'UDP' ? '4 2' : 'none'}
                    />
                  </g>
                );
              })}

              {/* Node Circles */}
              {graph.nodes.map((node) => {
                const pos = nodePositions[node.id] || { x: centerX, y: centerY };
                const isHub = node.id === maxNode;
                const isSelected = selectedNode?.id === node.id;
                const nodeRadius = isHub ? 24 : 16;

                return (
                  <g
                    key={`node-${node.id}`}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Pulsing ring for central hub */}
                    {isHub && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={nodeRadius + 14}
                        fill="url(#hubGlow)"
                        className="animate-radar"
                      />
                    )}

                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeRadius}
                      fill={isHub ? (isAttack ? '#dc2626' : '#ea580c') : isSelected ? '#0891b2' : '#0f172a'}
                      stroke={isSelected ? '#22d3ee' : isHub ? '#f87171' : '#334155'}
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* Node Text Label */}
                    <text
                      x={pos.x}
                      y={pos.y + nodeRadius + 14}
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Click any node in the canvas to inspect host metrics.</span>
            <span className="font-mono text-cyan-400">Max Degree Hub: {maxNode}</span>
          </div>
        </div>

        {/* Selected Node Inspector Panel */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Host Telemetry Inspector
              </span>
            </div>

            {selectedNode ? (
              <div className="mt-4 space-y-4">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Selected Endpoint</div>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">{selectedNode.id}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {selectedNode.id === maxNode ? (
                      <span className="text-amber-400 font-semibold">⚠️ Central Traffic Coordinator</span>
                    ) : (
                      'Peripheral Communicating Host'
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-900">
                    <span className="text-[10px] text-slate-500">Degree (Total)</span>
                    <div className="text-sm font-bold text-white mt-0.5">{selectedNode.degree}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-900">
                    <span className="text-[10px] text-slate-500">In / Out Ratio</span>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {selectedNode.in_degree} : {selectedNode.out_degree}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> Bytes Sent:
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {(selectedNode.bytes_sent / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ArrowDownLeft className="h-3.5 w-3.5 text-cyan-400" /> Bytes Received:
                    </span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {(selectedNode.bytes_recv / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-slate-500 space-y-2">
                <Server className="h-8 w-8 text-slate-700 mx-auto" />
                <p className="text-xs">Select any node on the graph canvas to inspect its transport metrics.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            NetworkX Topological State Snapshot &bull; SIH26153
          </div>
        </div>

      </div>
    </div>
  );
};
