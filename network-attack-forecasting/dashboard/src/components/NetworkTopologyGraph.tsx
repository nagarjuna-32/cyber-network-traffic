import React, { useState } from 'react';
import { Network, Server, ArrowRight, ShieldAlert, Cpu, Activity, Info } from 'lucide-react';
import { NetworkGraphSnapshot, NetworkGraphNode } from '../types/prediction';

interface NetworkTopologyGraphProps {
  graph?: NetworkGraphSnapshot;
  currentState: string;
}

export const NetworkTopologyGraph: React.FC<NetworkTopologyGraphProps> = ({
  graph,
  currentState,
}) => {
  const [selectedNode, setSelectedNode] = useState<NetworkGraphNode | null>(null);

  const nodes = graph?.nodes || [
    { id: '192.168.4.197', degree: 3, in_degree: 0, out_degree: 3, bytes_sent: 4500000, bytes_recv: 0 },
    { id: '192.168.4.249', degree: 1, in_degree: 1, out_degree: 0, bytes_sent: 0, bytes_recv: 900000 },
    { id: '10.0.0.1', degree: 2, in_degree: 2, out_degree: 0, bytes_sent: 12000, bytes_recv: 3600000 },
  ];

  const edges = graph?.edges || [
    { source: '192.168.4.197', target: '10.0.0.1', weight: 3600000, packet_count: 24000, flow_count: 150, protocol: 'TCP' },
    { source: '192.168.4.197', target: '192.168.4.249', weight: 900000, packet_count: 1100, flow_count: 25, protocol: 'TCP' },
  ];

  const numNodes = graph?.num_nodes || nodes.length;
  const numEdges = graph?.num_edges || edges.length;
  const starScore = graph?.star_score ?? 0.82;
  const maxDegreeNode = graph?.max_degree_node || nodes[0]?.id || 'N/A';

  const isAttack = currentState.toUpperCase() === 'ATTACK';

  // SVG canvas coordinates
  const svgWidth = 600;
  const svgHeight = 280;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Node position calculation: central target hub surrounded by client nodes
  const nodePositions: Record<string, { x: number; y: number }> = {};
  
  // Designate max_degree_node or target as center
  const targetNodeId = edges[0]?.target || nodes[nodes.length - 1]?.id;

  nodes.forEach((n, idx) => {
    if (n.id === targetNodeId) {
      nodePositions[n.id] = { x: centerX, y: centerY };
    } else {
      const otherNodes = nodes.filter((x) => x.id !== targetNodeId);
      const angle = (idx / Math.max(otherNodes.length, 1)) * 2 * Math.PI;
      const radius = 100;
      nodePositions[n.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * (radius * 0.75),
      };
    }
  });

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-3">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
            <Network className="h-4 w-4" />
            <span>Topological Attack Flow Graph G(V, E)</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Network Topology & Attack Concentration Map
          </h3>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">Nodes: <span className="text-cyan-300 font-bold">{numNodes}</span></span>
          <span className="text-slate-400">Edges: <span className="text-cyan-300 font-bold">{numEdges}</span></span>
          <span className="text-slate-400">Star Anomaly: <span className={`font-bold ${starScore > 0.7 ? 'text-red-400' : 'text-emerald-400'}`}>{starScore.toFixed(2)}</span></span>
        </div>
      </div>

      {/* SVG Canvas & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        
        {/* SVG Graph (8 cols) */}
        <div className="lg:col-span-8 bg-[#070a12] rounded-xl border border-slate-800/80 p-2 relative overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
            {/* Draw Edges */}
            {edges.map((e, idx) => {
              const src = nodePositions[e.source] || { x: 100, y: 100 };
              const tgt = nodePositions[e.target] || { x: centerX, y: centerY };

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isAttack ? '#ef4444' : '#0284c7'}
                    strokeWidth={Math.min(Math.max((e.flow_count || 10) / 30, 2), 6)}
                    strokeOpacity={0.65}
                    strokeDasharray={isAttack ? '5 3' : 'none'}
                    className={isAttack ? 'animate-pulse' : ''}
                  />
                  {/* Midpoint protocol label */}
                  <rect
                    x={(src.x + tgt.x) / 2 - 14}
                    y={(src.y + tgt.y) / 2 - 8}
                    width={28}
                    height={16}
                    fill="#0b101b"
                    rx={4}
                    stroke="#1e293b"
                    strokeWidth={1}
                  />
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 + 3}
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {e.protocol || 'TCP'}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((n) => {
              const pos = nodePositions[n.id] || { x: centerX, y: centerY };
              const isTarget = n.id === targetNodeId;
              const isSelected = selectedNode?.id === n.id;

              return (
                <g
                  key={n.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(n)}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse if target / attack */}
                  {isTarget && isAttack && (
                    <circle r={22} fill="none" stroke="#ef4444" strokeWidth={1.5} className="animate-ping opacity-50" />
                  )}

                  {/* Main node circle */}
                  <circle
                    r={isTarget ? 16 : 12}
                    fill={isTarget ? '#dc2626' : isSelected ? '#0284c7' : '#1e293b'}
                    stroke={isSelected ? '#38bdf8' : isTarget ? '#f87171' : '#475569'}
                    strokeWidth={2}
                    className="transition-all"
                  />

                  {/* Node IP text */}
                  <text
                    y={isTarget ? 28 : 22}
                    fill={isTarget ? '#fca5a5' : '#cbd5e1'}
                    fontSize="10"
                    fontWeight={isTarget ? 'bold' : 'normal'}
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {n.id}
                  </text>

                  {/* Target label */}
                  {isTarget && (
                    <text
                      y={-20}
                      fill="#ef4444"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      [TARGET HUB]
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 bg-[#070a12] rounded-xl border border-slate-800 p-3.5 text-xs font-mono flex flex-col justify-between h-full min-h-[220px]">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 uppercase">Host Inspector</span>
              <span className="text-[10px] text-cyan-400">Click node to inspect</span>
            </div>

            {selectedNode ? (
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">IP Address:</span>
                  <span className="text-sm font-bold text-cyan-300">{selectedNode.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Degree:</span>
                    <span className="text-white font-bold">{selectedNode.degree}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">In / Out:</span>
                    <span className="text-white">{selectedNode.in_degree} / {selectedNode.out_degree}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block">Traffic Volume:</span>
                  <span className="text-slate-300">
                    Sent: {(selectedNode.bytes_sent / 1024).toFixed(1)} KB | Recv: {(selectedNode.bytes_recv / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400">
                <Server className="h-6 w-6 mx-auto mb-1 text-slate-400" />
                <p className="text-[11px]">Primary Attacker Hub:</p>
                <p className="text-xs font-bold text-cyan-400 mt-0.5">{maxDegreeNode}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Star anomaly score: <strong className="text-amber-400">{starScore.toFixed(2)}</strong> indicates concentrated hub egress.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Protocol: TCP/UDP Stream</span>
            <span className="text-emerald-400">Live Ingested</span>
          </div>
        </div>

      </div>

    </div>
  );
};
