import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { predictionApi } from '../services/predictionApi';
import { trafficApi } from '../services/trafficApi';
import { threatApi } from '../services/threatApi';
import { NetworkSecurityOverview } from '../components/dashboard/NetworkSecurityOverview';
import { EssentialMetricCards } from '../components/dashboard/EssentialMetricCards';
import { AttackForecastChart } from '../components/dashboard/AttackForecastChart';
import { RecentAlertsTable } from '../components/dashboard/RecentAlertsTable';
import { TrafficSummaryChart } from '../components/dashboard/TrafficSummaryChart';
import { TriadStatusBanner } from '../components/common/TriadStatusBanner';
import { DeepDiagnosticsPanel } from '../components/dashboard/DeepDiagnosticsPanel';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton';
import { ThreatDetailPanel } from '../components/threats/ThreatDetailPanel';
import { Threat, Alert } from '../types';
import { Cpu, ChevronDown, ChevronUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [showDeepDiagnostics, setShowDeepDiagnostics] = useState<boolean>(false);

  // 1. Fetch current prediction & security state from real backend
  const { data: prediction, isLoading: loadingPrediction } = usePolling(
    () => predictionApi.getCurrentPrediction(),
    8000
  );

  // 2. Fetch traffic metrics
  const { data: trafficStats, isLoading: loadingTraffic } = usePolling(
    () => trafficApi.getTrafficStats('15m'),
    8000
  );

  // 3. Fetch security alerts
  const { data: alerts, isLoading: loadingAlerts } = usePolling(
    () => threatApi.getAlerts(),
    8000
  );

  // Derive metrics safely from actual backend data
  const currentState = prediction?.current_state || 'NORMAL';
  const threatLevel = prediction?.risk_level || 'LOW';
  const threatScore = prediction?.threat_score ?? 0;
  const predictedNextState = prediction?.predicted_next_state || 'NORMAL';
  const forecastHorizon = prediction?.forecast?.length || 3;
  const explanation = prediction?.explainability?.explanation;
  const predictionConfidence = prediction?.prediction_confidence;
  const forecastSteps = prediction?.forecast || [];
  const timeline = prediction?.timeline || [];

  const packetsPerSec = trafficStats?.summary?.packets_per_sec ?? 25;
  const bytesPerSec = trafficStats?.summary?.bytes_per_sec ?? 18750;
  const activeAlertCount = alerts?.filter((a) => a.status !== 'Resolved' && a.status !== 'Mitigated').length ?? 0;

  // Genuine attack probability based on backend state
  const attackProbability =
    currentState === 'ATTACK'
      ? predictionConfidence ?? 0.95
      : currentState === 'SUSPICIOUS'
      ? predictionConfidence ?? 0.75
      : currentState === 'ELEVATED'
      ? predictionConfidence ?? 0.45
      : 0.12;

  // Triad guidance strings
  const whatIsHappeningText =
    currentState === 'ATTACK'
      ? `Active attack detected (${prediction?.threat_type || 'Intrusion'}). Volumetric anomalies exceed safety thresholds.`
      : currentState === 'SUSPICIOUS' || currentState === 'ELEVATED'
      ? `Elevated reconnaissance or anomalous flow burst detected. Connection frequency is heightened.`
      : 'Network traffic is operating within baseline bounds. No anomalous precursors observed.';

  const whatMayHappenNextText =
    predictedNextState === 'ATTACK'
      ? `AI model projects attack escalation within ${forecastHorizon} observation steps.`
      : predictedNextState === 'SUSPICIOUS' || predictedNextState === 'ELEVATED'
      ? `AI model forecasts potential transition to ${predictedNextState} within ${forecastHorizon} steps.`
      : `Network security state is predicted to remain stable (${predictedNextState}) over next ${forecastHorizon} steps.`;

  const recommendedActionText =
    currentState === 'ATTACK'
      ? 'Execute containment: Apply immediate firewall rate-limiting and isolate anomalous destination sockets.'
      : currentState === 'SUSPICIOUS' || currentState === 'ELEVATED'
      ? 'Increase monitoring: Inspect top source IPs, verify authentication logs, and prepare edge filtering rules.'
      : 'Maintain surveillance: Routine telemetry monitoring. No active mitigations required.';

  return (
    <div className="space-y-6">
      {/* 1. Main Threat Summary: Answers the 3 Core SOC Questions */}
      {loadingPrediction && !prediction ? (
        <CardSkeleton />
      ) : (
        <NetworkSecurityOverview
          currentState={currentState}
          threatLevel={threatLevel}
          predictedNextState={predictedNextState}
          forecastHorizon={forecastHorizon}
          explanation={explanation}
          predictionConfidence={predictionConfidence}
          forecastSteps={forecastSteps}
        />
      )}

      {/* 2. Action Triad: What is happening, What may happen next, Recommended action */}
      <TriadStatusBanner
        whatIsHappening={whatIsHappeningText}
        whatMayHappenNext={whatMayHappenNextText}
        recommendedAction={recommendedActionText}
        currentState={currentState}
        predictedNextState={predictedNextState}
        severity={threatLevel}
      />

      {/* 3. Four Essential Metric Cards */}
      {loadingTraffic && !trafficStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <EssentialMetricCards
          packetsPerSec={packetsPerSec}
          bytesPerSec={bytesPerSec}
          threatLevel={threatLevel}
          threatScore={threatScore}
          activeAlertCount={activeAlertCount}
          attackProbability={attackProbability}
        />
      )}

      {/* 4. Attack Forecast ("What Happens Next?") & Traffic Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          {loadingPrediction && !prediction ? (
            <ChartSkeleton />
          ) : (
            <AttackForecastChart
              currentState={currentState}
              forecastSteps={forecastSteps}
              timeline={timeline}
              explanation={
                currentState === 'NORMAL'
                  ? 'Network state is forecasted to remain stable with low threat activity.'
                  : `Model anticipates persistent ${predictedNextState || 'elevated'} traffic activity across upcoming steps.`
              }
            />
          )}
        </div>

        <div className="lg:col-span-5">
          {loadingTraffic && !trafficStats ? (
            <ChartSkeleton />
          ) : (
            <TrafficSummaryChart timeline={trafficStats?.timeline} />
          )}
        </div>
      </div>

      {/* 5. Progressive Disclosure Toggle for Advanced AI Diagnostics */}
      <div className="flex justify-between items-center pt-1">
        <span className="text-xs text-slate-400">
          Need in-depth neural telemetry or MITRE technique details?
        </span>
        <button
          onClick={() => setShowDeepDiagnostics(!showDeepDiagnostics)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-blue-400 hover:text-blue-300 hover:border-slate-700 transition-colors font-medium shadow-sm"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>{showDeepDiagnostics ? 'Hide Advanced AI Diagnostics' : 'Inspect Deep AI & Cybersecurity Diagnostics'}</span>
          {showDeepDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 6. Advanced Diagnostics Panel (Progressive Disclosure) */}
      {showDeepDiagnostics && (
        <DeepDiagnosticsPanel
          prediction={prediction}
          onClose={() => setShowDeepDiagnostics(false)}
        />
      )}

      {/* 7. Recent Security Alerts */}
      <RecentAlertsTable
        alerts={alerts || []}
        onSelectAlert={(a) => {
          setSelectedThreat({
            id: a.id,
            timestamp: a.timestamp,
            source_ip: a.source_ip,
            destination_ip: a.destination_ip,
            source_port: 0,
            destination_port: 0,
            protocol: 'TCP',
            threat_type: a.threat_type || a.title,
            severity: a.severity,
            confidence: a.confidence,
            status: a.status,
            state: a.current_state,
            mitre_technique: a.mitre_id || 'T1595',
            evidence: {
              packet_rate: 0,
              byte_rate: 0,
              packet_count: 0,
              byte_count: 0,
              flow_duration: 0,
              inter_arrival_time: 0,
              connection_frequency: 0,
              entropy: 0,
            },
            explanation: a.title,
          });
        }}
      />

      {/* Slide-out Threat Detail Panel if an alert is selected */}
      <ThreatDetailPanel
        threat={selectedThreat}
        onClose={() => setSelectedThreat(null)}
      />
    </div>
  );
};
