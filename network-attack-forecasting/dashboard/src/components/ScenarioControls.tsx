import React, { useState } from 'react';
import { PlayCircle, Database, HelpCircle, AlertTriangle, Layers, Clock, Zap, Code, RefreshCw } from 'lucide-react';

interface ScenarioControlsProps {
  currentScenario: string;
  onSelectScenario: (key: string) => void;
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
  onSimulateLoading: () => void;
  onApplyCustomJson?: (jsonString: string) => void;
  isPolling?: boolean;
  onTogglePolling?: () => void;
  onOpenDatabaseModal?: (tab?: 'input' | 'config' | 'table') => void;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  currentScenario,
  onSelectScenario,
  isLiveMode,
  onToggleLiveMode,
  onSimulateLoading,
  onApplyCustomJson,
  isPolling,
  onTogglePolling,
  onOpenDatabaseModal,
}) => {
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [customJsonText, setCustomJsonText] = useState<string>(`{
  "timestamp": "${new Date().toISOString()}",
  "current_state": "SUSPICIOUS",
  "current_stage": "Command and Control",
  "threat_type": "Encrypted C2 Beaconing (T1071)",
  "threat_score": 74,
  "risk_level": "HIGH",
  "confidence": 0.92,
  "predicted_next_state": "PREDICTED ATTACK",
  "predicted_stage": "Lateral Movement",
  "prediction_confidence": 0.88,
  "evidence": [
    "Periodic low-jitter outbound TCP beaconing at 45s intervals",
    "Destination port entropy elevated (4.31 vs 0.85 nominal)"
  ]
}`);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const sampleInputs = [
    { key: 'NORMAL', label: '1. Normal Baseline', color: 'hover:border-emerald-500' },
    { key: 'ELEVATED', label: '2. Port Scan (Elevated)', color: 'hover:border-amber-500' },
    { key: 'SUSPICIOUS', label: '3. C2 Beacon (Suspicious)', color: 'hover:border-orange-500' },
    { key: 'PREDICTED ATTACK', label: '4. Imminent Attack (Predicted)', color: 'hover:border-pink-500' },
    { key: 'ATTACK', label: '5. Volumetric DDoS (Attack)', color: 'hover:border-red-500' },
    { key: 'RECOVERY', label: '6. Containment (Recovery)', color: 'hover:border-purple-500' },
  ];

  const edgeCases = [
    { key: 'EMPTY_DATASET', label: 'Empty Dataset (0 Traffic)' },
    { key: 'MISSING_FIELDS', label: 'Missing Fields Resilience' },
  ];

  const handleApplyCustom = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(customJsonText);
      if (!parsed.current_state) {
        throw new Error('Missing "current_state" field');
      }
      if (onApplyCustomJson) {
        onApplyCustomJson(customJsonText);
      }
      setShowJsonModal(false);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <PlayCircle className="h-4 w-4 text-cyan-400" />
            <span>Sample Input Presets & Live Controls</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Select verified sample inputs or enable live tracking to test temporal state forecasting:
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Streaming Toggle */}
          {onTogglePolling && (
            <button
              onClick={onTogglePolling}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border flex items-center space-x-1.5 transition-all ${
                isPolling
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-500/20 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${isPolling ? 'animate-pulse text-cyan-400' : 'text-slate-400'}`} />
              <span>{isPolling ? 'Live Stream: Active' : 'Live Stream: Paused'}</span>
            </button>
          )}

          {/* Backend vs Demo Mode */}
          <button
            onClick={onToggleLiveMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
              isLiveMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            <Database className={`h-3.5 w-3.5 ${isLiveMode ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{isLiveMode ? 'Target: Backend (/api)' : 'Target: Sample Input Mode'}</span>
          </button>

          {/* Fill Database Input Button */}
          {onOpenDatabaseModal && (
            <button
              onClick={() => onOpenDatabaseModal('input')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-cyan-950/60 text-cyan-200 border border-cyan-500/60 hover:bg-cyan-900/80 hover:text-white flex items-center space-x-1.5 transition-all shadow-sm shadow-cyan-500/20 font-mono font-semibold"
              title="Open form to fill and inject database records directly into the pipeline"
            >
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Fill Database Input</span>
            </button>
          )}

          {/* Custom JSON Sample Input */}
          <button
            onClick={() => setShowJsonModal(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white flex items-center space-x-1.5 transition-all"
            title="Inspect or load custom sample input JSON"
          >
            <Code className="h-3.5 w-3.5 text-cyan-400" />
            <span>Custom Sample JSON</span>
          </button>

          {/* Test 2s Loading Delay */}
          <button
            onClick={onSimulateLoading}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white flex items-center space-x-1.5 transition-all"
            title="Simulate backend model loading delay"
          >
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Test Delay</span>
          </button>
        </div>
      </div>

      {/* Sample Input Buttons */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-slate-400 mr-1">Sample Inputs:</span>
        {sampleInputs.map(({ key, label, color }) => {
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

      {/* Custom Sample JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Custom Sample Input JSON (Shreenisha Contract)</h4>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste or modify any valid standardized prediction JSON payload to test the dashboard live:
            </p>

            <textarea
              value={customJsonText}
              onChange={(e) => setCustomJsonText(e.target.value)}
              className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
            />

            {jsonError && (
              <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 p-2 rounded-lg">
                JSON Syntax Error: {jsonError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustom}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              >
                Apply Sample Payload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
