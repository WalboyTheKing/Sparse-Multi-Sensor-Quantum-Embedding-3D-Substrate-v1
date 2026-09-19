import { Vector3D, VoxelPoint, QuantumStateVector } from '../types/quantumField';
import { createMaximumUncertaintyPriorState } from './quantumEmbedding';
import { SpatialIndex, SparseWorld } from './sparseWorld';

export interface RefinementTriggerCriteria {
  minUncertaintyForRefine?: number; // e.g., > 0.8
  minActivityVelocity?: number; // e.g., > 0.3 m/s
  queryFocusRegion?: { center: Vector3D; radius: number };
  maxResolutionLevel?: number; // default 2
}

export class AdaptiveSpatialResolution {
  private spatialIndex: SpatialIndex;
  private sparseWorld: SparseWorld;
  private bounds: number;
  private maxLevel: number;

  constructor(sparseWorld: SparseWorld, maxLevel = 2) {
    this.sparseWorld = sparseWorld;
    this.spatialIndex = sparseWorld.getSpatialIndex();
    this.bounds = this.spatialIndex.getBounds();
    this.maxLevel = maxLevel;
  }

  public cellKey(ix: number, iy: number, iz: number, level: number): string {
    return this.spatialIndex.key(ix, iy, iz, level);
  }

  public cellSize(level: number): number {
    const baseDim = this.spatialIndex.getBaseResolution();
    return (2 * this.bounds) / (baseDim * Math.pow(2, level));
  }

  /**
   * Locates the active cell key covering a 3D coordinate at the highest available resolution
   */
  public locate(pos: Vector3D, level = 0): { key: string; cellSize: number; level: number } {
    const key = this.spatialIndex.positionToKey(pos, this.spatialIndex.getBaseResolution(), level);
    return {
      key,
      cellSize: this.cellSize(level),
      level,
    };
  }

  /**
   * Refines a coarse spatial cell into 8 finer sub-cells (octree-style subdivision),
   * inheriting prior evidence or preserving UNKNOWN state.
   */
  public refine(parentKey: string): VoxelPoint[] {
    const { level, ix, iy, iz } = this.spatialIndex.parseKey(parentKey);
    if (level >= this.maxLevel) return [];

    const parentVoxel = this.sparseWorld.getByKey(parentKey);
    const parentState = parentVoxel ? parentVoxel.state : createMaximumUncertaintyPriorState();

    const nextLevel = level + 1;
    const subCellSize = this.cellSize(nextLevel);
    const children: VoxelPoint[] = [];

    // 2x2x2 subdivision
    for (let ox = 0; ox < 2; ox++) {
      for (let oy = 0; oy < 2; oy++) {
        for (let oz = 0; oz < 2; oz++) {
          const childIx = ix * 2 + ox;
          const childIy = iy * 2 + oy;
          const childIz = iz * 2 + oz;
          const childKey = this.cellKey(childIx, childIy, childIz, nextLevel);

          const childPos: Vector3D = {
            x: -this.bounds + (childIx + 0.5) * subCellSize,
            y: -this.bounds + (childIy + 0.5) * subCellSize,
            z: -this.bounds + (childIz + 0.5) * subCellSize,
          };

          // Child inherits parent's properties with slightly increased uncertainty prior to local measurement
          const childState: QuantumStateVector = {
            ...parentState,
            observationsCount: parentState.observationsCount,
            entropy: Math.min(1.0, parentState.entropy * 1.05),
            uncertainty: Math.min(1.0, parentState.uncertainty * 1.05),
            confidence: Math.max(0.0, parentState.confidence * 0.95),
          };

          const childVoxel: VoxelPoint = {
            id: childKey,
            ix: childIx,
            iy: childIy,
            iz: childIz,
            position: childPos,
            state: childState,
            resolutionLevel: nextLevel,
            cellSize: subCellSize,
          };

          this.sparseWorld.set(childVoxel);
          children.push(childVoxel);
        }
      }
    }

    return children;
  }

  /**
   * Refines a cell if it meets uncertainty, activity, query, or sensor density thresholds
   */
  public refineIfNeeded(voxel: VoxelPoint, criteria: RefinementTriggerCriteria = {}): boolean {
    const currentLevel = voxel.resolutionLevel || 0;
    const maxAllowed = criteria.maxResolutionLevel ?? this.maxLevel;
    if (currentLevel >= maxAllowed) return false;

    let shouldRefine = false;

    // 1. High uncertainty trigger
    if (criteria.minUncertaintyForRefine && voxel.state.uncertainty > criteria.minUncertaintyForRefine) {
      shouldRefine = true;
    }

    // 2. High physical activity trigger (Doppler velocity)
    if (voxel.state.velocity) {
      const speed = Math.hypot(voxel.state.velocity[0], voxel.state.velocity[1], voxel.state.velocity[2]);
      if (criteria.minActivityVelocity && speed > criteria.minActivityVelocity) {
        shouldRefine = true;
      }
    }

    // 3. Query focus region
    if (criteria.queryFocusRegion) {
      const { center, radius } = criteria.queryFocusRegion;
      const dist = Math.hypot(
        voxel.position.x - center.x,
        voxel.position.y - center.y,
        voxel.position.z - center.z
      );
      if (dist <= radius) {
        shouldRefine = true;
      }
    }

    if (shouldRefine) {
      this.refine(voxel.id);
      return true;
    }

    return false;
  }
}
