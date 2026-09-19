import { 
  Vector3D, 
  QuantumStateVector, 
  PhysicalObject, 
  SensorConfig,
  VoxelPoint
} from '../types/quantumField';
import { 
  createVacuumPriorState, 
  updateWithRGBD, 
  updateWithThermal, 
  updateWithRadar, 
  updateWithForceProbe 
} from './quantumEmbedding';

export const GRID_SIZE = 14; // 14x14x14 = 2,744 points for smooth real-time 60fps rendering
export const WORLD_BOUNDS = 2.0; // from -2.0 to +2.0 in X, Y, Z

export function voxelKey(ix: number, iy: number, iz: number): string {
  return `${ix},${iy},${iz}`;
}

export function indexToCoord(i: number): number {
  return -WORLD_BOUNDS + (i / (GRID_SIZE - 1)) * (2 * WORLD_BOUNDS);
}

export function coordToIndex(val: number): number {
  const norm = (val + WORLD_BOUNDS) / (2 * WORLD_BOUNDS);
  return Math.max(0, Math.min(GRID_SIZE - 1, Math.round(norm * (GRID_SIZE - 1))));
}

/**
 * Initializes the spatial grid where EVERY voxel starts as a quantum vacuum prior
 * Unknown = high entropy / low confidence.
 */
export function initializeQuantumGrid(): Map<string, VoxelPoint> {
  const grid = new Map<string, VoxelPoint>();

  for (let ix = 0; ix < GRID_SIZE; ix++) {
    for (let iy = 0; iy < GRID_SIZE; iy++) {
      for (let iz = 0; iz < GRID_SIZE; iz++) {
        const id = voxelKey(ix, iy, iz);
        const position: Vector3D = {
          x: indexToCoord(ix),
          y: indexToCoord(iy),
          z: indexToCoord(iz),
        };
        grid.set(id, {
          id,
          ix,
          iy,
          iz,
          position,
          state: createVacuumPriorState(),
        });
      }
    }
  }

  return grid;
}

/**
 * Default ground truth physical world objects for multi-sensor simulation
 */
export const DEFAULT_PHYSICAL_OBJECTS: PhysicalObject[] = [
  {
    id: 'copper_core',
    name: 'Heated Copper Cylinder',
    type: 'warm_metal_cylinder',
    position: { x: 0.4, y: -0.2, z: 0.2 },
    size: { x: 0.6, y: 0.8, z: 0.6 },
    color: [0.88, 0.42, 0.22],
    trueTemperature: 78.5, // hot
    trueVelocity: [0, 0, 0],
    trueHardness: 145,
    trueDielectric: 6.2,
  },
  {
    id: 'acrylic_cube',
    name: 'Cold Acrylic Specimen',
    type: 'cold_acrylic_cube',
    position: { x: -0.6, y: 0.3, z: -0.3 },
    size: { x: 0.7, y: 0.7, z: 0.7 },
    color: [0.15, 0.75, 0.95],
    trueTemperature: 6.0, // cold
    trueVelocity: [0, 0, 0],
    trueHardness: 85,
    trueDielectric: 3.1,
  },
  {
    id: 'dynamic_target',
    name: 'Dynamic Radar Target',
    type: 'dynamic_sphere',
    position: { x: 0.2, y: 0.8, z: -0.4 },
    size: { x: 0.5, y: 0.5, z: 0.5 },
    color: [0.95, 0.85, 0.2],
    trueTemperature: 36.5,
    trueVelocity: [0.75, -0.35, 0.5], // moving!
    trueHardness: 110,
    trueDielectric: 9.0,
  },
  {
    id: 'occluder_shield',
    name: 'Occluding Shield Wall',
    type: 'organic_barrier',
    position: { x: 0.0, y: -0.5, z: 1.1 },
    size: { x: 1.2, y: 0.8, z: 0.2 },
    color: [0.35, 0.38, 0.45],
    trueTemperature: 21.0,
    trueVelocity: [0, 0, 0],
    trueHardness: 60,
    trueDielectric: 2.2,
  },
];

/**
 * Checks if a point in 3D space intersects any ground-truth physical object
 */
export function queryGroundTruth(pos: Vector3D, objects = DEFAULT_PHYSICAL_OBJECTS): PhysicalObject | null {
  for (const obj of objects) {
    const halfX = obj.size.x / 2;
    const halfY = obj.size.y / 2;
    const halfZ = obj.size.z / 2;

    const inX = Math.abs(pos.x - obj.position.x) <= halfX;
    const inY = Math.abs(pos.y - obj.position.y) <= halfY;
    const inZ = Math.abs(pos.z - obj.position.z) <= halfZ;

    if (inX && inY && inZ) {
      return obj;
    }
  }
  return null;
}

/**
 * Default multi-sensor suite:
 * 1. RGB-D Vision & Depth Camera
 * 2. FLIR Thermal Radiometer
 * 3. Doppler Millimeter-Wave Radar
 * 4. Tactile Contact Force Probe
 */
export const DEFAULT_SENSORS: SensorConfig[] = [
  {
    id: 'sensor_rgbd',
    type: 'rgbd',
    name: 'RGB-D Optical Frustum',
    description: 'Line-of-sight depth raycast & color. Leaves shadows in high entropy.',
    enabled: true,
    position: { x: 0.0, y: 0.4, z: 3.2 },
    target: { x: 0.0, y: 0.0, z: 0.0 },
    range: 4.5,
    fov: 55,
    noiseStd: 0.02,
    color: '#38bdf8', // Sky cyan
  },
  {
    id: 'sensor_thermal',
    type: 'thermal',
    name: 'FLIR Thermal Sensor',
    description: 'Measures radiative surface temperature & heat dispersion.',
    enabled: true,
    position: { x: 2.8, y: 0.8, z: 0.5 },
    target: { x: 0.0, y: 0.0, z: 0.0 },
    range: 4.0,
    fov: 45,
    noiseStd: 0.5,
    color: '#f97316', // Warm orange
  },
  {
    id: 'sensor_radar',
    type: 'radar',
    name: 'mmWave Doppler Radar',
    description: 'Penetrative RF pulses detecting velocity & dielectric permittivity.',
    enabled: true,
    position: { x: -2.8, y: 0.2, z: 0.0 },
    target: { x: 0.0, y: 0.0, z: 0.0 },
    range: 4.5,
    fov: 60,
    noiseStd: 0.05,
    color: '#a855f7', // Radar purple
  },
  {
    id: 'sensor_force',
    type: 'force_probe',
    name: 'Tactile Force Probe',
    description: 'Physical contact transducer collapsing spatial uncertainty to zero.',
    enabled: true,
    position: { x: 0.4, y: 1.8, z: 0.2 },
    target: { x: 0.4, y: -0.2, z: 0.2 }, // Aims at Heated Copper Cylinder
    range: 2.5,
    fov: 10,
    noiseStd: 0.01,
    color: '#10b981', // Emerald green
  },
];

/**
 * Raycasts RGB-D sensor through the 3D quantum grid.
 * Updates visible surfaces to Solid/RGB and traversed vacuum to Void.
 * Occluded areas behind solid objects remain completely untouched (High Entropy!).
 */
export function fireRGBDSensor(
  grid: Map<string, VoxelPoint>,
  sensor: SensorConfig,
  objects = DEFAULT_PHYSICAL_OBJECTS
): { updatedCount: number; occludedCount: number } {
  let updatedCount = 0;
  let occludedCount = 0;

  const raySteps = 45;
  const rayAngleCount = 18;

  // Cast ray cone
  for (let a = 0; a < rayAngleCount; a++) {
    for (let b = 0; b < rayAngleCount; b++) {
      const u = (a / (rayAngleCount - 1) - 0.5) * (sensor.fov * Math.PI / 180);
      const v = (b / (rayAngleCount - 1) - 0.5) * (sensor.fov * Math.PI / 180);

      // Ray direction from sensor towards target + angles
      const dx = sensor.target.x - sensor.position.x;
      const dy = sensor.target.y - sensor.position.y;
      const dz = sensor.target.z - sensor.position.z;
      const baseDist = Math.hypot(dx, dy, dz);
      const fwd = { x: dx / baseDist, y: dy / baseDist, z: dz / baseDist };

      // Simple rotation around up & right
      const rDir: Vector3D = {
        x: fwd.x + u,
        y: fwd.y + v,
        z: fwd.z - 0.5 * (u * u + v * v),
      };
      const len = Math.hypot(rDir.x, rDir.y, rDir.z);
      rDir.x /= len;
      rDir.y /= len;
      rDir.z /= len;

      let hasHitSurface = false;
      const visitedInRay = new Set<string>();

      for (let step = 1; step <= raySteps; step++) {
        const dist = (step / raySteps) * sensor.range;
        const curPos: Vector3D = {
          x: sensor.position.x + rDir.x * dist,
          y: sensor.position.y + rDir.y * dist,
          z: sensor.position.z + rDir.z * dist,
        };

        // Check if inside grid boundary
        if (
          Math.abs(curPos.x) > WORLD_BOUNDS ||
          Math.abs(curPos.y) > WORLD_BOUNDS ||
          Math.abs(curPos.z) > WORLD_BOUNDS
        ) {
          continue;
        }

        const ix = coordToIndex(curPos.x);
        const iy = coordToIndex(curPos.y);
        const iz = coordToIndex(curPos.z);
        const key = voxelKey(ix, iy, iz);

        if (visitedInRay.has(key)) continue;
        visitedInRay.add(key);

        const point = grid.get(key);
        if (!point) continue;

        if (hasHitSurface) {
          // Point is behind an occluding object!
          // We DO NOT update this point - it stays in its high-entropy quantum state!
          if (point.state.observationsCount === 0) {
            point.state.unknownSubtype = 'occluded';
            if (point.state.currentState) {
              point.state.currentState.unknownSubtype = 'occluded';
            }
          }
          occludedCount++;
          continue;
        }

        const hitObject = queryGroundTruth(curPos, objects);
        if (hitObject) {
          // Surface hit!
          point.state = updateWithRGBD(point.state, true, hitObject.color);
          hasHitSurface = true;
          updatedCount++;
        } else {
          // Empty space along line of sight
          point.state = updateWithRGBD(point.state, false);
          updatedCount++;
        }
      }
    }
  }

  return { updatedCount, occludedCount };
}

/**
 * Fires the Thermal (FLIR Infrared) radiometer.
 * Detects infrared emission from surfaces within FOV, writes true temperature into embedding.
 */
export function fireThermalSensor(
  grid: Map<string, VoxelPoint>,
  sensor: SensorConfig,
  objects = DEFAULT_PHYSICAL_OBJECTS
): { updatedCount: number } {
  let updatedCount = 0;

  for (const point of grid.values()) {
    const pos = point.position;
    // Check if within thermal cone and range
    const toPoint: Vector3D = {
      x: pos.x - sensor.position.x,
      y: pos.y - sensor.position.y,
      z: pos.z - sensor.position.z,
    };
    const dist = Math.hypot(toPoint.x, toPoint.y, toPoint.z);
    if (dist > sensor.range || dist < 0.1) continue;

    // Check angle relative to sensor target
    const toTarget: Vector3D = {
      x: sensor.target.x - sensor.position.x,
      y: sensor.target.y - sensor.position.y,
      z: sensor.target.z - sensor.position.z,
    };
    const targetDist = Math.hypot(toTarget.x, toTarget.y, toTarget.z);
    const dot = (toPoint.x * toTarget.x + toPoint.y * toTarget.y + toPoint.z * toTarget.z) / (dist * targetDist);
    const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

    if (angleDeg <= sensor.fov / 2) {
      const hitObject = queryGroundTruth(pos, objects);
      const measuredTemp = hitObject ? hitObject.trueTemperature : 20.0;
      // Add small sensor noise
      const noisyTemp = measuredTemp + (Math.random() - 0.5) * sensor.noiseStd;
      
      point.state = updateWithThermal(point.state, noisyTemp);
      updatedCount++;
    }
  }

  return { updatedCount };
}

/**
 * Fires the Millimeter-Wave Radar.
 * Penetrates air and light boundaries, measures Doppler velocity and dielectric constant.
 */
export function fireRadarSensor(
  grid: Map<string, VoxelPoint>,
  sensor: SensorConfig,
  objects = DEFAULT_PHYSICAL_OBJECTS
): { updatedCount: number } {
  let updatedCount = 0;

  for (const point of grid.values()) {
    const pos = point.position;
    const toPoint = {
      x: pos.x - sensor.position.x,
      y: pos.y - sensor.position.y,
      z: pos.z - sensor.position.z,
    };
    const dist = Math.hypot(toPoint.x, toPoint.y, toPoint.z);
    if (dist > sensor.range || dist < 0.1) continue;

    const hitObject = queryGroundTruth(pos, objects);
    if (hitObject) {
      // Radar returns Doppler velocity and dielectric value
      const vel = hitObject.trueVelocity;
      const noisyVel: [number, number, number] = [
        vel[0] + (Math.random() - 0.5) * sensor.noiseStd,
        vel[1] + (Math.random() - 0.5) * sensor.noiseStd,
        vel[2] + (Math.random() - 0.5) * sensor.noiseStd,
      ];
      point.state = updateWithRadar(point.state, noisyVel, hitObject.trueDielectric);
      updatedCount++;
    }
  }

  return { updatedCount };
}

/**
 * Simulates the Tactile / Contact Force Probe.
 * Extends probe from its position towards its target until contact with matter occurs.
 * Collapses uncertainty at contact coordinate to near-zero ($S \approx 0.02$).
 */
export function fireForceProbe(
  grid: Map<string, VoxelPoint>,
  sensor: SensorConfig,
  objects = DEFAULT_PHYSICAL_OBJECTS
): { contactFound: boolean; contactPoint?: Vector3D; pressure?: number } {
  const steps = 30;
  const dir: Vector3D = {
    x: sensor.target.x - sensor.position.x,
    y: sensor.target.y - sensor.position.y,
    z: sensor.target.z - sensor.position.z,
  };
  const totalDist = Math.hypot(dir.x, dir.y, dir.z);
  const normDir = { x: dir.x / totalDist, y: dir.y / totalDist, z: dir.z / totalDist };

  for (let s = 1; s <= steps; s++) {
    const d = (s / steps) * totalDist;
    const testPos: Vector3D = {
      x: sensor.position.x + normDir.x * d,
      y: sensor.position.y + normDir.y * d,
      z: sensor.position.z + normDir.z * d,
    };

    const hitObject = queryGroundTruth(testPos, objects);
    if (hitObject) {
      // Direct tactile contact made!
      const ix = coordToIndex(testPos.x);
      const iy = coordToIndex(testPos.y);
      const iz = coordToIndex(testPos.z);
      const key = voxelKey(ix, iy, iz);
      const point = grid.get(key);

      if (point) {
        point.state = updateWithForceProbe(point.state, hitObject.trueHardness, true);
      }

      // Also collapse immediate adjacent neighbor voxels
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const nKey = voxelKey(ix + dx, iy + dy, iz + dz);
            const nPoint = grid.get(nKey);
            if (nPoint && nKey !== key) {
              nPoint.state = updateWithForceProbe(nPoint.state, hitObject.trueHardness * 0.7, true);
            }
          }
        }
      }

      return {
        contactFound: true,
        contactPoint: testPos,
        pressure: hitObject.trueHardness,
      };
    }
  }

  return { contactFound: false };
}
