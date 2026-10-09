import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { forecastApi } from '../services/forecastApi';
import { predictionApi } from '../services/predictionApi';
import { ForecastTimeline } from '../components/forecasting/ForecastTimeline';
import { AttackProbabilityGraph } from '../components/forecasting/AttackProbabilityGraph';
import { FeatureImportanceChart } from '../components/explanations/FeatureImportanceChart';
import { WorldModelFlow } from '../components/dashboard/WorldModelFlow';
import { AttackProgressionFlow } from '../components/forecasting/AttackProgressionFlow';
import { TriadStatusBanner } from '../components/common/TriadStatusBanner';
import { Card } from '../components/common/Card';
import { ChartSkeleton, CardSkeleton } from '../components/common/Skeleton';
import {
  TrendingUp,
  Clock,
  Info,
  Shield,
  CheckCircle2,
  Cpu,
  Crosshair,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AttackForecast: React.FC = () => {
  const [horizon, setHorizon] = useState<number>(5);
  const [showModelInternals, setShowModelInternals] = useState<boolean>(false);

  const { data: forecast, isLoading } = usePolling(
    () => forecastApi.getForecast(horizon),
    10000
  );

  const { data: prediction } = usePolling(
    () => predictionApi.getCurrentPrediction(),
    10000
  );

  const currentState = forecast?.current_state || 'NORMAL';
  const predictedNextState = forecast?.predicted_next_state || 'NORMAL';

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Attack Forecast
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Predicting multi-step network state transitions and potential threat escalation
          </p>
        </div>

        {/* Source Badge & Horizon Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">Live Model Prediction</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 px-2">Look-Ahead:</span>
            {[3, 5, 8].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  horizon === h
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                +{h} Steps
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Triad Banner: What is happening, What may happen next, Recommended action */}
      <TriadStatusBanner
        whatIsHappening={
          currentState === 'ATTACK'
            ? 'Active attack state detected. Immediate containment actions are required.'
            : currentState === 'SUSPICIOUS' || currentState === 'ELEVATED'
            ? 'Elevated connection bursts detected. Network activity is exhibiting anomalous pre-attack dynamics.'
            : 'Current observation window exhibits stable normal traffic with low transition probability.'
        }
        whatMayHappenNext={
          predictedNextState === 'ATTACK'
            ? `Forecasting engine predicts transition to full ATTACK within ${horizon} observation steps.`
            : `Next state projected as ${predictedNextState}. Probability curve indicates manageable risk.`
        }
        recommendedAction={
          currentState === 'ATTACK'
            ? 'Execute emergency network isolation rules and inspect affected destination IPs.'
            : currentState === 'SUSPICIOUS' || currentState === 'ELEVATED'
            ? 'Preemptively inspect high-frequency socket handshakes and enable aggressive TCP rate-limiting.'
            : 'Continue passive world-model forecasting. No intervention necessary.'
        }
        currentState={currentState}
        predictedNextState={predictedNextState}
        severity={forecast?.risk_level || 'LOW'}
      />

      {/* Overview Explanation Card */}
      {forecast ? (
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                Forecast Summary
              </span>
              <div className="text-base font-bold text-white mt-1">
                {forecast.current_state === 'NORMAL' && forecast.predicted_next_state === 'NORMAL'
                  ? 'Stable Network Activity Forecasted'
                  : `Escalation Risk Detected: Transition from ${forecast.current_state} to ${forecast.predicted_next_state}`}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Projected Risk: </span>
                <span
                  className={`font-semibold ${
                    forecast.risk_level === 'CRITICAL'
                      ? 'text-rose-400'
                      : forecast.risk_level === 'HIGH'
                      ? 'text-orange-400'
                      : forecast.risk_level === 'MEDIUM'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {forecast.risk_level}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Confidence: </span>
                <span className="text-emerald-400 font-semibold font-mono">
                  {Math.round(forecast.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            {forecast.what_happens_next?.rationale ||
              `The AI world model predicts network activity across a ${horizon}-step horizon. Based on flow arrival rates and connection patterns, the security state is projected with calibrated uncertainty.`}
          </p>
        </div>
      ) : (
        <CardSkeleton />
      )}

      {/* 1. Multi-Step State Horizon Timeline (+1 to +K) */}
      <Card
        title="Predicted State Trajectory"
        subtitle={`Anticipated state and security stage across next ${horizon} observation steps`}
      >
        {isLoading || !forecast ? (
          <ChartSkeleton />
        ) : (
          <ForecastTimeline
            currentState={forecast.current_state}
            futureStates={forecast.future_states}
          />
        )}
      </Card>

      {/* 2. Attack Probability Curve Graph */}
      <Card
        title="Escalation Probability Over Time"
        subtitle="Statistical trajectory of threat likelihood across the forecast horizon"
      >
        {isLoading || !forecast ? (
          <ChartSkeleton />
        ) : (
          <AttackProbabilityGraph data={forecast.probability_curve} />
        )}
      </Card>

      {/* Progressive Disclosure Toggle for Model Latent Space & Kill Chain */}
      <div className="flex justify-between items-center pt-1">
        <span className="text-xs text-slate-400">
          Want to inspect the 128-dimension GRU latent state dynamics and kill-chain stages?
        </span>
        <button
          onClick={() => setShowModelInternals(!showModelInternals)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-blue-400 hover:text-blue-300 hover:border-slate-700 transition-colors font-medium shadow-sm"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>{showModelInternals ? 'Hide World Model Internals' : 'Inspect World Model Internals & Kill Chain'}</span>
          {showModelInternals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Progressive Disclosure Content: WorldModelFlow & Kill Chain */}
      {showModelInternals && (
        <div className="space-y-6">
          <WorldModelFlow forecast={forecast || undefined} />

          <AttackProgressionFlow
            currentStageId={
              forecast?.what_happens_next?.current_state === 'ATTACK'
                ? 'LATERAL_MOVEMENT'
                : forecast?.what_happens_next?.current_state === 'SUSPICIOUS'
                ? 'INITIAL_ACCESS'
                : 'RECONNAISSANCE'
            }
            predictedNextStageId={
              forecast?.what_happens_next?.predicted_next_state === 'ATTACK'
                ? 'IMPACT'
                : forecast?.what_happens_next?.predicted_next_state === 'SUSPICIOUS'
                ? 'INITIAL_ACCESS'
                : 'RECONNAISSANCE'
            }
          />
        </div>
      )}

      {/* 3. Feature Importance Attribution */}
      {forecast?.attributions && forecast.attributions.length > 0 && (
        <Card
          title="Traffic Indicators Driving This Forecast"
          subtitle="Relative contribution of network traffic features to the model's prediction"
        >
          <FeatureImportanceChart
            features={forecast.attributions.map((a) => ({
              feature: a.feature,
              importance: a.impact,
              direction: a.impact >= 0 ? 'Positive' : 'Negative',
              description: a.description,
            }))}
            rationale={forecast.what_happens_next?.rationale}
          />
        </Card>
      )}
    </div>
  );
};
