import React, { useState, useEffect } from 'react';
import { VoxelPoint } from '../types/quantumField';
import {
  X,
  Atom,
  ShieldAlert,
  CheckCircle2,
  History,
  Activity,
  Layers,
  Thermometer,
  Gauge,
  Radio,
  Zap,
  Clock,
  Fingerprint,
  Maximize2,
  Minimize2,
  Crosshair,
  ChevronRight,
  Info,
  Compass
} from 'lucide-react';
import { BaselineTemporalPrediction } from '../core/prediction';

interface Props {
  voxel: VoxelPoint | null;
  onClose: () => void;
  onFocusVoxel?: (voxel: VoxelPoint) => void;
  initialMode?: 'compact' | 'expanded';
}

export const VoxelStateInspector: React.FC<Props> = ({
  voxel,
  onClose,
  onFocusVoxel,
  initialMode = 'compact',
}) => {
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>(initialMode);
  const [activeTab, setActiveTab] = useState<'observables' | 'quantum' | 'epistemic' | 'provenance'>('observables');

  // ESC key listener to close or minimize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewMode === 'expanded') {
          setViewMode('compact');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, onClose]);

  if (!voxel) return null;

  const { state, position, ix, iy, iz } = voxel;
  const isUnknown = state.occupancyState === 'UNKNOWN' || state.observationsCount === 0;
  const occPercent = (state.occupancy * 100).toFixed(1);
  const voidPercent = ((1 - state.occupancy) * 100).toFixed(1);

  // Subtype distinction for UNKNOWN state:
  // UNKNOWN
  //   ├── Occluded (obstacle shadow)
  //   ├── Unobserved (outside sensor volume)
  //   └── Insufficient sensor coverage
  const unknownSubtype = state.unknownSubtype || (state.observationsCount === 0 ? 'unobserved' : undefined);

  // Temporal prediction extrapolation
  const prediction = (state.knownMask.velocity || (state.knownMask.temperature && (state.temperature ?? 0) > 30))
    ? BaselineTemporalPrediction.predictVoxelTrajectory(voxel, 3.0, 3)
    : null;

  // Field amplitude / Hamiltonian energy
  const fieldAmplitude = Math.sqrt(
    state.psiMatter.re * state.psiMatter.re +
    state.psiMatter.im * state.psiMatter.im
  );
  
  const fieldEnergyJoule = state.energy !== null
    ? `${state.energy.toFixed(2)} J/m³`
    : (state.occupancyState === 'KNOWN_MATTER'
        ? `${(1.25 * (state.temperature ? (state.temperature + 273.15) * 0.05 : 15.0)).toFixed(2)} J/m³`
        : state.occupancyState === 'KNOWN_EMPTY'
        ? '0.00 J/m³ (Empty)'
        : 'UNKNOWN');

  const formattedTimestamp = state.lastObservedTimestamp > 0
    ? new Date(state.lastObservedTimestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        fractionalSecondDigits: 3 
      })
    : 'None (Unmeasured prior)';

  // =========================================================================
  // TIER 1: COMPACT FLOATING VOXEL HUD (Zero vertical scroll, 3D preserved)
  // =========================================================================
  if (viewMode === 'compact') {
    return (
      <div 
        id="voxel-hud-compact"
        className="w-84 sm:w-88 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-slate-200 flex flex-col gap-2.5 select-none transition-all duration-200 animate-fade-in"
      >
        {/* Top Header: Title, Coordinates, and Fast Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Voxel State HUD</span>
                <span className="font-mono text-[9px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                  ({ix},{iy},{iz})
                </span>
              </div>
              <div className="font-mono text-[10px] text-cyan-300">
                [{position.x.toFixed(2)}, {position.y.toFixed(2)}, {position.z.toFixed(2)}] m
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onFocusVoxel && (
              <button
                type="button"
                id="btn-hud-focus-voxel"
                onClick={() => onFocusVoxel(voxel)}
                className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                title="Focus Camera on Voxel"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              id="btn-hud-expand"
              onClick={() => setViewMode('expanded')}
              className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Expand Full Multidimensional State"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-hud-close"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. Primary Physical State Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
              state.occupancyState === 'KNOWN_MATTER'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : state.occupancyState === 'KNOWN_EMPTY'
                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                : state.occupancyState === 'CONFLICTING_UNCERTAIN'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-purple-950 text-purple-300 border border-purple-800'
            }`}>
              {state.occupancyState}
            </span>

            {isUnknown && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-800/80">
                {unknownSubtype === 'occluded' ? 'Occluded' : unknownSubtype === 'insufficient_coverage' ? 'Low Signal' : 'Unobserved'}
              </span>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-400">
            Obs: <span className="text-slate-200 font-semibold">{state.observationsCount}</span>
          </div>
        </div>

        {/* 2. Core Epistemic Gauges (Confidence & Entropy) */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800/90 text-center font-mono">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase">Confidence</span>
            <span className={`text-xs font-bold ${state.confidence > 0.5 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {(state.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex flex-col border-x border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase">Entropy (S)</span>
            <span className={`text-xs font-bold ${state.entropy > 0.8 ? 'text-amber-400' : 'text-cyan-300'}`}>
              {state.entropy.toFixed(3)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase">Uncertainty</span>
            <span className="text-xs font-bold text-purple-300">
              {(state.uncertainty * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* 3. Key Observables Mini-Grid (Temperature, Velocity, Pressure, Energy) */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
          {/* Temperature */}
          <div className="bg-slate-950/90 p-1.5 px-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span>Temp</span>
            </div>
            <span className={`font-semibold ${state.temperature !== null ? 'text-orange-400' : 'text-slate-500'}`}>
              {state.temperature !== null ? `${state.temperature.toFixed(1)}°C` : 'UNKNOWN'}
            </span>
          </div>

          {/* Doppler Velocity */}
          <div className="bg-slate-950/90 p-1.5 px-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <Gauge className="w-3 h-3 text-yellow-400" />
              <span>Velocity</span>
            </div>
            <span className={`font-semibold truncate max-w-[80px] ${state.velocity ? 'text-yellow-300' : 'text-slate-500'}`}>
              {state.velocity ? `${Math.hypot(...state.velocity).toFixed(2)} m/s` : 'UNKNOWN'}
            </span>
          </div>

          {/* Tactile Pressure */}
          <div className="bg-slate-950/90 p-1.5 px-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Pressure</span>
            </div>
            <span className={`font-semibold ${state.pressure !== null ? 'text-emerald-400' : 'text-slate-500'}`}>
              {state.pressure !== null ? `${state.pressure.toFixed(1)} kPa` : 'UNKNOWN'}
            </span>
          </div>

          {/* Energy Density */}
          <div className="bg-slate-950/90 p-1.5 px-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Energy</span>
            </div>
            <span className="font-semibold text-cyan-300 truncate max-w-[80px]">
              {fieldEnergyJoule}
            </span>
          </div>
        </div>

        {/* 4. Superposition Mini-Bar */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-0.5">
            <span>|Void⟩: {voidPercent}%</span>
            <span className="text-cyan-300 font-semibold">|Matter⟩: {occPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-slate-600 transition-all" style={{ width: `${voidPercent}%` }} />
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${occPercent}%` }} />
          </div>
        </div>

        {/* 5. Expand Button: Progressive Disclosure Trigger */}
        <button
          type="button"
          id="btn-hud-view-full-state"
          onClick={() => setViewMode('expanded')}
          className="w-full mt-1 bg-slate-800/80 hover:bg-slate-750 hover:border-cyan-500/60 border border-slate-700/80 text-cyan-300 hover:text-cyan-200 text-xs font-medium py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <span>View Full Scientific State</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // =========================================================================
  // TIER 2: FULL SCIENTIFIC MULTIDIMENSIONAL INSPECTOR (Tabbed, High-Density)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        id="voxel-inspector-expanded-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-4 sm:p-5 text-slate-200 shadow-2xl flex flex-col gap-3.5 max-h-[92vh] select-none"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Physical Voxel State Inspector</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                  state.occupancyState === 'KNOWN_MATTER'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : state.occupancyState === 'KNOWN_EMPTY'
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-purple-950 text-purple-300 border border-purple-800'
                }`}>
                  {state.occupancyState}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Deterministic 14-Channel Quantum-Embedding Representation &bull; UNKNOWN &ne; 0 Axiom
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onFocusVoxel && (
              <button
                type="button"
                id="btn-expanded-focus-voxel"
                onClick={() => {
                  onFocusVoxel(voxel);
                  setViewMode('compact');
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Focus 3D Viewport on this coordinate"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Focus</span>
              </button>
            )}

            <button
              type="button"
              id="btn-expanded-minimize"
              onClick={() => setViewMode('compact')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              title="Minimize back to compact floating HUD"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">HUD</span>
            </button>

            <button
              type="button"
              id="btn-expanded-close"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Spatial Coordinate Strip */}
        <div className="flex items-center justify-between text-xs font-mono bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Spatial Position:</span>
            <span className="text-cyan-300 font-semibold">
              [{position.x.toFixed(2)}, {position.y.toFixed(2)}, {position.z.toFixed(2)}] m
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Grid Index:</span>
            <span className="text-slate-200">
              ({ix}, {iy}, {iz}) / 14³ Substrate
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Progressive Horizontal Organization - No Long Scrolls) */}
        <div className="flex border-b border-slate-800 text-xs font-medium gap-1">
          <button
            type="button"
            id="tab-btn-observables"
            onClick={() => setActiveTab('observables')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'observables'
                ? 'bg-slate-800/90 text-cyan-300 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Observables & Fields</span>
          </button>

          <button
            type="button"
            id="tab-btn-quantum"
            onClick={() => setActiveTab('quantum')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quantum'
                ? 'bg-slate-800/90 text-cyan-300 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Quantum Representation</span>
          </button>

          <button
            type="button"
            id="tab-btn-epistemic"
            onClick={() => setActiveTab('epistemic')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'epistemic'
                ? 'bg-slate-800/90 text-cyan-300 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Epistemic Substrate & Mask</span>
          </button>

          <button
            type="button"
            id="tab-btn-provenance"
            onClick={() => setActiveTab('provenance')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'provenance'
                ? 'bg-slate-800/90 text-cyan-300 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Provenance & History</span>
          </button>
        </div>

        {/* Tab 1: Physical Observables & Fields */}
        {activeTab === 'observables' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {/* Temperature */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-orange-400" />
                    <span>Temperature</span>
                  </span>
                  <span className={`font-mono text-[9px] px-1 rounded ${state.knownMask.temperature ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {state.knownMask.temperature ? 'KNOWN' : 'UNKNOWN'}
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold text-orange-400 mt-1">
                  {state.temperature !== null ? `${state.temperature.toFixed(1)} °C` : 'UNKNOWN'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Confidence: {(state.propertyConfidences.temperature * 100).toFixed(0)}%
                </div>
              </div>

              {/* Doppler Velocity */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-yellow-400" />
                    <span>Doppler Velocity</span>
                  </span>
                  <span className={`font-mono text-[9px] px-1 rounded ${state.knownMask.velocity ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {state.knownMask.velocity ? 'KNOWN' : 'UNKNOWN'}
                  </span>
                </div>
                <div className="font-mono text-xs font-semibold text-yellow-300 mt-1 truncate">
                  {state.velocity ? `[${state.velocity.map(v => v.toFixed(2)).join(', ')}] m/s` : 'UNKNOWN'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Confidence: {(state.propertyConfidences.velocity * 100).toFixed(0)}%
                </div>
              </div>

              {/* Contact Pressure */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-400" />
                    <span>Contact Pressure</span>
                  </span>
                  <span className={`font-mono text-[9px] px-1 rounded ${state.knownMask.pressure ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {state.knownMask.pressure ? 'KNOWN' : 'UNKNOWN'}
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold text-emerald-400 mt-1">
                  {state.pressure !== null ? `${state.pressure.toFixed(1)} kPa` : 'UNKNOWN'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Confidence: {(state.propertyConfidences.pressure * 100).toFixed(0)}%
                </div>
              </div>

              {/* Dielectric Permittivity */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-purple-400" />
                    <span>Dielectric (ε_r)</span>
                  </span>
                  <span className={`font-mono text-[9px] px-1 rounded ${state.knownMask.dielectric ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {state.knownMask.dielectric ? 'KNOWN' : 'UNKNOWN'}
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold text-purple-400 mt-1">
                  {state.dielectric !== null ? state.dielectric.toFixed(1) : 'UNKNOWN'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Confidence: {(state.propertyConfidences.dielectric * 100).toFixed(0)}%
                </div>
              </div>

              {/* Energy Density */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Energy Density</span>
                  </span>
                  <span className={`font-mono text-[9px] px-1 rounded ${state.knownMask.energy ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {state.knownMask.energy ? 'KNOWN' : 'DERIVED'}
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold text-cyan-300 mt-1">
                  {fieldEnergyJoule}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Hamiltonian expectation
                </div>
              </div>

              {/* Optical Color & Amplitude */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Atom className="w-3 h-3 text-blue-400" />
                    <span>Field Amplitude |ψ|</span>
                  </span>
                  <span className="font-mono text-[9px] px-1 rounded bg-slate-800 text-slate-300">
                    {fieldAmplitude.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div
                    className="w-4 h-4 rounded border border-slate-700 shadow"
                    style={{ backgroundColor: `rgb(${Math.round(state.color[0] * 255)}, ${Math.round(state.color[1] * 255)}, ${Math.round(state.color[2] * 255)})` }}
                  />
                  <span className="font-mono text-xs text-slate-300">
                    {state.light ? `RGB(${state.light.map(c => c.toFixed(2)).join(',')})` : 'Unobserved light'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trajectory Prediction if dynamic */}
            {prediction && (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-yellow-800/50 text-xs">
                <div className="flex items-center gap-1.5 text-yellow-400 font-semibold text-[11px] mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>BASELINE TEMPORAL PREDICTION (t = +3.0s)</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {prediction.explanation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quantum Representation & Superposition */}
        {activeTab === 'quantum' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs flex flex-col gap-2.5">
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Superposition Basis |ψ⟩ = α|Void⟩ + β|Matter⟩</span>
                <span className="text-cyan-300 font-mono">Tr(ρ²) = {state.purity.toFixed(3)}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">|Void⟩ Probability: {voidPercent}%</span>
                <span className="text-cyan-300 font-semibold">|Matter⟩ Probability: {occPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-slate-600 transition-all" style={{ width: `${voidPercent}%` }} />
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${occPercent}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1 font-mono text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ψ_Void Complex Amplitude:</span>
                  <span className="text-slate-200">{state.psiVoid.re.toFixed(3)} + {state.psiVoid.im.toFixed(3)}i</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ψ_Matter Complex Amplitude:</span>
                  <span className="text-cyan-300 font-semibold">{state.psiMatter.re.toFixed(3)} + {state.psiMatter.im.toFixed(3)}i</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Von Neumann Entropy</span>
                <span className="text-sm font-bold text-amber-400">{state.entropy.toFixed(3)}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Quantum Purity Tr(ρ²)</span>
                <span className="text-sm font-bold text-emerald-400">{state.purity.toFixed(3)}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Phase Coherence</span>
                <span className="text-sm font-bold text-cyan-300">{state.coherence.toFixed(3)}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Field Amplitude |ψ|</span>
                <span className="text-sm font-bold text-blue-300">{fieldAmplitude.toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Epistemic Substrate & Known Mask */}
        {activeTab === 'epistemic' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* UNKNOWN != 0 Axiom Clarification */}
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              isUnknown 
                ? 'bg-purple-950/40 border-purple-800/60' 
                : 'bg-emerald-950/40 border-emerald-800/60'
            }`}>
              {isUnknown ? (
                <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isUnknown ? 'text-purple-200' : 'text-emerald-200'}`}>
                    {isUnknown ? 'UNKNOWN != 0 (Fundamental Epistemic Axiom)' : 'Empirically Resolved Coordinate'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 uppercase font-bold text-slate-300">
                    {isUnknown ? `Subtype: ${unknownSubtype}` : `Observations: ${state.observationsCount}`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300/80 mt-1 leading-relaxed">
                  {isUnknown
                    ? unknownSubtype === 'occluded'
                      ? 'Physical obstacle detected directly along sensor line-of-sight. Raycasting terminates at obstacle surface, preserving maximal entropy (S = 1.0) in the shadow zone without fabricating empty free space or false zeros.'
                      : unknownSubtype === 'insufficient_coverage'
                      ? 'Sensory return signal fell below signal-to-noise detection threshold in this spatial voxel.'
                      : 'Coordinate lies outside active sensor frustum sweeps. Physical state is completely unobserved.'
                    : 'Physical sensory measurements have reduced local spatial uncertainty. Properties are backed by deterministic sensor provenance.'}
                </p>
              </div>
            </div>

            {/* Known Mask Pill Grid */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                Channel-by-Channel Known Mask (Explicit Nullability)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(state.knownMask).map(([key, isKnown]) => (
                  <span
                    key={key}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium flex items-center gap-1.5 ${
                      isKnown
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span>{key}:</span>
                    <span className="font-bold">{isKnown ? 'KNOWN' : 'NULL'}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Property Confidence vs Uncertainty Bars */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                Property Confidences vs Uncertainties
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                {Object.entries(state.propertyConfidences).map(([k, conf]) => (
                  <div key={k} className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 uppercase block text-[9px]">{k}</span>
                    <span className="text-slate-200">Conf: {(conf * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Sensor Provenance & History Log */}
        {activeTab === 'provenance' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sensor Provenance Substrate</span>
                </span>
                <span className="font-mono text-slate-300">
                  Total Observations: {state.observationsCount}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Contributing Sensor Modalities:</span>
                  <span className="text-slate-200">
                    {state.contributingSensors.length > 0 ? state.contributingSensors.join(', ') : 'None (Unobserved Prior)'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Last Observation Timestamp:</span>
                  <span className="text-slate-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400 inline" />
                    {formattedTimestamp}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Observation History Audit Trail */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                Observation Audit Trail ({state.detailedHistory?.length || 0} events)
              </div>
              {state.detailedHistory && state.detailedHistory.length > 0 ? (
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-800/60 font-mono text-[11px]">
                  {state.detailedHistory.map((rec, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-cyan-300 font-semibold">{rec.sensorType}</span>
                        <span className="text-slate-400">observed &rarr; {rec.observedProperty}</span>
                      </div>
                      <div className="text-slate-400">
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 font-mono text-[11px] py-2 text-center">
                  No sensory observation writes recorded on this voxel prior.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-1 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Esc</kbd> to minimize to floating HUD</span>
          </div>
          <button
            type="button"
            id="btn-footer-close-expanded"
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
