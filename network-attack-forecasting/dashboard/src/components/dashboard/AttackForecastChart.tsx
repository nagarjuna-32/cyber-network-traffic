import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Dot,
} from 'recharts';
import { ForecastStep, SecurityState, PredictionTimelinePoint } from '../../types';

interface AttackForecastChartProps {
  currentState?: SecurityState;
  forecastSteps?: ForecastStep[];
  timeline?: PredictionTimelinePoint[];
  explanation?: string;
}

export const AttackForecastChart: React.FC<AttackForecastChartProps> = ({
  currentState = 'NORMAL',
  forecastSteps = [],
  timeline = [],
  explanation,
}) => {
  // Build simple unified points for the chart
  const chartData = React.useMemo(() => {
    if (timeline && timeline.length > 0) {
      return timeline.map((pt, idx) => ({
        stepLabel: idx === 0 ? 'Now' : pt.time,
        threatScore: pt.threatScore,
        state: pt.state,
        isForecast: pt.isForecast,
      }));
    }

    if (forecastSteps && forecastSteps.length > 0) {
      const points = [
        {
          stepLabel: 'Now',
          threatScore: currentState === 'ATTACK' ? 85 : currentState === 'SUSPICIOUS' ? 55 : currentState === 'ELEVATED' ? 30 : 10,
          state: currentState,
          isForecast: false,
        },
      ];

      forecastSteps.forEach((s) => {
        points.push({
          stepLabel: `+${s.step}`,
          threatScore: s.threat_score,
          state: s.state,
          isForecast: true,
        });
      });
      return points;
    }

    return [
      { stepLabel: 'Now', threatScore: 10, state: currentState, isForecast: false },
      { stepLabel: '+1', threatScore: 15, state: 'NORMAL', isForecast: true },
      { stepLabel: '+2', threatScore: 18, state: 'NORMAL', isForecast: true },
      { stepLabel: '+3', threatScore: 20, state: 'NORMAL', isForecast: true },
    ];
  }, [timeline, forecastSteps, currentState]);

  // Plain-English sentence below the chart
  const getPlainEnglishSummary = () => {
    if (explanation && explanation.trim()) {
      return explanation;
    }

    const lastPoint = chartData[chartData.length - 1];
    if (lastPoint.state === 'ATTACK') {
      return 'The model projects an attack escalation within the next few observation steps.';
    }
    if (lastPoint.state === 'SUSPICIOUS' || lastPoint.state === 'ELEVATED') {
      return 'The model projects increased anomalous activity over upcoming steps, warranting close observation.';
    }
    return 'The network state is predicted to remain stable and within normal operating parameters.';
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white">
            What Happens Next?
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Projected security state trajectory over upcoming observation steps
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-400">Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-400">Attack</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="stepLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0b101d',
                borderColor: '#1e293b',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: any, _: any, entry: any) => [
                `Score: ${value} (${entry.payload.state})`,
                entry.payload.isForecast ? 'Forecasted Step' : 'Current State',
              ]}
              labelFormatter={(lbl) => `Timeline: ${lbl}`}
            />
            <Line
              type="monotone"
              dataKey="threatScore"
              name="Threat Score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                let fill = '#10b981';
                if (payload.state === 'ATTACK') fill = '#ef4444';
                else if (payload.state === 'SUSPICIOUS' || payload.state === 'ELEVATED') fill = '#f59e0b';
                return (
                  <circle
                    key={`dot-${props.index}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={fill}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Plain-English summary statement */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <p className="text-xs text-slate-300 leading-relaxed flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span>{getPlainEnglishSummary()}</span>
        </p>
      </div>
    </div>
  );
};
