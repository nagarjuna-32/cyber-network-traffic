import React from 'react';
import { History, TrendingUp, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { TimelineObservation, ForecastStep } from '../types/prediction';

interface TimelineViewProps {
  timeline?: TimelineObservation[];
  forecast?: ForecastStep[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline = [],
  forecast = [],
}) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-slate-100">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            8. Traffic & Behavior Timeline
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
          <AlertCircle className="h-8 w-8 mb-2 text-slate-600" />
          <p className="text-xs">No temporal telemetry records currently available in this dataset partition.</p>
        </div>
      </div>
    );
  }

  const maxPacket = Math.max(...timeline.map((t) => t.packetRate), 1000);

  const getStateBadgeColor = (state: string) => {
    switch ((state || '').toUpperCase()) {
      case 'NORMAL':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ELEVATED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'SUSPICIOUS':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'PREDICTED ATTACK':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'ATTACK':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'RECOVERY':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            8. Traffic & Predictive Behavior Timeline
          </h3>
        </div>
        
        {/* Timeline Horizon Legend */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>Observed Past (t-T .. t)</span>
          </div>
          <div className="flex items-center space-x-1.5 text-pink-400">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span>Projected Horizon (t+1 .. t+K)</span>
          </div>
        </div>
      </div>

      {/* Bar / Telemetry Visualizer */}
      <div className="mt-5">
        <div className="grid grid-cols-7 gap-2.5 items-end h-44 pb-2 pt-4 px-2 bg-slate-950/70 rounded-xl border border-slate-800/80">
          {timeline.map((item, idx) => {
            const heightPercent = Math.max(12, Math.min(100, Math.round((item.packetRate / maxPacket) * 100)));
            const isForecast = item.isForecast;

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                
                {/* Hover Tooltip */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 p-1.5 rounded text-[10px] text-center z-30 pointer-events-none whitespace-nowrap shadow-xl">
                  <div className="font-bold text-slate-200">{item.time} ({item.timestamp})</div>
                  <div className="text-cyan-400 font-mono">{item.packetRate} pkts/s</div>
                  <div className="text-amber-400 font-mono">Threat Score: {item.threatScore}</div>
                </div>

                {/* Score Marker */}
                <div className="text-[10px] font-mono text-slate-400 mb-1 group-hover:text-white transition-colors">
                  {item.threatScore}
                </div>

                {/* Bar */}
                <div className="w-full max-w-[36px] bg-slate-900 rounded-t-md overflow-hidden flex flex-col justify-end p-0.5 border border-slate-800">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      isForecast
                        ? 'bg-gradient-to-t from-pink-900/60 to-pink-500 border-t-2 border-pink-400'
                        : 'bg-gradient-to-t from-cyan-950 to-cyan-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* State Tag */}
                <span
                  className={`mt-2 text-[9px] font-mono px-1 py-0.5 rounded border uppercase font-bold truncate max-w-full ${getStateBadgeColor(
                    item.state
                  )}`}
                >
                  {item.state}
                </span>

                {/* Time Label */}
                <span className={`text-[10px] font-mono mt-1 ${isForecast ? 'text-pink-400 font-semibold' : 'text-slate-400'}`}>
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-step Lookahead Breakdown */}
      {forecast && forecast.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            <span>K-Step Forward Horizon Projections (Deterministic Structural Lookahead):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {forecast.map((fc) => (
              <div
                key={fc.step}
                className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center"
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
