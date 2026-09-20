import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  VoxelPoint, 
  RenderMode, 
  SensorConfig, 
  SensorType, 
  PhysicalQuery, 
  FieldStatistics,
  PhysicalEvent,
  WorldSituation,
  WorldSnapshot,
  Vector3D
} from './types/quantumField';
import { 
  initializeQuantumGrid, 
  DEFAULT_SENSORS, 
  DEFAULT_PHYSICAL_OBJECTS, 
  fireRGBDSensor, 
  fireThermalSensor, 
  fireRadarSensor, 
  fireForceProbe,
  coordToIndex,
  voxelKey
} from './core/sensorSimulation';
import { computeFieldMetrics } from './core/quantumEmbedding';
import { loadApiSettings, ApiSettings, executePhysicalQuery } from './services/llmQueryService';
import { TemporalWorld } from './core/temporalWorld';
import { EventDetectionEngine } from './core/eventDetection';
import { WorldSituationEngine } from './core/worldSituation';
import { ThreeFieldCanvas } from './components/ThreeFieldCanvas';
import { SensorControlPanel } from './components/SensorControlPanel';
import { StateInspectorModal } from './components/StateInspectorModal';
import { QueryConsole } from './components/QueryConsole';
import { ExperimentPresets, ExperimentId } from './components/ExperimentPresets';
import { TemporalEventPanel } from './components/TemporalEventPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AboutFieldModal } from './components/AboutFieldModal';
import { ScientificExportModal } from './components/ScientificExportModal';
import { 
  Atom, 
  BookOpen, 
  Sliders, 
  Activity, 
  Scissors,
  FolderArchive
} from 'lucide-react';

export default function App() {
  // Main Quantum Field Grid
  const [grid, setGrid] = useState<Map<string, VoxelPoint>>(() => initializeQuantumGrid());
  
  // Temporal World Model & Event History
  const temporalWorldRef = useRef<TemporalWorld>(new TemporalWorld(40));
  const [snapshots, setSnapshots] = useState<readonly WorldSnapshot[]>([]);
  const [activeEvents, setActiveEvents] = useState<PhysicalEvent[]>([]);
  const [situations, setSituations] = useState<WorldSituation[]>([]);
  const [highlightCoords, setHighlightCoords] = useState<Vector3D[]>([]);

  // Sidebar Tab: Sensors & Experiments vs Temporal Timeline
  const [sidebarTab, setSidebarTab] = useState<'sensors' | 'temporal'>('sensors');

  // Sensors Suite
  const [sensors, setSensors] = useState<SensorConfig[]>(DEFAULT_SENSORS);
  const [activeFiringSensor, setActiveFiringSensor] = useState<SensorType | null>(null);
  const [isContinuousSweep, setIsContinuousSweep] = useState(false);
  const continuousSweepRef = useRef<number | null>(null);

  // Visualization Controls
  const [renderMode, setRenderMode] = useState<RenderMode>('entropy');
  const [selectedVoxelId, setSelectedVoxelId] = useState<string | null>(null);
  const [sliceAxis, setSliceAxis] = useState<'none' | 'x' | 'y' | 'z'>('none');
  const [sliceValue, setSliceValue] = useState<number>(0.0);
  const [showSensors, setShowSensors] = useState(true);

  // Query & Experiments State
  const [currentQuery, setCurrentQuery] = useState<PhysicalQuery | null>(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [activeExperiment, setActiveExperiment] = useState<ExperimentId | null>('occlusion');

  // Modals & Settings
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => loadApiSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Derive Field Metrics
  const metrics: FieldStatistics = useMemo(() => {
    const states = new Map();
    for (const [k, v] of grid.entries()) {
      states.set(k, v.state);
    }
    return computeFieldMetrics(states);
  }, [grid]);

  // Selected Voxel Point
  const selectedVoxel = useMemo(() => {
    if (!selectedVoxelId) return null;
    return grid.get(selectedVoxelId) || null;
  }, [selectedVoxelId, grid]);

  // Coordinate Selection Helper (e.g. from QueryConsole or Situations)
  const handleSelectCoordinate = useCallback((coord: Vector3D) => {
    const ix = coordToIndex(coord.x);
    const iy = coordToIndex(coord.y);
    const iz = coordToIndex(coord.z);
    const key = `${ix},${iy},${iz}`;
    const v = grid.get(key);
    if (v) {
      setSelectedVoxelId(v.id);
    }
  }, [grid]);

  // Sync temporal events & snapshot
  const recordGridSnapshotAndEvents = useCallback((nextGrid: Map<string, VoxelPoint>, label: string) => {
    const snap = temporalWorldRef.current.captureSnapshot(nextGrid, label);
    setSnapshots([...temporalWorldRef.current.getSnapshots()]);

    const events = EventDetectionEngine.scanWorldForEvents(nextGrid);
    setActiveEvents(events);

    const sits = WorldSituationEngine.groupEventsIntoSituations(events);
    setSituations(sits);
  }, []);

  // Initial Run on First Mount: Fire RGB-D to showcase occlusion & shadow uncertainty out-of-the-box
  useEffect(() => {
    handleFireSensor('rgbd');
  }, []);

  // Sensor Actions
  const handleFireSensor = useCallback((type: SensorType) => {
    setActiveFiringSensor(type);
    setTimeout(() => setActiveFiringSensor(null), 400);

    setGrid((prevGrid) => {
      const nextGrid = new Map(prevGrid);
      const sensor = sensors.find((s) => s.type === type);
      if (!sensor || !sensor.enabled) return prevGrid;

      switch (type) {
        case 'rgbd':
          fireRGBDSensor(nextGrid, sensor, DEFAULT_PHYSICAL_OBJECTS);
          break;
        case 'thermal':
          fireThermalSensor(nextGrid, sensor, DEFAULT_PHYSICAL_OBJECTS);
          break;
        case 'radar':
          fireRadarSensor(nextGrid, sensor, DEFAULT_PHYSICAL_OBJECTS);
          break;
        case 'force_probe':
          const probeResult = fireForceProbe(nextGrid, sensor, DEFAULT_PHYSICAL_OBJECTS);
          if (probeResult.contactPoint) {
            const ix = coordToIndex(probeResult.contactPoint.x);
            const iy = coordToIndex(probeResult.contactPoint.y);
            const iz = coordToIndex(probeResult.contactPoint.z);
            setSelectedVoxelId(voxelKey(ix, iy, iz));
          }
          break;
      }

      recordGridSnapshotAndEvents(nextGrid, `${sensor.name} Sweep`);
      return nextGrid;
    });
  }, [sensors, recordGridSnapshotAndEvents]);

  const handleFireAllSensors = useCallback(() => {
    setGrid((prevGrid) => {
      const nextGrid = new Map(prevGrid);
      sensors.forEach((sensor) => {
        if (!sensor.enabled) return;
        if (sensor.type === 'rgbd') fireRGBDSensor(nextGrid, sensor, DEFAULT_PHYSICAL_OBJECTS);
        if (sensor.type === 'thermal') fireThermalSensor(nextGrid, sensor, DEFAULT_PHYSICAL_OBJECTS);
        if (sensor.type === 'radar') fireRadarSensor(nextGrid, sensor, DEFAULT_PHYSICAL_OBJECTS);
        if (sensor.type === 'force_probe') fireForceProbe(nextGrid, sensor, DEFAULT_PHYSICAL_OBJECTS);
      });

      recordGridSnapshotAndEvents(nextGrid, 'Full Multi-Sensor Sweep');
      return nextGrid;
    });
  }, [sensors, recordGridSnapshotAndEvents]);

  const handleResetField = useCallback(() => {
    const fresh = initializeQuantumGrid();
    setGrid(fresh);
    setSelectedVoxelId(null);
    setCurrentQuery(null);
    setActiveExperiment(null);
    setHighlightCoords([]);
    temporalWorldRef.current = new TemporalWorld(40);
    recordGridSnapshotAndEvents(fresh, 'Field Initialization (Unobserved Prior)');
  }, [recordGridSnapshotAndEvents]);

  // Continuous sweep loop
  const handleToggleContinuousSweep = useCallback(() => {
    if (isContinuousSweep) {
      if (continuousSweepRef.current) clearInterval(continuousSweepRef.current);
      setIsContinuousSweep(false);
    } else {
      setIsContinuousSweep(true);
      continuousSweepRef.current = window.setInterval(() => {
        handleFireAllSensors();
      }, 900);
    }
  }, [isContinuousSweep, handleFireAllSensors]);

  useEffect(() => {
    return () => {
      if (continuousSweepRef.current) clearInterval(continuousSweepRef.current);
    };
  }, []);

  const handleToggleSensor = (id: string) => {
    setSensors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Run Query
  const handleRunQuery = async (prompt: string) => {
    setIsQueryLoading(true);
    try {
      const result = await executePhysicalQuery(prompt, grid, apiSettings);
      setCurrentQuery(result);
      if (result.relevantVoxelCoords) {
        setHighlightCoords(result.relevantVoxelCoords);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsQueryLoading(false);
    }
  };

  // Run Curated Experiment
  const handleRunExperiment = useCallback((expId: ExperimentId) => {
    setActiveExperiment(expId);

    if (expId === 'occlusion') {
      const freshGrid = initializeQuantumGrid();
      const rgbdSensor = sensors.find((s) => s.type === 'rgbd')!;
      fireRGBDSensor(freshGrid, rgbdSensor, DEFAULT_PHYSICAL_OBJECTS);
      setGrid(freshGrid);
      setRenderMode('entropy');
      recordGridSnapshotAndEvents(freshGrid, 'Experiment 1: Occlusion & Shadow');
      handleRunQuery('Where are the regions of highest quantum entropy and unobserved shadow?');
    } else if (expId === 'multi_sensor_merge') {
      const freshGrid = initializeQuantumGrid();
      sensors.forEach((s) => {
        if (s.type === 'rgbd') fireRGBDSensor(freshGrid, s, DEFAULT_PHYSICAL_OBJECTS);
        if (s.type === 'thermal') fireThermalSensor(freshGrid, s, DEFAULT_PHYSICAL_OBJECTS);
        if (s.type === 'radar') fireRadarSensor(freshGrid, s, DEFAULT_PHYSICAL_OBJECTS);
        if (s.type === 'force_probe') fireForceProbe(freshGrid, s, DEFAULT_PHYSICAL_OBJECTS);
      });
      setGrid(freshGrid);
      setRenderMode('composite');
      recordGridSnapshotAndEvents(freshGrid, 'Experiment 2: Multi-Sensor Merge');
      handleRunQuery('What is the temperature at the heated copper core and what are the hottest observed locations?');
    } else if (expId === 'doppler_motion') {
      const freshGrid = initializeQuantumGrid();
      const radarSensor = sensors.find((s) => s.type === 'radar')!;
      fireRadarSensor(freshGrid, radarSensor, DEFAULT_PHYSICAL_OBJECTS);
      setGrid(freshGrid);
      setRenderMode('velocity');
      recordGridSnapshotAndEvents(freshGrid, 'Experiment 3: Kinematic Doppler');
      handleRunQuery('What is the velocity? What is predicted to happen next?');
    } else if (expId === 'tactile_ground_truth') {
      const freshGrid = initializeQuantumGrid();
      const probeSensor = sensors.find((s) => s.type === 'force_probe')!;
      const res = fireForceProbe(freshGrid, probeSensor, DEFAULT_PHYSICAL_OBJECTS);
      setGrid(freshGrid);
      setRenderMode('pressure');
      if (res.contactPoint) {
        const ix = coordToIndex(res.contactPoint.x);
        const iy = coordToIndex(res.contactPoint.y);
        const iz = coordToIndex(res.contactPoint.z);
        setSelectedVoxelId(voxelKey(ix, iy, iz));
      }
      recordGridSnapshotAndEvents(freshGrid, 'Experiment 4: Tactile Contact Measurement (Uncertainty Reduction)');
      handleRunQuery('What contact force and mechanical pressure was verified by the tactile probe?');
    }
  }, [sensors, recordGridSnapshotAndEvents]);

  const activeProviderName = 
    apiSettings.provider === 'openai' 
      ? 'OpenAI' 
      : apiSettings.provider === 'grok' 
      ? 'xAI Grok' 
      : 'Deterministic Physics';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Atom className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">
                Physical State Field
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                World Model v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Sparse Multi-Sensor Quantum-Embedding 3D Substrate &bull; UNKNOWN &ne; 0
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-3">
          {/* Render Mode Toolbar */}
          <div className="hidden lg:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-mono px-2">Mode:</span>
            {(['composite', 'entropy', 'matter', 'thermal', 'velocity', 'pressure', 'purity'] as RenderMode[]).map((mode) => (
              <button
                key={mode}
                id={`btn-mode-${mode}`}
                onClick={() => setRenderMode(mode)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-all cursor-pointer ${
                  renderMode === mode
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {mode === 'entropy' ? 'Uncertainty (S)' : mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-export"
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-cyan-800/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm shadow-cyan-950/40"
              title="Export complete 5-file scientific dataset"
            >
              <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Dataset</span>
            </button>

            <button
              id="btn-open-about"
              onClick={() => setIsAboutOpen(true)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Scientific Principles</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Control Sidebar */}
        <div className="w-full lg:w-96 xl:w-[420px] bg-slate-950/95 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-10 shadow-2xl">
          {/* Sidebar Navigation Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              id="sidebar-tab-sensors"
              onClick={() => setSidebarTab('sensors')}
              className={`flex-1 py-1.5 rounded text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                sidebarTab === 'sensors' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sensors & Experiments</span>
            </button>
            <button
              id="sidebar-tab-temporal"
              onClick={() => setSidebarTab('temporal')}
              className={`flex-1 py-1.5 rounded text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                sidebarTab === 'temporal' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Temporal Events ({activeEvents.length})</span>
            </button>
          </div>

          {sidebarTab === 'sensors' ? (
            <>
              {/* Multi-Sensor Fusion Suite */}
              <SensorControlPanel
                sensors={sensors}
                onFireSensor={handleFireSensor}
                onFireAllSensors={handleFireAllSensors}
                onToggleSensor={handleToggleSensor}
                onResetField={handleResetField}
                isContinuousSweep={isContinuousSweep}
                onToggleContinuousSweep={handleToggleContinuousSweep}
                metrics={metrics}
                activeFiringSensor={activeFiringSensor}
              />

              {/* Curated Experiments */}
              <ExperimentPresets
                activeExperiment={activeExperiment}
                onRunExperiment={handleRunExperiment}
                isRunning={isContinuousSweep}
              />
            </>
          ) : (
            <TemporalEventPanel
              snapshots={snapshots}
              activeEvents={activeEvents}
              situations={situations}
              onHighlightCoords={(coords) => setHighlightCoords(coords)}
            />
          )}
        </div>

        {/* Center: 3D Quantum Field Viewport */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Sub-toolbar inside Viewport (Slicing & View Toggles) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-xl">
            <div className="flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">Slice Axis:</span>
              {(['none', 'x', 'y', 'z'] as const).map((axis) => (
                <button
                  key={axis}
                  id={`btn-slice-${axis}`}
                  onClick={() => setSliceAxis(axis)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase cursor-pointer ${
                    sliceAxis === axis
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {axis}
                </button>
              ))}
            </div>

            {sliceAxis !== 'none' && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <input
                  id="slider-slice-value"
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.1"
                  value={sliceValue}
                  onChange={(e) => setSliceValue(parseFloat(e.target.value))}
                  className="w-20 accent-cyan-500 cursor-pointer"
                />
                <span className="font-mono text-[10px] text-cyan-400 w-8">
                  {sliceValue.toFixed(1)}
                </span>
              </div>
            )}

            <div className="pl-2 border-l border-slate-800 flex items-center gap-1.5">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSensors}
                  onChange={(e) => setShowSensors(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Sensors</span>
              </label>
            </div>
          </div>

          {/* 3D Three.js Canvas */}
          <div className="flex-1 relative">
            <ThreeFieldCanvas
              grid={grid}
              renderMode={renderMode}
              sensors={sensors}
              selectedVoxelId={selectedVoxelId}
              onSelectVoxel={(voxel) => setSelectedVoxelId(voxel ? voxel.id : null)}
              highlightCoords={highlightCoords.length > 0 ? highlightCoords : currentQuery?.relevantVoxelCoords}
              sliceAxis={sliceAxis}
              sliceValue={sliceValue}
              showSensors={showSensors}
            />

            {/* Floating State Inspector when a voxel is clicked */}
            {selectedVoxel && (
              <div className="absolute top-4 right-4 z-20 animate-fade-in">
                <StateInspectorModal
                  voxel={selectedVoxel}
                  onClose={() => setSelectedVoxelId(null)}
                />
              </div>
            )}
          </div>

          {/* Bottom Drawer: Language Query Layer */}
          <div className="p-3 lg:p-3.5 bg-slate-950/95 border-t border-slate-800 shrink-0 z-10 max-h-[360px] overflow-y-auto">
            <QueryConsole
              onRunQuery={handleRunQuery}
              isLoading={isQueryLoading}
              currentQuery={currentQuery}
              onOpenSettings={() => setIsSettingsOpen(true)}
              activeProviderName={activeProviderName}
              onInspectCoordinate={handleSelectCoordinate}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={apiSettings}
        onSave={(newSettings) => setApiSettings(newSettings)}
      />

      <AboutFieldModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <ScientificExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        grid={grid}
        sensors={sensors}
        events={activeEvents}
        snapshots={snapshots as any[]}
        activeExperimentId={activeExperiment || 'custom_sweep'}
      />
    </div>
  );
}
