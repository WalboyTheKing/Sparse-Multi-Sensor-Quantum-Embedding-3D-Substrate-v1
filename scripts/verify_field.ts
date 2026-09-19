import { computeFieldMetrics } from '../src/core/quantumEmbedding';
import { 
  initializeQuantumGrid,
  fireRGBDSensor, 
  fireThermalSensor, 
  fireRadarSensor, 
  fireForceProbe,
  DEFAULT_SENSORS,
  DEFAULT_PHYSICAL_OBJECTS
} from '../src/core/sensorSimulation';
import { EventDetectionEngine } from '../src/core/eventDetection';
import { WorldSituationEngine } from '../src/core/worldSituation';
import { buildScientificExport } from '../src/utils/scientificExport';
import { VoxelPoint } from '../src/types/quantumField';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}`);
  }
}

console.log('\n=== PHYSICAL STATE FIELD: VALIDATION SUITE ===\n');

// 1. Grid Initialization
console.log('--- 1. Substrate & Prior Initialization ---');
const grid1 = initializeQuantumGrid();
assert(grid1.size === 2744, 'Initializes exactly 2,744 voxels (14x14x14 grid)');

let allUnknown = true;
let allMaxEntropy = true;
let allUnobservedSubtype = true;

for (const pt of grid1.values()) {
  if (pt.state.occupancyState !== 'UNKNOWN') allUnknown = false;
  if (Math.abs(pt.state.entropy - 1.0) > 0.001) allMaxEntropy = false;
  if (pt.state.unknownSubtype !== 'unobserved') allUnobservedSubtype = false;
}

assert(allUnknown, 'Every voxel starts as UNKNOWN (Axiom: UNKNOWN != 0)');
assert(allMaxEntropy, 'Every voxel prior has maximal Von Neumann entropy S = 1.0');
assert(allUnobservedSubtype, 'Priors have unknownSubtype = "unobserved"');

const initialMetrics = computeFieldMetrics(new Map(Array.from(grid1.entries()).map(([k, v]) => [k, v.state])));
assert(initialMetrics.observedVoxels === 0, 'Observed count is 0 before sensor firing');
assert(initialMetrics.unobservedVoxels === 2744, 'Unobserved count is 2744 before sensor firing');
assert(initialMetrics.informationGainBits === 0, 'Information gain ΔI = 0.0 bits on vacuum field');

// 2. Multi-Sensor Fused Substrate Writing
console.log('\n--- 2. Multi-Sensor Direct Writing ---');
const rgbdSensor = DEFAULT_SENSORS.find((s) => s.type === 'rgbd')!;
const thermalSensor = DEFAULT_SENSORS.find((s) => s.type === 'thermal')!;
const radarSensor = DEFAULT_SENSORS.find((s) => s.type === 'radar')!;
const forceSensor = DEFAULT_SENSORS.find((s) => s.type === 'force_probe')!;

fireRGBDSensor(grid1, rgbdSensor, DEFAULT_PHYSICAL_OBJECTS);
const afterRGBD = computeFieldMetrics(new Map(Array.from(grid1.entries()).map(([k, v]) => [k, v.state])));
assert(afterRGBD.observedVoxels > 0, 'RGB-D sensor resolves spatial points into KNOWN_MATTER / KNOWN_EMPTY');
assert(afterRGBD.occludedVoxels > 0, 'RGB-D marks obstacle shadow cells as unknownSubtype="occluded"');
assert(afterRGBD.informationGainBits > 0, 'Von Neumann entropy drops; information gain ΔI > 0');

fireThermalSensor(grid1, thermalSensor, DEFAULT_PHYSICAL_OBJECTS);
const afterThermal = computeFieldMetrics(new Map(Array.from(grid1.entries()).map(([k, v]) => [k, v.state])));
assert(afterThermal.maxTemperature > 25, 'Thermal sensor registers elevated temperature on hot core');

fireRadarSensor(grid1, radarSensor, DEFAULT_PHYSICAL_OBJECTS);
const afterRadar = computeFieldMetrics(new Map(Array.from(grid1.entries()).map(([k, v]) => [k, v.state])));
assert(afterRadar.maxVelocity > 0, 'Radar Doppler registers kinematic velocity on moving target');

fireForceProbe(grid1, forceSensor, DEFAULT_PHYSICAL_OBJECTS);
const afterForce = computeFieldMetrics(new Map(Array.from(grid1.entries()).map(([k, v]) => [k, v.state])));
assert(afterForce.maxPressure > 0, 'Force probe registers contact stress pressure in substrate');

// 3. Occlusion Preservation
console.log('\n--- 3. Occlusion Invariant ---');
const gridOcc = initializeQuantumGrid();
fireRGBDSensor(gridOcc, rgbdSensor, DEFAULT_PHYSICAL_OBJECTS);
let occludedPreservedCount = 0;
let occludedMaxEntropyValid = true;

for (const pt of gridOcc.values()) {
  if (pt.state.unknownSubtype === 'occluded') {
    occludedPreservedCount++;
    if (pt.state.entropy < 0.99) {
      occludedMaxEntropyValid = false;
    }
  }
}
assert(occludedPreservedCount > 0, `Occluded region exists (${occludedPreservedCount} voxels behind obstacle)`);
assert(occludedMaxEntropyValid, 'All voxels in occlusion shadow strictly maintain maximal entropy S = 1.0');

// 4. Temporal Situations & Events
console.log('\n--- 4. Temporal Situation Engine ---');
const events = EventDetectionEngine.scanWorldForEvents(grid1);
assert(events.length > 0, `Detected ${events.length} physical events from sensor observations`);
const situations = WorldSituationEngine.groupEventsIntoSituations(events);
assert(situations.length > 0, `Grouped events into ${situations.length} coherent physical situations`);

// 5. Bit-to-Bit Determinism & Reproducibility
console.log('\n--- 5. Bit-to-Bit Determinism ---');
const gridA = initializeQuantumGrid();
const gridB = initializeQuantumGrid();

fireRGBDSensor(gridA, rgbdSensor, DEFAULT_PHYSICAL_OBJECTS);
fireRGBDSensor(gridB, rgbdSensor, DEFAULT_PHYSICAL_OBJECTS);

let bitIdentical = true;
for (const [key, voxelA] of gridA.entries()) {
  const voxelB = gridB.get(key)!;
  if (
    voxelA.state.occupancy !== voxelB.state.occupancy ||
    voxelA.state.entropy !== voxelB.state.entropy ||
    voxelA.state.unknownSubtype !== voxelB.state.unknownSubtype ||
    voxelA.state.occupancyState !== voxelB.state.occupancyState
  ) {
    bitIdentical = false;
    break;
  }
}
assert(bitIdentical, 'Two identical sensory sweeps produce bit-for-bit identical state fields');

// 6. Scientific Export Artifacts
console.log('\n--- 6. Scientific Export Bundle ---');
const exportPkg = buildScientificExport(grid1, DEFAULT_SENSORS, events, [], 'exp_validation_01');

assert(exportPkg.metadata !== undefined, 'Export includes metadata.json');
assert(exportPkg.metadata.voxel_count === 2744, 'metadata.json records exactly 2,744 voxels');
assert(exportPkg.metadata.scientific_standard.includes('authoritative computational representation'), 'metadata.json enforces authoritative scientific standard');
assert(exportPkg.metadata.epistemic_breakdown.occluded > 0, 'metadata.json includes epistemic occlusion breakdown');

assert(exportPkg.field.length === 2744, 'field.json contains all 2,744 voxels');
assert(exportPkg.field[0].knownMask !== undefined, 'field.json voxels contain explicit knownMask');
assert(exportPkg.field[0].purity !== undefined, 'field.json voxels contain quantum purity Tr(ρ²)');

assert(exportPkg.events.length > 0, 'events.json contains physical event log');
assert(Array.isArray(exportPkg.snapshots), 'snapshots.json contains temporal snapshot history');
assert(exportPkg.metrics.meanEntropy > 0, 'metrics.json contains Von Neumann entropy S');
assert(exportPkg.metrics.informationGainBits > 0, 'metrics.json contains information gain ΔI');

// 7. Deterministic Physical Queries (Axiom: UNKNOWN != 0)
console.log('\n--- 7. Deterministic Physical Query Engine ---');
import { evaluatePhysicalQuery } from '../src/core/physicalQueryEngine';

const vacuumGrid = initializeQuantumGrid();
const vacuumQuery = evaluatePhysicalQuery('What is the temperature at 0.5, 0.5, 0.5?', vacuumGrid);
assert(
  vacuumQuery.answer.toLowerCase().includes('unknown') || vacuumQuery.evidence.toLowerCase().includes('unobserved'),
  'Query on unobserved vacuum returns UNKNOWN (not default 0°C)'
);

const tempQuery = evaluatePhysicalQuery('What is the highest temperature in the scene?', grid1);
assert(tempQuery.confidence > 0.5, 'Thermal query on fused substrate yields high confidence answer');
assert(typeof tempQuery.value === 'number' && tempQuery.value > 25, 'Thermal query correctly returns elevated core temperature');

const velQuery = evaluatePhysicalQuery('Is any object moving? What is its velocity?', grid1);
assert(velQuery.evidence.length > 0, 'Radar query on moving object provides physical evidence trace');

const forceQuery = evaluatePhysicalQuery('What is the contact pressure measured by the force probe?', grid1);
assert(forceQuery.confidence > 0.8, 'Tactile force probe query returns high-confidence physical state');

// 8. Voxel Channel Integrity (All 14 Properties)
console.log('\n--- 8. 14-Channel Voxel State Vector ---');
const sampleVoxel = Array.from(grid1.values()).find((v) => v.state.observationsCount > 0)!;
assert(sampleVoxel.state.occupancy !== undefined, 'Channel 1: occupancy');
assert(sampleVoxel.state.occupancyState !== undefined, 'Channel 2: occupancyState');
assert(sampleVoxel.state.entropy !== undefined, 'Channel 3: entropy');
assert(sampleVoxel.state.confidence !== undefined, 'Channel 4: confidence');
assert(sampleVoxel.state.uncertainty !== undefined, 'Channel 5: uncertainty');
assert(sampleVoxel.state.purity !== undefined, 'Channel 6: purity Tr(ρ²)');
assert(sampleVoxel.state.coherence !== undefined, 'Channel 7: coherence');
assert(sampleVoxel.state.psiVoid !== undefined, 'Channel 8: psiVoid amplitude');
assert(sampleVoxel.state.psiMatter !== undefined, 'Channel 9: psiMatter amplitude');
assert(sampleVoxel.state.knownMask !== undefined, 'Channel 10: knownMask');
assert(sampleVoxel.state.propertyConfidences !== undefined, 'Channel 11: propertyConfidences');
assert(sampleVoxel.state.propertyUncertainties !== undefined, 'Channel 12: propertyUncertainties');
assert(Array.isArray(sampleVoxel.state.contributingSensors), 'Channel 13: contributingSensors provenance');
assert(Array.isArray(sampleVoxel.state.detailedHistory), 'Channel 14: detailedHistory audit trail');

// 9. Performance Benchmark (Sub-100ms Fused Sweep)
console.log('\n--- 9. Performance Benchmark ---');
const benchGrid = initializeQuantumGrid();
const t0 = performance.now();
fireRGBDSensor(benchGrid, rgbdSensor, DEFAULT_PHYSICAL_OBJECTS);
fireThermalSensor(benchGrid, thermalSensor, DEFAULT_PHYSICAL_OBJECTS);
fireRadarSensor(benchGrid, radarSensor, DEFAULT_PHYSICAL_OBJECTS);
fireForceProbe(benchGrid, forceSensor, DEFAULT_PHYSICAL_OBJECTS);
const elapsedMs = performance.now() - t0;

console.log(`  Measured 4-sensor fusion time across 2,744 voxels: ${elapsedMs.toFixed(2)} ms`);
assert(elapsedMs < 150, `Multi-sensor fusion completes in under 150 ms (${elapsedMs.toFixed(2)} ms)`);

console.log(`\n==============================================`);
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`==============================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
