/**
 * Types and interfaces for the Physical State Field (Quantum-Embedding World Model)
 * 
 * Fundamental Invariant: UNKNOWN != 0.
 * An unobserved location is never interpreted as measured zero.
 * The system clearly distinguishes:
 * 1. UNKNOWN
 * 2. KNOWN EMPTY / FREE SPACE
 * 3. KNOWN MATTER
 * 4. CONFLICTING / UNCERTAIN STATE
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ComplexNum {
  re: number;
  im: number;
}

export type SensorType = 'rgbd' | 'thermal' | 'radar' | 'force_probe' | 'lidar';

export type OccupancyClassification = 
  | 'UNKNOWN' 
  | 'KNOWN_EMPTY' 
  | 'KNOWN_MATTER' 
  | 'CONFLICTING_UNCERTAIN';

export type UnknownSubtype = 'occluded' | 'unobserved' | 'insufficient_coverage';

export interface KnownMask {
  occupancy: boolean;
  light: boolean;
  temperature: boolean;
  velocity: boolean;
  pressure: boolean;
  energy: boolean;
  dielectric: boolean;
}

export interface PropertyConfidences {
  occupancy: number;
  light: number;
  temperature: number;
  velocity: number;
  pressure: number;
  energy: number;
  dielectric: number;
}

export interface SensorObservationRecord {
  sensorType: SensorType;
  timestamp: number;
  observedProperty: string;
  value: number | [number, number, number] | string;
  confidence: number;
  uncertainty: number;
}

export interface PhysicalStateSnapshot {
  timestamp: number;
  occupancy: number | null;
  occupancyState: OccupancyClassification;
  unknownSubtype?: UnknownSubtype;
  temperature: number | null;
  velocity: [number, number, number] | null;
  pressure: number | null;
  light: [number, number, number] | null;
  energy: number | null;
  dielectric: number | null;
  entropy: number;
  confidence: number;
  uncertainty: number;
}

export interface QuantumStateVector {
  // Superposition basis for occupancy: |Void⟩ and |Matter⟩
  psiVoid: ComplexNum;
  psiMatter: ComplexNum;

  // Occupancy classification
  occupancyState: OccupancyClassification;
  unknownSubtype?: UnknownSubtype;
  
  // Observable expectation values (nullable/masked: UNKNOWN != 0)
  occupancy: number; // probability ∈ [0, 1] (0.5 = maximum epistemic uncertainty, not 50% matter)
  light: [number, number, number] | null; // [R, G, B] normalized, null if unobserved
  color: [number, number, number]; // Fallback display color for visualizer
  temperature: number | null; // in °C (null if unobserved)
  velocity: [number, number, number] | null; // [vx, vy, vz] in m/s (null if unobserved)
  pressure: number | null; // in kPa (contact stress, null if unobserved)
  energy: number | null; // in J/m³ or radiated thermal flux (null if unobserved)
  dielectric: number | null; // radar permittivity / reflectivity (null if unobserved)
  time: number; // timestamp of state

  // Known/Unknown Mask (Explicit epistemic record)
  knownMask: KnownMask;

  // Property-specific confidence and uncertainty
  propertyConfidences: PropertyConfidences;
  propertyUncertainties: PropertyConfidences;

  // Quantum information metrics
  entropy: number; // Von Neumann entropy S ∈ [0, 1], 1 = complete unknown
  confidence: number; // 1 - entropy ∈ [0, 1]
  uncertainty: number; // Epistemic uncertainty ∈ [0, 1]
  purity: number; // Tr(ρ²) ∈ [0.5, 1.0]
  coherence: number; // off-diagonal coherence measure

  // Provenance metadata
  observationsCount: number;
  contributingSensors: SensorType[];
  sensorHistory: SensorType[];
  detailedHistory: SensorObservationRecord[];
  firstObservedTimestamp: number;
  lastObservedTimestamp: number;

  // Temporal states
  previousState?: PhysicalStateSnapshot;
  currentState: PhysicalStateSnapshot;
  predictedState?: PhysicalStateSnapshot;
}

export interface VoxelKey {
  ix: number;
  iy: number;
  iz: number;
}

export interface VoxelPoint extends VoxelKey {
  id: string;
  position: Vector3D;
  state: QuantumStateVector;
  resolutionLevel?: number;
  cellSize?: number;
}

export interface PhysicalObject {
  id: string;
  name: string;
  type: 'warm_metal_cylinder' | 'cold_acrylic_cube' | 'dynamic_sphere' | 'organic_barrier';
  position: Vector3D;
  size: Vector3D;
  color: [number, number, number];
  trueTemperature: number;
  trueVelocity: [number, number, number];
  trueHardness: number; // kPa
  trueDielectric: number;
}

export interface SensorConfig {
  id: string;
  type: SensorType;
  name: string;
  description: string;
  enabled: boolean;
  position: Vector3D;
  target: Vector3D;
  range: number;
  fov: number; // in degrees
  noiseStd: number;
  color: string;
  isFiring?: boolean;
}

export type RenderMode = 
  | 'composite' 
  | 'matter' 
  | 'thermal' 
  | 'entropy' 
  | 'velocity' 
  | 'pressure' 
  | 'confidence'
  | 'purity';

export interface PhysicalQuery {
  id: string;
  timestamp: number;
  prompt: string;
  answer: string;
  value?: number | string | [number, number, number] | null;
  unit?: string;
  position?: Vector3D;
  confidence: number;
  uncertainty: number;
  meanEntropy: number;
  evidence: string;
  relevantVoxelCoords?: Vector3D[];
  metrics?: Record<string, string | number>;
  source: 'deterministic_physics' | 'openai' | 'grok' | 'llm_verbalization';
}

export interface FieldStatistics {
  totalVoxels: number;
  observedVoxels: number;
  unobservedVoxels: number;
  meanEntropy: number;
  informationGainBits: number;
  maxTemperature: number;
  maxVelocity: number;
  maxPressure: number;
  activeRegionsCount?: number;
  eventsCount?: number;
  situationsCount?: number;
}

// Sensor Unified Observation
export interface SensorObservation<T = unknown> {
  id: string;
  sensorType: SensorType;
  timestamp: number;
  position: Vector3D;
  direction: Vector3D;
  range: number;
  value: T;
  confidence: number;
  uncertainty: number;
  metadata?: Record<string, unknown>;
}

// Event Detection
export type PhysicalEventType = 
  | 'matter_appeared'
  | 'matter_disappeared'
  | 'temperature_increased'
  | 'temperature_decreased'
  | 'motion_increased'
  | 'motion_decreased'
  | 'pressure_changed'
  | 'confidence_changed_significantly';

export interface PhysicalEvent {
  id: string;
  type: PhysicalEventType;
  position: Vector3D;
  property: string;
  previousValue: number | string | null;
  currentValue: number | string | null;
  delta: number | null;
  confidence: number;
  uncertainty: number;
  timestamp: number;
  evidence: string;
}

// World Situations
export interface WorldSituation {
  id: string;
  positions: Vector3D[];
  properties: string[];
  eventTypes: PhysicalEventType[];
  relations: string;
  confidence: number;
  uncertainty: number;
  temporalContext: { start: number; end: number };
  evidence: string[];
  description: string;
}

// World Snapshots
export interface WorldSnapshot {
  id: string;
  timestamp: number;
  label: string;
  voxelSnapshots: Map<string, PhysicalStateSnapshot>;
}
