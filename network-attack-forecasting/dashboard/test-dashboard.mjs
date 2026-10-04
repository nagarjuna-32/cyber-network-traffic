import { MOCK_SCENARIOS } from './src/data/mockScenarios.ts';

console.log("=== RUNNING NETFORECAST DASHBOARD VERIFICATION SUITE ===");

const states = ['NORMAL', 'ELEVATED', 'SUSPICIOUS', 'PREDICTED ATTACK', 'ATTACK', 'RECOVERY'];

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  passed++;
  console.log(`✅ PASSED: ${message}`);
}

// 1. Test All 6 World Model States & Transitions
for (const state of states) {
  const scenario = MOCK_SCENARIOS[state];
  assert(scenario !== undefined, `Scenario ${state} exists`);
  assert(scenario.decision.current_state === state, `State ${state} matches decision.current_state`);
  assert(typeof scenario.decision.threat_score === 'number', `${state} threat_score is a number`);
  assert(scenario.decision.threat_score >= 0 && scenario.decision.threat_score <= 100, `${state} threat_score is in [0, 100]`);
  assert(scenario.decision.confidence >= 0 && scenario.decision.confidence <= 1, `${state} confidence is in [0, 1]`);
  assert(scenario.decision.prediction_confidence >= 0 && scenario.decision.prediction_confidence <= 1, `${state} prediction_confidence is in [0, 1]`);
  assert(Array.isArray(scenario.decision.evidence), `${state} evidence is an array`);
  assert(scenario.decision.threat_type.length > 0, `${state} threat_type is defined`);

  // Verify Live Monitored Threat Threads
  assert(Array.isArray(scenario.decision.threat_threads), `${state} has threat_threads array`);
  assert(scenario.decision.threat_threads.length > 0, `${state} contains active monitored threads`);
  for (const th of scenario.decision.threat_threads) {
    assert(th.id.length > 0, `${state} thread has id ${th.id}`);
    assert(th.sourceIp.length > 0, `${state} thread has sourceIp`);
    assert(th.destIp.length > 0, `${state} thread has destIp`);
    assert(typeof th.flowRate === 'number', `${state} thread has numeric flowRate`);
    assert(['BENIGN', 'SUSPICIOUS', 'ATTACK', 'ANOMALOUS'].includes(th.threatStatus), `${state} thread has valid status`);
  }

  // Verify High-Resolution Timeline Graph Data
  assert(Array.isArray(scenario.timeline), `${state} has timeline points`);
  assert(scenario.timeline.length >= 7, `${state} has sufficient timeline points for smooth SVG graph`);
  assert(scenario.timeline.some(t => t.time === 'Now'), `${state} timeline contains current 'Now' observation`);
  assert(scenario.timeline.some(t => t.isForecast), `${state} timeline contains future forecast lookahead points`);
}

// 2. Test Edge Case: Empty Dataset
const emptyScenario = MOCK_SCENARIOS['EMPTY_DATASET'];
assert(emptyScenario !== undefined, 'EMPTY_DATASET scenario exists');
assert(emptyScenario.decision.threat_score === 0, 'Empty dataset has 0 threat score');
assert(emptyScenario.decision.evidence.length === 0, 'Empty dataset evidence is empty');
assert(emptyScenario.alerts.length === 0, 'Empty dataset alerts are empty');
assert(emptyScenario.timeline.length === 0, 'Empty dataset timeline is empty');
assert(emptyScenario.decision.threat_threads.length === 0, 'Empty dataset has 0 threat threads');

// 3. Test Edge Case: Missing Fields Resilience
const missingScenario = MOCK_SCENARIOS['MISSING_FIELDS'];
assert(missingScenario !== undefined, 'MISSING_FIELDS scenario exists');
assert(missingScenario.decision.threat_score === undefined, 'Missing threat score handled');
assert(missingScenario.decision.evidence === undefined, 'Missing evidence handled');
assert(missingScenario.decision.threat_threads === undefined, 'Missing threat threads handled');

console.log(`\n🎉 ALL ${passed}/${total} TEST SUITE ASSERTIONS PASSED!`);
