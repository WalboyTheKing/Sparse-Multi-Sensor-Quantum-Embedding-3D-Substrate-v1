import { 
  Vector3D, 
  QuantumStateVector, 
  PhysicalStateSnapshot,
  VoxelPoint 
} from '../types/quantumField';

export interface TrajectoryPoint {
  timeSeconds: number;
  position: Vector3D;
  predictedVelocity: [number, number, number];
  predictedTemperature: number | null;
  uncertaintyEstimate: number;
}

export interface PredictionResult {
  label: 'BASELINE TEMPORAL PREDICTION';
  targetVoxelId: string;
  horizonSeconds: number;
  trajectory: TrajectoryPoint[];
  method: string;
  confidence: number;
  uncertainty: number;
  explanation: string;
}

export class BaselineTemporalPrediction {
  public static readonly MODEL_LABEL = 'BASELINE TEMPORAL PREDICTION';

  /**
   * Deterministically predicts state trajectory into the future (e.g. 1.0s, 2.0s, 3.0s)
   * using linear first-order extrapolation:
   * x(t + dt) = x(t) + v(t) * dt
   * Uncertainty expands with time: σ(t + dt) = σ(t) * (1 + 0.15 * dt)
   */
  public static predictVoxelTrajectory(
    voxel: VoxelPoint,
    horizonSeconds = 3.0,
    timeSteps = 6
  ): PredictionResult {
    const curr = voxel.state;
    const trajectory: TrajectoryPoint[] = [];
    const dt = horizonSeconds / timeSteps;

    const vel = curr.velocity || [0, 0, 0];
    const initialPos = voxel.position;
    const initialTemp = curr.temperature;

    for (let step = 1; step <= timeSteps; step++) {
      const t = step * dt;
      // Linear kinematics: x = x0 + v * t
      const predPos: Vector3D = {
        x: Number((initialPos.x + vel[0] * t).toFixed(3)),
        y: Number((initialPos.y + vel[1] * t).toFixed(3)),
        z: Number((initialPos.z + vel[2] * t).toFixed(3)),
      };

      // Thermal dissipation towards ambient 20°C if heated
      let predTemp: number | null = null;
      if (initialTemp !== null) {
        const ambient = 20.0;
        const decayRate = 0.05; // 5% cooling per second
        predTemp = Number((ambient + (initialTemp - ambient) * Math.exp(-decayRate * t)).toFixed(1));
      }

      // Uncertainty grows forward in time (entropy dispersion)
      const baseUncertainty = curr.uncertainty;
      const uncertaintyAtT = Math.min(1.0, Number((baseUncertainty + (1 - baseUncertainty) * (1 - Math.exp(-0.25 * t))).toFixed(2)));

      trajectory.push({
        timeSeconds: Number(t.toFixed(1)),
        position: predPos,
        predictedVelocity: [vel[0], vel[1], vel[2]],
        predictedTemperature: predTemp,
        uncertaintyEstimate: uncertaintyAtT,
      });
    }

    const avgConfidence = Math.max(0.1, curr.confidence * 0.85);

    return {
      label: this.MODEL_LABEL,
      targetVoxelId: voxel.id,
      horizonSeconds,
      trajectory,
      method: 'Deterministic 1st-order linear kinematic extrapolation with exponential thermal relaxation',
      confidence: Number(avgConfidence.toFixed(2)),
      uncertainty: Number((1.0 - avgConfidence).toFixed(2)),
      explanation: `Extrapolated kinematic vector [${vel[0].toFixed(2)}, ${vel[1].toFixed(2)}, ${vel[2].toFixed(2)}] m/s over ${horizonSeconds}s horizon. Epistemic uncertainty expands from ${(curr.uncertainty * 100).toFixed(0)}% to ${(trajectory[trajectory.length - 1].uncertaintyEstimate * 100).toFixed(0)}%.`,
    };
  }
}
