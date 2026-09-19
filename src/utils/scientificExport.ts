import { VoxelPoint, SensorConfig, PhysicalEvent } from '../types/quantumField';
import { computeFieldMetrics } from '../core/quantumEmbedding';

export interface ScientificExportPackage {
  metadata: {
    experiment_id: string;
    timestamp: string;
    timestamp_ms: number;
    scientific_standard: string;
    grid_dimensions: {
      nx: number;
      ny: number;
      nz: number;
      boundsMeters: [number, number];
      cellSizeMeters: number;
      totalCells: number;
    };
    voxel_count: number;
    observed_voxels: number;
    unknown_voxels: number;
    epistemic_breakdown: {
      occluded: number;
      unobserved: number;
      insufficient_coverage: number;
    };
    sensor_configuration: Array<{
      id: string;
      name: string;
      type: string;
      enabled: boolean;
      position: { x: number; y: number; z: number };
      target: { x: number; y: number; z: number };
      range: number;
      fov: number;
      noiseStd: number;
    }>;
    sensor_observations_total: number;
    state_history_count: number;
    events_count: number;
    entropy_metrics: {
      meanFieldEntropy: number;
      informationGainBits: number;
    };
    prediction_metrics: {
      activeMovingRegions: number;
      maxVelocity: number;
      maxPressure: number;
      maxTemperature: number;
    };
  };
  field: Array<{
    id: string;
    position: [number, number, number];
    gridIndex: [number, number, number];
    occupancy: number;
    occupancyState: string;
    unknownSubtype?: string;
    temperature: number | null;
    velocity: [number, number, number] | null;
    pressure: number | null;
    dielectric: number | null;
    energy: number | null;
    entropy: number;
    confidence: number;
    purity: number;
    coherence: number;
    knownMask: Record<string, boolean>;
    contributingSensors: string[];
    observationsCount: number;
    lastObservedTimestamp: number;
  }>;
  events: PhysicalEvent[];
  snapshots: any[];
  metrics: {
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
  };
}

/**
 * Compiles the complete scientific dataset following the 5-part specification:
 * metadata.json, field.json, events.json, snapshots.json, metrics.json
 */
export function buildScientificExport(
  grid: Map<string, VoxelPoint>,
  sensors: SensorConfig[],
  events: PhysicalEvent[],
  snapshots: any[],
  experimentId = 'physical_state_field_experiment'
): ScientificExportPackage {
  const voxelStateMap = new Map();
  let totalObservations = 0;

  for (const [k, v] of grid.entries()) {
    voxelStateMap.set(k, v.state);
    totalObservations += v.state.observationsCount;
  }

  const fieldMetrics = computeFieldMetrics(voxelStateMap);

  const fieldArray = Array.from(grid.values()).map((pt) => ({
    id: pt.id,
    position: [
      Number(pt.position.x.toFixed(3)),
      Number(pt.position.y.toFixed(3)),
      Number(pt.position.z.toFixed(3)),
    ] as [number, number, number],
    gridIndex: [pt.ix, pt.iy, pt.iz] as [number, number, number],
    occupancy: Number(pt.state.occupancy.toFixed(3)),
    occupancyState: pt.state.occupancyState,
    unknownSubtype: pt.state.unknownSubtype,
    temperature: pt.state.temperature !== null ? Number(pt.state.temperature.toFixed(2)) : null,
    velocity: (pt.state.velocity && pt.state.velocity.length === 3
      ? [Number(pt.state.velocity[0].toFixed(3)), Number(pt.state.velocity[1].toFixed(3)), Number(pt.state.velocity[2].toFixed(3))]
      : null) as [number, number, number] | null,
    pressure: pt.state.pressure !== null ? Number(pt.state.pressure.toFixed(2)) : null,
    dielectric: pt.state.dielectric !== null ? Number(pt.state.dielectric.toFixed(2)) : null,
    energy: pt.state.energy !== null ? Number(pt.state.energy.toFixed(2)) : null,
    entropy: Number(pt.state.entropy.toFixed(3)),
    confidence: Number(pt.state.confidence.toFixed(3)),
    purity: Number(pt.state.purity.toFixed(3)),
    coherence: Number(pt.state.coherence.toFixed(3)),
    knownMask: { ...pt.state.knownMask },
    contributingSensors: [...pt.state.contributingSensors],
    observationsCount: pt.state.observationsCount,
    lastObservedTimestamp: pt.state.lastObservedTimestamp,
  }));

  const now = Date.now();

  const metadata = {
    experiment_id: experimentId,
    timestamp: new Date(now).toISOString(),
    timestamp_ms: now,
    scientific_standard: 'The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance.',
    grid_dimensions: {
      nx: 14,
      ny: 14,
      nz: 14,
      boundsMeters: [-1.96, 1.96] as [number, number],
      cellSizeMeters: 0.28,
      totalCells: grid.size,
    },
    voxel_count: grid.size,
    observed_voxels: fieldMetrics.observedVoxels,
    unknown_voxels: fieldMetrics.unobservedVoxels + fieldMetrics.occludedVoxels + fieldMetrics.insufficientCoverageVoxels,
    epistemic_breakdown: {
      occluded: fieldMetrics.occludedVoxels,
      unobserved: fieldMetrics.unobservedVoxels,
      insufficient_coverage: fieldMetrics.insufficientCoverageVoxels,
    },
    sensor_configuration: sensors.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      enabled: s.enabled,
      position: { ...s.position },
      target: { ...s.target },
      range: s.range,
      fov: s.fov,
      noiseStd: s.noiseStd,
    })),
    sensor_observations_total: totalObservations,
    state_history_count: snapshots.length,
    events_count: events.length,
    entropy_metrics: {
      meanFieldEntropy: fieldMetrics.meanEntropy,
      informationGainBits: fieldMetrics.informationGainBits,
    },
    prediction_metrics: {
      activeMovingRegions: fieldMetrics.activeRegionsCount || 0,
      maxVelocity: fieldMetrics.maxVelocity,
      maxPressure: fieldMetrics.maxPressure,
      maxTemperature: fieldMetrics.maxTemperature,
    },
  };

  return {
    metadata,
    field: fieldArray,
    events,
    snapshots,
    metrics: fieldMetrics,
  };
}

/**
 * Triggers a browser download of a JSON object.
 */
export function downloadJsonFile(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
