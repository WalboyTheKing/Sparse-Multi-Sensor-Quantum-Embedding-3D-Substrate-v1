import { VoxelPoint, Vector3D, PhysicalQuery } from '../types/quantumField';
import { coordToIndex, voxelKey } from './sensorSimulation';
import { BaselineTemporalPrediction } from './prediction';
import { EventDetectionEngine } from './eventDetection';

export type QueryIntent = 
  | 'temperature'
  | 'occupied'
  | 'free_space'
  | 'motion'
  | 'velocity'
  | 'uncertainty'
  | 'change'
  | 'prediction'
  | 'force'
  | 'general';

export interface QueryAnalysis {
  intent: QueryIntent;
  targetPos?: Vector3D;
  targetRegionName?: string;
}

export function parseQueryIntent(prompt: string): QueryAnalysis {
  const p = prompt.toLowerCase();

  if (p.includes('predict') || p.includes('what is predicted') || p.includes('trajectory') || p.includes('next')) {
    return { intent: 'prediction' };
  }
  if (p.includes('change') || p.includes('what changed') || p.includes('event') || p.includes('difference')) {
    return { intent: 'change' };
  }
  if (p.includes('temperature') || p.includes('temp') || p.includes('heat') || p.includes('warm') || p.includes('cold') || p.includes('thermal')) {
    return { intent: 'temperature' };
  }
  if (p.includes('occupied') || p.includes('is this location occupied') || p.includes('solid matter') || p.includes('matter here')) {
    return { intent: 'occupied' };
  }
  if (p.includes('free space') || p.includes('known to be free') || p.includes('clear') || p.includes('path') || p.includes('void')) {
    return { intent: 'free_space' };
  }
  if (p.includes('moving') || p.includes('doppler') || p.includes('motion')) {
    return { intent: 'motion' };
  }
  if (p.includes('velocity') || p.includes('speed') || p.includes('m/s')) {
    return { intent: 'velocity' };
  }
  if (p.includes('uncertain') || p.includes('entropy') || p.includes('shadow') || p.includes('confidence') || p.includes('unknown')) {
    return { intent: 'uncertainty' };
  }
  if (p.includes('force') || p.includes('pressure') || p.includes('probe') || p.includes('contact') || p.includes('hardness')) {
    return { intent: 'force' };
  }

  return { intent: 'general' };
}

/**
 * Deterministically evaluates a physical query against the quantum spatial state field.
 * Strictly adheres to UNKNOWN != 0.
 * Does not require an LLM.
 */
export function evaluatePhysicalQuery(
  prompt: string,
  grid: Map<string, VoxelPoint>
): PhysicalQuery {
  const analysis = parseQueryIntent(prompt);
  const id = `query_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const timestamp = Date.now();

  // 1. TEMPERATURE QUERY
  if (analysis.intent === 'temperature') {
    let maxTemp = -Infinity;
    let minTemp = Infinity;
    let hottestVoxel: VoxelPoint | null = null;
    let coldestVoxel: VoxelPoint | null = null;
    let observedThermalCount = 0;

    for (const point of grid.values()) {
      if (point.state.knownMask.temperature && point.state.temperature !== null) {
        observedThermalCount++;
        if (point.state.temperature > maxTemp) {
          maxTemp = point.state.temperature;
          hottestVoxel = point;
        }
        if (point.state.temperature < minTemp) {
          minTemp = point.state.temperature;
          coldestVoxel = point;
        }
      }
    }

    if (observedThermalCount === 0) {
      return {
        id,
        timestamp,
        prompt,
        answer: 'UNKNOWN: No thermal sensor observations have been recorded in the Physical State Field. All unobserved locations hold state UNKNOWN (not 0.0°C). Trigger the FLIR Thermal Sensor to measure radiometric infrared radiation.',
        value: null,
        unit: '°C',
        confidence: 0.0,
        uncertainty: 1.0,
        meanEntropy: 1.0,
        evidence: 'zero thermal observations in spatial index (knownMask.temperature = false for all cells)',
        source: 'deterministic_physics',
      };
    }

    const hPos = hottestVoxel!.position;
    return {
      id,
      timestamp,
      prompt,
      answer: `Temperature at observed thermal peak is ${maxTemp.toFixed(1)}°C at position [${hPos.x.toFixed(2)}, ${hPos.y.toFixed(2)}, ${hPos.z.toFixed(2)}]. Total observed thermal cells: ${observedThermalCount}. Unobserved spatial regions remain UNKNOWN with maximum entropy.`,
      value: Number(maxTemp.toFixed(1)),
      unit: '°C',
      position: hPos,
      confidence: hottestVoxel!.state.propertyConfidences.temperature,
      uncertainty: hottestVoxel!.state.propertyUncertainties.temperature,
      meanEntropy: hottestVoxel!.state.entropy,
      evidence: `Calibrated radiometric FLIR reading across ${observedThermalCount} cells; peak radiation at heated metallic specimen`,
      relevantVoxelCoords: [hPos, coldestVoxel!.position],
      metrics: {
        maxTempC: maxTemp.toFixed(1),
        minTempC: minTemp.toFixed(1),
        activeThermalCells: observedThermalCount,
      },
      source: 'deterministic_physics',
    };
  }

  // 2. IS THIS LOCATION OCCUPIED?
  if (analysis.intent === 'occupied') {
    let solidCount = 0;
    let highestOccVoxel: VoxelPoint | null = null;
    let maxOcc = 0;

    for (const point of grid.values()) {
      if (point.state.knownMask.occupancy && point.state.occupancy > 0.6) {
        solidCount++;
        if (point.state.occupancy > maxOcc) {
          maxOcc = point.state.occupancy;
          highestOccVoxel = point;
        }
      }
    }

    if (solidCount === 0) {
      return {
        id,
        timestamp,
        prompt,
        answer: 'UNKNOWN / UNMEASURED: No solid matter has been confirmed by optical surface raycasts or tactile probes yet. Space remains in unobserved epistemic state.',
        value: 'UNKNOWN',
        confidence: 0.1,
        uncertainty: 0.9,
        meanEntropy: 1.0,
        evidence: 'occupancy classification has not resolved to KNOWN_MATTER for any voxel',
        source: 'deterministic_physics',
      };
    }

    const pos = highestOccVoxel!.position;
    return {
      id,
      timestamp,
      prompt,
      answer: `KNOWN MATTER: Confirmed solid occupancy at position [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}] with occupancy probability ${(maxOcc * 100).toFixed(1)}% (classification: ${highestOccVoxel!.state.occupancyState}). Total confirmed solid voxels: ${solidCount}.`,
      value: Number(maxOcc.toFixed(2)),
      unit: 'probability',
      position: pos,
      confidence: highestOccVoxel!.state.propertyConfidences.occupancy,
      uncertainty: highestOccVoxel!.state.propertyUncertainties.occupancy,
      meanEntropy: highestOccVoxel!.state.entropy,
      evidence: `Raycast surface intersection and/or tactile contact force confirmed boundary at coordinate`,
      relevantVoxelCoords: [pos],
      metrics: {
        confirmedSolidVoxels: solidCount,
        maxOccupancy: maxOcc.toFixed(2),
      },
      source: 'deterministic_physics',
    };
  }

  // 3. IS THIS SPACE KNOWN TO BE FREE?
  if (analysis.intent === 'free_space') {
    let totalSamples = 0;
    let solidCollisions = 0;
    let voidVerified = 0;
    let highEntropyUnknowns = 0;
    const pathCoords: Vector3D[] = [];

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -1.5 + 3.0 * t;
      const y = 0.0;
      const z = 1.5 - 3.0 * t;
      pathCoords.push({ x, y, z });

      const ix = coordToIndex(x);
      const iy = coordToIndex(y);
      const iz = coordToIndex(z);
      const point = grid.get(voxelKey(ix, iy, iz));

      if (point) {
        totalSamples++;
        if (point.state.occupancyState === 'UNKNOWN' || point.state.entropy > 0.6) {
          highEntropyUnknowns++;
        } else if (point.state.occupancyState === 'KNOWN_MATTER' || point.state.occupancy > 0.6) {
          solidCollisions++;
        } else if (point.state.occupancyState === 'KNOWN_EMPTY' || point.state.occupancy < 0.3) {
          voidVerified++;
        }
      }
    }

    const isClear = solidCollisions === 0 && highEntropyUnknowns < 5;
    const answer = isClear
      ? `KNOWN FREE SPACE: Traversal corridor is verified free of solid obstacles (${voidVerified} voxels resolved to KNOWN_EMPTY via optical ray penetration).`
      : solidCollisions > 0
      ? `OBSTACLE DETECTED: Path intersects ${solidCollisions} confirmed solid voxels (KNOWN_MATTER). Traversal blocked.`
      : `CAUTION - UNKNOWN / HIGH UNCERTAINTY: Corridor contains ${highEntropyUnknowns} unobserved voxels. UNKNOWN != 0: Unobserved space must NOT be assumed free.`;

    return {
      id,
      timestamp,
      prompt,
      answer,
      value: isClear ? 'KNOWN_EMPTY' : solidCollisions > 0 ? 'KNOWN_MATTER' : 'UNKNOWN',
      confidence: Math.max(0.2, voidVerified / totalSamples),
      uncertainty: highEntropyUnknowns / totalSamples,
      meanEntropy: highEntropyUnknowns / totalSamples,
      evidence: `${voidVerified} voxels verified |Void⟩, ${solidCollisions} solid hits, ${highEntropyUnknowns} unobserved shadow voxels`,
      relevantVoxelCoords: pathCoords,
      metrics: {
        solidBlocks: solidCollisions,
        confirmedVoid: voidVerified,
        uncertainSteps: highEntropyUnknowns,
      },
      source: 'deterministic_physics',
    };
  }

  // 4. MOTION & VELOCITY QUERIES
  if (analysis.intent === 'motion' || analysis.intent === 'velocity') {
    let maxSpeed = 0;
    let fastestPoint: VoxelPoint | null = null;
    let movingCount = 0;

    for (const point of grid.values()) {
      if (point.state.knownMask.velocity && point.state.velocity !== null) {
        const [vx, vy, vz] = point.state.velocity;
        const speed = Math.hypot(vx, vy, vz);
        if (speed > 0.1) {
          movingCount++;
          if (speed > maxSpeed) {
            maxSpeed = speed;
            fastestPoint = point;
          }
        }
      }
    }

    if (movingCount === 0) {
      return {
        id,
        timestamp,
        prompt,
        answer: 'Radar Doppler Analysis: UNKNOWN / NO MOTION DETECTED. No non-zero velocity vectors are stored in the current Physical State Field. Trigger the mmWave Doppler Radar.',
        value: null,
        unit: 'm/s',
        confidence: 0.2,
        uncertainty: 0.8,
        meanEntropy: 0.8,
        evidence: 'zero cells with knownMask.velocity = true and speed > 0.1 m/s',
        source: 'deterministic_physics',
      };
    }

    const pos = fastestPoint!.position;
    const [vx, vy, vz] = fastestPoint!.state.velocity!;

    return {
      id,
      timestamp,
      prompt,
      answer: `Dynamic Motion Detected: Speed = ${maxSpeed.toFixed(2)} m/s, Velocity Vector = [${vx.toFixed(2)}, ${vy.toFixed(2)}, ${vz.toFixed(2)}] m/s at position [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]. Radar dielectric permittivity ε_r = ${fastestPoint!.state.dielectric?.toFixed(1) ?? 'UNKNOWN'}.`,
      value: Number(maxSpeed.toFixed(2)),
      unit: 'm/s',
      position: pos,
      confidence: fastestPoint!.state.propertyConfidences.velocity,
      uncertainty: fastestPoint!.state.propertyUncertainties.velocity,
      meanEntropy: fastestPoint!.state.entropy,
      evidence: `mmWave radar Doppler frequency shift measured across ${movingCount} moving spatial cells`,
      relevantVoxelCoords: [pos],
      metrics: {
        speedMps: maxSpeed.toFixed(2),
        dielectric: fastestPoint!.state.dielectric?.toFixed(1) ?? 'N/A',
        movingVoxelClusterSize: movingCount,
      },
      source: 'deterministic_physics',
    };
  }

  // 5. WHAT IS PREDICTED TO HAPPEN NEXT?
  if (analysis.intent === 'prediction') {
    // Find active moving or heated voxel
    let candidateVoxel: VoxelPoint | null = null;
    for (const point of grid.values()) {
      if (point.state.knownMask.velocity && point.state.velocity) {
        const spd = Math.hypot(point.state.velocity[0], point.state.velocity[1], point.state.velocity[2]);
        if (spd > 0.2) {
          candidateVoxel = point;
          break;
        }
      }
    }

    if (!candidateVoxel) {
      for (const point of grid.values()) {
        if (point.state.knownMask.temperature && point.state.temperature !== null && point.state.temperature > 30) {
          candidateVoxel = point;
          break;
        }
      }
    }

    if (!candidateVoxel) {
      return {
        id,
        timestamp,
        prompt,
        answer: 'BASELINE TEMPORAL PREDICTION: Insufficient dynamic or thermal activity observed to project trajectories. All cells remain in static or unobserved state.',
        value: null,
        confidence: 0.1,
        uncertainty: 0.9,
        meanEntropy: 0.9,
        evidence: 'No active velocity or elevated thermal gradient detected across grid',
        source: 'deterministic_physics',
      };
    }

    const pred = BaselineTemporalPrediction.predictVoxelTrajectory(candidateVoxel, 3.0, 5);
    const finalPt = pred.trajectory[pred.trajectory.length - 1];

    return {
      id,
      timestamp,
      prompt,
      answer: `BASELINE TEMPORAL PREDICTION (Horizon 3.0s):
• Initial State: Position [${candidateVoxel.position.x.toFixed(2)}, ${candidateVoxel.position.y.toFixed(2)}, ${candidateVoxel.position.z.toFixed(2)}].
• Projected Position at t=+3.0s: [${finalPt.position.x.toFixed(2)}, ${finalPt.position.y.toFixed(2)}, ${finalPt.position.z.toFixed(2)}].
• Predicted Velocity: [${finalPt.predictedVelocity[0].toFixed(2)}, ${finalPt.predictedVelocity[1].toFixed(2)}, ${finalPt.predictedVelocity[2].toFixed(2)}] m/s.
• Projected Uncertainty Growth: ${(pred.uncertainty * 100).toFixed(0)}% expanding forward in time.
${pred.explanation}`,
      value: [finalPt.position.x, finalPt.position.y, finalPt.position.z],
      unit: 'coordinates [x, y, z]',
      position: finalPt.position,
      confidence: pred.confidence,
      uncertainty: pred.uncertainty,
      meanEntropy: candidateVoxel.state.entropy,
      evidence: pred.method,
      relevantVoxelCoords: [candidateVoxel.position, finalPt.position],
      metrics: {
        horizonSeconds: 3.0,
        modelLabel: pred.label,
      },
      source: 'deterministic_physics',
    };
  }

  // 6. WHAT CHANGED HERE? (EVENT DETECTION)
  if (analysis.intent === 'change') {
    const events = EventDetectionEngine.scanWorldForEvents(grid);
    if (events.length === 0) {
      return {
        id,
        timestamp,
        prompt,
        answer: 'Physical State Field Change Audit: No state transitions recorded between current field and preceding snapshot. Trigger a new sensor sweep to record empirical physical deltas.',
        value: 0,
        unit: 'events',
        confidence: 0.8,
        uncertainty: 0.2,
        meanEntropy: 0.5,
        evidence: 'differential comparison against previousState yielded 0 threshold crossings',
        source: 'deterministic_physics',
      };
    }

    const summary = events.slice(0, 4).map((e) => `• [${e.type}] at [${e.position.x.toFixed(2)}, ${e.position.y.toFixed(2)}, ${e.position.z.toFixed(2)}]: ${e.evidence}`).join('\n');
    return {
      id,
      timestamp,
      prompt,
      answer: `Physical State Change Detection (${events.length} events logged):\n${summary}`,
      value: events.length,
      unit: 'events',
      position: events[0].position,
      confidence: events[0].confidence,
      uncertainty: events[0].uncertainty,
      meanEntropy: 0.3,
      evidence: events.map((e) => e.evidence).join('; '),
      relevantVoxelCoords: events.slice(0, 4).map((e) => e.position),
      metrics: {
        totalDetectedEvents: events.length,
        primaryEventType: events[0].type,
      },
      source: 'deterministic_physics',
    };
  }

  // 7. UNCERTAINTY & SHADOW AUDIT
  if (analysis.intent === 'uncertainty') {
    let unobservedCount = 0;
    let observedCount = 0;
    let sumEntropy = 0;

    for (const point of grid.values()) {
      sumEntropy += point.state.entropy;
      if (point.state.observationsCount === 0 || point.state.occupancyState === 'UNKNOWN') {
        unobservedCount++;
      } else {
        observedCount++;
      }
    }

    const meanS = sumEntropy / grid.size;
    return {
      id,
      timestamp,
      prompt,
      answer: `Epistemic Uncertainty & Quantum-Inspired Entropy Audit:
• Total Spatial Grid: ${grid.size} voxels across [-2.0, +2.0]³ bounds.
• Mean Field Entropy: S̄ = ${meanS.toFixed(3)} (1.0 = total unobserved uncertainty, 0.0 = measurement-induced uncertainty reduction).
• Observed Cells: ${observedCount} (${((observedCount / grid.size) * 100).toFixed(1)}%).
• High-Entropy Unknowns / Occluded Shadows: ${unobservedCount} (${((unobservedCount / grid.size) * 100).toFixed(1)}%).
• FUNDAMENTAL PRINCIPLE: UNKNOWN != 0. The volume behind occluding barriers retains maximum entropy (S ≈ 1.0) rather than hallucinating empty space.`,
      value: Number(meanS.toFixed(3)),
      unit: 'Von Neumann entropy S',
      confidence: 0.95,
      uncertainty: meanS,
      meanEntropy: meanS,
      evidence: `Exhaustive entropy integration over ${grid.size} discrete quantum-inspired state vectors`,
      metrics: {
        meanEntropy: meanS.toFixed(3),
        observedVoxels: observedCount,
        unknownVoxels: unobservedCount,
      },
      source: 'deterministic_physics',
    };
  }

  // 8. TACTILE FORCE PROBE
  if (analysis.intent === 'force') {
    let probedCount = 0;
    let maxPressure = 0;
    let probedVoxel: VoxelPoint | null = null;

    for (const point of grid.values()) {
      if (point.state.knownMask.pressure && point.state.pressure !== null) {
        probedCount++;
        if (point.state.pressure > maxPressure) {
          maxPressure = point.state.pressure;
          probedVoxel = point;
        }
      }
    }

    if (probedCount === 0) {
      return {
        id,
        timestamp,
        prompt,
        answer: 'Tactile Force & Contact Transducer: UNKNOWN / NO CONTACT. No physical contact probes have touched the field yet. Trigger the Tactile Force Probe to press against the copper specimen.',
        value: null,
        unit: 'kPa',
        confidence: 0.1,
        uncertainty: 0.9,
        meanEntropy: 0.9,
        evidence: 'zero cells with knownMask.pressure = true',
        source: 'deterministic_physics',
      };
    }

    return {
      id,
      timestamp,
      prompt,
      answer: `Tactile Force Probe Measurement:
• Direct Mechanical Contact Confirmed at [${probedVoxel?.position.x.toFixed(2)}, ${probedVoxel?.position.y.toFixed(2)}, ${probedVoxel?.position.z.toFixed(2)}].
• Contact Stress: ${maxPressure.toFixed(1)} kPa.
• Measurement-Induced Uncertainty Reduction: Occupancy resolved to pure solid (P=0.99, KNOWN_MATTER), entropy reduced to S=${probedVoxel?.state.entropy.toFixed(3)}.`,
      value: Number(maxPressure.toFixed(1)),
      unit: 'kPa',
      position: probedVoxel!.position,
      confidence: 0.98,
      uncertainty: 0.02,
      meanEntropy: probedVoxel!.state.entropy,
      evidence: 'Direct contact transducer resistance measurement with normal stress confirmation',
      relevantVoxelCoords: [probedVoxel!.position],
      metrics: {
        contactPressureKPa: maxPressure.toFixed(1),
        probedCells: probedCount,
      },
      source: 'deterministic_physics',
    };
  }

  // GENERAL DEFAULT
  return {
    id,
    timestamp,
    prompt,
    answer: `Physical State Field Overview:
• Discretized Spatial Substrate: ${grid.size} points.
• Active Sensor Modalities: Optical RGB-D, FLIR Infrared Radiometer, mmWave Doppler Radar, Tactile Contact Transducer.
• Invariant: UNKNOWN != 0.
• Supported Deterministic Queries:
  - "What is the temperature at this location?"
  - "Is this location occupied?"
  - "Is this space known to be free?"
  - "What is moving here?"
  - "What is the velocity?"
  - "How uncertain is this region?"
  - "What changed here?"
  - "What is predicted to happen next?"`,
    confidence: 0.9,
    uncertainty: 0.1,
    meanEntropy: 0.4,
    evidence: 'Physical state substrate query dispatcher',
    source: 'deterministic_physics',
  };
}
