import { Vector3D, SensorType, SensorObservation } from '../types/quantumField';

export interface BaseSensorReading<T> {
  raw: T;
  timestamp: number;
  sensorId: string;
  sensorType: SensorType;
  origin: Vector3D;
  target?: Vector3D;
  noiseLevel: number;
}

export interface RGBDRawReading {
  rayDirection: Vector3D;
  distance: number;
  hasHit: boolean;
  surfaceNormal?: Vector3D;
  color?: [number, number, number];
}

export interface ThermalRawReading {
  targetCoord: Vector3D;
  radiantTemperatureC: number;
  emissivityEstimate: number;
}

export interface RadarRawReading {
  targetCoord: Vector3D;
  dopplerShiftHz: number;
  radialVelocityMps: number;
  velocityVector: [number, number, number];
  rcs: number; // radar cross section
  permittivityEstimate: number;
}

export interface ForceRawReading {
  contactCoord: Vector3D;
  forceNewtons: number;
  contactAreaMm2: number;
  pressureKPa: number;
  contactConfirmed: boolean;
}

export type AnyRawReading = 
  | BaseSensorReading<RGBDRawReading>
  | BaseSensorReading<ThermalRawReading>
  | BaseSensorReading<RadarRawReading>
  | BaseSensorReading<ForceRawReading>;
