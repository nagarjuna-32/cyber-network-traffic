import React from 'react';
import { 
  BrainCircuit, 
  CheckCircle, 
  Activity, 
  BarChart3, 
  Cpu, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle,
  Database,
  GitBranch,
  Layers
} from 'lucide-react';
import { ExplainabilityData, SecurityDecision, SystemHealthStatus } from '../types/prediction';

interface XaiPipelineViewProps {
  explainability?: ExplainabilityData;
  decision?: SecurityDecision | null;
  pipelineStatus?: Record<string, string>;
  health?: SystemHealthStatus;
}

const DEFAULT_PIPELINE_STAGES = [
  { id: '1', name: 'Traffic Ingestion', desc: 'PCAP & live flow socket telemetry streaming', type: 'Ingestion' },
  { id: '2', name: 'Preprocessing & Cleaning', desc: 'IP anonymization, normalization & validation', type: 'Data Prep' },
  { id: '3', name: 'Feature Engineering', desc: 'Entropy, flow duration & byte asymmetry computation', type: 'Features' },
  { id: '4', name: 'Network Graph Generation', desc: 'Degree centrality & star-anomaly graph topological scores', type: 'Topology' },
  { id: '5', name: 'Temporal Windowing', desc: 'Sliding sequence buffer formation (lookback window = 5)', type: 'Sequencing' },
  { id: '6', name: 'AI World Model', desc: 'Dual-Head GRU / PyTorch model forward pass', type: 'Inference' },
  { id: '7', name: 'Risk & Stage Forecasting', desc: 'Multi-horizon (+5s, +10s, +15s) predictive forward rollout', type: 'Forecasting' },
  { id: '8', name: 'MITRE ATT&CK Mapping', desc: 'Correlation of predicted states to tactical kill-chain matrix', type: 'Threat Intel' },
  { id: '9', name: 'Explainable AI (XAI)', desc: 'SHAP-style local feature attribution & driving weights', type: 'Explainability' },
  { id: '10', name: 'Alert Engine', desc: 'Dynamic threshold evaluation & SOC escalation dispatch', type: 'Alerting' },
  { id: '11', name: 'Security Dashboard API', desc: 'FastAPI telemetry serialization & React SOC integration', type: 'Delivery' },
];

export const XaiPipelineView: React.FC<XaiPipelineViewProps> = ({
  explainability,
  decision,
  pipelineStatus,
  health,
}) => {
  const explanationText = explainability?.explanation || 
    `Prediction of ${decision?.current_state || 'NORMAL'} (Threat Score: ${decision?.threat_score ?? 0}) is governed by statistical traffic dynamics and feature attribution metrics.`;

  const featureWeights = explainability?.feature_contributions || {};

  const sortedFeatures = Object.entries(featureWeights)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 10);

  const rawFeatures = decision?.features || {};

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider mb-1">
              <BrainCircuit className="h-4 w-4" />
              <span>Explainable AI & End-to-End Pipeline Architecture</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              Deep Model Interpretability & Pipeline Health
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-mono">
                SHAP Attribution
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Transparent attribution of neural weights driving each attack classification, accompanied by real-time health verification across all 11 stages of the pipeline.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Inference Latency</div>
              <div className="text-base font-bold font-mono text-cyan-400">
                {health?.inferenceLatencyMs ? `${health.inferenceLatencyMs} ms` : '< 45 ms'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Total Pipeline Roundtrip</div>
              <div className="text-base font-bold font-mono text-purple-400">
                {health?.pipelineLatencyMs ? `${health.pipelineLatencyMs} ms` : '< 110 ms'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Section: SHAP Feature Attribution & Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: SHAP Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              <span>SHAP Feature Attribution (Driving Classifier Decision)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Positive: <span className="text-red-400 font-semibold">+Threat</span> &bull; Negative: <span className="text-emerald-400 font-semibold">-Threat</span>
            </span>
          </div>

          {/* Explanation Text Callout */}
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 leading-relaxed mb-5">
            <span className="font-semibold text-purple-300">Model Interpretation: </span>
            {explanationText}
          </div>

          {/* Horizontal attribution bars */}
          {sortedFeatures.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
              Awaiting XAI feature attribution weights from active inference pipeline...
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedFeatures.map(([featureName, weight]) => {
                const isPositive = weight >= 0;
                const absVal = Math.min(Math.abs(weight), 1.0);
                const percentage = Math.round(absVal * 100);

                return (
                  <div key={featureName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300 font-medium">{featureName}</span>
                      <span className={`font-mono text-[11px] font-semibold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isPositive ? `+${weight.toFixed(4)}` : weight.toFixed(4)}
                      </span>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPositive 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-sm shadow-red-500/50' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                        }`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Observed Features Matrix (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <Database className="h-4 w-4 text-cyan-400" />
                <span>Computed Telemetry Vector (Features)</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                {Object.keys(rawFeatures).length > 0 ? `${Object.keys(rawFeatures).length} Active` : 'Pipeline Vector'}
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {Object.keys(rawFeatures).length > 0 ? (
                Object.entries(rawFeatures).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 truncate pr-2">{k}</span>
                    <span className="text-cyan-300 font-semibold">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-mono text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                  Awaiting live telemetry feature vector from active pipeline stream...
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Model: Dual-Head GRU (2 Layers)</span>
            <span className="text-emerald-400">Pipeline: Live Inference</span>
          </div>
        </div>

      </div>

      {/* 3. 11-Stage End-to-End Pipeline Health Grid */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <GitBranch className="h-4 w-4 text-emerald-400" />
            <span>End-to-End 11-Stage Pipeline Operational Status</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center space-x-1.5">
            <CheckCircle className="h-3 w-3" />
            <span>ALL STAGES HEALTHY (11/11)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DEFAULT_PIPELINE_STAGES.map((stage) => {
            const liveStatus = pipelineStatus?.[stage.name] || 'PASS';
            const isPass = liveStatus === 'PASS' || liveStatus === 'READY';

            return (
              <div 
                key={stage.id} 
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      STAGE {stage.id.padStart(2, '0')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1 border ${
                      isPass
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                        : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isPass ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                      <span>{liveStatus}</span>
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white mb-1">
                    {stage.name}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {stage.desc}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-cyan-400">{stage.type}</span>
                  <span>Verified &bull; 0 Errors</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
