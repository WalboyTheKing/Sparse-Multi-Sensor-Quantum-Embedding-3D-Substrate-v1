import { Vector3D, VoxelPoint, QuantumStateVector } from '../types/quantumField';
import { createMaximumUncertaintyPriorState } from './quantumEmbedding';

export class SpatialIndex {
  private bounds: number;
  private baseResolution: number;

  constructor(bounds = 2.0, baseResolution = 8) {
    this.bounds = bounds;
    this.baseResolution = baseResolution;
  }

  public getBounds(): number {
    return this.bounds;
  }

  public getBaseResolution(): number {
    return this.baseResolution;
  }

  public coordToIndex(val: number, resolution = this.baseResolution): number {
    const norm = (val + this.bounds) / (2 * this.bounds);
    return Math.max(0, Math.min(resolution - 1, Math.floor(norm * resolution)));
  }

  public indexToCoord(i: number, resolution = this.baseResolution): number {
    const step = (2 * this.bounds) / resolution;
    return -this.bounds + (i + 0.5) * step;
  }

  public key(ix: number, iy: number, iz: number, level = 0): string {
    return `${level}:${ix},${iy},${iz}`;
  }

  public parseKey(key: string): { level: number; ix: number; iy: number; iz: number } {
    const [lvlStr, coords] = key.split(':');
    const [ix, iy, iz] = coords.split(',').map(Number);
    return { level: Number(lvlStr), ix, iy, iz };
  }

  public positionToKey(pos: Vector3D, resolution = this.baseResolution, level = 0): string {
    const ix = this.coordToIndex(pos.x, resolution);
    const iy = this.coordToIndex(pos.y, resolution);
    const iz = this.coordToIndex(pos.z, resolution);
    return this.key(ix, iy, iz, level);
  }
}

export class SparseWorld {
  private spatialIndex: SpatialIndex;
  private sparseCells: Map<string, VoxelPoint>;
  private defaultBounds: number;
  private baseDim: number;

  constructor(bounds = 2.0, baseDim = 8) {
    this.defaultBounds = bounds;
    this.baseDim = baseDim;
    this.spatialIndex = new SpatialIndex(bounds, baseDim);
    this.sparseCells = new Map<string, VoxelPoint>();
  }

  public getSpatialIndex(): SpatialIndex {
    return this.spatialIndex;
  }

  public getCellCount(): number {
    return this.sparseCells.size;
  }

  public getActiveCells(): Map<string, VoxelPoint> {
    return this.sparseCells;
  }

  /**
   * Retrieves a cell at the specified coordinates.
   * If unobserved/not allocated, returns a fresh Maximum Uncertainty Prior State (UNKNOWN != 0)
   * without allocating persistent memory until modified.
   */
  public get(x: number, y: number, z: number, level = 0): VoxelPoint {
    const key = this.spatialIndex.positionToKey({ x, y, z }, this.baseDim, level);
    const existing = this.sparseCells.get(key);
    if (existing) {
      return existing;
    }

    const { ix, iy, iz } = this.spatialIndex.parseKey(key);
    const cellSize = (2 * this.defaultBounds) / (this.baseDim * Math.pow(2, level));

    return {
      id: key,
      ix,
      iy,
      iz,
      position: {
        x: this.spatialIndex.indexToCoord(ix, this.baseDim),
        y: this.spatialIndex.indexToCoord(iy, this.baseDim),
        z: this.spatialIndex.indexToCoord(iz, this.baseDim),
      },
      state: createMaximumUncertaintyPriorState(),
      resolutionLevel: level,
      cellSize,
    };
  }

  public getByKey(key: string): VoxelPoint | undefined {
    return this.sparseCells.get(key);
  }

  public set(voxel: VoxelPoint): void {
    this.sparseCells.set(voxel.id, voxel);
  }

  public updateState(id: string, updater: (prev: QuantumStateVector) => QuantumStateVector): VoxelPoint {
    const existing = this.sparseCells.get(id);
    if (existing) {
      const nextState = updater(existing.state);
      const updated: VoxelPoint = { ...existing, state: nextState };
      this.sparseCells.set(id, updated);
      return updated;
    }

    // Allocate on first write
    const { level, ix, iy, iz } = this.spatialIndex.parseKey(id);
    const cellSize = (2 * this.defaultBounds) / (this.baseDim * Math.pow(2, level));
    const pos: Vector3D = {
      x: this.spatialIndex.indexToCoord(ix, this.baseDim),
      y: this.spatialIndex.indexToCoord(iy, this.baseDim),
      z: this.spatialIndex.indexToCoord(iz, this.baseDim),
    };

    const nextState = updater(createMaximumUncertaintyPriorState());
    const newVoxel: VoxelPoint = {
      id,
      ix,
      iy,
      iz,
      position: pos,
      state: nextState,
      resolutionLevel: level,
      cellSize,
    };
    this.sparseCells.set(id, newVoxel);
    return newVoxel;
  }

  public clear(): void {
    this.sparseCells.clear();
  }

  /**
   * Exports dense or sparse map representation for rendering
   */
  public toMap(): Map<string, VoxelPoint> {
    return new Map(this.sparseCells);
  }
}
