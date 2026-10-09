import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { trafficApi } from '../services/trafficApi';
import { predictionApi } from '../services/predictionApi';
import { TrafficTimelineChart } from '../components/traffic/TrafficTimelineChart';
import { ProtocolDonutChart } from '../components/traffic/ProtocolDonutChart';
import { TopologicalNetworkGraph } from '../components/traffic/TopologicalNetworkGraph';
import { CurrentNetworkStatePanel } from '../components/dashboard/CurrentNetworkStatePanel';
import { TriadStatusBanner } from '../components/common/TriadStatusBanner';
import { Card } from '../components/common/Card';
import { StateBadge } from '../components/common/Badge';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton';
import { formatTime, formatBytes, formatNumber } from '../utils';
import {
  Activity,
  Radio,
  ArrowRight,
  Network,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';

export const TrafficAnalysis: React.FC = () => {
  const [selectedWindow, setSelectedWindow] = useState('15m');
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [trafficTypeFilter, setTrafficTypeFilter] = useState<'ALL' | 'NORMAL' | 'ANOMALOUS'>('ALL');
  const [showDeepDiagnostics, setShowDeepDiagnostics] = useState<boolean>(false);

  const { data: stats, isLoading: loadingStats } = usePolling(
    () => trafficApi.getTrafficStats(selectedWindow),
    8000
  );

  const { data: flows, isLoading: loadingFlows } = usePolling(
    () => trafficApi.getTraffic(50),
    8000
  );

  const { data: prediction } = usePolling(
    () => predictionApi.getCurrentPrediction(),
    8000
  );

  const filteredFlows = (flows || []).filter((f) => {
    const matchProto = protocolFilter === 'ALL' || f.protocol === protocolFilter;
    const matchType =
      trafficTypeFilter === 'ALL' ||
      (trafficTypeFilter === 'NORMAL' && f.state === 'NORMAL') ||
      (trafficTypeFilter === 'ANOMALOUS' && f.state !== 'NORMAL');
    return matchProto && matchType;
  });

  const summary = stats?.summary;
  const isAnomalous = summary && (summary.packets_per_sec > 100 || summary.syn_ack_ratio > 1.8);

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Live Traffic
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time incoming network traffic, throughput, and connection telemetry
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/90 rounded-lg px-2.5 py-1 text-slate-300">
            <span className="text-slate-400">Time Range:</span>
            <select
              value={selectedWindow}
              onChange={(e) => setSelectedWindow(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="5m" className="bg-slate-900">Last 5 min</option>
              <option value="15m" className="bg-slate-900">Last 15 min</option>
              <option value="1h" className="bg-slate-900">Last 1 hour</option>
              <option value="24h" className="bg-slate-900">Last 24 hours</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/90 rounded-lg px-2.5 py-1 text-slate-300">
            <span className="text-slate-400">Type:</span>
            <select
              value={trafficTypeFilter}
              onChange={(e) => setTrafficTypeFilter(e.target.value as any)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Traffic</option>
              <option value="NORMAL" className="bg-slate-900">Normal Only</option>
              <option value="ANOMALOUS" className="bg-slate-900">Anomalies Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Triad Banner: What is happening, What may happen next, Recommended action */}
      <TriadStatusBanner
        whatIsHappening={
          isAnomalous
            ? `Heightened throughput detected: ${Math.round(summary?.packets_per_sec || 0)} pkts/s. SYN/ACK ratio elevated at ${summary?.syn_ack_ratio}x.`
            : `Flow rate is stable at ${Math.round(summary?.packets_per_sec || 25)} pkts/s with ${summary?.active_connections || 1204} active socket connections.`
        }
        whatMayHappenNext={
          isAnomalous
            ? 'Continued high connection volume could saturate connection tables or indicate port scanning sweeps.'
            : 'Traffic patterns remain predictable; baseline throughput expected to persist over upcoming intervals.'
        }
        recommendedAction={
          isAnomalous
            ? 'Inspect top source IPs below and ensure edge firewall rate-limiting policies are active.'
            : 'No action required. Telemetry monitoring operational.'
        }
        currentState={isAnomalous ? 'ELEVATED' : 'NORMAL'}
        predictedNextState={prediction?.predicted_next_state || 'NORMAL'}
        severity={isAnomalous ? 'MEDIUM' : 'LOW'}
      />

      {/* Traffic Summary Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Packet Rate
            </span>
            <div className="text-xl font-bold font-mono text-white">
              {formatNumber(Math.round(summary.packets_per_sec))} <span className="text-xs font-normal text-slate-400 font-sans">pkts/s</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Throughput: {formatBytes(summary.bytes_per_sec)}/s
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Active Connections
            </span>
            <div className="text-xl font-bold font-mono text-blue-400">
              {formatNumber(summary.active_connections)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Flow Rate: {summary.flows_per_sec} flows/s
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Total Volume
            </span>
            <div className="text-xl font-bold font-mono text-white">
              {formatBytes(summary.total_bytes)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {formatNumber(summary.total_packets)} packets transferred
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Monitored Hosts
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {summary.unique_src_ips} Src · {summary.unique_dst_ips} Dst
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Avg Flow Duration: {summary.avg_duration}s
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Grid: Timeline + Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card
            title="Traffic Volume Timeline"
            subtitle="Real-time network packets and bytes aggregated over time"
          >
            {loadingStats || !stats ? (
              <ChartSkeleton />
            ) : (
              <TrafficTimelineChart
                timeline={stats.timeline}
                selectedWindow={selectedWindow}
                onWindowChange={setSelectedWindow}
              />
            )}
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card
            title="Protocol Distribution"
            subtitle="Breakdown of network protocols and application services"
          >
            {loadingStats || !stats ? (
              <ChartSkeleton />
            ) : (
              <ProtocolDonutChart protocols={stats.protocols} />
            )}
          </Card>
        </div>
      </div>

      {/* Progressive Disclosure Toggle for Advanced Diagnostics */}
      <div className="flex justify-between items-center pt-1">
        <span className="text-xs text-slate-400">
          Need topological host graph analysis or deep protocol entropy?
        </span>
        <button
          onClick={() => setShowDeepDiagnostics(!showDeepDiagnostics)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-blue-400 hover:text-blue-300 hover:border-slate-700 transition-colors font-medium shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5 text-purple-400" />
          <span>{showDeepDiagnostics ? 'Hide Graph & Deep Diagnostics' : 'Inspect Topological Graph & Protocol Diagnostics'}</span>
          {showDeepDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Progressive Disclosure Content: Topological Graph & Full Diagnostics */}
      {showDeepDiagnostics && (
        <div className="space-y-6">
          {prediction?.network_graph && (
            <TopologicalNetworkGraph graph={prediction.network_graph} />
          )}

          {summary && (
            <CurrentNetworkStatePanel
              summary={summary}
              topPorts={stats?.top_ports || []}
            />
          )}
        </div>
      )}

      {/* Top Ports Grid */}
      {stats?.top_ports && !showDeepDiagnostics && (
        <Card
          title="Most Active Service Ports"
          subtitle="Top destination ports observed in current traffic flows"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.top_ports.map((p, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-center"
              >
                <div className="text-xs font-semibold text-slate-200">{p.port}</div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {formatNumber(p.count)} pkts
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Live Ingested Flows Table */}
      <Card
        title="Recent Network Flows"
        subtitle="Individual connection records processed by the analysis pipeline"
        action={
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Protocol:</span>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 font-medium">
                <th className="py-2.5 px-3">Flow ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source Socket</th>
                <th className="py-2.5 px-3">Destination Socket</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Packets</th>
                <th className="py-2.5 px-3">Bytes</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredFlows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 font-sans">
                    No flows matching selected filter.
                  </td>
                </tr>
              ) : (
                filteredFlows.slice(0, 25).map((f) => (
                  <tr key={f.flow_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{f.flow_id.slice(0, 10)}...</td>
                    <td className="py-2.5 px-3 text-slate-400">{formatTime(f.timestamp)}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-medium">
                      {f.src_ip}:{f.src_port}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-medium">
                      {f.dst_ip}:{f.dst_port}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans text-[11px]">
                        {f.protocol}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{formatNumber(f.packet_count)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{formatBytes(f.byte_count)}</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <StateBadge state={f.state} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
