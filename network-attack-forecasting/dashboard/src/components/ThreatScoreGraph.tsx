import React, { useState } from 'react';
import { TrendingUp, ShieldAlert, Activity } from 'lucide-react';
import { SecurityDecision } from '../types/prediction';

interface ThreatScoreGraphProps {
  decision: SecurityDecision | null;
}

export const ThreatScoreGraph: React.FC<ThreatScoreGraphProps> = ({ decision }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const currentScore = decision?.threat_score ?? 0;
  const rawForecast = decision?.forecast || [];

  // Points: Current, followed by actual forecast points from live model rollout
  const forecastPoints = rawForecast.map((f: any) => ({
    label: `+${f.step * 5}s`,
    score: Number(f.threat_score ?? 0),
    time: `+${f.step * 5} sec`,
  }));

  const points = [
    { label: 'Current', score: currentScore, time: 'Now' },
    ...forecastPoints,
  ];

  // SVG Chart dimensions
  const width = 640;
  const height = 220;
  const paddingX = 55;
  const paddingY = 30;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  // Coordinate mapping
  const coords = points.map((p, idx) => {
    const x = paddingX + (points.length > 1 ? (idx / (points.length - 1)) * innerWidth : innerWidth / 2);
    const y = paddingY + innerHeight - (Math.min(Math.max(p.score, 0), 100) / 100) * innerHeight;
    return { ...p, x, y };
  });

  // Construct SVG Path
  const linePath = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;

  // Color selection based on current / peak score
  const peakScore = Math.max(...points.map((p) => p.score));
  const isCritical = peakScore >= 70;
  const isElevated = peakScore >= 40;

  const strokeColor = isCritical ? '#f87171' : isElevated ? '#fbbf24' : '#34d399';
  const gradientId = isCritical ? 'grad-crit' : isElevated ? 'grad-elev' : 'grad-norm';

  return (
    <div className="bg-[#0b101b] rounded-2xl border border-slate-800 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-3">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" />
            <span>Temporal Risk Evolution &bull; Lookahead Curve</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Threat Score Trajectory (Current vs Future Forecast)
          </h3>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">Peak Projected:</span>
          <span className={`font-bold ${isCritical ? 'text-red-400' : isElevated ? 'text-amber-400' : 'text-emerald-400'}`}>
            {peakScore} / 100
          </span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
        >
          <defs>
            <linearGradient id="grad-crit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-elev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-norm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines (0, 25, 50, 75, 100) */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = paddingY + innerHeight - (val / 100) * innerHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {coords.map((pt, idx) => {
            const isHovered = hoveredPoint === idx;
            return (
              <g
                key={pt.label}
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                {/* Glow ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 8 : 5}
                  fill={strokeColor}
                  stroke="#0b101b"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Score value pill above point */}
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {pt.score}
                </text>

                {/* X-axis label */}
                <text
                  x={pt.x}
                  y={height - paddingY + 20}
                  fill={idx === 0 ? '#38bdf8' : '#94a3b8'}
                  fontSize="11"
                  fontWeight={idx === 0 ? 'bold' : 'normal'}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/80 pt-2">
        <span>Vertical axis: Threat Score (0–100)</span>
        <span className="text-cyan-400">Step Interval: 5.0 seconds</span>
      </div>

    </div>
  );
};
