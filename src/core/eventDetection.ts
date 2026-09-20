import { 
  PhysicalEvent, 
  PhysicalEventType, 
  VoxelPoint, 
  Vector3D,
  PhysicalStateSnapshot 
} from '../types/quantumField';

export class EventDetectionEngine {
  /**
   * Detects events by comparing a voxel's current state with its previous snapshot
   */
  public static detectEventsForVoxel(
    voxel: VoxelPoint,
    previousSnapshot?: PhysicalStateSnapshot
  ): PhysicalEvent[] {
    const events: PhysicalEvent[] = [];
    const curr = voxel.state;
    const prev = previousSnapshot || curr.previousState;

    if (!prev) return events;

    const timestamp = Date.now();
    const pos = voxel.position;

    // 1. Matter Appeared / Disappeared
    if (prev.occupancy !== null && curr.knownMask.occupancy) {
      const deltaOcc = curr.occupancy - prev.occupancy;
      if (prev.occupancy < 0.35 && curr.occupancy > 0.65) {
        events.push({
          id: `evt_matter_app_${timestamp}_${voxel.id}`,
          type: 'matter_appeared',
          position: pos,
          property: 'occupancy',
          previousValue: Number(prev.occupancy.toFixed(2)),
          currentValue: Number(curr.occupancy.toFixed(2)),
          delta: Number(deltaOcc.toFixed(2)),
          confidence: curr.propertyConfidences.occupancy,
          uncertainty: curr.propertyUncertainties.occupancy,
          timestamp,
          evidence: `Voxel occupancy crossed threshold from ${prev.occupancy.toFixed(2)} to ${curr.occupancy.toFixed(2)} via ${curr.contributingSensors.join(', ')}`,
        });
      } else if (prev.occupancy > 0.65 && curr.occupancy < 0.35) {
        events.push({
          id: `evt_matter_dis_${timestamp}_${voxel.id}`,
          type: 'matter_disappeared',
          position: pos,
          property: 'occupancy',
          previousValue: Number(prev.occupancy.toFixed(2)),
          currentValue: Number(curr.occupancy.toFixed(2)),
          delta: Number(deltaOcc.toFixed(2)),
          confidence: curr.propertyConfidences.occupancy,
          uncertainty: curr.propertyUncertainties.occupancy,
          timestamp,
          evidence: `Voxel occupancy resolved below free-space threshold from ${prev.occupancy.toFixed(2)} to ${curr.occupancy.toFixed(2)}`,
        });
      }
    }

    // 2. Temperature Shifts
    if (prev.temperature !== null && curr.temperature !== null) {
      const deltaTemp = curr.temperature - prev.temperature;
      if (deltaTemp >= 3.0) {
        events.push({
          id: `evt_temp_inc_${timestamp}_${voxel.id}`,
          type: 'temperature_increased',
          position: pos,
          property: 'temperature',
          previousValue: Number(prev.temperature.toFixed(1)),
          currentValue: Number(curr.temperature.toFixed(1)),
          delta: Number(deltaTemp.toFixed(1)),
          confidence: curr.propertyConfidences.temperature,
          uncertainty: curr.propertyUncertainties.temperature,
          timestamp,
          evidence: `Radiometric FLIR reading recorded +${deltaTemp.toFixed(1)}°C increase at coordinate [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`,
        });
      } else if (deltaTemp <= -3.0) {
        events.push({
          id: `evt_temp_dec_${timestamp}_${voxel.id}`,
          type: 'temperature_decreased',
          position: pos,
          property: 'temperature',
          previousValue: Number(prev.temperature.toFixed(1)),
          currentValue: Number(curr.temperature.toFixed(1)),
          delta: Number(deltaTemp.toFixed(1)),
          confidence: curr.propertyConfidences.temperature,
          uncertainty: curr.propertyUncertainties.temperature,
          timestamp,
          evidence: `Thermal radiometer observed cooling shift of ${deltaTemp.toFixed(1)}°C down to ${curr.temperature.toFixed(1)}°C`,
        });
      }
    }

    // 3. Motion / Doppler Velocity Shifts
    if (prev.velocity && curr.velocity) {
      const prevSpeed = Math.hypot(prev.velocity[0], prev.velocity[1], prev.velocity[2]);
      const currSpeed = Math.hypot(curr.velocity[0], curr.velocity[1], curr.velocity[2]);
      const deltaSpeed = currSpeed - prevSpeed;

      if (deltaSpeed > 0.25) {
        events.push({
          id: `evt_mot_inc_${timestamp}_${voxel.id}`,
          type: 'motion_increased',
          position: pos,
          property: 'velocity',
          previousValue: Number(prevSpeed.toFixed(2)),
          currentValue: Number(currSpeed.toFixed(2)),
          delta: Number(deltaSpeed.toFixed(2)),
          confidence: curr.propertyConfidences.velocity,
          uncertainty: curr.propertyUncertainties.velocity,
          timestamp,
          evidence: `mmWave radar detected acceleration: radial Doppler speed increased by +${deltaSpeed.toFixed(2)} m/s`,
        });
      } else if (deltaSpeed < -0.25) {
        events.push({
          id: `evt_mot_dec_${timestamp}_${voxel.id}`,
          type: 'motion_decreased',
          position: pos,
          property: 'velocity',
          previousValue: Number(prevSpeed.toFixed(2)),
          currentValue: Number(currSpeed.toFixed(2)),
          delta: Number(deltaSpeed.toFixed(2)),
          confidence: curr.propertyConfidences.velocity,
          uncertainty: curr.propertyUncertainties.velocity,
          timestamp,
          evidence: `Radar Doppler return recorded deceleration: speed reduced by ${deltaSpeed.toFixed(2)} m/s`,
        });
      }
    }

    // 4. Pressure / Contact Changes
    if (curr.pressure !== null && (prev.pressure === null || Math.abs(curr.pressure - prev.pressure) > 5.0)) {
      const prevP = prev.pressure ?? 0;
      events.push({
        id: `evt_press_${timestamp}_${voxel.id}`,
        type: 'pressure_changed',
        position: pos,
        property: 'pressure',
        previousValue: Number(prevP.toFixed(1)),
        currentValue: Number(curr.pressure.toFixed(1)),
        delta: Number((curr.pressure - prevP).toFixed(1)),
        confidence: curr.propertyConfidences.pressure,
        uncertainty: curr.propertyUncertainties.pressure,
        timestamp,
        evidence: `Direct tactile probe measured contact stress of ${curr.pressure.toFixed(1)} kPa (delta: ${(curr.pressure - prevP).toFixed(1)} kPa)`,
      });
    }

    // 5. Significant Confidence Shift (Uncertainty Reduction)
    const deltaConf = curr.confidence - prev.confidence;
    if (deltaConf > 0.35) {
      events.push({
        id: `evt_conf_${timestamp}_${voxel.id}`,
        type: 'confidence_changed_significantly',
        position: pos,
        property: 'confidence',
        previousValue: Number(prev.confidence.toFixed(2)),
        currentValue: Number(curr.confidence.toFixed(2)),
        delta: Number(deltaConf.toFixed(2)),
        confidence: curr.confidence,
        uncertainty: curr.uncertainty,
        timestamp,
        evidence: `Von Neumann entropy decreased from ${prev.entropy.toFixed(2)} to ${curr.entropy.toFixed(2)}; epistemic confidence gained +${deltaConf.toFixed(2)} via sensor integration`,
      });
    }

    return events;
  }

  /**
   * Scans entire world grid for active physical events
   */
  public static scanWorldForEvents(voxels: Map<string, VoxelPoint>): PhysicalEvent[] {
    const allEvents: PhysicalEvent[] = [];
    for (const v of voxels.values()) {
      const evts = this.detectEventsForVoxel(v);
      allEvents.push(...evts);
    }
    return allEvents;
  }
}
