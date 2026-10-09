import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TimelinePoint } from '../../types';
import { formatBytes, formatTime } from '../../utils';

interface TrafficSummaryChartProps {
  timeline?: TimelinePoint[];
}

export const TrafficSummaryChart: React.FC<TrafficSummaryChartProps> = ({
  timeline = [],
}) => {
  const chartData = React.useMemo(() => {
    if (!timeline || timeline.length === 0) {
      // Default clean baseline points
      return [
        { timeLabel: '10m ago', packetRate: 20, byteRate: 15000 },
        { timeLabel: '8m ago', packetRate: 24, byteRate: 18000 },
        { timeLabel: '6m ago', packetRate: 22, byteRate: 16500 },
        { timeLabel: '4m ago', packetRate: 26, byteRate: 19500 },
        { timeLabel: '2m ago', packetRate: 25, byteRate: 18750 },
        { timeLabel: 'Now', packetRate: 25, byteRate: 18750 },
      ];
    }

    return timeline.map((pt) => ({
      timeLabel: formatTime(pt.timestamp),
      packetRate: Math.round(pt.packet_rate),
      byteRate: Math.round(pt.byte_rate),
    }));
  }, [timeline]);

  return (
    <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white">
            Traffic Summary
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Recent packet arrival rate and network throughput
          </p>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0b101d',
                borderColor: '#1e293b',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: any, name: any) => [
                name === 'packetRate' ? `${value} pkts/s` : `${formatBytes(value)}/s`,
                name === 'packetRate' ? 'Packet Rate' : 'Throughput',
              ]}
              labelFormatter={(lbl) => `Time: ${lbl}`}
            />
            <Area
              type="monotone"
              dataKey="packetRate"
              name="packetRate"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#trafficGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
