import React, { useState } from 'react';
import { History, TrendingUp, Sparkles, Clock, AlertCircle, Radio, Activity } from 'lucide-react';
import { TimelineObservation, ForecastStep } from '../types/prediction';

interface TimelineViewProps {
  timeline?: TimelineObservation[];
  forecast?: ForecastStep[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline = [],
  forecast = [],
}) => {
  const [activeMetric, setActiveMetric] = useState<'dual' | 'packets' | 'threat'>('dual');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-slate-100">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            8. Traffic & Predictive Behavior Timeline
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <AlertCircle className="h-9 w-9 mb-2 text-slate-600" />
          <p className="text-xs font-mono">No temporal telemetry records currently available in this dataset partition.</p>
          <span className="text-[11px] text-slate-600 mt-1">Network interface idle or packet stream buffer empty.</span>
        </div>
      </div>
    );
  }

  // Chart dimensions & scaling
  const chartWidth = 920;
  const chartHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const maxPacket = Math.max(...timeline.map((t) => t.packetRate || 0), 1000);
  const maxThreat = 100;

  // Calculate coordinates for each point
  const totalPoints = timeline.length;
  const points = timeline.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, totalPoints - 1)) * innerWidth;
    const packetY = paddingTop + innerHeight - ((d.packetRate || 0) / maxPacket) * innerHeight;
    const threatY = paddingTop + innerHeight - (Math.min(100, Math.max(0, d.threatScore || 0)) / maxThreat) * innerHeight;
    return { ...d, x, packetY, threatY, index: i };
  });

  // Find the index of the "Now" (current observation) point
  const nowIndex = points.findIndex((p) => p.time === 'Now' || !p.isForecast && points[p.index + 1]?.isForecast);
  const splitIdx = nowIndex !== -1 ? nowIndex : points.findIndex((p) => p.isForecast) - 1;
  const safeSplit = splitIdx >= 0 ? splitIdx : Math.floor(points.length / 2);

  // Generate smooth cubic bezier SVG path string
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  // Past points vs Future forecast points
  const pastPoints = points.slice(0, safeSplit + 1);
  const futurePoints = points.slice(safeSplit);

  const pastPacketCoords = pastPoints.map((p) => ({ x: p.x, y: p.packetY }));
  const futurePacketCoords = futurePoints.map((p) => ({ x: p.x, y: p.packetY }));
  const allPacketCoords = points.map((p) => ({ x: p.x, y: p.packetY }));

  const pastThreatCoords = pastPoints.map((p) => ({ x: p.x, y: p.threatY }));
  const futureThreatCoords = futurePoints.map((p) => ({ x: p.x, y: p.threatY }));

  const pastPacketPath = createSmoothPath(pastPacketCoords);
  const futurePacketPath = createSmoothPath(futurePacketCoords);

  const pastThreatPath = createSmoothPath(pastThreatCoords);
  const futureThreatPath = createSmoothPath(futureThreatCoords);

  // Area under packet rate curve for past
  const bottomY = paddingTop + innerHeight;
  const pastPacketArea = pastPoints.length > 0
    ? `${pastPacketPath} L ${pastPoints[pastPoints.length - 1].x} ${bottomY} L ${pastPoints[0].x} ${bottomY} Z`
    : '';

  // Area for future forecast corridor
  const futurePacketArea = futurePoints.length > 0
    ? `${futurePacketPath} L ${futurePoints[futurePoints.length - 1].x} ${bottomY} L ${futurePoints[0].x} ${bottomY} Z`
    : '';

  // Current live point
  const currentLivePoint = points[safeSplit] || points[0];

  // Colors for states
  const getStateColor = (st: string) => {
    switch ((st || '').toUpperCase()) {
      case 'NORMAL': return '#10b981';
      case 'ELEVATED': return '#f59e0b';
      case 'SUSPICIOUS': return '#f97316';
      case 'PREDICTED ATTACK': return '#ec4899';
      case 'ATTACK': return '#ef4444';
      case 'RECOVERY': return '#a855f7';
      default: return '#64748b';
    }
  };

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  // Peak rate and stats
  const currentPacketRate = currentLivePoint.packetRate || 0;
  const currentThreatScore = currentLivePoint.threatScore || 0;
  const peakPacketRate = Math.max(...points.map((p) => p.packetRate || 0));
  const forecastTrend = points[points.length - 1]?.threatScore > currentThreatScore
    ? 'Escalating'
    : points[points.length - 1]?.threatScore < currentThreatScore
    ? 'De-escalating'
    : 'Stable Baseline';

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden">
      {/* Top Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2.5">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            8. Traffic & Predictive Behavior Timeline
          </h3>
          <span className="hidden md:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[10px] font-mono">
            <Radio className="h-2.5 w-2.5 animate-pulse text-cyan-400" />
            <span>LIVE TRACKING</span>
          </span>
        </div>

        {/* Metric Toggles & Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMetric('dual')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                activeMetric === 'dual'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dual Graph
            </button>
            <button
              onClick={() => setActiveMetric('packets')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                activeMetric === 'packets'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Traffic (pkts/s)
            </button>
            <button
              onClick={() => setActiveMetric('threat')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                activeMetric === 'threat'
                  ? 'bg-pink-500/20 text-pink-300 font-bold border border-pink-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Threat Score
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-[11px] font-mono pl-2 text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Observed (Past)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-pink-400">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              <span>Forecast (+5m)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Interactive Time-Series Graph */}
      <div className="mt-4 relative bg-slate-950/80 rounded-xl border border-slate-800/80 p-2 overflow-hidden">
        
        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-xl p-2.5 shadow-2xl text-xs backdrop-blur-md transition-all duration-75"
            style={{
              left: Math.min(Math.max(10, (hoveredPoint.x / chartWidth) * 100), 85) + '%',
              top: '12px',
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1 mb-1.5 font-mono text-[11px]">
              <span className="font-bold text-slate-200">{hoveredPoint.time} ({hoveredPoint.timestamp})</span>
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                style={{
                  backgroundColor: `${getStateColor(hoveredPoint.state)}22`,
                  color: getStateColor(hoveredPoint.state),
                }}
              >
                {hoveredPoint.state}
              </span>
            </div>
            <div className="space-y-0.5 font-mono text-[11px]">
              <div className="flex justify-between text-cyan-300">
                <span>Traffic Flow:</span>
                <span className="font-bold">{hoveredPoint.packetRate.toLocaleString()} pkts/s</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>Threat Score:</span>
                <span className="font-bold">{hoveredPoint.threatScore}/100</span>
              </div>
              {hoveredPoint.confidence !== undefined && (
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Certainty:</span>
                  <span>{Math.round(hoveredPoint.confidence * 100)}%</span>
                </div>
              )}
              {hoveredPoint.isForecast && (
                <div className="text-[10px] text-pink-400 font-semibold pt-0.5">
                  ✦ Projected Forecast Horizon
                </div>
              )}
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="cyanAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="pinkAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="threatLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + innerHeight * (1 - pct);
            const valuePackets = Math.round(maxPacket * pct);
            const valueThreat = Math.round(maxThreat * pct);

            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                {/* Left Y Axis (Packet Rate) */}
                {(activeMetric === 'dual' || activeMetric === 'packets') && (
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {valuePackets}
                  </text>
                )}
                {/* Right Y Axis (Threat Score) */}
                {(activeMetric === 'dual' || activeMetric === 'threat') && (
                  <text
                    x={chartWidth - paddingRight + 8}
                    y={y + 3}
                    fill="#ec4899"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="start"
                  >
                    {valueThreat}
                  </text>
                )}
              </g>
            );
          })}

          {/* Split boundary vertical line for "Now (t)" */}
          {currentLivePoint && (
            <g>
              <line
                x1={currentLivePoint.x}
                y1={paddingTop - 10}
                x2={currentLivePoint.x}
                y2={bottomY}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <rect
                x={currentLivePoint.x - 30}
                y={paddingTop - 22}
                width="60"
                height="16"
                rx="4"
                fill="#0891b2"
              />
              <text
                x={currentLivePoint.x}
                y={paddingTop - 11}
                fill="#030712"
                fontSize="8.5"
                fontWeight="900"
                fontFamily="monospace"
                textAnchor="middle"
              >
                NOW (t)
              </text>
            </g>
          )}

          {/* --- PACKET RATE CURVE & AREA --- */}
          {(activeMetric === 'dual' || activeMetric === 'packets') && (
            <>
              {/* Area fills */}
              {pastPacketArea && (
                <path d={pastPacketArea} fill="url(#cyanAreaGrad)" />
              )}
              {futurePacketArea && (
                <path d={futurePacketArea} fill="url(#pinkAreaGrad)" />
              )}

              {/* Observed line (Past) */}
              {pastPacketPath && (
                <path
                  d={pastPacketPath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
              )}

              {/* Forecast line (Future - Dashed) */}
              {futurePacketPath && (
                <path
                  d={futurePacketPath}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                />
              )}
            </>
          )}

          {/* --- THREAT SCORE CURVE --- */}
          {(activeMetric === 'dual' || activeMetric === 'threat') && (
            <>
              {pastThreatPath && (
                <path
                  d={pastThreatPath}
                  fill="none"
                  stroke="url(#threatLineGrad)"
                  strokeWidth="2"
                />
              )}
              {futureThreatPath && (
                <path
                  d={futureThreatPath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              )}
            </>
          )}

          {/* Data Points on Curves */}
          {points.map((p, i) => {
            const isHovered = hoveredIdx === i;
            const isNow = i === safeSplit;
            const primaryY = activeMetric === 'threat' ? p.threatY : p.packetY;
            const dotColor = p.isForecast ? '#ec4899' : '#06b6d4';

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover capture area */}
                <rect
                  x={p.x - 14}
                  y={paddingTop}
                  width="28"
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Vertical hover crosshair */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingTop}
                    x2={p.x}
                    y2={bottomY}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Packet Rate Dot */}
                {(activeMetric === 'dual' || activeMetric === 'packets') && (
                  <>
                    {isNow && (
                      <circle
                        cx={p.x}
                        cy={p.packetY}
                        r="8"
                        fill="#06b6d4"
                        opacity="0.3"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.packetY}
                      r={isHovered ? 5.5 : isNow ? 4.5 : 3}
                      fill={p.isForecast ? '#ec4899' : '#06b6d4'}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                  </>
                )}

                {/* Threat Score Dot (if dual or threat) */}
                {activeMetric === 'dual' && (
                  <circle
                    cx={p.x}
                    cy={p.threatY}
                    r={isHovered ? 4.5 : 2.5}
                    fill={p.isForecast ? '#f43f5e' : '#f59e0b'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}

                {/* X Axis Labels */}
                <text
                  x={p.x}
                  y={bottomY + 16}
                  fill={isNow ? '#38bdf8' : p.isForecast ? '#f472b6' : '#94a3b8'}
                  fontSize={isNow ? '10' : '9'}
                  fontWeight={isNow ? 'bold' : 'normal'}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {p.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Metrics Summary Strip */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono">Current Flow Rate</div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
            {currentPacketRate.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">pkts/s</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono">Peak Monitored</div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
            {peakPacketRate.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">pkts/s</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono">Current Threat Score</div>
          <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
            {currentThreatScore}<span className="text-[10px] text-slate-500 font-normal">/100</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono">Trajectory Forecast</div>
          <div className={`text-xs font-bold font-mono mt-0.5 truncate ${
            forecastTrend === 'Escalating' ? 'text-pink-400' : forecastTrend === 'De-escalating' ? 'text-purple-400' : 'text-emerald-400'
          }`}>
            {forecastTrend}
          </div>
        </div>

        <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-400 font-mono">Horizon Early Warning</div>
          <div className="text-sm font-bold font-mono text-pink-300 mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3 text-pink-400" />
            <span>+3 mins lead</span>
          </div>
        </div>
      </div>

      {/* Multi-step Lookahead Breakdown */}
      {forecast && forecast.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            <span>Lookahead Horizon Projections P(S&#123;t+K&#125; | S&#123;t&#125;):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {forecast.map((fc) => (
              <div
                key={fc.step}
                className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center"
              >
                <div>
                  <div className="font-mono text-pink-400 font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Horizon K = +{fc.step} ({fc.time})</span>
                  </div>
                  <div className="text-slate-300 font-medium mt-0.5">
                    Stage: <span className="text-white font-semibold">{fc.stage}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-100">
                    Threat {fc.threat_score}/100
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {Math.round(fc.confidence * 100)}% Certainty
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
