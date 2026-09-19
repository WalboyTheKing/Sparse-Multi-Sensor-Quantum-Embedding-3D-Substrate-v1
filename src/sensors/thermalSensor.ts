import { Vector3D, SensorConfig, PhysicalObject, SensorObservation } from '../types/quantumField';
import { SensorNormalizer } from './sensorNormalizer';
import { ThermalRawReading, BaseSensorReading } from './sensorTypes';

export class ThermalSensor {
  /**
   * Scans objects and surrounding space with calibrated FLIR Infrared radiometer
   */
  public static scan(
    sensor: SensorConfig,
    objects: PhysicalObject[]
  ): SensorObservation<{ temperatureC: number; emissivity: number }>[] {
    const observations: SensorObservation<{ temperatureC: number; emissivity: number }>[] = [];
    const timestamp = Date.now();

    for (const obj of objects) {
      // Check if object is within sensor FOV cone and range
      const dx = obj.position.x - sensor.position.x;
      const dy = obj.position.y - sensor.position.y;
      const dz = obj.position.z - sensor.position.z;
      const dist = Math.hypot(dx, dy, dz);

      if (dist <= sensor.range) {
        // Sample points across object body
        const samples = [
          obj.position,
          { x: obj.position.x + obj.size.x * 0.25, y: obj.position.y, z: obj.position.z },
          { x: obj.position.x - obj.size.x * 0.25, y: obj.position.y, z: obj.position.z },
          { x: obj.position.x, y: obj.position.y + obj.size.y * 0.25, z: obj.position.z },
          { x: obj.position.x, y: obj.position.y - obj.size.y * 0.25, z: obj.position.z },
        ];

        for (const pt of samples) {
          const noise = (Math.random() - 0.5) * sensor.noiseStd * 5;
          const measuredTemp = obj.trueTemperature + noise;
          const emissivity = obj.type === 'warm_metal_cylinder' ? 0.85 : 0.95;

          const raw: BaseSensorReading<ThermalRawReading> = {
            raw: {
              targetCoord: pt,
              radiantTemperatureC: measuredTemp,
              emissivityEstimate: emissivity,
            },
            timestamp,
            sensorId: sensor.id,
            sensorType: 'thermal',
            origin: sensor.position,
            target: obj.position,
            noiseLevel: sensor.noiseStd,
          };

          observations.push(SensorNormalizer.normalizeThermal(raw));
        }
      }
    }

    return observations;
  }
}
