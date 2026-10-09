import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { threatApi } from '../services/threatApi';
import { predictionApi } from '../services/predictionApi';
import { modelApi } from '../services/modelApi';
import { ThreatTable } from '../components/threats/ThreatTable';
import { ThreatDetailPanel } from '../components/threats/ThreatDetailPanel';
import { MitreHeatmap } from '../components/mitre/MitreHeatmap';
import { AttackProgressionFlow } from '../components/forecasting/AttackProgressionFlow';
import { TriadStatusBanner } from '../components/common/TriadStatusBanner';
import { Card } from '../components/common/Card';
import { StateBadge, SeverityBadge } from '../components/common/Badge';
import { Threat } from '../types';
import { TableSkeleton, CardSkeleton } from '../components/common/Skeleton';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  Crosshair,
} from 'lucide-react';

export const ThreatDetection: React.FC = () => {
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [showMitreCatalog, setShowMitreCatalog] = useState(false);
  const [showKillChain, setShowKillChain] = useState(false);

  const { data: threats, isLoading: loadingThreats } = usePolling(
    () => threatApi.getThreats(undefined, undefined, 50),
    8000
  );

  const { data: mitreData } = usePolling(
    () => modelApi.getMitreMapping(),
    15000
  );

  const { data: prediction } = usePolling(
    () => predictionApi.getCurrentPrediction(),
    8000
  );

  const criticalCount = threats?.filter((t) => t.severity === 'CRITICAL').length || 0;
  const highCount = threats?.filter((t) => t.severity === 'HIGH').length || 0;
  const activeCount = threats?.filter((t) => t.status === 'Active').length || 0;

  const currentState = prediction?.current_state || 'NORMAL';
  const predictedNextState = prediction?.predicted_next_state || 'NORMAL';

  return (
    <div className="space-y-6">
      {/* Page Title & Progressive Disclosure Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Threat Detection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detected network anomalies, suspicious activity, and threat explanations
          </p>
        </div>

        {/* Toggles for Advanced Frameworks */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowKillChain(!showKillChain)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            <span>{showKillChain ? 'Hide Kill Chain' : 'Adversary Kill Chain'}</span>
            {showKillChain ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowMitreCatalog(!showMitreCatalog)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span>{showMitreCatalog ? 'Hide MITRE Matrix' : 'MITRE ATT&CK'}</span>
            {showMitreCatalog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Triad Banner: What is happening, What may happen next, Recommended action */}
      <TriadStatusBanner
        whatIsHappening={
          criticalCount > 0
            ? `${criticalCount} critical security incidents actively detected on internal subnets.`
            : highCount > 0
            ? `${highCount} high-risk anomaly vectors currently flagged for investigation.`
            : 'All analyzed flow records reflect normal operating traffic with no critical threat indicators.'
        }
        whatMayHappenNext={
          predictedNextState === 'ATTACK'
            ? `AI model anticipates potential lateral spread or denial of service within ${prediction?.forecast?.length || 3} intervals.`
            : `Projected transition to ${predictedNextState}; connection activity remains contained.`
        }
        recommendedAction={
          criticalCount > 0
            ? 'Execute emergency quarantine: Isolate affected endpoints and block high-volume ports.'
            : highCount > 0
            ? 'Review flagged flows in the table below and verify host authentication credentials.'
            : 'Maintain standard perimeter monitoring. No immediate SOC intervention required.'
        }
        currentState={currentState}
        predictedNextState={predictedNextState}
        severity={criticalCount > 0 ? 'CRITICAL' : highCount > 0 ? 'HIGH' : 'LOW'}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-slate-800/90 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Critical Threats
            </span>
            <div className="text-2xl font-bold font-mono text-rose-400">{criticalCount}</div>
            <span className="text-[11px] text-slate-400">Immediate containment required</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-rose-400/30" />
        </div>

        <div className="bg-[#0f172a] border border-slate-800/90 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              High Risk Anomaly Vectors
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400">{highCount}</div>
            <span className="text-[11px] text-slate-400">Under SOC investigation</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-400/30" />
        </div>

        <div className="bg-[#0f172a] border border-slate-800/90 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Active Security Incidents
            </span>
            <div className="text-2xl font-bold font-mono text-blue-400">{activeCount}</div>
            <span className="text-[11px] text-slate-400">Monitored connections</span>
          </div>
          <ShieldCheck className="w-8 h-8 text-blue-400/30" />
        </div>
      </div>

      {/* Distinction Banner: Detected Threats vs Predicted Threats */}
      {prediction && (
        <div className="bg-[#0f172a] border border-blue-500/25 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-white tracking-wide uppercase">
                  Detected Threats vs. Predicted Threats
                </span>
                <span className="text-[11px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Forecast Next State: {prediction.predicted_next_state}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Detected Threats</strong> represent malicious patterns confirmed in observed telemetry. In contrast,{' '}
                <strong className="text-blue-300">Predicted Threats</strong> represent the AI world model’s statistical projection of where the adversary may move next (Threat Score: {prediction.threat_score}/100, Stage: {prediction.predicted_stage || 'Baseline'}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Kill Chain Section (Progressive Disclosure) */}
      {showKillChain && (
        <AttackProgressionFlow
          currentStageId={
            prediction?.current_stage === 'Scanning'
              ? 'RECONNAISSANCE'
              : prediction?.current_stage === 'Initial Access'
              ? 'INITIAL_ACCESS'
              : prediction?.current_stage === 'Lateral Movement'
              ? 'LATERAL_MOVEMENT'
              : 'RECONNAISSANCE'
          }
          predictedNextStageId={
            prediction?.predicted_stage === 'Scanning'
              ? 'RECONNAISSANCE'
              : prediction?.predicted_stage === 'Initial Access'
              ? 'INITIAL_ACCESS'
              : prediction?.predicted_stage === 'Lateral Movement'
              ? 'LATERAL_MOVEMENT'
              : 'INITIAL_ACCESS'
          }
        />
      )}

      {/* Expandable MITRE ATT&CK Matrix Section (Progressive Disclosure) */}
      {showMitreCatalog && (
        <Card
          title="MITRE ATT&CK Enterprise Technique Matrix"
          subtitle="Enterprise tactic catalog mapped to observed threat precursors"
        >
          <MitreHeatmap matrix={mitreData?.matrix || []} />
        </Card>
      )}

      {/* Main Detected Threats Table */}
      <Card
        title="Detected Threats & Evidence"
        subtitle="Active anomalies identified by the detection engine with root-cause indicators"
      >
        {loadingThreats || !threats ? (
          <TableSkeleton rows={6} />
        ) : (
          <ThreatTable
            threats={threats}
            onSelectThreat={(t) => setSelectedThreat(t)}
          />
        )}
      </Card>

      {/* Slide-out Threat Detail Panel */}
      <ThreatDetailPanel
        threat={selectedThreat}
        onClose={() => setSelectedThreat(null)}
      />
    </div>
  );
};
