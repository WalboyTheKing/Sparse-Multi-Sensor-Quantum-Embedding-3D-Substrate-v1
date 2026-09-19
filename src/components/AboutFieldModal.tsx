import React from 'react';
import { X, BookOpen, Layers, Atom, Sparkles, Cpu, Eye, Flame, Radio, HandMetal, AlertCircle, Compass } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutFieldModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-slate-200 shadow-2xl flex flex-col gap-4 my-8 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Atom className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-base text-white">Physical State Field: Architecture & Scientific Principles</h3>
          </div>
          <button
            id="btn-close-about-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-300 overflow-y-auto pr-2">
          {/* Scientific Disclaimer */}
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Scientific Clarification (Classical vs. Quantum):</span>{' '}
              This system is a <strong>classical simulation</strong> running on standard computer hardware. It employs the <strong>mathematical formalism of quantum mechanics</strong> (complex state vectors |ψ⟩, density matrices ρ, trace purity Tr(ρ²), and Von Neumann entropy S = -Tr(ρ log₂ ρ)) as a rigorous framework for continuous multi-property representation and epistemic uncertainty. It does <em>not</em> use quantum computing hardware or claim physical quantum superposition of macroscopic matter.
            </div>
          </div>

          {/* 1. What is Physical State Field & Why Sparse */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-cyan-300 text-sm mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              1. Authoritative Computational Representation
            </h4>
            <p className="text-slate-300 mb-2 font-medium">
              <em>The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance.</em>
            </p>
            <p className="text-slate-400">
              Unlike 2D images, RGB point clouds, or Gaussian Splatting, the <strong>Physical State Field</strong> is a persistent, sparse 3D spatial substrate. Space is discretized into an adaptive spatial index where each spatial point holds multiple physical observables (occupancy, temperature, velocity, tactile pressure, dielectric permittivity) simultaneously rather than merely photometric rendering proxies.
            </p>
          </div>

          {/* 2. Invariant: UNKNOWN != 0 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-purple-300 text-sm mb-1 flex items-center gap-1.5">
              <Atom className="w-4 h-4 text-purple-400" />
              2. Fundamental Invariant: UNKNOWN != 0
            </h4>
            <p className="text-slate-400">
              Standard neural network world models and occupancy grids conflate unobserved space with empty space (hallucinating 0.0 occupancy). In the Physical State Field:
            </p>
            <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-400">
              <li><strong>UNKNOWN:</strong> High Von Neumann entropy (S ≈ 1.0), zero confidence, unmeasured. Sub-classified into:
                <ul className="list-circle list-inside ml-5 mt-1 space-y-0.5 text-slate-400 text-[11px]">
                  <li>• <strong>Occluded:</strong> Space directly behind an obstacle shadow.</li>
                  <li>• <strong>Unobserved:</strong> Outside active sensor frustums.</li>
                  <li>• <strong>Insufficient Coverage:</strong> Return signal below detection threshold.</li>
                </ul>
              </li>
              <li><strong>KNOWN EMPTY:</strong> Confirmed transparent vacuum (|Void⟩ ≈ 1.0, S ≈ 0.05) verified by light penetration.</li>
              <li><strong>KNOWN MATTER:</strong> Confirmed solid surface (|Matter⟩ ≈ 1.0) verified by depth reflection or tactile contact.</li>
              <li><strong>CONFLICTING:</strong> Disagreement between sensor modalities flagged for resolution.</li>
            </ul>
            <p className="text-slate-400 mt-2">
              The volume directly behind an opaque shield remains in maximum entropy (S ≈ 1.0). A robotic agent knows it is uninspected, not empty.
            </p>
          </div>

          {/* 3. Multi-Sensor Direct Writing */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-emerald-300 text-sm mb-1 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              3. Multi-Sensor Direct Writing
            </h4>
            <p className="text-slate-400 mb-2">
              All sensors write asynchronously into the same persistent spatial state substrate:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <div><strong>RGB-D Camera:</strong> Raycasts clear line-of-sight vacuum and resolve solid boundary surfaces.</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <div><strong>FLIR Thermal:</strong> Updates radiative surface heat without destroying occupancy.</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <div><strong>mmWave Radar:</strong> Penetrates optical boundaries and measures Doppler velocity vectors.</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                <HandMetal className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div><strong>Force Probe:</strong> Direct contact achieves measurement-induced uncertainty reduction ($S \approx 0.02$).</div>
              </div>
            </div>
          </div>

          {/* 4. Language as Query Layer Only */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              4. Language as a Query & Description Layer
            </h4>
            <p className="text-slate-400">
              The language model is <strong>not</strong> the source of physical truth. It does not store 3D space in latent text weights. Language sits strictly on top of the physical state field as an interrogator: user questions are converted into structured geometric queries against the field, evaluated deterministically, and formatted with full epistemic provenance.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            id="btn-dismiss-about"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
