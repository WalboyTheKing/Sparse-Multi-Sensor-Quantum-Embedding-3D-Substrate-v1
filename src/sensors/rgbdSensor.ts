import { Vector3D, SensorConfig, PhysicalObject, SensorObservation } from '../types/quantumField';
import { SensorNormalizer } from './sensorNormalizer';
import { RGBDRawReading, BaseSensorReading } from './sensorTypes';

export interface RayHitResult {
  hit: boolean;
  distance: number;
  hitPoint?: Vector3D;
  object?: PhysicalObject;
}

export class RGBDSensor {
  public static intersectRayWithBox(
    origin: Vector3D,
    direction: Vector3D,
    boxPos: Vector3D,
    boxSize: Vector3D
  ): { hit: boolean; distance: number; normal?: Vector3D } {
    const halfX = boxSize.x / 2;
    const halfY = boxSize.y / 2;
    const halfZ = boxSize.z / 2;

    const minX = boxPos.x - halfX;
    const maxX = boxPos.x + halfX;
    const minY = boxPos.y - halfY;
    const maxY = boxPos.y + halfY;
    const minZ = boxPos.z - halfZ;
    const maxZ = boxPos.z + halfZ;

    const invDx = direction.x !== 0 ? 1 / direction.x : 1e9;
    const invDy = direction.y !== 0 ? 1 / direction.y : 1e9;
    const invDz = direction.z !== 0 ? 1 / direction.z : 1e9;

    const t1 = (minX - origin.x) * invDx;
    const t2 = (maxX - origin.x) * invDx;
    const t3 = (minY - origin.y) * invDy;
    const t4 = (maxY - origin.y) * invDy;
    const t5 = (minZ - origin.z) * invDz;
    const t6 = (maxZ - origin.z) * invDz;

    const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    if (tmax < 0 || tmin > tmax) {
      return { hit: false, distance: Infinity };
    }

    const dist = tmin >= 0 ? tmin : tmax;
    return { hit: true, distance: dist };
  }

  public static castRay(
    origin: Vector3D,
    direction: Vector3D,
    objects: PhysicalObject[],
    maxRange: number
  ): RayHitResult {
    let closestDist = maxRange;
    let hitObj: PhysicalObject | undefined = undefined;

    for (const obj of objects) {
      const res = this.intersectRayWithBox(origin, direction, obj.position, obj.size);
      if (res.hit && res.distance < closestDist && res.distance > 0.05) {
        closestDist = res.distance;
        hitObj = obj;
      }
    }

    if (hitObj) {
      return {
        hit: true,
        distance: closestDist,
        hitPoint: {
          x: origin.x + direction.x * closestDist,
          y: origin.y + direction.y * closestDist,
          z: origin.z + direction.z * closestDist,
        },
        object: hitObj,
      };
    }

    return {
      hit: false,
      distance: maxRange,
    };
  }

  /**
   * Generates a batch of normalized RGB-D observations for a sensor sweep
   */
  public static scan(
    sensor: SensorConfig,
    objects: PhysicalObject[]
  ): SensorObservation<{ hasHit: boolean; distance: number; color?: [number, number, number] }>[] {
    const observations: SensorObservation<{ hasHit: boolean; distance: number; color?: [number, number, number] }>[] = [];
    const numRaysX = 16;
    const numRaysY = 16;
    const halfFovRad = ((sensor.fov / 2) * Math.PI) / 180;

    // Compute camera coordinate frame
    const fx = sensor.target.x - sensor.position.x;
    const fy = sensor.target.y - sensor.position.y;
    const fz = sensor.target.z - sensor.position.z;
    const flen = Math.hypot(fx, fy, fz) || 1;
    const forward: Vector3D = { x: fx / flen, y: fy / flen, z: fz / flen };

    const rx = -forward.z;
    const ry = 0;
    const rz = forward.x;
    const rlen = Math.hypot(rx, rz) || 1;
    const right: Vector3D = { x: rx / rlen, y: 0, z: rz / rlen };

    const up: Vector3D = {
      x: forward.y * right.z - forward.z * right.y,
      y: forward.z * right.x - forward.x * right.z,
      z: forward.x * right.y - forward.y * right.x,
    };

    const timestamp = Date.now();

    for (let ix = 0; ix < numRaysX; ix++) {
      for (let iy = 0; iy < numRaysY; iy++) {
        const u = ((ix + 0.5) / numRaysX) * 2 - 1;
        const v = ((iy + 0.5) / numRaysY) * 2 - 1;

        const tanFov = Math.tan(halfFovRad);
        const dirX = forward.x + right.x * u * tanFov + up.x * v * tanFov;
        const dirY = forward.y + right.y * u * tanFov + up.y * v * tanFov;
        const dirZ = forward.z + right.z * u * tanFov + up.z * v * tanFov;
        const dlen = Math.hypot(dirX, dirY, dirZ);
        const rayDir: Vector3D = { x: dirX / dlen, y: dirY / dlen, z: dirZ / dlen };

        const hit = this.castRay(sensor.position, rayDir, objects, sensor.range);
        
        let color: [number, number, number] | undefined = undefined;
        if (hit.hit && hit.object) {
          const noise = (Math.random() - 0.5) * sensor.noiseStd;
          color = [
            Math.max(0, Math.min(1, hit.object.color[0] + noise)),
            Math.max(0, Math.min(1, hit.object.color[1] + noise)),
            Math.max(0, Math.min(1, hit.object.color[2] + noise)),
          ];
        }

        const raw: BaseSensorReading<RGBDRawReading> = {
          raw: {
            rayDirection: rayDir,
            distance: hit.distance,
            hasHit: hit.hit,
            color,
          },
          timestamp,
          sensorId: sensor.id,
          sensorType: 'rgbd',
          origin: sensor.position,
          noiseLevel: sensor.noiseStd,
        };

        observations.push(SensorNormalizer.normalizeRGBD(raw));
      }
    }

    return observations;
  }
}
