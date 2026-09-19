import { 
  QuantumStateVector, 
  PhysicalStateSnapshot, 
  VoxelPoint,
  Vector3D 
} from '../types/quantumField';

export interface WorldSnapshot {
  id: string;
  timestamp: number;
  label: string;
  voxelSnapshots: Map<string, PhysicalStateSnapshot>;
}

export interface StateDifference {
  voxelId: string;
  position: Vector3D;
  property: string;
  valueA: any;
  valueB: any;
  delta: number | null;
  significant: boolean;
}

export class TemporalWorld {
  private snapshots: WorldSnapshot[] = [];
  private historyLimit: number;

  constructor(historyLimit = 50) {
    this.historyLimit = historyLimit;
  }

  /**
   * Captures an immutable snapshot of the entire physical state field
   */
  public captureSnapshot(
    voxels: Map<string, VoxelPoint>,
    label = 'Sensor sweep checkpoint'
  ): WorldSnapshot {
    const timestamp = Date.now();
    const voxelMap = new Map<string, PhysicalStateSnapshot>();

    for (const [id, v] of voxels.entries()) {
      // Deep freeze / clone snapshot
      const snap: PhysicalStateSnapshot = {
        timestamp: v.state.lastObservedTimestamp || timestamp,
        occupancy: v.state.knownMask.occupancy ? v.state.occupancy : null,
        occupancyState: v.state.occupancyState,
        temperature: v.state.temperature,
        velocity: v.state.velocity ? [...v.state.velocity] : null,
        pressure: v.state.pressure,
        light: v.state.light ? [...v.state.light] : null,
        energy: v.state.energy,
        dielectric: v.state.dielectric,
        entropy: v.state.entropy,
        confidence: v.state.confidence,
        uncertainty: v.state.uncertainty,
      };
      voxelMap.set(id, Object.freeze(snap));
    }

    const snapshot: WorldSnapshot = {
      id: `snap_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp,
      label,
      voxelSnapshots: voxelMap,
    };

    this.snapshots.push(Object.freeze(snapshot) as WorldSnapshot);
    if (this.snapshots.length > this.historyLimit) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  public getSnapshots(): readonly WorldSnapshot[] {
    return this.snapshots;
  }

  public getSnapshotById(id: string): WorldSnapshot | undefined {
    return this.snapshots.find((s) => s.id === id);
  }

  /**
   * Compares two snapshots to identify all physical property shifts
   */
  public compareStates(snapshotIdA: string, snapshotIdB: string): StateDifference[] {
    const snapA = this.getSnapshotById(snapshotIdA);
    const snapB = this.getSnapshotById(snapshotIdB);
    if (!snapA || !snapB) return [];

    const diffs: StateDifference[] = [];

    for (const [id, stateA] of snapA.voxelSnapshots.entries()) {
      const stateB = snapB.voxelSnapshots.get(id);
      if (!stateB) continue;

      // Check temperature shift
      if (stateA.temperature !== null && stateB.temperature !== null) {
        const deltaTemp = stateB.temperature - stateA.temperature;
        if (Math.abs(deltaTemp) > 1.0) {
          diffs.push({
            voxelId: id,
            position: { x: 0, y: 0, z: 0 },
            property: 'temperature',
            valueA: stateA.temperature,
            valueB: stateB.temperature,
            delta: deltaTemp,
            significant: Math.abs(deltaTemp) > 5.0,
          });
        }
      }

      // Check occupancy shift
      if (stateA.occupancy !== null && stateB.occupancy !== null) {
        const deltaOcc = stateB.occupancy - stateA.occupancy;
        if (Math.abs(deltaOcc) > 0.15) {
          diffs.push({
            voxelId: id,
            position: { x: 0, y: 0, z: 0 },
            property: 'occupancy',
            valueA: stateA.occupancy,
            valueB: stateB.occupancy,
            delta: deltaOcc,
            significant: Math.abs(deltaOcc) > 0.4,
          });
        }
      }

      // Check velocity shift
      if (stateA.velocity && stateB.velocity) {
        const speedA = Math.hypot(stateA.velocity[0], stateA.velocity[1], stateA.velocity[2]);
        const speedB = Math.hypot(stateB.velocity[0], stateB.velocity[1], stateB.velocity[2]);
        const deltaSpeed = speedB - speedA;
        if (Math.abs(deltaSpeed) > 0.1) {
          diffs.push({
            voxelId: id,
            position: { x: 0, y: 0, z: 0 },
            property: 'velocity',
            valueA: speedA,
            valueB: speedB,
            delta: deltaSpeed,
            significant: Math.abs(deltaSpeed) > 0.5,
          });
        }
      }
    }

    return diffs;
  }

  /**
   * Retrieves temporal series for a given voxel property across all recorded snapshots
   */
  public propertySeries(
    voxelId: string,
    property: 'temperature' | 'occupancy' | 'entropy' | 'confidence' | 'pressure'
  ): { timestamp: number; value: number | null }[] {
    const series: { timestamp: number; value: number | null }[] = [];

    for (const snap of this.snapshots) {
      const v = snap.voxelSnapshots.get(voxelId);
      if (v) {
        series.push({
          timestamp: snap.timestamp,
          value: v[property] as number | null,
        });
      }
    }

    return series;
  }

  /**
   * Linear extrapolation prediction for a scalar property based on snapshot history
   */
  public predictProperty(
    voxelId: string,
    property: 'temperature' | 'occupancy' | 'pressure',
    dtSeconds = 1.0
  ): { predictedValue: number | null; confidence: number; method: string } {
    const series = this.propertySeries(voxelId, property).filter((s) => s.value !== null);
    if (series.length < 2) {
      return {
        predictedValue: series.length === 1 ? (series[0].value as number) : null,
        confidence: 0.2,
        method: 'constant_prior',
      };
    }

    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    const dtHistory = (last.timestamp - prev.timestamp) / 1000;
    if (dtHistory <= 0) {
      return { predictedValue: last.value as number, confidence: 0.4, method: 'last_known' };
    }

    const rateOfChange = ((last.value as number) - (prev.value as number)) / dtHistory;
    const predicted = (last.value as number) + rateOfChange * dtSeconds;

    return {
      predictedValue: Number(predicted.toFixed(2)),
      confidence: 0.65,
      method: 'BASELINE TEMPORAL PREDICTION (linear extrapolation)',
    };
  }
}
