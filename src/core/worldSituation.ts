import { 
  WorldSituation, 
  PhysicalEvent, 
  Vector3D,
  PhysicalEventType 
} from '../types/quantumField';

export class WorldSituationEngine {
  /**
   * Clusters spatially and temporally proximal physical events into coherent WorldSituations.
   * Strictly avoids speculative semantic tags (e.g. does not label as 'FIRE' without verified
   * combustion chemical evidence, but labels as 'Thermal-Radiation-Concentration').
   */
  public static groupEventsIntoSituations(
    events: PhysicalEvent[],
    proximityThreshold = 0.8
  ): WorldSituation[] {
    if (events.length === 0) return [];

    const clusters: PhysicalEvent[][] = [];

    // Spatial clustering
    for (const evt of events) {
      let added = false;
      for (const cluster of clusters) {
        const leader = cluster[0];
        const dist = Math.hypot(
          evt.position.x - leader.position.x,
          evt.position.y - leader.position.y,
          evt.position.z - leader.position.z
        );
        if (dist <= proximityThreshold) {
          cluster.push(evt);
          added = true;
          break;
        }
      }
      if (!added) {
        clusters.push([evt]);
      }
    }

    const situations: WorldSituation[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const positions: Vector3D[] = cluster.map((e) => e.position);
      const properties: string[] = Array.from(new Set(cluster.map((e) => e.property)));
      const eventTypes: PhysicalEventType[] = Array.from(new Set(cluster.map((e) => e.type)));
      const evidences: string[] = cluster.map((e) => e.evidence);

      let minTime = Infinity;
      let maxTime = -Infinity;
      let sumConf = 0;

      for (const e of cluster) {
        if (e.timestamp < minTime) minTime = e.timestamp;
        if (e.timestamp > maxTime) maxTime = e.timestamp;
        sumConf += e.confidence;
      }

      const avgConfidence = sumConf / cluster.length;
      const uncertainty = 1.0 - avgConfidence;

      // Evidence-based objective description
      let situationLabel = 'Localized Physical Dynamic Activity';
      if (properties.includes('temperature') && properties.includes('occupancy')) {
        situationLabel = 'Thermal Energy Emission at Solid Matter Surface';
      } else if (properties.includes('velocity') && properties.includes('occupancy')) {
        situationLabel = 'Kinematic Displacement of Detected Matter Volume';
      } else if (properties.includes('pressure')) {
        situationLabel = 'Direct Mechanical Stress and Measurement-Induced Uncertainty Reduction';
      } else if (properties.includes('temperature')) {
        situationLabel = 'Radiometric Thermal Flux Gradient';
      }

      situations.push({
        id: `sit_${Date.now()}_${i}`,
        positions,
        properties,
        eventTypes,
        relations: `Co-located within ${proximityThreshold.toFixed(1)}m radius across ${cluster.length} measured spatial points`,
        confidence: Number(avgConfidence.toFixed(2)),
        uncertainty: Number(uncertainty.toFixed(2)),
        temporalContext: { start: minTime, end: maxTime },
        evidence: evidences,
        description: situationLabel,
      });
    }

    return situations;
  }
}
