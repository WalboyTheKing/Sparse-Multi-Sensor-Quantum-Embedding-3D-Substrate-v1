import { 
  QuantumStateVector, 
  ComplexNum, 
  SensorType, 
  Vector3D,
  PhysicalStateSnapshot,
  KnownMask,
  PropertyConfidences,
  OccupancyClassification
} from '../types/quantumField';

export const AMBIENT_TEMP_C = 20.0;

/**
 * Creates the canonical maximum uncertainty prior state (quantum-inspired representation).
 * Unknown = maximum Von Neumann entropy (S = 1.0), zero confidence (0.0), maximally mixed density matrix.
 * 
 * FUNDAMENTAL INVARIANT: UNKNOWN != 0.
 * An unobserved location is NEVER interpreted as a measured zero.
 * Physical properties are explicitly null until measured.
 * Occupancy probability 0.5 represents "insufficient evidence to distinguish states",
 * NOT "the physical world is half matter and half void".
 */
export function createMaximumUncertaintyPriorState(timestamp = Date.now()): QuantumStateVector {
  const invSqrt2 = 1 / Math.SQRT2;

  const defaultKnownMask: KnownMask = {
    occupancy: false,
    light: false,
    temperature: false,
    velocity: false,
    pressure: false,
    energy: false,
    dielectric: false,
  };

  const defaultConfidences: PropertyConfidences = {
    occupancy: 0.0,
    light: 0.0,
    temperature: 0.0,
    velocity: 0.0,
    pressure: 0.0,
    energy: 0.0,
    dielectric: 0.0,
  };

  const defaultUncertainties: PropertyConfidences = {
    occupancy: 1.0,
    light: 1.0,
    temperature: 1.0,
    velocity: 1.0,
    pressure: 1.0,
    energy: 1.0,
    dielectric: 1.0,
  };

  const snapshot: PhysicalStateSnapshot = {
    timestamp,
    occupancy: null,
    occupancyState: 'UNKNOWN',
    unknownSubtype: 'unobserved',
    temperature: null,
    velocity: null,
    pressure: null,
    light: null,
    energy: null,
    dielectric: null,
    entropy: 1.0,
    confidence: 0.0,
    uncertainty: 1.0,
  };

  return {
    psiVoid: { re: invSqrt2, im: 0 },
    psiMatter: { re: invSqrt2, im: 0 },
    occupancyState: 'UNKNOWN',
    unknownSubtype: 'unobserved',
    occupancy: 0.5, // 0.5 represents maximum epistemic uncertainty prior
    light: null,
    color: [0.18, 0.22, 0.28], // Neutral dark slate visual fallback
    temperature: null,
    velocity: null,
    pressure: null,
    energy: null,
    dielectric: null,
    time: timestamp,
    knownMask: defaultKnownMask,
    propertyConfidences: defaultConfidences,
    propertyUncertainties: defaultUncertainties,
    entropy: 1.0, // Maximum uncertainty
    confidence: 0.0,
    uncertainty: 1.0,
    purity: 0.5, // Tr(ρ²) = 0.5 for maximally mixed 2-state system
    coherence: 0.0,
    observationsCount: 0,
    contributingSensors: [],
    sensorHistory: [],
    detailedHistory: [],
    firstObservedTimestamp: 0,
    lastObservedTimestamp: 0,
    currentState: snapshot,
  };
}

/**
 * Alias for backward compatibility with existing components
 */
export const createVacuumPriorState = createMaximumUncertaintyPriorState;

/**
 * Calculates Von Neumann entropy for a 2-level quantum-inspired occupancy density matrix
 * S = -Tr(ρ log2 ρ) = -λ1 log2(λ1) - λ2 log2(λ2)
 */
export function calculateVonNeumannEntropy(prob1: number, prob2: number): number {
  const p1 = Math.max(1e-6, Math.min(1 - 1e-6, prob1));
  const p2 = Math.max(1e-6, Math.min(1 - 1e-6, prob2));
  const sum = p1 + p2;
  const np1 = p1 / sum;
  const np2 = p2 / sum;
  
  const h = -(np1 * Math.log2(np1) + np2 * Math.log2(np2));
  return Math.min(1.0, Math.max(0.0, h));
}

/**
 * Canonical calculation of entropy
 */
export function calculateEntropy(probMatter: number): number {
  return calculateVonNeumannEntropy(probMatter, 1 - probMatter);
}

/**
 * Calculates purity Tr(ρ²) for a 2-level state.
 * Purity ranges from 0.5 (completely mixed/unknown) to 1.0 (pure state).
 */
export function calculatePurity(probMatter: number): number {
  const pM = Math.max(0, Math.min(1, probMatter));
  const pV = 1 - pM;
  // For diagonal density matrix: Tr(ρ²) = pM² + pV²
  return pM * pM + pV * pV;
}

/**
 * Calculates overall confidence based on entropy and observation counts
 */
export function calculateConfidence(entropy: number, observationsCount: number): number {
  const baseConfidence = Math.max(0, 1 - entropy);
  if (observationsCount === 0) return 0;
  return Math.min(1.0, baseConfidence);
}

/**
 * Calculates information gain in bits: ΔI = S_prior - S_posterior
 */
export function calculateInformationGain(priorEntropy: number, currentEntropy: number): number {
  return Math.max(0, priorEntropy - currentEntropy);
}

/**
 * Creates a frozen immutable snapshot of the current state
 */
export function createSnapshotFromState(state: QuantumStateVector): PhysicalStateSnapshot {
  return {
    timestamp: state.lastObservedTimestamp || Date.now(),
    occupancy: state.knownMask.occupancy ? state.occupancy : null,
    occupancyState: state.occupancyState,
    temperature: state.temperature,
    velocity: state.velocity ? [...state.velocity] : null,
    pressure: state.pressure,
    light: state.light ? [...state.light] : null,
    energy: state.energy,
    dielectric: state.dielectric,
    entropy: state.entropy,
    confidence: state.confidence,
    uncertainty: state.uncertainty,
  };
}

/**
 * Update the quantum embedding with an RGB-Depth observation.
 * If ray hit surface: collapses towards KNOWN_MATTER, writes color/light, sharpens occupancy.
 * If ray traversed free space: collapses towards KNOWN_EMPTY.
 */
export function updateWithRGBD(
  current: QuantumStateVector,
  isSurfaceHit: boolean,
  color?: [number, number, number],
  sensorWeight = 0.7
): QuantumStateVector {
  const targetOcc = isSurfaceHit ? 1.0 : 0.0;
  const previousSnapshot = current.currentState;
  
  // Bayesian / Quantum measurement operator update
  const currentProb = current.knownMask.occupancy ? current.occupancy : 0.5;
  const newOcc = currentProb * (1 - sensorWeight) + targetOcc * sensorWeight;
  const pMatter = Math.sqrt(Math.max(0.01, Math.min(0.99, newOcc)));
  const pVoid = Math.sqrt(Math.max(0.01, Math.min(0.99, 1 - newOcc)));
  
  // Update color if surface hit
  let updatedColor = current.color;
  let updatedLight = current.light;
  if (isSurfaceHit && color) {
    const blendFactor = current.knownMask.light ? 0.65 : 1.0;
    const prevColor = current.light || current.color;
    updatedLight = [
      prevColor[0] * (1 - blendFactor) + color[0] * blendFactor,
      prevColor[1] * (1 - blendFactor) + color[1] * blendFactor,
      prevColor[2] * (1 - blendFactor) + color[2] * blendFactor,
    ];
    updatedColor = updatedLight;
  }
  
  // Entropy decays with each confirming observation
  const obsCount = current.observationsCount + 1;
  const newEntropy = calculateVonNeumannEntropy(newOcc, 1 - newOcc) * Math.pow(0.75, Math.min(obsCount, 4));
  const newConfidence = Math.min(1.0, Math.max(0.0, 1.0 - newEntropy));
  const newUncertainty = 1.0 - newConfidence;
  const purity = calculatePurity(newOcc);
  
  // Classification
  let classification: OccupancyClassification = 'UNKNOWN';
  if (newOcc > 0.65) classification = 'KNOWN_MATTER';
  else if (newOcc < 0.35) classification = 'KNOWN_EMPTY';
  else classification = 'CONFLICTING_UNCERTAIN';

  const now = Date.now();
  const contributingSensors = current.contributingSensors.includes('rgbd')
    ? current.contributingSensors
    : [...current.contributingSensors, 'rgbd' as SensorType];

  const sensorHistory = current.sensorHistory.includes('rgbd')
    ? current.sensorHistory
    : [...current.sensorHistory, 'rgbd' as SensorType];

  const detailedHistory = [
    ...current.detailedHistory,
    {
      sensorType: 'rgbd' as SensorType,
      timestamp: now,
      observedProperty: isSurfaceHit ? 'matter_surface' : 'free_space',
      value: isSurfaceHit ? (color || [1, 1, 1]) : 0,
      confidence: sensorWeight,
      uncertainty: 1 - sensorWeight,
    }
  ];

  const updatedKnownMask: KnownMask = {
    ...current.knownMask,
    occupancy: true,
    light: isSurfaceHit ? true : current.knownMask.light,
  };

  const updatedConfidences: PropertyConfidences = {
    ...current.propertyConfidences,
    occupancy: Math.min(1.0, current.propertyConfidences.occupancy + sensorWeight * (1 - current.propertyConfidences.occupancy)),
    light: isSurfaceHit ? 0.85 : current.propertyConfidences.light,
  };

  const updatedUncertainties: PropertyConfidences = {
    ...current.propertyUncertainties,
    occupancy: 1 - updatedConfidences.occupancy,
    light: 1 - updatedConfidences.light,
  };

  const nextState: QuantumStateVector = {
    ...current,
    unknownSubtype: undefined,
    psiVoid: { re: pVoid, im: 0 },
    psiMatter: { re: pMatter, im: 0 },
    occupancyState: classification,
    occupancy: newOcc,
    color: updatedColor,
    light: updatedLight,
    knownMask: updatedKnownMask,
    propertyConfidences: updatedConfidences,
    propertyUncertainties: updatedUncertainties,
    entropy: newEntropy,
    confidence: newConfidence,
    uncertainty: newUncertainty,
    purity,
    coherence: Math.abs(pMatter * pVoid),
    observationsCount: obsCount,
    contributingSensors,
    sensorHistory,
    detailedHistory,
    firstObservedTimestamp: current.firstObservedTimestamp || now,
    lastObservedTimestamp: now,
    previousState: previousSnapshot,
    currentState: {
      timestamp: now,
      occupancy: newOcc,
      occupancyState: classification,
      temperature: current.temperature,
      velocity: current.velocity,
      pressure: current.pressure,
      light: updatedLight,
      energy: current.energy,
      dielectric: current.dielectric,
      entropy: newEntropy,
      confidence: newConfidence,
      uncertainty: newUncertainty,
    },
  };

  return nextState;
}

/**
 * Update the quantum embedding with a Thermal (FLIR Infrared) observation.
 * Directly updates temperature channel without destroying occupancy, motion, pressure.
 * Independent property confidence for thermal.
 */
export function updateWithThermal(
  current: QuantumStateVector,
  measuredTempC: number,
  sensorWeight = 0.75
): QuantumStateVector {
  const previousSnapshot = current.currentState;
  const currentTemp = current.temperature ?? AMBIENT_TEMP_C;
  const updatedTemp = current.knownMask.temperature
    ? currentTemp * (1 - sensorWeight) + measuredTempC * sensorWeight
    : measuredTempC;
  
  // Thermal observation confirms existence of physical medium if heat != ambient
  const isHeatedOrCooled = Math.abs(updatedTemp - AMBIENT_TEMP_C) > 2.0;
  let newOcc = current.occupancy;
  let classification = current.occupancyState;
  
  if (isHeatedOrCooled && (!current.knownMask.occupancy || current.occupancy < 0.6)) {
    newOcc = current.occupancy * 0.7 + 0.8 * 0.3; // Radiation indicates solid or warm body
    if (newOcc > 0.6) classification = 'KNOWN_MATTER';
  }

  const entropyReduction = 0.8;
  const newEntropy = current.entropy * entropyReduction;
  const confidence = Math.min(1.0, 1.0 - newEntropy);
  const uncertainty = 1.0 - confidence;
  const now = Date.now();

  const contributingSensors = current.contributingSensors.includes('thermal')
    ? current.contributingSensors
    : [...current.contributingSensors, 'thermal' as SensorType];

  const sensorHistory = current.sensorHistory.includes('thermal') 
    ? current.sensorHistory 
    : [...current.sensorHistory, 'thermal' as SensorType];

  const updatedKnownMask: KnownMask = {
    ...current.knownMask,
    temperature: true,
    energy: true,
  };

  const updatedConfidences: PropertyConfidences = {
    ...current.propertyConfidences,
    temperature: Math.min(1.0, current.propertyConfidences.temperature + sensorWeight * (1 - current.propertyConfidences.temperature)),
    energy: 0.8,
  };

  const updatedUncertainties: PropertyConfidences = {
    ...current.propertyUncertainties,
    temperature: 1 - updatedConfidences.temperature,
    energy: 1 - updatedConfidences.energy,
  };

  // Stefan-Boltzmann radiometric thermal flux estimate (E = ε σ T⁴)
  const tempK = updatedTemp + 273.15;
  const stefanBoltzmann = 5.67e-8;
  const thermalEnergyFlux = 0.95 * stefanBoltzmann * Math.pow(tempK, 4);

  return {
    ...current,
    unknownSubtype: undefined,
    temperature: updatedTemp,
    energy: thermalEnergyFlux,
    occupancy: newOcc,
    occupancyState: classification,
    entropy: newEntropy,
    confidence,
    uncertainty,
    knownMask: updatedKnownMask,
    propertyConfidences: updatedConfidences,
    propertyUncertainties: updatedUncertainties,
    observationsCount: current.observationsCount + 1,
    contributingSensors,
    sensorHistory,
    detailedHistory: [
      ...current.detailedHistory,
      {
        sensorType: 'thermal',
        timestamp: now,
        observedProperty: 'temperature',
        value: measuredTempC,
        confidence: sensorWeight,
        uncertainty: 1 - sensorWeight,
      }
    ],
    firstObservedTimestamp: current.firstObservedTimestamp || now,
    lastObservedTimestamp: now,
    previousState: previousSnapshot,
    currentState: {
      timestamp: now,
      occupancy: newOcc,
      occupancyState: classification,
      temperature: updatedTemp,
      velocity: current.velocity,
      pressure: current.pressure,
      light: current.light,
      energy: thermalEnergyFlux,
      dielectric: current.dielectric,
      entropy: newEntropy,
      confidence,
      uncertainty,
    },
  };
}

/**
 * Update the quantum embedding with Millimeter-Wave Radar observation.
 * Radar penetrates voids/light occluders, measures Doppler velocity and dielectric constant.
 * Does not destroy optical or thermal channels.
 */
export function updateWithRadar(
  current: QuantumStateVector,
  measuredVelocity: [number, number, number],
  dielectricConstant = 3.5,
  sensorWeight = 0.7
): QuantumStateVector {
  const previousSnapshot = current.currentState;
  const [mvx, mvy, mvz] = measuredVelocity;

  let updatedVel: [number, number, number];
  if (current.knownMask.velocity && current.velocity) {
    const [vx, vy, vz] = current.velocity;
    updatedVel = [
      vx * (1 - sensorWeight) + mvx * sensorWeight,
      vy * (1 - sensorWeight) + mvy * sensorWeight,
      vz * (1 - sensorWeight) + mvz * sensorWeight,
    ];
  } else {
    updatedVel = [mvx, mvy, mvz];
  }

  const currentDielectric = current.dielectric ?? 1.0;
  const updatedDielectric = current.knownMask.dielectric
    ? currentDielectric * (1 - sensorWeight) + dielectricConstant * sensorWeight
    : dielectricConstant;
  
  // Radar return indicates matter
  let newOcc = current.occupancy;
  let classification = current.occupancyState;
  if (dielectricConstant > 2.0 && (!current.knownMask.occupancy || current.occupancy < 0.5)) {
    newOcc = current.occupancy * 0.5 + 0.85 * 0.5;
    if (newOcc > 0.6) classification = 'KNOWN_MATTER';
  }

  const newEntropy = current.entropy * 0.78;
  const confidence = Math.min(1.0, 1.0 - newEntropy);
  const uncertainty = 1.0 - confidence;
  const now = Date.now();

  const contributingSensors = current.contributingSensors.includes('radar')
    ? current.contributingSensors
    : [...current.contributingSensors, 'radar' as SensorType];

  const sensorHistory = current.sensorHistory.includes('radar') 
    ? current.sensorHistory 
    : [...current.sensorHistory, 'radar' as SensorType];

  const updatedKnownMask: KnownMask = {
    ...current.knownMask,
    velocity: true,
    dielectric: true,
  };

  const updatedConfidences: PropertyConfidences = {
    ...current.propertyConfidences,
    velocity: Math.min(1.0, current.propertyConfidences.velocity + sensorWeight * (1 - current.propertyConfidences.velocity)),
    dielectric: 0.85,
  };

  const updatedUncertainties: PropertyConfidences = {
    ...current.propertyUncertainties,
    velocity: 1 - updatedConfidences.velocity,
    dielectric: 1 - updatedConfidences.dielectric,
  };

  return {
    ...current,
    unknownSubtype: undefined,
    velocity: updatedVel,
    dielectric: updatedDielectric,
    occupancy: newOcc,
    occupancyState: classification,
    entropy: newEntropy,
    confidence,
    uncertainty,
    knownMask: updatedKnownMask,
    propertyConfidences: updatedConfidences,
    propertyUncertainties: updatedUncertainties,
    observationsCount: current.observationsCount + 1,
    contributingSensors,
    sensorHistory,
    detailedHistory: [
      ...current.detailedHistory,
      {
        sensorType: 'radar',
        timestamp: now,
        observedProperty: 'velocity_doppler',
        value: measuredVelocity,
        confidence: sensorWeight,
        uncertainty: 1 - sensorWeight,
      }
    ],
    firstObservedTimestamp: current.firstObservedTimestamp || now,
    lastObservedTimestamp: now,
    previousState: previousSnapshot,
    currentState: {
      timestamp: now,
      occupancy: newOcc,
      occupancyState: classification,
      temperature: current.temperature,
      velocity: updatedVel,
      pressure: current.pressure,
      light: current.light,
      energy: current.energy,
      dielectric: updatedDielectric,
      entropy: newEntropy,
      confidence,
      uncertainty,
    },
  };
}

/**
 * Update the quantum embedding with a Direct Contact / Force Probe.
 * Tactile touch provides definitive physical ground truth:
 * Measurement-induced uncertainty reduction ("state collapse in the quantum-inspired representation"):
 * Entropy collapses to near zero (S ~ 0.02, confidence ~ 0.98), writes pressure and confirms solid matter.
 */
export function updateWithForceProbe(
  current: QuantumStateVector,
  contactPressureKPa: number,
  isSolid = true
): QuantumStateVector {
  const previousSnapshot = current.currentState;
  const newOcc = isSolid ? 0.99 : 0.01;
  const newEntropy = 0.02; // State collapse in quantum-inspired representation
  const confidence = 0.98;
  const uncertainty = 0.02;
  const purity = 0.99;
  const now = Date.now();

  const contributingSensors = current.contributingSensors.includes('force_probe') 
    ? current.contributingSensors 
    : [...current.contributingSensors, 'force_probe' as SensorType];

  const sensorHistory = current.sensorHistory.includes('force_probe') 
    ? current.sensorHistory 
    : [...current.sensorHistory, 'force_probe' as SensorType];

  const updatedKnownMask: KnownMask = {
    ...current.knownMask,
    occupancy: true,
    pressure: true,
  };

  const updatedConfidences: PropertyConfidences = {
    ...current.propertyConfidences,
    occupancy: 0.99,
    pressure: 0.98,
  };

  const updatedUncertainties: PropertyConfidences = {
    ...current.propertyUncertainties,
    occupancy: 0.01,
    pressure: 0.02,
  };

  return {
    ...current,
    unknownSubtype: undefined,
    occupancy: newOcc,
    occupancyState: isSolid ? 'KNOWN_MATTER' : 'KNOWN_EMPTY',
    pressure: contactPressureKPa,
    entropy: newEntropy,
    confidence,
    uncertainty,
    purity,
    knownMask: updatedKnownMask,
    propertyConfidences: updatedConfidences,
    propertyUncertainties: updatedUncertainties,
    observationsCount: current.observationsCount + 1,
    contributingSensors,
    sensorHistory,
    detailedHistory: [
      ...current.detailedHistory,
      {
        sensorType: 'force_probe',
        timestamp: now,
        observedProperty: 'contact_pressure',
        value: contactPressureKPa,
        confidence: 0.98,
        uncertainty: 0.02,
      }
    ],
    firstObservedTimestamp: current.firstObservedTimestamp || now,
    lastObservedTimestamp: now,
    previousState: previousSnapshot,
    currentState: {
      timestamp: now,
      occupancy: newOcc,
      occupancyState: isSolid ? 'KNOWN_MATTER' : 'KNOWN_EMPTY',
      temperature: current.temperature,
      velocity: current.velocity,
      pressure: contactPressureKPa,
      light: current.light,
      energy: current.energy,
      dielectric: current.dielectric,
      entropy: newEntropy,
      confidence,
      uncertainty,
    },
  };
}

/**
 * Compute global field metrics
 */
export function computeFieldMetrics(voxels: Map<string, QuantumStateVector>): {
  totalVoxels: number;
  observedVoxels: number;
  unobservedVoxels: number;
  occludedVoxels: number;
  insufficientCoverageVoxels: number;
  meanEntropy: number;
  informationGainBits: number;
  maxTemperature: number;
  maxVelocity: number;
  maxPressure: number;
  activeRegionsCount?: number;
} {
  const total = voxels.size;
  if (total === 0) {
    return {
      totalVoxels: 0,
      observedVoxels: 0,
      unobservedVoxels: 0,
      occludedVoxels: 0,
      insufficientCoverageVoxels: 0,
      meanEntropy: 1.0,
      informationGainBits: 0,
      maxTemperature: AMBIENT_TEMP_C,
      maxVelocity: 0,
      maxPressure: 0,
    };
  }

  let sumEntropy = 0;
  let observedCount = 0;
  let occludedCount = 0;
  let insufficientCount = 0;
  let maxTemp = AMBIENT_TEMP_C;
  let maxVel = 0;
  let maxPressure = 0;
  let activeRegions = 0;

  for (const state of voxels.values()) {
    sumEntropy += state.entropy;
    if (state.observationsCount > 0) {
      observedCount++;
    } else {
      if (state.unknownSubtype === 'occluded') {
        occludedCount++;
      } else if (state.unknownSubtype === 'insufficient_coverage') {
        insufficientCount++;
      }
    }
    if (state.temperature !== null && state.temperature > maxTemp) {
      maxTemp = state.temperature;
    }
    if (state.velocity !== null) {
      const velMag = Math.hypot(state.velocity[0], state.velocity[1], state.velocity[2]);
      if (velMag > maxVel) maxVel = velMag;
      if (velMag > 0.1) activeRegions++;
    }
    if (state.pressure !== null && state.pressure > maxPressure) {
      maxPressure = state.pressure;
    }
  }

  const meanEntropy = sumEntropy / total;
  // Information gain in bits: ΔI = (S_prior - S_mean) * total where S_prior = 1.0 bit
  const informationGainBits = Math.max(0, (1.0 - meanEntropy) * total);

  return {
    totalVoxels: total,
    observedVoxels: observedCount,
    unobservedVoxels: total - observedCount - occludedCount - insufficientCount,
    occludedVoxels: occludedCount,
    insufficientCoverageVoxels: insufficientCount,
    meanEntropy: Number(meanEntropy.toFixed(3)),
    informationGainBits: Number(informationGainBits.toFixed(1)),
    maxTemperature: Number(maxTemp.toFixed(1)),
    maxVelocity: Number(maxVel.toFixed(2)),
    maxPressure: Number(maxPressure.toFixed(1)),
    activeRegionsCount: activeRegions,
  };
}
