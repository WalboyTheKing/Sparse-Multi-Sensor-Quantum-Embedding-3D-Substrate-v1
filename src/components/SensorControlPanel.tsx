import React from 'react';
import { SensorConfig, SensorType, FieldStatistics } from '../types/quantumField';
import { 
  Eye, 
  Flame, 
  Radio, 
  HandMetal, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Activity,
  Layers,
  Zap
} from 'lucide-react';

interface Props {
  sensors: SensorConfig[];
  onFireSensor: (sensorType: SensorType) => void;
  onFireAllSensors: () => void;
  onToggleSensor: (sensorId: string) => void;
  onResetField: () => void;
  isContinuousSweep: boolean;
  onToggleContinuousSweep: () => void;
  metrics: FieldStatistics;
  activeFiringSensor: SensorType | null;
}

export const SensorControlPanel: React.FC<Props> = ({
  sensors,
  onFireSensor,
  onFireAllSensors,
  onToggleSensor,
  onResetField,
  isContinuousSweep,
  onToggleContinuousSweep,
  metrics,
  activeFiringSensor,
}) => {
  const getSensorIcon = (type: SensorType) => {
    switch (type) {
      case 'rgbd':
        return <Eye className="w-4 h-4 text-sky-400" />;
      case 'thermal':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'radar':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'force_probe':
        return <HandMetal className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-slate-200 shadow-xl">
      {/* Header & Global Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Multi-Sensor Fusion Suite
          </h2>
        </div>
        <button
          id="btn-reset-field"
          onClick={onResetField}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2.5 py-1 rounded transition-colors"
          title="Reset field to high-entropy vacuum prior"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Prior</span>
        </button>
      </div>

      {/* Main Fire Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          id="btn-fire-all"
          onClick={onFireAllSensors}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-2 px-3 rounded-lg text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fire All Sensors</span>
        </button>

        <button
          id="btn-continuous-sweep"
          onClick={onToggleContinuousSweep}
          className={`flex items-center justify-center gap-2 font-medium py-2 px-3 rounded-lg text-xs transition-all cursor-pointer border ${
            isContinuousSweep
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isContinuousSweep ? 'Stop Sweep' : 'Continuous Sweep'}</span>
        </button>
      </div>

      {/* Sensor List */}
      <div className="flex flex-col gap-2.5">
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Individual Sensors (Write to Quantum State)
        </div>

        {sensors.map((sensor) => {
          const isFiring = activeFiringSensor === sensor.type;
          return (
            <div
              key={sensor.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isFiring
                  ? 'border-cyan-400 bg-cyan-950/30'
                  : sensor.enabled
                  ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  : 'border-slate-800/50 bg-slate-950/20 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800 mt-0.5">
                    {getSensorIcon(sensor.type)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span>{sensor.name}</span>
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: sensor.color }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      {sensor.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id={`btn-fire-${sensor.type}`}
                    onClick={() => onFireSensor(sensor.type)}
                    disabled={!sensor.enabled}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 font-mono text-[11px] px-2 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
                    title={`Trigger ${sensor.name} raycast/pulse`}
                  >
                    <Play className="w-3 h-3" />
                    <span>Fire</span>
                  </button>

                  <input
                    type="checkbox"
                    checked={sensor.enabled}
                    onChange={() => onToggleSensor(sensor.id)}
                    className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
                    title="Toggle sensor active state"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Field Metrics */}
      <div className="pt-2 border-t border-slate-800">
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Field State Telemetry</span>
          <span className="font-mono text-cyan-400">{metrics.totalVoxels} Voxels</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Mean Field Entropy (S)</div>
            <div className="text-sm font-mono font-semibold text-slate-200 flex items-baseline gap-1.5 mt-0.5">
              <span>{metrics.meanEntropy.toFixed(3)}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {metrics.meanEntropy > 0.7 ? '(High Uncertainty)' : '(Collapsed / Known)'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Information Gain</div>
            <div className="text-sm font-mono font-semibold text-emerald-400 mt-0.5">
              +{metrics.informationGainBits.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">bits</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Collapsed vs Unknown</div>
            <div className="text-xs font-mono text-slate-300 mt-1 flex items-center justify-between">
              <span className="text-cyan-400">{metrics.observedVoxels} known</span>
              <span className="text-purple-400">{metrics.unobservedVoxels} vacuum</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Peak Thermal / Velocity</div>
            <div className="text-xs font-mono text-slate-300 mt-1 flex items-center justify-between">
              <span className="text-orange-400">{metrics.maxTemperature}°C</span>
              <span className="text-yellow-400">{metrics.maxVelocity} m/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
