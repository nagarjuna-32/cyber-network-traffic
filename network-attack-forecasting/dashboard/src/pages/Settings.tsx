import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { API_BASE_URL } from '../services/api';
import { predictionApi, HealthResponse } from '../services/predictionApi';
import { Settings as SettingsIcon, CheckCircle, Server, Cpu, RefreshCw, Layers } from 'lucide-react';

export const Settings: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const [saved, setSaved] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);

  const fetchStatus = async () => {
    try {
      const h = await predictionApi.getHealth();
      setHealthStatus(h);
    } catch {
      setHealthStatus(null);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    await fetchStatus();
    setTestingConnection(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.localStorage) {
      if (apiUrl.trim()) {
        window.localStorage.setItem('NETSCOPE_API_URL', apiUrl.trim());
      } else {
        window.localStorage.removeItem('NETSCOPE_API_URL');
      }
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.reload();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800/80">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-400" />
          Platform Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          API connection endpoints, detection thresholds, and AI model specifications
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: API Connection */}
        <Card
          title="API Connection & Backend"
          subtitle="Configure the FastAPI inference service endpoint"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[11px] font-medium">
                Backend API Base URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://127.0.0.1:8000 (Default uses /api proxy)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>Test</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Local development routes through the Vite proxy (target: http://localhost:8000).
              </span>
            </div>

            {/* Connection Status Banner */}
            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400 font-sans">Status:</span>
                <span className={healthStatus?.isBackendConnected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {healthStatus?.isBackendConnected ? 'Connected & Operational' : 'Disconnected'}
                </span>
              </div>

              {healthStatus && (
                <div className="flex items-center gap-4 text-slate-400">
                  <span>Inference: <strong className="text-slate-200">{healthStatus.inferenceLatencyMs}ms</strong></span>
                  <span>Pipeline: <strong className="text-slate-200">{healthStatus.pipelineLatencyMs}ms</strong></span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Section 2: AI Model Specifications */}
        <Card
          title="AI Model Architecture"
          subtitle="World model specifications running on the FastAPI backend"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-1">Architecture</span>
              <span className="text-slate-100 font-medium font-mono">PyTorch GRU Dual-Head</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Simultaneously classifies current state (Head A) and forecasts next transition (Head B).
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-1">Sequence Window</span>
              <span className="text-slate-100 font-medium font-mono">20 Time Steps (W=20)</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Sliding sequence history capturing chronological traffic burst dynamics.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-1">Features Analyzed</span>
              <span className="text-slate-100 font-medium font-mono">7 Temporal Features</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Packet rate, byte rate, connection frequency, duration, packet count, SYN/ACK ratio.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] mb-1">Forecasting Horizon</span>
              <span className="text-slate-100 font-medium font-mono">K = 3 to 10 Steps Ahead</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Controlled horizon state projection with calibrated uncertainty decay.
              </p>
            </div>
          </div>
        </Card>

        {/* Section 3: Detection & Alert Sensitivity */}
        <Card
          title="Alert Thresholds"
          subtitle="Calibrate notification triggers for early warnings"
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-slate-200 font-medium block">Early Warning Trigger Threshold</span>
                <span className="text-slate-400 text-[11px]">
                  Minimum forecast attack probability required to dispatch proactive early warnings.
                </span>
              </div>
              <select className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none self-start sm:self-auto">
                <option value="0.7">70% Probability (Balanced)</option>
                <option value="0.8">80% Probability (High Precision)</option>
                <option value="0.6">60% Probability (Maximum Lead Time)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4" />
              Settings saved successfully!
            </span>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
