import React from 'react';
import { 
  WorldSnapshot, 
  PhysicalEvent, 
  WorldSituation, 
  Vector3D 
} from '../types/quantumField';
import { 
  Clock, 
  Zap, 
  Activity, 
  History, 
  ChevronRight, 
  Layers, 
  AlertTriangle,
  Compass
} from 'lucide-react';
import { EventReasoningEngine, PhysicalExplanation } from '../core/eventReasoning';

interface Props {
  snapshots: readonly WorldSnapshot[];
  activeEvents: PhysicalEvent[];
  situations: WorldSituation[];
  onSelectSnapshot?: (id: string) => void;
  onHighlightCoords?: (coords: Vector3D[]) => void;
}

export const TemporalEventPanel: React.FC<Props> = ({
  snapshots,
  activeEvents,
  situations,
  onSelectSnapshot,
  onHighlightCoords,
}) => {
  const [activeTab, setActiveTab] = React.useState<'events' | 'situations' | 'snapshots'>('events');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 text-slate-200 shadow-xl">
      {/* Header and Tab Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Temporal & Event Substrate
          </h2>
        </div>

        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
          <button
            id="tab-btn-events"
            onClick={() => setActiveTab('events')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'events' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Events ({activeEvents.length})
          </button>
          <button
            id="tab-btn-situations"
            onClick={() => setActiveTab('situations')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'situations' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Situations ({situations.length})
          </button>
          <button
            id="tab-btn-snapshots"
            onClick={() => setActiveTab('snapshots')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'snapshots' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Snapshots ({snapshots.length})
          </button>
        </div>
      </div>

      {/* Events View */}
      {activeTab === 'events' && (
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {activeEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              <div>No physical state transitions recorded yet.</div>
              <div className="text-[10px] mt-0.5">Fire sensors to record empirical physical deltas.</div>
            </div>
          ) : (
            activeEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onHighlightCoords?.([evt.position])}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-slate-200 uppercase font-mono text-[10px]">
                      {evt.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Pos: [{evt.position.x.toFixed(1)}, {evt.position.y.toFixed(1)}, {evt.position.z.toFixed(1)}]
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {evt.evidence}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5 pt-1 border-t border-slate-900">
                  <span>Delta: {evt.delta !== null ? (evt.delta > 0 ? `+${evt.delta}` : evt.delta) : 'N/A'}</span>
                  <span>Confidence: {(evt.confidence * 100).toFixed(0)}%</span>
                  <span>Uncertainty: {(evt.uncertainty * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Situations View */}
      {activeTab === 'situations' && (
        <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
          {situations.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              <Layers className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              <div>No proximal event clusters active.</div>
            </div>
          ) : (
            situations.map((sit) => {
              const hypotheses = EventReasoningEngine.analyzeSituation(sit);
              return (
                <div
                  key={sit.id}
                  onClick={() => onHighlightCoords?.(sit.positions)}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-cyan-800/80 transition-colors cursor-pointer text-xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300">{sit.description}</span>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                      Conf: {(sit.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    <strong>Observable Properties:</strong> {sit.properties.join(', ')} ({sit.positions.length} coordinates)
                  </div>

                  {hypotheses.length > 0 && (
                    <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex flex-col gap-1 text-[11px]">
                      <div className="text-amber-400 font-semibold flex items-center gap-1">
                        <Compass className="w-3 h-3" />
                        <span>Physical Law: {hypotheses[0].physicalLawInvoked}</span>
                      </div>
                      <div className="text-slate-300">{hypotheses[0].hypothesis}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Snapshots View */}
      {activeTab === 'snapshots' && (
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {snapshots.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              <History className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              <div>No temporal world snapshots captured yet.</div>
            </div>
          ) : (
            snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                onClick={() => onSelectSnapshot?.(snap.id)}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-200">
                    Snapshot #{idx + 1}: {snap.label}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(snap.timestamp).toLocaleTimeString()} &bull; {snap.voxelSnapshots.size} voxels preserved
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
