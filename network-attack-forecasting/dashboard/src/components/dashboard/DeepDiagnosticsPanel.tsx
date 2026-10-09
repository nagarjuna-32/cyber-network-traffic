import React from 'react';
import { CurrentPredictionResponse, ForecastResponse } from '../../types';
import { WorldModelFlow } from './WorldModelFlow';
import { AttackProgressionFlow } from '../forecasting/AttackProgressionFlow';
import { TopologicalNetworkGraph } from '../traffic/TopologicalNetworkGraph';
import { FeatureImportanceChart } from '../explanations/FeatureImportanceChart';
import { Cpu, Target, Share2, ShieldCheck, ChevronUp, Sparkles, Terminal } from 'lucide-react';

interface DeepDiagnosticsPanelProps {
  prediction?: CurrentPredictionResponse | null;
  onClose?: () => void;
}

export const DeepDiagnosticsPanel: React.FC<DeepDiagnosticsPanelProps> = ({
  prediction,
  onClose,
}) => {
  if (!prediction) return null;

  // Adapt prediction into ForecastResponse format for WorldModelFlow
  const forecastAdapt: ForecastResponse = {
    timestamp: prediction.timestamp,
    model_architecture: 'Dual-Head GRU Network State Forecaster',
    current_state: prediction.current_state,
    current_probabilities: {
      NORMAL: prediction.current_state === 'NORMAL' ? prediction.confidence : 0.05,
      ELEVATED: prediction.current_state === 'ELEVATED' ? prediction.confidence : 0.1,
      SUSPICIOUS: prediction.current_state === 'SUSPICIOUS' ? prediction.confidence : 0.15,
      ATTACK: prediction.current_state === 'ATTACK' ? prediction.confidence : 0.02,
    },
    predicted_next_state: prediction.predicted_next_state,
    confidence: prediction.confidence,
    risk_level: prediction.risk_level,
    forecast_horizon_steps: prediction.forecast?.length || 3,
    what_happens_next: {
      headline: `State projection: ${prediction.current_state} -> ${prediction.predicted_next_state}`,
      current_state: prediction.current_state,
      predicted_next_state: prediction.predicted_next_state,
      next_stage: prediction.predicted_stage || 'Adversary Progression',
      next_mitre_technique: prediction.mitre_mapping?.technique_id || 'T1595',
      next_probability: prediction.prediction_confidence || 0.75,
      next_confidence: prediction.confidence || 0.85,
      rationale: prediction.explainability?.explanation || 'Model projection based on sliding temporal sequences.',
    },
    future_states: (prediction.forecast || []).map((f) => ({
      step: `+${f.step}`,
      horizon_step: f.step,
      expected_time: prediction.timestamp,
      state: f.state,
      attack_stage: f.stage,
      stage_code: f.stage,
      probability: f.confidence,
      confidence: f.confidence,
      risk_level: f.risk_level,
      mitre_technique: prediction.mitre_mapping?.technique_id || 'T1595',
      key_evidence: [prediction.threat_type || 'Observed sequence'],
    })),
    probability_curve: (prediction.timeline || []).map((t, idx) => ({
      step: t.time,
      horizon: idx,
      probability: t.threatScore / 100,
      confidence_lower: Math.max(0, (t.threatScore - 15) / 100),
      confidence_upper: Math.min(1, (t.threatScore + 15) / 100),
    })),
    latent_state_dimension: 128,
    attributions: Object.entries(prediction.explainability?.feature_contributions || {})
      .slice(0, 6)
      .map(([feature, impact]) => ({
        feature,
        impact,
        description: `Influence score: ${(impact * 100).toFixed(0)}%`,
      })),
  };

  const mitigations = prediction.mitre_mapping?.mitigations || [
    'Apply network rate-limiting at ingress firewalls for high-frequency connection attempts.',
    'Isolate offending host sockets and inspect subsequent flow burst payloads.',
  ];

  return (
    <div className="bg-[#0b101d] border border-blue-500/30 rounded-xl p-5 shadow-lg space-y-6">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Deep AI Diagnostics & Cybersecurity Insights
            </h3>
            <p className="text-xs text-slate-400">
              Progressive disclosure inspection: Latent representations, topological graph, and kill-chain stages
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Collapse Panel</span>
          </button>
        )}
      </div>

      {/* 1. World Model Latent Space Flow */}
      <div>
        <WorldModelFlow forecast={forecastAdapt} />
      </div>

      {/* 2. Kill Chain Stage Progression */}
      <div>
        <AttackProgressionFlow
          currentStageId={
            prediction.current_stage === 'Scanning'
              ? 'RECONNAISSANCE'
              : prediction.current_stage === 'Initial Access'
              ? 'INITIAL_ACCESS'
              : prediction.current_stage === 'Lateral Movement'
              ? 'LATERAL_MOVEMENT'
              : 'RECONNAISSANCE'
          }
          predictedNextStageId={
            prediction.predicted_stage === 'Scanning'
              ? 'RECONNAISSANCE'
              : prediction.predicted_stage === 'Initial Access'
              ? 'INITIAL_ACCESS'
              : prediction.predicted_stage === 'Lateral Movement'
              ? 'LATERAL_MOVEMENT'
              : 'INITIAL_ACCESS'
          }
        />
      </div>

      {/* 3. Topological Network Graph */}
      {prediction.network_graph && (
        <div>
          <TopologicalNetworkGraph graph={prediction.network_graph} />
        </div>
      )}

      {/* 4. Feature Sensitivity & Mitigations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Weights */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-200 block mb-1">
            Top Driving Features in Current Inference
          </span>
          <p className="text-[11px] text-slate-400 mb-3">
            Local SHAP / sensitivity attribution scores computed by the neural world model
          </p>
          <div className="space-y-2">
            {Object.entries(prediction.explainability?.feature_contributions || {})
              .slice(0, 5)
              .map(([feat, val], i) => (
                <div key={i} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{feat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(10, val * 100))}%` }}
                      />
                    </div>
                    <span className="text-blue-400 font-bold w-12 text-right">
                      {(val * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recommended Mitigation Playbook */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Recommended SOC Containment Playbook</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Actionable mitigation guidance aligned with MITRE technique{' '}
              <span className="font-mono text-purple-400">{prediction.mitre_mapping?.technique_id}</span>
            </p>
            <ul className="space-y-2 text-xs text-slate-200">
              {mitigations.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                  <span className="leading-relaxed">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
