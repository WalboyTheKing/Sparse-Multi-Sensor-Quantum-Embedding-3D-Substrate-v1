import React, { useState } from 'react';
import { VoxelPoint, SensorConfig, PhysicalEvent } from '../types/quantumField';
import { buildScientificExport, downloadJsonFile, ScientificExportPackage } from '../utils/scientificExport';
import {
  X,
  Download,
  FileJson,
  Database,
  Layers,
  Activity,
  CheckCircle2,
  FolderArchive,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grid: Map<string, VoxelPoint>;
  sensors: SensorConfig[];
  events: PhysicalEvent[];
  snapshots: any[];
  activeExperimentId: string;
}

export const ScientificExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  grid,
  sensors,
  events,
  snapshots,
  activeExperimentId,
}) => {
  const [downloadedItem, setDownloadedItem] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<'metadata' | 'metrics' | 'events' | null>(null);

  if (!isOpen) return null;

  const exportData: ScientificExportPackage = buildScientificExport(
    grid,
    sensors,
    events,
    snapshots,
    activeExperimentId
  );

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const handleDownloadBundle = () => {
    downloadJsonFile(exportData, `physical_state_field_bundle_${activeExperimentId}_${timestampStr}.json`);
    setDownloadedItem('bundle');
    setTimeout(() => setDownloadedItem(null), 3000);
  };

  const handleDownloadIndividual = (type: 'field' | 'events' | 'snapshots' | 'metrics' | 'metadata') => {
    const filename = `${type}_${activeExperimentId}_${timestampStr}.json`;
    downloadJsonFile(exportData[type], filename);
    setDownloadedItem(type);
    setTimeout(() => setDownloadedItem(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 text-slate-200 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <FolderArchive className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Physical State Field — Scientific Dataset Export</h3>
              <p className="text-[11px] text-slate-400">Complete reproducible empirical dataset export (5 artifacts)</p>
            </div>
          </div>
          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scientific Standard Banner */}
        <div className="bg-slate-950 p-3 rounded-xl border border-cyan-900/60 text-xs text-slate-300 leading-relaxed">
          <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold mb-1">
            Authoritative Empirical Standard
          </div>
          <p className="text-slate-300 text-[11px] italic">
            &ldquo;The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance.&rdquo;
          </p>
        </div>

        {/* Dataset Summary Matrix */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Total Voxels</div>
            <div className="text-sm font-bold text-white mt-0.5">{exportData.metadata.voxel_count}</div>
            <div className="text-[9px] text-slate-500 font-mono">14³ (0.28m res)</div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Observed</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{exportData.metadata.observed_voxels}</div>
            <div className="text-[9px] text-slate-500 font-mono">Resolved cells</div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Unknown Cells</div>
            <div className="text-sm font-bold text-purple-400 mt-0.5">{exportData.metadata.unknown_voxels}</div>
            <div className="text-[9px] text-slate-500 font-mono">
              {exportData.metadata.epistemic_breakdown.occluded} occl / {exportData.metadata.epistemic_breakdown.unobserved} unob
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Events & History</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">
              {exportData.metadata.events_count} / {exportData.metadata.state_history_count}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">Events / Snaps</div>
          </div>
        </div>

        {/* Primary Action: Unified Full Bundle Download */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-purple-950/40 border border-cyan-500/30 p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-600/20 text-cyan-400 rounded-lg">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Full Scientific Package (.json)</div>
              <div className="text-[11px] text-slate-300">
                Single unified bundle containing all 5 files: <code className="text-cyan-300 font-mono">field</code>, <code className="text-cyan-300 font-mono">events</code>, <code className="text-cyan-300 font-mono">snapshots</code>, <code className="text-cyan-300 font-mono">metrics</code>, <code className="text-cyan-300 font-mono">metadata</code>
              </div>
            </div>
          </div>

          <button
            id="btn-download-full-bundle"
            onClick={handleDownloadBundle}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer shrink-0"
          >
            {downloadedItem === 'bundle' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Master Package</span>
              </>
            )}
          </button>
        </div>

        {/* Individual File Artifact Downloads */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Individual File Artifacts
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* field.json */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-mono text-white font-semibold">field.json</span>
                  <span className="text-[10px] text-slate-400 block">2,744 voxels with 14 physical channels</span>
                </div>
              </div>
              <button
                id="btn-download-field"
                onClick={() => handleDownloadIndividual('field')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors cursor-pointer"
                title="Download field.json"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* metadata.json */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="font-mono text-white font-semibold">metadata.json</span>
                  <span className="text-[10px] text-slate-400 block">Experiment specs, bounds, sensor setup</span>
                </div>
              </div>
              <button
                id="btn-download-metadata"
                onClick={() => handleDownloadIndividual('metadata')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors cursor-pointer"
                title="Download metadata.json"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* events.json */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-yellow-400 shrink-0" />
                <div>
                  <span className="font-mono text-white font-semibold">events.json</span>
                  <span className="text-[10px] text-slate-400 block">{exportData.events.length} detected physical events</span>
                </div>
              </div>
              <button
                id="btn-download-events"
                onClick={() => handleDownloadIndividual('events')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-yellow-300 transition-colors cursor-pointer"
                title="Download events.json"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* metrics.json */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-mono text-white font-semibold">metrics.json</span>
                  <span className="text-[10px] text-slate-400 block">Von Neumann entropy S, bit gain ΔI</span>
                </div>
              </div>
              <button
                id="btn-download-metrics"
                onClick={() => handleDownloadIndividual('metrics')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors cursor-pointer"
                title="Download metrics.json"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* snapshots.json */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between sm:col-span-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-mono text-white font-semibold">snapshots.json</span>
                  <span className="text-[10px] text-slate-400 block">{exportData.snapshots.length} temporal field state evolution records</span>
                </div>
              </div>
              <button
                id="btn-download-snapshots"
                onClick={() => handleDownloadIndividual('snapshots')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 transition-colors cursor-pointer"
                title="Download snapshots.json"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Schema Preview Toggle */}
        <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Inspect payload:</span>
            <button
              onClick={() => setPreviewFile(previewFile === 'metadata' ? null : 'metadata')}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                previewFile === 'metadata' ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              metadata.json
            </button>
            <button
              onClick={() => setPreviewFile(previewFile === 'metrics' ? null : 'metrics')}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                previewFile === 'metrics' ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              metrics.json
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Preview Drawer */}
        {previewFile && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
            <pre className="text-[10px] font-mono text-cyan-300/90 whitespace-pre-wrap">
              {JSON.stringify(exportData[previewFile], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
