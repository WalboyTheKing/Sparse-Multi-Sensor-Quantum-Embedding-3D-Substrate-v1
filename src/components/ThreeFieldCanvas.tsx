import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  VoxelPoint, 
  RenderMode, 
  SensorConfig, 
  Vector3D 
} from '../types/quantumField';

interface Props {
  grid: Map<string, VoxelPoint>;
  renderMode: RenderMode;
  sensors: SensorConfig[];
  selectedVoxelId: string | null;
  onSelectVoxel: (point: VoxelPoint | null) => void;
  highlightCoords?: Vector3D[];
  sliceAxis: 'none' | 'x' | 'y' | 'z';
  sliceValue: number; // -2.0 to +2.0
  showSensors: boolean;
}

export const ThreeFieldCanvas: React.FC<Props> = ({
  grid,
  renderMode,
  sensors,
  selectedVoxelId,
  onSelectVoxel,
  highlightCoords,
  sliceAxis,
  sliceValue,
  showSensors,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const voxelDataArrayRef = useRef<VoxelPoint[]>([]);
  const sensorGroupRef = useRef<THREE.Group | null>(null);
  const highlightsGroupRef = useRef<THREE.Group | null>(null);
  const selectionMarkerRef = useRef<THREE.Mesh | null>(null);

  // Orbit state
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const mouseDownStartPosRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 7.5, theta: Math.PI / 4, phi: Math.PI / 3 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d16');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    containerRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & directional lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Coordinate grid helper at bottom
    const gridHelper = new THREE.GridHelper(4.5, 9, 0x334155, 0x1e293b);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Group for sensor cones/frustums
    const sensorGroup = new THREE.Group();
    scene.add(sensorGroup);
    sensorGroupRef.current = sensorGroup;

    // Group for query highlights
    const highlightsGroup = new THREE.Group();
    scene.add(highlightsGroup);
    highlightsGroupRef.current = highlightsGroup;

    // Selection wireframe marker
    const markerGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    const markerMat = new THREE.MeshBasicMaterial({ 
      color: 0x38bdf8, 
      wireframe: true, 
      transparent: true,
      opacity: 0.9 
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.visible = false;
    scene.add(marker);
    selectionMarkerRef.current = marker;

    // Animation loop
    let animId: number;
    const updateCamera = () => {
      const { radius, theta, phi } = cameraSphericalRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(cameraTargetRef.current);
    };
    updateCamera();

    const render = () => {
      animId = requestAnimationFrame(render);
      renderer.render(scene, camera);
    };
    render();

    // Handle Resize smoothly via requestAnimationFrame to avoid ResizeObserver loop notification cycles
    let resizeRafId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        if (!containerRef.current || !entries || entries.length === 0) return;
        const entry = entries[0];
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w <= 0 || h <= 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animId);
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update instanced meshes when grid, renderMode, or slice changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clean previous instanced mesh
    if (instancedMeshRef.current) {
      sceneRef.current.remove(instancedMeshRef.current);
      instancedMeshRef.current.geometry.dispose();
      (instancedMeshRef.current.material as THREE.Material).dispose();
      instancedMeshRef.current = null;
    }

    const voxelPoints = Array.from(grid.values());
    voxelDataArrayRef.current = voxelPoints;
    const count = voxelPoints.length;
    if (count === 0) return;

    // We use a smoothed rounded box / point cube
    const geometry = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMeshRef.current = instancedMesh;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const p = voxelPoints[i];
      const pos = p.position;

      // Slicing check
      let isSlicedOut = false;
      if (sliceAxis === 'x' && pos.x > sliceValue) isSlicedOut = true;
      if (sliceAxis === 'y' && pos.y > sliceValue) isSlicedOut = true;
      if (sliceAxis === 'z' && pos.z > sliceValue) isSlicedOut = true;

      // Filter unobserved vacuum points if in matter/thermal modes to keep view clean,
      // but in entropy mode, render high-entropy points vividly!
      const isUnobserved = p.state.observationsCount === 0;
      let scale = 1.0;

      if (isSlicedOut) {
        scale = 0.0001; // hide
      } else if (isUnobserved) {
        if (renderMode === 'entropy') {
          scale = 0.7; // Visible high-entropy cloud
        } else if (renderMode === 'composite') {
          scale = 0.25; // Subtle unobserved vacuum grid dots
        } else {
          scale = 0.0001; // hide unobserved in physical channels
        }
      } else {
        // Size scales slightly with confidence/occupancy
        scale = Math.max(0.4, p.state.occupancy * 1.1);
      }

      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      // Color mapping
      if (isUnobserved) {
        if (renderMode === 'entropy') {
          color.setHSL(0.8, 0.85, 0.45); // Purple-magenta high entropy
        } else {
          color.setRGB(0.12, 0.16, 0.24); // Dim slate baseline
        }
      } else {
        switch (renderMode) {
          case 'matter': {
            // Occupancy gradient: void (dark grey) to solid (bright cyan)
            const occ = p.state.occupancy;
            color.setRGB(occ * 0.2, occ * 0.85 + 0.1, occ * 0.95);
            break;
          }
          case 'thermal': {
            // Temperature mapping: cold (6C -> blue) to ambient (20C -> dark teal) to hot (80C -> red/white)
            const temp = p.state.temperature ?? 20.0;
            const norm = Math.max(0, Math.min(1, (temp - 5) / 75));
            if (norm < 0.25) {
              color.setHSL(0.58, 0.9, 0.4 + norm * 0.4); // Cool cyan-blue
            } else if (norm < 0.5) {
              color.setHSL(0.35, 0.8, 0.5); // Green-yellow
            } else if (norm < 0.8) {
              color.setHSL(0.08, 0.95, 0.55); // Warm orange-red
            } else {
              color.setHSL(0.0, 0.9, 0.75 + (norm - 0.8) * 1.25); // Incandescent white-red
            }
            break;
          }
          case 'entropy': {
            // Low entropy = pure cyan (0.5), High entropy = violet (0.8)
            const h = 0.5 + p.state.entropy * 0.32;
            const l = 0.35 + (1.0 - p.state.entropy) * 0.25;
            color.setHSL(h, 0.85, l);
            break;
          }
          case 'velocity': {
            const vel = p.state.velocity || [0, 0, 0];
            const [vx, vy, vz] = vel;
            const speed = Math.hypot(vx, vy, vz);
            if (speed > 0.05) {
              // Bright dynamic Doppler gold/lime
              color.setRGB(0.95, 0.85, 0.1);
            } else {
              color.setRGB(0.2, 0.25, 0.32);
            }
            break;
          }
          case 'pressure': {
            const pressure = p.state.pressure ?? 0;
            if (pressure > 0.1) {
              color.setRGB(0.1, 0.95, 0.45); // Bright tactile emerald
            } else {
              color.setRGB(0.18, 0.22, 0.28);
            }
            break;
          }
          case 'purity': {
            const pur = p.state.purity; // 0.5 to 1.0
            const norm = (pur - 0.5) * 2.0;
            color.setHSL(0.45 * norm, 0.85, 0.3 + 0.3 * norm);
            break;
          }
          case 'composite':
          default: {
            // True optical color blended with occupancy
            const [r, g, b] = p.state.color;
            color.setRGB(r, g, b);
            break;
          }
        }
      }

      instancedMesh.setColorAt(i, color);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    instancedMesh.computeBoundingSphere();
    instancedMesh.computeBoundingBox();

    sceneRef.current.add(instancedMesh);
  }, [grid, renderMode, sliceAxis, sliceValue]);

  // Update sensor frustums and bodies
  useEffect(() => {
    const group = sensorGroupRef.current;
    if (!group) return;

    // Clear previous
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    }

    if (!showSensors) return;

    sensors.forEach((s) => {
      if (!s.enabled) return;

      const sPos = new THREE.Vector3(s.position.x, s.position.y, s.position.z);
      const tPos = new THREE.Vector3(s.target.x, s.target.y, s.target.z);
      const dir = new THREE.Vector3().subVectors(tPos, sPos).normalize();
      const dist = sPos.distanceTo(tPos);

      // Sensor body (small sphere)
      const bodyGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(s.color), 
        emissive: new THREE.Color(s.color),
        emissiveIntensity: 0.4,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.copy(sPos);
      group.add(body);

      // Sensor cone / frustum
      const coneRadius = Math.tan((s.fov * Math.PI) / 360) * Math.min(s.range, dist);
      const coneHeight = Math.min(s.range, dist);
      const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(s.color),
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });

      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.copy(sPos).addScaledVector(dir, coneHeight / 2);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      group.add(cone);

      // Central target ray line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([sPos, tPos]);
      const lineMat = new THREE.LineDashedMaterial({
        color: new THREE.Color(s.color),
        dashSize: 0.15,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      group.add(line);
    });
  }, [sensors, showSensors]);

  // Update query highlights
  useEffect(() => {
    const group = highlightsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    }

    if (!highlightCoords || highlightCoords.length === 0) return;

    highlightCoords.forEach((coord) => {
      const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(coord.x, coord.y, coord.z);
      group.add(mesh);
    });
  }, [highlightCoords]);

  // Update selection marker
  useEffect(() => {
    const marker = selectionMarkerRef.current;
    if (!marker) return;

    if (!selectedVoxelId) {
      marker.visible = false;
      return;
    }

    const voxel = grid.get(selectedVoxelId);
    if (!voxel) {
      marker.visible = false;
      return;
    }

    marker.position.set(voxel.position.x, voxel.position.y, voxel.position.z);
    marker.visible = true;
  }, [selectedVoxelId, grid]);

  // Mouse / Touch Interaction for 3D Orbiting and Raycast Click
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    mouseDownStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !cameraRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const sph = cameraSphericalRef.current;
    sph.theta -= dx * 0.008;
    sph.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi - dy * 0.008));

    const radius = sph.radius;
    cameraRef.current.position.x = radius * Math.sin(sph.phi) * Math.sin(sph.theta);
    cameraRef.current.position.y = radius * Math.cos(sph.phi);
    cameraRef.current.position.z = radius * Math.sin(sph.phi) * Math.cos(sph.theta);
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const totalDist = Math.hypot(
      e.clientX - mouseDownStartPosRef.current.x,
      e.clientY - mouseDownStartPosRef.current.y
    );

    isDraggingRef.current = false;

    // If it was a click (distance < 6px), raycast to select voxel
    if (totalDist < 6 && containerRef.current && cameraRef.current && instancedMeshRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(instancedMeshRef.current);

      for (const hit of intersects) {
        if (hit.instanceId !== undefined) {
          const candidate = voxelDataArrayRef.current[hit.instanceId];
          if (candidate) {
            // Check slicing bounds
            const pos = candidate.position;
            if (sliceAxis === 'x' && pos.x > sliceValue) continue;
            if (sliceAxis === 'y' && pos.y > sliceValue) continue;
            if (sliceAxis === 'z' && pos.z > sliceValue) continue;

            onSelectVoxel(candidate);
            return;
          }
        }
      }
      onSelectVoxel(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const sph = cameraSphericalRef.current;
    sph.radius = Math.max(2.5, Math.min(18.0, sph.radius + e.deltaY * 0.006));

    cameraRef.current.position.x = sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta);
    cameraRef.current.position.y = sph.radius * Math.cos(sph.phi);
    cameraRef.current.position.z = sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta);
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  const resetCamera = () => {
    if (!cameraRef.current) return;
    cameraSphericalRef.current = { radius: 7.5, theta: Math.PI / 4, phi: Math.PI / 3 };
    const sph = cameraSphericalRef.current;
    cameraRef.current.position.x = sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta);
    cameraRef.current.position.y = sph.radius * Math.cos(sph.phi);
    cameraRef.current.position.z = sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta);
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Viewport Overlay Controls */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono">Physical State Field (3D)</span>
        <span className="text-slate-600">|</span>
        <span>Click voxel to inspect quantum state</span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 text-xs">
        <button
          id="btn-reset-cam"
          onClick={resetCamera}
          className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset 3D Camera"
        >
          Reset View
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 pointer-events-none max-w-xs">
        <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
          <span>Active Mode: {renderMode.toUpperCase()}</span>
        </div>
        {renderMode === 'entropy' && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-cyan-400" />
            <span>Low Entropy (Known / Collapsed)</span>
            <span className="w-3 h-3 rounded bg-purple-500 ml-2" />
            <span>High S (Unknown Vacuum)</span>
          </div>
        )}
        {renderMode === 'thermal' && (
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span>6°C</span>
            <span className="w-8 h-1.5 mx-1 bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500 rounded" />
            <span className="w-2.5 h-2.5 rounded bg-red-500" />
            <span>80°C</span>
          </div>
        )}
        {renderMode === 'matter' && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-slate-700" />
            <span>|Void⟩ (Free Space)</span>
            <span className="w-3 h-3 rounded bg-cyan-400 ml-2" />
            <span>|Matter⟩ (Solid)</span>
          </div>
        )}
        {renderMode === 'velocity' && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-400" />
            <span>Dynamic Body (Doppler Vector Active)</span>
          </div>
        )}
        {renderMode === 'pressure' && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-400" />
            <span>Tactile Contact Normal Stress</span>
          </div>
        )}
        {renderMode === 'composite' && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-600" />
            <span>Hot Core</span>
            <span className="w-3 h-3 rounded bg-cyan-400" />
            <span>Cold Acrylic</span>
            <span className="w-3 h-3 rounded bg-yellow-400" />
            <span>Radar Target</span>
          </div>
        )}
      </div>
    </div>
  );
};
