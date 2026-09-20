import React from 'react';
import { FlaskConical, Eye, Flame, Radio, HandMetal, CheckCircle } from 'lucide-react';

export type ExperimentId = 'occlusion' | 'multi_sensor_merge' | 'doppler_motion' | 'tactile_ground_truth';

interface Props {
  activeExperiment: ExperimentId | null;
  onRunExperiment: (id: ExperimentId) => void;
  isRunning: boolean;
}

export const ExperimentPresets: React.FC<Props> = ({
  activeExperiment,
  onRunExperiment,
  isRunning,
}) => {
  const experiments = [
    {
      id: 'occlusion' as ExperimentId,
      title: '1. Occlusion & Shadow Uncertainty',
      description: 'Fires RGB-D camera. Line of sight resolves to pure matter; occluded rear maintains maximum Von Neumann entropy (S = 1.0).',
      badge: 'Uncertainty Preservation',
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800',
      icon: <Eye className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'multi_sensor_merge' as ExperimentId,
      title: '2. Multi-Sensor State Merge',
      description: 'Vision, Thermal, and Radar write into the exact same persistent spatial state vectors without Gaussian splats or mesh limits.',
      badge: 'Multi-Modal Fusion',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
    },
    {
      id: 'doppler_motion' as ExperimentId,
      title: '3. Kinematic Doppler Trajectory',
      description: 'Penetrative mmWave radar extracts velocity vector from dynamic target for future trajectory extrapolation.',
      badge: 'Doppler Kinematics',
      badgeColor: 'text-yellow-400 bg-yellow-950/60 border-yellow-800',
      icon: <Radio className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'tactile_ground_truth' as ExperimentId,
      title: '4. Tactile Contact Measurement',
      description: 'Robotic probe presses against physical specimen, performing measurement-induced uncertainty reduction (local spatial entropy drops from 1.0 to 0.02).',
      badge: 'Direct Contact Measurement',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
      icon: <HandMetal className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 text-slate-200 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Curated Experiments
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">1-Click Reproducibility</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {experiments.map((exp) => {
          const isActive = activeExperiment === exp.id;
          return (
            <button
              key={exp.id}
              id={`btn-exp-${exp.id}`}
              onClick={() => onRunExperiment(exp.id)}
              disabled={isRunning}
              className={`p-3 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 font-semibold text-xs text-white">
                  {exp.icon}
                  <span>{exp.title}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${exp.badgeColor}`}>
                  {exp.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                {exp.description}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px] text-cyan-400 font-mono">
                <span>Run Experiment &rarr;</span>
                {isActive && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
