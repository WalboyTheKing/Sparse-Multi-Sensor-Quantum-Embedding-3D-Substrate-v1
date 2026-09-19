import React from 'react';
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
} from 'lucide-react';
import { BaselineTemporalPrediction } from '../core/prediction';

interface Props {
  voxel: VoxelPoint | null;
  onClose: () => void;
}

export const StateInspectorModal: React.FC<Props> = ({ voxel, onClose }) => {
  if (!voxel) return null;

  const { state, position, ix, iy, iz } = voxel;
  const isUnknown = state.occupancyState === 'UNKNOWN' || state.observationsCount === 0;
  const occPercent = (state.occupancy * 100).toFixed(1);
  const voidPercent = ((1 - state.occupancy) * 100).toFixed(1);

  // Subtype distinction for UNKNOWN state:
  // UNKNOWN
  //   ├── Occluded
  //   ├── Unobserved
  //   └── Insufficient sensor coverage
  const unknownSubtype = state.unknownSubtype || (state.observationsCount === 0 ? 'unobserved' : undefined);

  // Prediction extrapolation
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
        : '0.00 J/m³ (Vacuum)');

  const formattedTimestamp = state.lastObservedTimestamp > 0
    ? new Date(state.lastObservedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })
    : 'None (Unmeasured prior)';

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-slate-200 flex flex-col gap-3.5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Physical Voxel State Inspector</div>
            <div className="text-[10px] text-slate-400">Deterministic multidimensional quantum-embedding state</div>
          </div>
        </div>
        <button
          id="btn-close-inspector"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Spatial Coordinates & Grid Index */}
      <div className="flex items-center justify-between text-xs font-mono bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Spatial Position [x, y, z]</span>
          <span className="text-cyan-300 font-semibold text-sm">
            [{position.x.toFixed(2)}, {position.y.toFixed(2)}, {position.z.toFixed(2)}] m
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grid Index (ix, iy, iz)</span>
          <span className="text-slate-300 text-xs">({ix}, {iy}, {iz}) / 14³</span>
        </div>
      </div>

      {/* 2. Occupancy & Epistemic Subtype Breakdown */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Occupancy Classification</span>
          <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
            state.occupancyState === 'KNOWN_MATTER'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : state.occupancyState === 'KNOWN_EMPTY'
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : 'bg-purple-950 text-purple-300 border border-purple-800'
          }`}>
            {state.occupancyState}
          </span>
        </div>

        {/* Epistemic Subtype Distinction for UNKNOWN */}
        {isUnknown ? (
          <div className="bg-purple-950/40 border border-purple-800/60 rounded-lg p-2.5 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-200">UNKNOWN != 0 (Axiom)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 uppercase font-bold">
                  Subtype: {unknownSubtype === 'occluded' ? 'Occluded (Obstacle Shadow)' : unknownSubtype === 'insufficient_coverage' ? 'Insufficient Coverage' : 'Unobserved (Outside Volume)'}
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80 mt-1 leading-snug">
                {unknownSubtype === 'occluded'
                  ? 'Coordinate is situated along a ray path behind a detected solid barrier. High entropy (S = 1.0) is preserved without fabricating vacuum.'
                  : unknownSubtype === 'insufficient_coverage'
                  ? 'Sensor signal fell below signal-to-noise threshold in this cell.'
                  : 'Coordinate has not been swept by any active sensor frustum.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2.5 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-emerald-200 text-[11px] leading-snug">
              <span className="font-semibold text-emerald-300">Empirically Resolved:</span>{' '}
              Integrated across {state.observationsCount} measurement(s) from [{state.contributingSensors.join(', ')}].
            </div>
          </div>
        )}

        {/* Superposition Basis |ψ⟩ */}
        <div className="pt-1.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">|Void⟩: {voidPercent}%</span>
            <span className="text-cyan-300 font-semibold">|Matter⟩: {occPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-slate-600 transition-all" style={{ width: `${voidPercent}%` }} />
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${occPercent}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[10px] text-slate-400">
            <div>ψ_Void: {state.psiVoid.re.toFixed(3)} + {state.psiVoid.im.toFixed(3)}i</div>
            <div>ψ_Matter: {state.psiMatter.re.toFixed(3)} + {state.psiMatter.im.toFixed(3)}i</div>
          </div>
        </div>
      </div>

      {/* 3. Strongly-Typed Physical Observables (Temperature, Velocity, Pressure, Energy, Field) */}
      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Physical Observables & Fields</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
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
            Conf: {(state.propertyConfidences.temperature * 100).toFixed(0)}%
          </div>
        </div>

        {/* Velocity */}
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
            {state.velocity ? `[${state.velocity.map(v => v.toFixed(2)).join(',')}] m/s` : 'UNKNOWN'}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Conf: {(state.propertyConfidences.velocity * 100).toFixed(0)}%
          </div>
        </div>

        {/* Tactile Contact Pressure */}
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
            Conf: {(state.propertyConfidences.pressure * 100).toFixed(0)}%
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
            Conf: {(state.propertyConfidences.dielectric * 100).toFixed(0)}%
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

        {/* Field Amplitude & Optical Color */}
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
              className="w-5 h-5 rounded border border-slate-700 shadow"
              style={{ backgroundColor: `rgb(${Math.round(state.color[0] * 255)}, ${Math.round(state.color[1] * 255)}, ${Math.round(state.color[2] * 255)})` }}
            />
            <span className="font-mono text-xs text-slate-300">
              {state.light ? `RGB(${state.light.map(c => c.toFixed(2)).join(',')})` : 'Unobserved light'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Quantum Information Metrics (Confidence, Entropy, Purity, Coherence) */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex flex-col gap-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
          <span>Information & Epistemic Uncertainty Metrics</span>
          <span className="font-mono text-cyan-400 font-bold">{(state.confidence * 100).toFixed(1)}% Overall Confidence</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
          <div>Von Neumann Entropy (S): <span className="text-amber-400 font-bold">{state.entropy.toFixed(3)}</span></div>
          <div>Epistemic Uncertainty: <span className="text-purple-300 font-bold">{(state.uncertainty * 100).toFixed(1)}%</span></div>
          <div>Purity Tr(ρ²): <span className="text-emerald-400 font-bold">{state.purity.toFixed(3)}</span></div>
          <div>Phase Coherence: <span className="text-cyan-300">{state.coherence.toFixed(3)}</span></div>
        </div>
      </div>

      {/* 5. Known Mask Status Pills */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">
          Epistemic Known Mask (Explicit Nullability)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(state.knownMask).map(([key, isKnown]) => (
            <span
              key={key}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                isKnown
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {key}: {isKnown ? 'KNOWN' : 'NULL'}
            </span>
          ))}
        </div>
      </div>

      {/* 6. Temporal Prediction Box */}
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

      {/* 7. Sensor Provenance, Timestamp, and History Log */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sensor Provenance & History</span>
          </span>
          <span className="font-mono text-slate-400">
            Total Observations: {state.observationsCount}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">Contributing Sensors:</span>
            <span className="text-slate-200">
              {state.contributingSensors.length > 0 ? state.contributingSensors.join(', ') : 'None (Vacuum Prior)'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Last Observation Timestamp:</span>
            <span className="text-slate-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 inline" />
              {formattedTimestamp}
            </span>
          </div>
        </div>

        {/* Detailed Sensor History Log */}
        {state.detailedHistory && state.detailedHistory.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Observation Audit Trail ({state.detailedHistory.length})
            </span>
            <div className="max-h-28 overflow-y-auto divide-y divide-slate-800/60 font-mono text-[10px]">
              {state.detailedHistory.map((rec, idx) => (
                <div key={idx} className="py-1 flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Fingerprint className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-cyan-300 font-semibold">{rec.sensorType}</span>
                    <span className="text-slate-400">→ {rec.observedProperty}</span>
                  </div>
                  <div className="text-slate-400">
                    Conf: {(rec.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
