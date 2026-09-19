import { Vector3D, SensorConfig, PhysicalObject, SensorObservation } from '../types/quantumField';
import { SensorNormalizer } from './sensorNormalizer';
import { ForceRawReading, BaseSensorReading } from './sensorTypes';

export class ForceSensor {
  /**
   * Simulates a robotic contact force/tactile probe.
   * Traverses along probe direction from probe origin towards target.
   * If physical boundary is touched, records contact pressure in kPa and triggers
   * measurement-induced uncertainty reduction ("quantum-inspired state collapse").
   */
  public static probe(
    sensor: SensorConfig,
    objects: PhysicalObject[]
  ): {
    observation: SensorObservation<{ pressureKPa: number; forceN: number; contactConfirmed: boolean }> | null;
    contactPoint: Vector3D | null;
    contactObject: PhysicalObject | null;
  } {
    const timestamp = Date.now();
    const probeOrigin = sensor.position;
    const probeTarget = sensor.target;

    const dx = probeTarget.x - probeOrigin.x;
    const dy = probeTarget.y - probeOrigin.y;
    const dz = probeTarget.z - probeOrigin.z;
    const totalDist = Math.hypot(dx, dy, dz);
    const steps = 60;

    let contactPoint: Vector3D | null = null;
    let hitObject: PhysicalObject | null = null;

    // Step probe tip forward
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const currPos: Vector3D = {
        x: probeOrigin.x + dx * t,
        y: probeOrigin.y + dy * t,
        z: probeOrigin.z + dz * t,
      };

      for (const obj of objects) {
        const halfX = obj.size.x / 2;
        const halfY = obj.size.y / 2;
        const halfZ = obj.size.z / 2;

        if (
          Math.abs(currPos.x - obj.position.x) <= halfX &&
          Math.abs(currPos.y - obj.position.y) <= halfY &&
          Math.abs(currPos.z - obj.position.z) <= halfZ
        ) {
          contactPoint = currPos;
          hitObject = obj;
          break;
        }
      }

      if (contactPoint) break;
    }

    if (contactPoint && hitObject) {
      const noise = (Math.random() - 0.5) * sensor.noiseStd * 10;
      const pressure = hitObject.trueHardness + noise;
      const contactAreaMm2 = 12.5; // 4mm tip
      const forceN = (pressure * 1000 * contactAreaMm2) / 1e6;

      const raw: BaseSensorReading<ForceRawReading> = {
        raw: {
          contactCoord: contactPoint,
          forceNewtons: forceN,
          contactAreaMm2,
          pressureKPa: pressure,
          contactConfirmed: true,
        },
        timestamp,
        sensorId: sensor.id,
        sensorType: 'force_probe',
        origin: sensor.position,
        target: contactPoint,
        noiseLevel: sensor.noiseStd,
      };

      return {
        observation: SensorNormalizer.normalizeForce(raw),
        contactPoint,
        contactObject: hitObject,
      };
    }

    return {
      observation: null,
      contactPoint: null,
      contactObject: null,
    };
  }
}
