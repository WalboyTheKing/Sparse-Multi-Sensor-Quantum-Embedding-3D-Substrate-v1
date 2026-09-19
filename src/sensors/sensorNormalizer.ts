import { SensorObservation, SensorType, Vector3D } from '../types/quantumField';
import { 
  RGBDRawReading, 
  ThermalRawReading, 
  RadarRawReading, 
  ForceRawReading, 
  BaseSensorReading 
} from './sensorTypes';

export class SensorNormalizer {
  /**
   * Normalizes an RGB-D raw reading into a standard SensorObservation
   */
  public static normalizeRGBD(
    reading: BaseSensorReading<RGBDRawReading>
  ): SensorObservation<{ hasHit: boolean; distance: number; color?: [number, number, number] }> {
    const raw = reading.raw;
    const confidence = Math.max(0.1, Math.min(0.99, 1.0 - reading.noiseLevel * 0.5));
    const uncertainty = 1.0 - confidence;

    return {
      id: `obs_rgbd_${reading.timestamp}_${Math.random().toString(36).substr(2, 6)}`,
      sensorType: 'rgbd',
      timestamp: reading.timestamp,
      position: reading.origin,
      direction: raw.rayDirection,
      range: raw.distance,
      value: {
        hasHit: raw.hasHit,
        distance: raw.distance,
        color: raw.color,
      },
      confidence,
      uncertainty,
      metadata: {
        sensorId: reading.sensorId,
        surfaceNormal: raw.surfaceNormal,
      },
    };
  }

  /**
   * Normalizes a Thermal IR raw reading
   */
  public static normalizeThermal(
    reading: BaseSensorReading<ThermalRawReading>
  ): SensorObservation<{ temperatureC: number; emissivity: number }> {
    const raw = reading.raw;
    // Calibrate radiometric temperature
    const calibratedTemp = raw.radiantTemperatureC / Math.max(0.1, Math.min(1.0, raw.emissivityEstimate));
    const confidence = Math.max(0.2, Math.min(0.95, 0.9 - reading.noiseLevel * 0.4));
    const uncertainty = 1.0 - confidence;

    const dx = raw.targetCoord.x - reading.origin.x;
    const dy = raw.targetCoord.y - reading.origin.y;
    const dz = raw.targetCoord.z - reading.origin.z;
    const range = Math.hypot(dx, dy, dz);
    const direction: Vector3D = range > 1e-4 
      ? { x: dx / range, y: dy / range, z: dz / range } 
      : { x: 0, y: 0, z: 1 };

    return {
      id: `obs_thermal_${reading.timestamp}_${Math.random().toString(36).substr(2, 6)}`,
      sensorType: 'thermal',
      timestamp: reading.timestamp,
      position: raw.targetCoord,
      direction,
      range,
      value: {
        temperatureC: Number(calibratedTemp.toFixed(1)),
        emissivity: raw.emissivityEstimate,
      },
      confidence,
      uncertainty,
      metadata: {
        sensorId: reading.sensorId,
        rawTemp: raw.radiantTemperatureC,
      },
    };
  }

  /**
   * Normalizes a Radar raw Doppler observation
   */
  public static normalizeRadar(
    reading: BaseSensorReading<RadarRawReading>
  ): SensorObservation<{ velocityVector: [number, number, number]; speed: number; dielectric: number }> {
    const raw = reading.raw;
    const speed = Math.hypot(raw.velocityVector[0], raw.velocityVector[1], raw.velocityVector[2]);
    const confidence = Math.max(0.3, Math.min(0.92, 0.85 - reading.noiseLevel * 0.3));
    const uncertainty = 1.0 - confidence;

    const dx = raw.targetCoord.x - reading.origin.x;
    const dy = raw.targetCoord.y - reading.origin.y;
    const dz = raw.targetCoord.z - reading.origin.z;
    const range = Math.hypot(dx, dy, dz);
    const direction: Vector3D = range > 1e-4 
      ? { x: dx / range, y: dy / range, z: dz / range } 
      : { x: 0, y: 0, z: 1 };

    return {
      id: `obs_radar_${reading.timestamp}_${Math.random().toString(36).substr(2, 6)}`,
      sensorType: 'radar',
      timestamp: reading.timestamp,
      position: raw.targetCoord,
      direction,
      range,
      value: {
        velocityVector: raw.velocityVector,
        speed: Number(speed.toFixed(2)),
        dielectric: raw.permittivityEstimate,
      },
      confidence,
      uncertainty,
      metadata: {
        sensorId: reading.sensorId,
        dopplerShiftHz: raw.dopplerShiftHz,
        rcs: raw.rcs,
      },
    };
  }

  /**
   * Normalizes a Force/Contact probe reading
   */
  public static normalizeForce(
    reading: BaseSensorReading<ForceRawReading>
  ): SensorObservation<{ pressureKPa: number; forceN: number; contactConfirmed: boolean }> {
    const raw = reading.raw;
    // Physical contact measurement gives near zero uncertainty
    const confidence = raw.contactConfirmed ? 0.98 : 0.1;
    const uncertainty = 1.0 - confidence;

    return {
      id: `obs_force_${reading.timestamp}_${Math.random().toString(36).substr(2, 6)}`,
      sensorType: 'force_probe',
      timestamp: reading.timestamp,
      position: raw.contactCoord,
      direction: { x: 0, y: -1, z: 0 },
      range: 0,
      value: {
        pressureKPa: raw.pressureKPa,
        forceN: raw.forceNewtons,
        contactConfirmed: raw.contactConfirmed,
      },
      confidence,
      uncertainty,
      metadata: {
        sensorId: reading.sensorId,
        contactAreaMm2: raw.contactAreaMm2,
      },
    };
  }
}
