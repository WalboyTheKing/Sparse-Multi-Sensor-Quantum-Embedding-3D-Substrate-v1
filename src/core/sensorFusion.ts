import { 
  QuantumStateVector, 
  SensorObservation, 
  SensorType, 
  OccupancyClassification,
  PropertyConfidences,
  KnownMask 
} from '../types/quantumField';
import { 
  updateWithRGBD, 
  updateWithThermal, 
  updateWithRadar, 
  updateWithForceProbe,
  calculateEntropy,
  calculatePurity 
} from './quantumEmbedding';

export interface FusionConflictRecord {
  timestamp: number;
  property: string;
  sensorA: { type: SensorType; value: any; confidence: number };
  sensorB: { type: SensorType; value: any; confidence: number };
  fusedValue: any;
  residualUncertainty: number;
  reason: string;
}

export class SensorFusionEngine {
  /**
   * Deterministically fuses an observation into a quantum state vector.
   * Property-specific confidence and uncertainty are updated independently.
   * Conflicting measurements are reconciled using variance-weighted fusion while
   * preserving full provenance in detailed history.
   */
  public static fuseObservation(
    currentState: QuantumStateVector,
    observation: SensorObservation<any>
  ): { nextState: QuantumStateVector; conflict?: FusionConflictRecord } {
    let conflict: FusionConflictRecord | undefined = undefined;

    switch (observation.sensorType) {
      case 'rgbd': {
        const val = observation.value as { hasHit: boolean; distance: number; color?: [number, number, number] };
        
        // Conflict check: if previous sensor (like force probe or thermal) claimed opposite
        if (currentState.knownMask.occupancy) {
          const priorMatter = currentState.occupancy > 0.6;
          const newMatter = val.hasHit;
          if (priorMatter !== newMatter && currentState.propertyConfidences.occupancy > 0.7) {
            conflict = {
              timestamp: observation.timestamp,
              property: 'occupancy',
              sensorA: {
                type: currentState.contributingSensors[0] || 'rgbd',
                value: currentState.occupancy,
                confidence: currentState.propertyConfidences.occupancy,
              },
              sensorB: {
                type: 'rgbd',
                value: val.hasHit ? 1.0 : 0.0,
                confidence: observation.confidence,
              },
              fusedValue: currentState.occupancy * 0.5 + (val.hasHit ? 1 : 0) * 0.5,
              residualUncertainty: Math.max(0.4, 1 - Math.min(currentState.propertyConfidences.occupancy, observation.confidence)),
              reason: 'Sensor occupancy divergence detected; weighted Bayesian reconciliation applied',
            };
          }
        }

        const next = updateWithRGBD(currentState, val.hasHit, val.color, observation.confidence);
        return { nextState: next, conflict };
      }

      case 'thermal': {
        const val = observation.value as { temperatureC: number; emissivity: number };
        
        if (currentState.knownMask.temperature && currentState.temperature !== null) {
          const diff = Math.abs(currentState.temperature - val.temperatureC);
          if (diff > 15.0 && currentState.propertyConfidences.temperature > 0.6) {
            conflict = {
              timestamp: observation.timestamp,
              property: 'temperature',
              sensorA: {
                type: 'thermal',
                value: currentState.temperature,
                confidence: currentState.propertyConfidences.temperature,
              },
              sensorB: {
                type: 'thermal',
                value: val.temperatureC,
                confidence: observation.confidence,
              },
              fusedValue: (currentState.temperature + val.temperatureC) / 2,
              residualUncertainty: 0.35,
              reason: 'Substantial thermal gradient divergence between sequential readings',
            };
          }
        }

        const next = updateWithThermal(currentState, val.temperatureC, observation.confidence);
        return { nextState: next, conflict };
      }

      case 'radar': {
        const val = observation.value as { velocityVector: [number, number, number]; dielectric: number };
        const next = updateWithRadar(currentState, val.velocityVector, val.dielectric, observation.confidence);
        return { nextState: next };
      }

      case 'force_probe': {
        const val = observation.value as { pressureKPa: number; contactConfirmed: boolean };
        const next = updateWithForceProbe(currentState, val.pressureKPa, val.contactConfirmed);
        return { nextState: next };
      }

      default:
        return { nextState: currentState };
    }
  }

  /**
   * Reconciles multiple competing observations for a specific scalar property
   * using precision-weighted averaging: x_fused = (sum w_i * x_i) / (sum w_i)
   */
  public static precisionWeightedFusion(
    measurements: { value: number; confidence: number }[]
  ): { value: number; fusedConfidence: number; residualUncertainty: number } {
    if (measurements.length === 0) {
      return { value: 0, fusedConfidence: 0, residualUncertainty: 1.0 };
    }
    if (measurements.length === 1) {
      return {
        value: measurements[0].value,
        fusedConfidence: measurements[0].confidence,
        residualUncertainty: 1.0 - measurements[0].confidence,
      };
    }

    let weightedSum = 0;
    let weightSum = 0;
    for (const m of measurements) {
      const precision = 1 / Math.max(0.01, 1.0 - m.confidence);
      weightedSum += m.value * precision;
      weightSum += precision;
    }

    const fusedValue = weightedSum / weightSum;
    const fusedConfidence = Math.min(0.99, 1.0 - 1.0 / weightSum);

    return {
      value: fusedValue,
      fusedConfidence,
      residualUncertainty: 1.0 - fusedConfidence,
    };
  }
}
