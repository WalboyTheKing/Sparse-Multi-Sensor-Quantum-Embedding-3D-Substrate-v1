import { Vector3D, SensorConfig, PhysicalObject, SensorObservation } from '../types/quantumField';
import { SensorNormalizer } from './sensorNormalizer';
import { RadarRawReading, BaseSensorReading } from './sensorTypes';

export class RadarSensor {
  /**
   * Scans target scene with Millimeter-Wave Doppler Radar.
   * Penetrates light occluders and measures Doppler velocity vector, radial speed, dielectric permittivity.
   */
  public static scan(
    sensor: SensorConfig,
    objects: PhysicalObject[]
  ): SensorObservation<{ velocityVector: [number, number, number]; speed: number; dielectric: number }>[] {
    const observations: SensorObservation<{ velocityVector: [number, number, number]; speed: number; dielectric: number }>[] = [];
    const timestamp = Date.now();

    for (const obj of objects) {
      const dx = obj.position.x - sensor.position.x;
      const dy = obj.position.y - sensor.position.y;
      const dz = obj.position.z - sensor.position.z;
      const dist = Math.hypot(dx, dy, dz);

      if (dist <= sensor.range) {
        const velNoiseX = (Math.random() - 0.5) * sensor.noiseStd * 0.2;
        const velNoiseY = (Math.random() - 0.5) * sensor.noiseStd * 0.2;
        const velNoiseZ = (Math.random() - 0.5) * sensor.noiseStd * 0.2;

        const measuredVel: [number, number, number] = [
          obj.trueVelocity[0] + velNoiseX,
          obj.trueVelocity[1] + velNoiseY,
          obj.trueVelocity[2] + velNoiseZ,
        ];

        // Doppler frequency shift: Δf = 2 * v_radial * f0 / c
        const radVel = (measuredVel[0] * dx + measuredVel[1] * dy + measuredVel[2] * dz) / dist;
        const carrierFreqHz = 77e9; // 77 GHz mmWave automotive radar
        const c = 3e8;
        const dopplerHz = (2 * radVel * carrierFreqHz) / c;

        const raw: BaseSensorReading<RadarRawReading> = {
          raw: {
            targetCoord: obj.position,
            dopplerShiftHz: dopplerHz,
            radialVelocityMps: radVel,
            velocityVector: measuredVel,
            rcs: obj.type === 'dynamic_sphere' ? 1.5 : 0.8,
            permittivityEstimate: obj.trueDielectric,
          },
          timestamp,
          sensorId: sensor.id,
          sensorType: 'radar',
          origin: sensor.position,
          target: obj.position,
          noiseLevel: sensor.noiseStd,
        };

        observations.push(SensorNormalizer.normalizeRadar(raw));
      }
    }

    return observations;
  }
}
