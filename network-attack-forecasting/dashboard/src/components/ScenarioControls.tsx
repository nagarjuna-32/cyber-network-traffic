import React from 'react';
import { PlayCircle, Database, HelpCircle, AlertTriangle, Layers, Clock, Zap } from 'lucide-react';
import { MOCK_SCENARIOS } from '../data/mockScenarios';

interface ScenarioControlsProps {
  currentScenario: string;
  onSelectScenario: (key: string) => void;
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
  onSimulateLoading: () => void;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  currentScenario,
  onSelectScenario,
  isLiveMode,
  onToggleLiveMode,
  onSimulateLoading,
}) => {
  const scenarioKeys = [
    { key: 'NORMAL', label: '1. Normal', color: 'hover:border-emerald-500' },
    { key: 'ELEVATED', label: '2. Elevated', color: 'hover:border-amber-500' },
    { key: 'SUSPICIOUS', label: '3. Suspicious', color: 'hover:border-orange-500' },
    { key: 'PREDICTED ATTACK', label: '4. Predicted Attack', color: 'hover:border-pink-500' },
    { key: 'ATTACK', label: '5. Attack', color: 'hover:border-red-500' },
    { key: 'RECOVERY', label: '6. Recovery', color: 'hover:border-purple-500' },
  ];

  const edgeCases = [
    { key: 'EMPTY_DATASET', label: 'Empty Dataset (0 Traffic)' },
    { key: 'MISSING_FIELDS', label: 'Missing Fields Resilience' },
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <PlayCircle className="h-4 w-4 text-cyan-400" />
            <span>Interactive State & Edge-Case Test Harness</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Test all 6 World Model states, edge cases, and API fallback integration instantly:
          </p>
        </div>

        {/* Live vs Demo Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleLiveMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
              isLiveMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            <Zap className={`h-3.5 w-3.5 ${isLiveMode ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{isLiveMode ? 'Target: Live Backend API (/api)' : 'Target: Verified Demo Mode'}</span>
          </button>

          <button
            onClick={onSimulateLoading}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white flex items-center space-x-1.5 transition-all"
            title="Simulate 2-second backend model loading delay"
          >
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Test Loading Delay</span>
          </button>
        </div>
      </div>

      {/* State Switcher Buttons */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-slate-400 mr-1">States:</span>
        {scenarioKeys.map(({ key, label, color }) => {
          const isActive = currentScenario === key && !isLiveMode;
          return (
            <button
              key={key}
              onClick={() => onSelectScenario(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${color} ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          );
        })}

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        <span className="text-[11px] font-mono text-slate-400 mr-1">Resilience:</span>
        {edgeCases.map(({ key, label }) => {
          const isActive = currentScenario === key && !isLiveMode;
          return (
            <button
              key={key}
              onClick={() => onSelectScenario(key)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
