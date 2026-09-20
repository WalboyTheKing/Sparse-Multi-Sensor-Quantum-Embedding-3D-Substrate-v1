import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Layers, 
  Atom, 
  Sparkles, 
  Cpu, 
  Eye, 
  Flame, 
  Radio, 
  HandMetal, 
  AlertCircle, 
  Compass, 
  ShieldCheck, 
  GitBranch, 
  Activity, 
  CheckCircle2, 
  Binary,
  Maximize2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SCIENTIFIC_PRINCIPLES = [
  {
    num: 1,
    title: 'Clarity Before Beauty',
    summary: 'Design must serve understanding before aesthetics.',
    body: 'Every interface element should have a clear scientific or operational purpose. Visual decoration should never compete with physical-state information.',
  },
  {
    num: 2,
    title: 'Information Hierarchy',
    summary: 'The interface must make the hierarchy of information immediately understandable.',
    body: '1. Physical State Field visualization (primary visual anchor)\n2. Sensor controls and physical observations\n3. State metrics and uncertainty\n4. Query and analysis\n5. Advanced scientific representation\n\nThe 3D physical field remains the primary visual element.',
  },
  {
    num: 3,
    title: 'Controlled Information Density',
    summary: 'Scientific interfaces can contain substantial information without becoming visually chaotic.',
    body: 'Use spacing, grouping, typography, and progressive disclosure to keep information readable. Do not remove scientific information merely to make the interface look simpler.',
  },
  {
    num: 4,
    title: 'Fidelity to the Inferred Physical State',
    summary: 'The interface must represent the currently inferred physical state faithfully.',
    body: 'Visual encodings must not hide, exaggerate or fabricate physical information. UNKNOWN must never be represented as zero. UNKNOWN must not automatically be interpreted as KNOWN EMPTY. KNOWN EMPTY must only be established by sufficient physical evidence. The system represents an inferred computational physical state, not absolute physical truth.',
  },
  {
    num: 5,
    title: 'Precise and Consistent Terminology',
    summary: 'Use terminology that accurately describes the computational model.',
    body: 'Prefer "Quantum-Inspired Physical State" over "Quantum State". Prefer "Measurement-Induced Uncertainty Reduction" over "Quantum Collapse". Distinguish clearly between: Observed, Derived, Inferred, Predicted, and Unknown. These categories must not be treated as interchangeable.',
  },
  {
    num: 6,
    title: 'Progressive Disclosure',
    summary: 'Show essential information first without deleting advanced details.',
    body: 'Advanced information remains available without overwhelming the primary interface: density matrix representation, amplitudes, purity, entropy, epistemic uncertainty, sensor provenance, temporal history, and derived quantities. Use expandable sections, overlays, or inspectors.',
  },
  {
    num: 7,
    title: 'Immediate and Subtle Feedback',
    summary: 'Every meaningful user action should produce clear but restrained feedback.',
    body: 'Sensor firing, voxel selection, visualization mode changes, experiment execution, query evaluation, and state updates communicate system activity cleanly without becoming decorative distractions.',
  },
  {
    num: 8,
    title: 'Instrument Aesthetic',
    summary: 'The interface should resemble a professional scientific instrument.',
    body: 'Visual references: scientific instrumentation, microscopy software, simulation environments, robotics interfaces, measurement systems. Characteristics: dark background, restrained luminous accents, fine borders, technical typography, controlled contrast, minimal decorative shadows, data-focused visual hierarchy. Avoid generic SaaS dashboard aesthetics.',
  },
  {
    num: 9,
    title: 'System Transparency',
    summary: 'Distinguish observed, derived, inferred, predicted, and unknown.',
    body: 'The user should always know what was directly observed, derived, inferred, predicted, or remains unknown. The interface makes uncertainty visible rather than hiding it. Sensor provenance remains fully accessible.',
  },
  {
    num: 10,
    title: 'Functional Minimalism',
    summary: 'Every visual element and color must serve an empirical purpose.',
    body: 'Color primarily encodes meaningful physical information: entropy, temperature, velocity, pressure, confidence, and state classification. Color is never used purely for decoration when it could confuse physical interpretation.',
  },
  {
    num: 11,
    title: 'Traceability and Provenance',
    summary: 'Physical-state information retains auditability across its lifecycle.',
    body: 'Understand which sensor contributed, when the observation occurred, the confidence score, the state uncertainty, and whether the quantity was observed, derived, inferred, or predicted.',
  },
];

const STATE_SEMANTICS = [
  {
    tag: 'OBSERVED',
    color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    desc: 'Directly measured by a sensor (e.g. RGB-D depth return, thermal radiance, radar Doppler reflection, or tactile force probe).',
  },
  {
    tag: 'DERIVED',
    color: 'text-sky-400 bg-sky-950/60 border-sky-800',
    desc: 'Computed deterministically from available physical observations (e.g. thermal diffusion gradients, kinetic velocity vectors, contact stress tensors).',
  },
  {
    tag: 'INFERRED',
    color: 'text-purple-400 bg-purple-950/60 border-purple-800',
    desc: 'Estimated from the current physical state and density matrix world model (e.g. free space clearance probabilities, multi-sensor Bayesian fusion).',
  },
  {
    tag: 'PREDICTED',
    color: 'text-amber-400 bg-amber-950/60 border-amber-800',
    desc: 'Estimated about a future state or forward extrapolation along detected velocity vectors.',
  },
  {
    tag: 'UNKNOWN',
    color: 'text-rose-400 bg-rose-950/60 border-rose-800',
    desc: 'Insufficient physical evidence. High Von Neumann entropy (S ≈ 1.0). UNKNOWN != 0. Must never be conflated with empty space or fabricated zeros.',
  },
];

export const AboutFieldModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'principles' | 'semantics' | 'architecture'>('principles');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 text-slate-200 shadow-2xl flex flex-col gap-4 my-6 max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-lg text-white tracking-tight">Scientific Principles</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Design Principles for a Computational Physical-State Instrument
            </p>
          </div>
          <button
            id="btn-close-about-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('principles')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'principles'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>11 Scientific Principles</span>
          </button>
          <button
            onClick={() => setActiveTab('semantics')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'semantics'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>State Semantics</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Substrate Architecture</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-300 overflow-y-auto pr-1">
          {/* TAB 1: 11 SCIENTIFIC PRINCIPLES */}
          {activeTab === 'principles' && (
            <div className="flex flex-col gap-3.5 animate-fade-in">
              {/* Introduction Callout */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-slate-300 italic">
                "The Physical State Field is designed as a scientific instrument interface rather than a conventional web dashboard. Its visual language prioritizes clarity, data fidelity, uncertainty representation, traceability, and progressive access to information."
              </div>

              {/* 11 Principles Cards */}
              <div className="grid grid-cols-1 gap-2.5">
                {SCIENTIFIC_PRINCIPLES.map((principle) => (
                  <div
                    key={principle.num}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                        PRINCIPLE {principle.num}
                      </span>
                      <h4 className="font-semibold text-white text-xs sm:text-sm">
                        {principle.title}
                      </h4>
                    </div>
                    <div className="text-cyan-300/90 font-medium mb-1.5 text-[11px]">
                      {principle.summary}
                    </div>
                    <div className="text-slate-400 whitespace-pre-line text-[11px] leading-relaxed">
                      {principle.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: STATE SEMANTICS */}
          {activeTab === 'semantics' && (
            <div className="flex flex-col gap-3.5 animate-fade-in">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-slate-300">
                <h4 className="font-semibold text-white text-xs mb-1">Epistemic State Hierarchy</h4>
                <p className="text-slate-400 text-[11px]">
                  The Physical State Field strictly enforces consistent categorization of all spatial state information. Categories must never be treated as interchangeable:
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {STATE_SEMANTICS.map((item) => (
                  <div
                    key={item.tag}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${item.color}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed mt-1">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* UNKNOWN != 0 Invariant Callout */}
              <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-3.5 text-purple-200">
                <span className="font-semibold text-purple-300 block mb-1">Authoritative Invariant: UNKNOWN != 0</span>
                <p className="text-[11px] leading-relaxed text-purple-200/90">
                  UNKNOWN must never be represented as zero. UNKNOWN must not automatically be interpreted as KNOWN EMPTY. KNOWN EMPTY must only be established by sufficient physical evidence (such as verified line-of-sight optical transmission). The system represents an inferred computational physical state, not absolute physical truth.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSTRATE ARCHITECTURE & AXIOMS */}
          {activeTab === 'architecture' && (
            <div className="flex flex-col gap-3.5 animate-fade-in">
              {/* Scientific Clarification */}
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">Scientific Clarification (Classical vs. Quantum):</span>{' '}
                  This system is a <strong>classical simulation research prototype</strong> running on standard semiconductor hardware (CPU / GPU via WebGL). It employs the <strong>mathematical formalism of quantum mechanics</strong> (complex state vectors |ψ⟩, density matrices ρ, trace purity Tr(ρ²), and Von Neumann entropy S = -Tr(ρ log₂ ρ)) as a rigorous framework for continuous multi-property representation and epistemic uncertainty. It does <em>not</em> use quantum computing hardware or claim physical quantum superposition of macroscopic matter.
                </div>
              </div>

              {/* 1. Authoritative Representation */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-cyan-300 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  1. Authoritative Computational Representation
                </h4>
                <p className="text-slate-300 mb-2 font-medium">
                  <em>"The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance."</em>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Space is discretized into a sparse, adaptive 3D volumetric substrate (2,744 voxels in the reference 14×14×14 grid). Every active node maintains a 14-channel physical vector holding occupancy, temperature, velocity, tactile pressure, and dielectric permittivity simultaneously.
                </p>
              </div>

              {/* 2. Invariant: UNKNOWN != 0 */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-purple-300 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-purple-400" />
                  2. Occlusion & Epistemic Uncertainty
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Standard neural network world models conflate unobserved space with empty space (hallucinating 0.0 occupancy). In the Physical State Field:
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-400 text-[11px]">
                  <li><strong>UNKNOWN:</strong> High Von Neumann entropy (S ≈ 1.0), zero confidence, unmeasured. Subtypes include: <em>Occluded</em> (obstacle shadow), <em>Unobserved</em> (outside frustum), <em>Insufficient Coverage</em>.</li>
                  <li><strong>KNOWN EMPTY:</strong> Confirmed transparent free space (|Void⟩ ≈ 1.0, S ≈ 0.05) verified by optical transmission.</li>
                  <li><strong>KNOWN MATTER:</strong> Confirmed solid surface (|Matter⟩ ≈ 1.0) verified by depth reflection or tactile contact.</li>
                  <li><strong>CONFLICTING_UNCERTAIN:</strong> Disagreement between sensor modalities flagged for resolution.</li>
                </ul>
              </div>

              {/* 3. Multi-Sensor Direct Writing */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-emerald-300 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  3. Multi-Sensor Direct Writing
                </h4>
                <p className="text-slate-400 text-[11px] mb-2">
                  All sensors write asynchronously into the same persistent spatial state substrate:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                    <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <div><strong>RGB-D Camera:</strong> Raycasts clear line-of-sight free space and resolves solid boundary surfaces.</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                    <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <div><strong>Thermal Bolometer:</strong> Ingests radiative surface heat without corrupting occupancy.</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                    <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <div><strong>mmWave Radar:</strong> Penetrates optical boundaries and measures Doppler velocity vectors.</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-start gap-2">
                    <HandMetal className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div><strong>Force Probe:</strong> Direct contact achieves measurement-induced uncertainty reduction (S ≈ 0.02).</div>
                  </div>
                </div>
              </div>

              {/* 4. Language as Query Layer Only */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-amber-300 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  4. Language as an Interrogative Query Layer
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Language models (such as xAI Grok or OpenAI GPT-4o) are strictly downstream verbalizers. They do not store 3D physical state in latent text weights. Physical questions are evaluated deterministically by the Physical Query Engine, and results are verbalized with full epistemic provenance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-[11px] font-mono text-slate-500">
            Physical State Field • World Model v1.0
          </span>
          <button
            id="btn-dismiss-about"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
