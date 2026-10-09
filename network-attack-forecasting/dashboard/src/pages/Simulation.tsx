import React, { useState, useEffect, useRef } from 'react';
import { simulationApi } from '../services/simulationApi';
import { predictionApi } from '../services/predictionApi';
import { SimulationScenario, SimulationRunResult, CurrentPredictionResponse } from '../types';
import { SimulationStepViewer } from '../components/simulation/SimulationStepViewer';
import { TriadStatusBanner } from '../components/common/TriadStatusBanner';
import { Card } from '../components/common/Card';
import { StateBadge, SeverityBadge } from '../components/common/Badge';
import {
  PlayCircle,
  FlaskConical,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'lucide-react';

const SCENARIO_DESCRIPTIONS: Record<string, { label: string; desc: string; icon: string }> = {
  normal: {
    label: 'Normal Operations',
    desc: 'Benign baseline traffic with standard web, SSH, and DNS query flows.',
    icon: 'ShieldCheck',
  },
  scanning: {
    label: 'Port & Network Scanning',
    desc: 'Sequential host and port sweeps characteristic of adversary reconnaissance.',
    icon: 'Radio',
  },
  syn_flood: {
    label: 'TCP SYN Flood',
    desc: 'Asymmetric flood of half-open TCP SYN connection handshakes.',
    icon: 'Activity',
  },
  ddos: {
    label: 'Distributed Denial of Service',
    desc: 'Volumetric packet flood overwhelming target network throughput.',
    icon: 'ShieldAlert',
  },
  beaconing: {
    label: 'C2 Command & Control Beaconing',
    desc: 'Periodic covert outbound beacon signals communicating with external servers.',
    icon: 'Target',
  },
  udp_attack: {
    label: 'UDP Flood Attack',
    desc: 'High-frequency UDP datagram flood aimed at socket exhaustion.',
    icon: 'Zap',
  },
  mixed: {
    label: 'Multi-Stage Intrusion',
    desc: 'Progressive multi-phase attack: Reconnaissance → Exploit → C2 → Impact.',
    icon: 'AlertTriangle',
  },
  recovery: {
    label: 'Post-Attack Recovery',
    desc: 'Traffic volume tapering down to baseline after containment playbook execution.',
    icon: 'CheckCircle',
  },
};

export const Simulation: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState('scanning');
  const [isExecuting, setIsExecuting] = useState(false);
  const [simResult, setSimResult] = useState<SimulationRunResult | null>(null);
  const [pipelineOutcome, setPipelineOutcome] = useState<CurrentPredictionResponse | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStepViewer, setShowStepViewer] = useState(true);
  const timerRef = useRef<number | null>(null);

  // Run simulation against backend
  const handleRunSimulation = async (scenarioToRun: string = selectedScenario) => {
    setIsExecuting(true);
    setIsPlaying(false);
    try {
      // 1. Run full 11-stage pipeline on backend
      const outcome = await predictionApi.simulateScenario(scenarioToRun);
      setPipelineOutcome(outcome);

      // 2. Fetch step sequence for interactive playback
      const stepsResult = await simulationApi.runSimulation(scenarioToRun, 25, 1000);
      setSimResult(stepsResult);
      setCurrentStepIndex(0);
    } catch (err) {
      console.error('Simulation run failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    handleRunSimulation('scanning');
  }, []);

  // Playback timer
  useEffect(() => {
    if (isPlaying && simResult) {
      timerRef.current = window.setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= simResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simResult]);

  const activeLabel = SCENARIO_DESCRIPTIONS[selectedScenario]?.label || selectedScenario;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-400" />
            Attack Simulations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test and validate how the AI model anticipates known threat scenarios
          </p>
        </div>

        <button
          onClick={() => handleRunSimulation(selectedScenario)}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* Prominent Simulation Environment Notice */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
            Synthetic Simulation Environment
          </h3>
          <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
            The data and predictions in this section are generated from synthetic attack scenarios for testing and demonstration purposes. They do not represent live production network attacks.
          </p>
        </div>
      </div>

      {/* Triad Banner: What is happening, What may happen next, Recommended action */}
      {pipelineOutcome && (
        <TriadStatusBanner
          whatIsHappening={`Simulating scenario: '${activeLabel}'. Model evaluated current state as ${pipelineOutcome.current_state} (Score: ${pipelineOutcome.threat_score}/100).`}
          whatMayHappenNext={`Adversary progression projected to transition toward '${pipelineOutcome.predicted_next_state}' with ${Math.round((pipelineOutcome.prediction_confidence || 0.8) * 100)}% model probability.`}
          recommendedAction={
            pipelineOutcome.mitre_mapping?.mitigations?.[0] ||
            'Verify automated containment playbook rules to prevent lateral movement.'
          }
          currentState={pipelineOutcome.current_state}
          predictedNextState={pipelineOutcome.predicted_next_state}
          severity={pipelineOutcome.risk_level}
        />
      )}

      {/* Clean Scenario Selector (8 scenarios) */}
      <Card
        title="Select Scenario"
        subtitle="Choose an attack vector to evaluate how the temporal model projects future steps"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(SCENARIO_DESCRIPTIONS).map(([key, meta]) => {
            const isSelected = selectedScenario === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedScenario(key);
                  handleRunSimulation(key);
                }}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
                    {meta.label}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                  {meta.desc}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Simulation Results Banner */}
      {pipelineOutcome && (
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                Simulation Execution Result
              </span>
              <div className="text-lg font-bold text-white mt-1 flex items-center gap-3">
                <span>Model Output:</span>
                <StateBadge state={pipelineOutcome.current_state} />
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-normal text-slate-300">
                  Predicted Next: <strong className="text-white">{pipelineOutcome.predicted_next_state}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Threat Score: </span>
                <span className="text-white font-mono font-bold">
                  {pipelineOutcome.threat_score} / 100
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Risk Level: </span>
                <span className="font-semibold text-amber-400">
                  {pipelineOutcome.risk_level}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <strong className="text-slate-100 font-medium">Analysis: </strong>
            {pipelineOutcome.explainability?.explanation ||
              `Scenario executed successfully across 25 sequential time steps with an inference latency of ${pipelineOutcome.inferenceLatencyMs}ms.`}
          </div>
        </div>
      )}

      {/* Progressive Disclosure Toggle for Step Sequence Viewer */}
      {simResult && simResult.steps.length > 0 && (
        <div className="flex justify-between items-center pt-1">
          <span className="text-xs text-slate-400">
            Detailed step-by-step playback with packet-level inspection:
          </span>
          <button
            onClick={() => setShowStepViewer(!showStepViewer)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-blue-400 hover:text-blue-300 hover:border-slate-700 transition-colors font-medium shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>{showStepViewer ? 'Hide Step Inspector' : 'Show Step Inspector'}</span>
            {showStepViewer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Step Sequence Viewer & Playback Controls */}
      {showStepViewer && simResult && simResult.steps.length > 0 && (
        <Card
          title="Sequential Step-by-Step Playback"
          subtitle={`Flow sequence for '${selectedScenario}' showing model state evolution`}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(0);
                }}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset to Step 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        >
          <SimulationStepViewer
            steps={simResult.steps}
            currentStepIndex={currentStepIndex}
          />
        </Card>
      )}
    </div>
  );
};
