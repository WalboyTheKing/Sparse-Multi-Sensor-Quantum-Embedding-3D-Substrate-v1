import React, { useState } from 'react';
import { PhysicalQuery, Vector3D } from '../types/quantumField';
import { 
  MessageSquare, 
  Send, 
  Compass, 
  HelpCircle, 
  Sliders, 
  Sparkles, 
  CheckCircle,
  AlertTriangle,
  Flame,
  Radio,
  Eye,
  ShieldAlert
} from 'lucide-react';

interface Props {
  onRunQuery: (prompt: string) => void;
  isLoading: boolean;
  currentQuery: PhysicalQuery | null;
  onOpenSettings: () => void;
  activeProviderName: string;
  onInspectCoordinate?: (coord: Vector3D) => void;
}

const PRESET_QUERIES = [
  {
    icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
    label: 'Temperature at Core',
    prompt: 'What is the temperature at the heated copper core and what are the hottest observed locations?',
  },
  {
    icon: <Compass className="w-3.5 h-3.5 text-sky-400" />,
    label: 'Free Space Clearance',
    prompt: 'Is the corridor through the center free space or blocked by solid matter, and what regions have high uncertainty?',
  },
  {
    icon: <Radio className="w-3.5 h-3.5 text-purple-400" />,
    label: 'Motion Prediction',
    prompt: 'What dynamic objects are in motion? Predict their kinematic trajectory based on radar Doppler velocity.',
  },
  {
    icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
    label: 'High Entropy Shadows',
    prompt: 'Where are the regions of highest quantum entropy and unobserved shadow in the spatial field?',
  },
  {
    icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
    label: 'Tactile Contact Stress',
    prompt: 'What contact force and mechanical pressure was verified by the tactile probe?',
  },
];

export const QueryConsole: React.FC<Props> = ({
  onRunQuery,
  isLoading,
  currentQuery,
  onOpenSettings,
  activeProviderName,
  onInspectCoordinate,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onRunQuery(inputText.trim());
    setInputText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Language Query Layer
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Engine: <span className="text-cyan-400 font-semibold">{activeProviderName}</span>
          </span>
          <button
            id="btn-open-api-settings"
            onClick={onOpenSettings}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
            title="Configure Grok / OpenAI API settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>API Settings</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-snug">
        Language is an interrogative query layer over the underlying quantum embedding substrate. Ask physical questions regarding temperature, free space, motion, or entropy.
      </p>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            id={`preset-query-${idx}`}
            onClick={() => onRunQuery(preset.prompt)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {preset.icon}
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Custom Query Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
        <input
          id="input-physical-query"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask world model: e.g. 'What is the temperature at (0.4, -0.2, 0.2)?' or 'Is path clear?'"
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
        />
        <button
          id="btn-submit-query"
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Query</span>
        </button>
      </form>

      {/* Query Result Card */}
      {currentQuery && (
        <div className="mt-2 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Query Answer</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-400">
                Confidence: <span className="text-emerald-400 font-semibold">{(currentQuery.confidence * 100).toFixed(0)}%</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                Entropy S: <span className="text-amber-400 font-semibold">{currentQuery.meanEntropy.toFixed(3)}</span>
              </span>
            </div>
          </div>

          <div className="text-slate-300 font-sans leading-relaxed whitespace-pre-line">
            {currentQuery.answer}
          </div>

          {/* Quick Inspect Coordinate action */}
          {currentQuery.relevantVoxelCoords && currentQuery.relevantVoxelCoords.length > 0 && onInspectCoordinate && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400">Relevant Coordinates:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentQuery.relevantVoxelCoords.slice(0, 3).map((coord, i) => (
                  <button
                    key={i}
                    onClick={() => onInspectCoordinate(coord)}
                    className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    title="Click to open State Inspector at this coordinate"
                  >
                    <span>Inspect ({coord.x.toFixed(2)}, {coord.y.toFixed(2)}, {coord.z.toFixed(2)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentQuery.metrics && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/60 font-mono text-[10px]">
              {Object.entries(currentQuery.metrics).map(([key, val]) => (
                <span key={key} className="bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                  {key}: <span className="text-slate-200">{val}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
