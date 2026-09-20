<div align="center">

# Physical State Field (PSF)
### Sparse Multi-Sensor Quantum-Inspired 3D Substrate & World Model Simulator
#### Prototype v1.0 • Deterministic Spatial Physics Instrument

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%207.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-Backend%20Proxy-lightgrey?logo=express&logoColor=black)](https://expressjs.com/)
[![xAI Grok](https://img.shields.io/badge/xAI%20Grok-Primary%20Explanation%20Layer-black?logo=x&logoColor=white)](https://x.ai/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o%20Secondary-412991?logo=openai&logoColor=white)](https://platform.openai.com/)
[![Tests](https://img.shields.io/badge/Tests-49%2F49%20Passing-brightgreen?logo=vitest&logoColor=white)](#scientific-validation-suite)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*A deterministic spatial world-model research prototype unifying multi-modal perception (RGB-D depth, micro-bolometer thermal, FMCW radar Doppler, tactile contact force), quantum-inspired density matrix embeddings, and rigorous epistemic uncertainty quantification.*

---

</div>

## 🌌 Overview

The **Physical State Field (PSF)** is a classical computational simulation architecture designed for robotic perception, spatial AI, and physics-grounded scene understanding. Traditional world models often rely on 2D image backbones or photometric rendering proxies (such as NeRFs or Gaussian Splatting) which fail to maintain an explicit representation of unobserved regions, contact forces, or multi-spectral sensor physics.

This system discretizes 3D space into a sparse volumetric substrate (reference grid of 2,744 voxels, 14 × 14 × 14) where each spatial cell maintains a **14-channel physical state vector**. By modeling occupancy through the mathematical formalism of density matrices ($\rho$) and a 2-level Hilbert state space ($|\text{Void}\rangle$ vs. $|\text{Matter}\rangle$), the substrate provides rigorous quantification of **epistemic uncertainty** (lack of sensor data) versus **aleatoric noise** (sensor measurement variance).

### 🏛️ Core Epistemic Axiom

> **"The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance."**

AI models (such as xAI's **Grok** or OpenAI's **GPT-4o**) serve exclusively as downstream verbalizers and scientific interpreters. The AI layer is **never** permitted to hallucinate or dictate physical reality: it receives strictly structured, deterministic query results produced directly by the Substrate's Physical Query Engine.

---

## 🏛️ Scientific Design Principles

The interface and underlying architecture are built as a **scientific instrument** rather than a conventional dashboard.

> *"The Physical State Field is designed as a scientific instrument interface rather than a conventional web dashboard. Its visual language prioritizes clarity, data fidelity, uncertainty representation, traceability, and progressive access to information."*

### 1. Clarity Before Beauty
Design must serve understanding before aesthetics. Every interface element has a clear scientific or operational purpose. Visual decoration never competes with physical-state information.

### 2. Information Hierarchy
The interface establishes a clear perceptual hierarchy:
1. **Physical State Field visualization** (3D viewport remains the primary visual anchor)
2. **Sensor controls and physical observations** (RGB-D, Thermal, Radar, Tactile)
3. **State metrics and uncertainty** (Von Neumann entropy, purity, confidence)
4. **Query and analysis** (Language query layer, spatial intent parsing)
5. **Advanced scientific representation** (Density matrices, amplitudes, temporal histories)

### 3. Controlled Information Density
Scientific interfaces can contain substantial information without becoming chaotic. Spacing, grouping, technical typography, and progressive disclosure keep information readable without arbitrarily stripping scientific depth.

### 4. Fidelity to the Inferred Physical State
Visual encodings must not hide, exaggerate, or fabricate physical information:
- **`UNKNOWN` must never be represented as zero.**
- **`UNKNOWN` must not automatically be interpreted as `KNOWN EMPTY`.**
- **`KNOWN EMPTY` must only be established by sufficient physical evidence** (e.g. optical transmission across a clear ray path).
- The system represents an inferred computational physical state, not absolute physical truth.

### 5. Precise and Consistent Terminology
Language reflects computational reality:
- Prefer **Quantum-Inspired Physical State** over *Quantum State*.
- Prefer **Measurement-Induced Uncertainty Reduction** over *Quantum Collapse*.
- Distinguish strictly between: **Observed**, **Derived**, **Inferred**, **Predicted**, and **Unknown**.

### 6. Progressive Disclosure
Essential physical telemetry appears upfront; advanced mathematical details (complex amplitudes $|\psi\rangle$, purity $\text{Tr}(\rho^2)$, coherence, sensor provenance traces) remain accessible via inspector panels, modal views, and scientific data exports.

### 7. Immediate and Subtle Feedback
Actions (firing sensors, selecting voxels, changing slicing planes, executing queries) produce restrained, functional visual responses without decorative clutter.

### 8. Instrument Aesthetic
Visual character grounded in professional scientific tooling: dark background, restrained luminous accents, fine structural borders, technical typography, controlled contrast, and minimal decorative shadows.

### 9. System Transparency
The user can always distinguish what was directly measured, derived, inferred, predicted, or remains unknown. Uncertainty is displayed directly rather than concealed.

### 10. Functional Minimalism
Every visual channel and color encodes physical meaning: entropy, temperature, velocity, pressure, confidence, or state classification. Color is never decorative.

### 11. Traceability and Provenance
Every spatial cell records contributing sensor IDs, timestamps, confidence factors, and measurement variance across its entire operational history.

---

## 🏷️ State Semantics Hierarchy

The system strictly distinguishes between five categories of spatial state information:

| Category | Definition | Physical Example |
| :--- | :--- | :--- |
| **`OBSERVED`** | Directly measured by an active sensor | Depth reflection, infrared bolometer flux, tactile strain |
| **`DERIVED`** | Computed deterministically from raw observations | Thermal diffusion gradient, Doppler kinematic velocity vector |
| **`INFERRED`** | Estimated from the current physical state & density matrix | Bayesian occupancy probability, free-space clearance score |
| **`PREDICTED`** | Forward extrapolation of a future physical state | Kinematic trajectory propagation along radar velocity vector |
| **`UNKNOWN`** | Insufficient physical evidence ($S \approx 1.0$) | Space outside sensor sweeps, occluded obstacle shadow zones |

---

## ⚡ Key Architectural Pillars

### 1. Invariant: `UNKNOWN != 0` & Occlusion Preservation
In standard computer vision systems, unobserved space is frequently conflated with empty vacuum (zeros). In the Physical State Field:
- **Unobserved Space:** Starts with maximal Von Neumann entropy ($S = 1.0$), zero confidence, and `knownMask = 0`.
- **Occlusion Shadows:** Regions located behind opaque physical obstacles during an RGB-D sweep are explicitly tagged `unknownSubtype = "occluded"` and strictly maintain $S = 1.0$.
- **Matter vs. Void:** Confirmed matter exhibits $S \to 0$, high occupancy ($p > 0.9$), and `knownMask = 1`. Confirmed free space exhibits $p < 0.05$ with $S \to 0$.

### 2. Multi-Sensor Direct Fusion Pipeline
The substrate ingests raw physical streams from four heterogeneous sensor modalities:
* **RGB-D Depth Camera:** Raycasts depth vectors to carve out free space (`KNOWN_EMPTY`) and register surface points (`KNOWN_MATTER`).
* **Thermal Micro-Bolometer:** Ingests radiant thermal signatures ($T \in [-20^\circ\text{C}, 150^\circ\text{C}]$), modeling thermal diffusion gradients across solid matter.
* **FMCW Radar Doppler:** Emits frequency-modulated continuous waves to detect Doppler velocity vectors ($v \in [-15, +15]\,\text{m/s}$), penetrating low-dielectric obstacles.
* **High-Frequency Tactile Force Probe:** Ingests normal contact forces and shear stress tensors ($P \in [0, 500]\,\text{kPa}$) directly into substrate surface voxels.

### 3. Quantum-Inspired Density Matrix Formulation
Rather than tracking heuristic confidence scores, each voxel models occupancy state using the mathematical apparatus of quantum density matrices:

$$\rho = |\psi\rangle \langle\psi| = \begin{pmatrix} |\alpha|^2 & \alpha \beta^* \\ \alpha^* \beta & |\beta|^2 \end{pmatrix}$$

Where:
* $|\psi\rangle = \alpha |\text{Void}\rangle + \beta |\text{Matter}\rangle$, with $|\alpha|^2 + |\beta|^2 = 1$.
* **Purity:** $\gamma = \text{Tr}(\rho^2) \in [0.5, 1.0]$. A pure state ($\gamma = 1.0$) indicates complete observation certainty; a maximally mixed state ($\gamma = 0.5$) represents complete ignorance.
* **Von Neumann Entropy:** $S(\rho) = -\text{Tr}(\rho \log_2 \rho) \in [0, 1]$.
* **Information Gain:** $\Delta I = S_{\text{prior}} - S_{\text{posterior}}$ (bits gained per sensory sweep).

### 4. Deterministic Physical Query Engine
Users and autonomous agents query the field using natural language (e.g., *"What is the peak temperature behind the barrier?"*, *"Is any moving object detected?"*).
1. The engine deterministically parses physical intents (spatial bounding box, target observable, threshold conditions).
2. Direct volumetric traversal evaluates the mathematical field state.
3. If an unobserved region is targeted, it deterministically reports `UNKNOWN` with empirical provenance.
4. Optional verbalization via **xAI Grok** (or OpenAI GPT-4o) translates the structured output into natural scientific discourse without risk of factual deviation.

---

## 📊 14-Channel Voxel State Vector

Every active spatial node in the field stores the following continuous state representation:

| # | Channel | Type | Physical Meaning |
|---|---------|------|------------------|
| 1 | `occupancy` | `number [0, 1]` | Inferred probability of matter existence |
| 2 | `occupancyState` | `enum` | Discrete classification (`UNKNOWN`, `KNOWN_EMPTY`, `KNOWN_MATTER`) |
| 3 | `entropy` | `number [0, 1]` | Epistemic Von Neumann entropy $S(\rho)$ |
| 4 | `confidence` | `number [0, 1]` | Empirical certainty ($1 - S$) |
| 5 | `uncertainty` | `number [0, 1]` | Combined epistemic and sensor measurement variance |
| 6 | `purity` | `number [0.5, 1]` | Quantum state purity $\text{Tr}(\rho^2)$ |
| 7 | `coherence` | `number [0, 1]` | Off-diagonal phase coherence magnitude $|\rho_{01}|$ |
| 8 | `psiVoid` | `Complex` | Complex probability amplitude $\alpha$ for state $|\text{Void}\rangle$ |
| 9 | `psiMatter` | `Complex` | Complex probability amplitude $\beta$ for state $|\text{Matter}\rangle$ |
| 10 | `knownMask` | `bitmask` | Explicit sensory coverage bitmask per observable channel |
| 11 | `propertyConfidences` | `Record<string, number>` | Individual confidence scores per channel ($T, v, P, \epsilon$) |
| 12 | `propertyUncertainties` | `Record<string, number>` | Individual noise standard deviations per channel |
| 13 | `contributingSensors` | `string[]` | Complete provenance history of sensor IDs that updated this voxel |
| 14 | `detailedHistory` | `VoxelHistoryEntry[]` | Time-stamped micro-log of state transitions |

---

## 🏗️ Repository Architecture

```text
.
├── scripts/
│   └── verify_field.ts          # Comprehensive test suite (49 mathematical assertions)
├── server.ts                    # Express backend proxy for xAI Grok / OpenAI
├── src/
│   ├── components/              # React UI & Three.js 3D Viewport
│   │   ├── AboutFieldModal.tsx          # 11 Scientific Principles & architecture modal
│   │   ├── ApiKeyModal.tsx              # Grok / OpenAI key configuration & latency tester
│   │   ├── ExperimentPresets.tsx        # Scientific benchmark scenarios
│   │   ├── QueryConsole.tsx             # Interactive physical query interface
│   │   ├── ScientificExportModal.tsx    # Raw telemetry & state bundle exporter
│   │   ├── SensorControlPanel.tsx       # Live controls for RGB-D, Thermal, Radar, Tactile
│   │   ├── StateInspectorModal.tsx      # Deep voxel quantum-inspired state viewer
│   │   ├── TemporalEventPanel.tsx       # Causal event log & situation tracking
│   │   ├── ThreeFieldCanvas.tsx         # WebGL Three.js point-cloud & vector field
│   │   └── VoxelStateInspector.tsx      # Real-time hover inspector
│   ├── core/                    # Scientific & Mathematical Engine
│   │   ├── adaptiveResolution.ts        # Dynamic spatial octree refinement & coarsening
│   │   ├── eventDetection.ts            # Physical anomaly & threshold detection
│   │   ├── eventReasoning.ts            # Causal situation clustering
│   │   ├── physicalQueryEngine.ts       # Deterministic state evaluation (UNKNOWN != 0)
│   │   ├── prediction.ts                # Epistemic forward state extrapolation
│   │   ├── quantumEmbedding.ts          # Density matrix, entropy, purity, and trace math
│   │   ├── sensorFusion.ts              # Bayesian & density matrix state fusion
│   │   ├── sensorSimulation.ts          # Multi-sensor physics simulators
│   │   ├── sparseWorld.ts               # Sparse spatial hash grid data structures
│   │   ├── temporalWorld.ts             # Time-series world state recorder
│   │   └── worldSituation.ts            # Situation-level semantic abstractions
│   ├── sensors/                 # Sensor Modality Implementations
│   │   ├── forceSensor.ts               # Tactile & contact stress normalizer
│   │   ├── radarSensor.ts               # FMCW Doppler velocity processing
│   │   ├── rgbdSensor.ts                # Raycasting depth & occlusion mapping
│   │   ├── sensorNormalizer.ts          # Cross-sensor unit scaling & uncertainty calibration
│   │   ├── sensorTypes.ts               # Sensor coordinate & stream types
│   │   └── thermalSensor.ts             # Micro-bolometer radiation & temperature integration
│   ├── services/
│   │   └── llmQueryService.ts           # Grounded Grok / OpenAI query pipeline
│   ├── types/
│   │   └── quantumField.ts              # TypeScript type declarations for field state
│   ├── utils/
│   │   └── scientificExport.ts          # Comprehensive JSON bundle generation
│   ├── App.tsx                  # Main application orchestrator
│   ├── index.css                # Tailwind CSS v4 styling rules
│   └── main.tsx                 # React 19 root entry
├── .env.example                 # Environment variables template (Grok & OpenAI)
├── package.json                 # Dependencies & automation scripts
├── tsconfig.json                # Strict TypeScript configuration
└── vite.config.ts               # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or later
* **npm** or **bun** / **pnpm**
* Modern Web Browser with **WebGL 2.0** support

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/WalboyTheKing/Sparse-Multi-Sensor-Quantum-Embedding-3D-Substrate-v1.git
   cd Sparse-Multi-Sensor-Quantum-Embedding-3D-Substrate-v1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Configure your xAI Grok or OpenAI API key:
   ```env
   # Primary verbalizer
   GROK_API_KEY=xai-your-grok-api-key-here

   # Secondary verbalizer
   OPENAI_API_KEY=sk-your-openai-api-key-here
   PORT=3000
   ```
   > **Note:** The entire Physical State Field operates **100% offline and deterministically** without any API key. An API key is only required if you want Grok or OpenAI to verbalize the structured query results into conversational scientific text.

4. **Launch the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🧪 Scientific Validation Suite

The repository includes a standalone, automated verification suite enforcing mathematical invariants, determinism, and sensor accuracy:

```bash
npm test
```

### Verified Test Cases (49/49 Passing):
* ✅ **Substrate & Vacuum Prior:** Confirms exactly 2,744 voxels initialize with maximal Von Neumann entropy ($S = 1.0$), `knownMask = 0`, and unobserved classification.
* ✅ **RGB-D Depth & Occlusion Shadow:** Asserts that raycasted surfaces become `KNOWN_MATTER`, empty paths become `KNOWN_EMPTY`, and line-of-sight occlusions strictly remain $S = 1.0$.
* ✅ **Thermal Gradient Mapping:** Confirms micro-bolometer updates elevate temperature channels with correct confidence-scaled variance.
* ✅ **FMCW Radar Doppler:** Validates kinematic velocity vector extraction on moving dynamic targets.
* ✅ **Tactile Force Probe:** Validates contact stress and pressure tensor integration.
* ✅ **Bit-to-Bit Determinism:** Identical sensory input streams guarantee bit-for-bit identical density matrices and field states.
* ✅ **Axiom `UNKNOWN != 0`:** Guarantees that queries over unobserved space return `UNKNOWN` rather than arbitrary defaults (e.g., $0^\circ\text{C}$).
* ✅ **14-Channel Vector Integrity:** Audits all 14 channels across every active voxel.
* ✅ **Sub-100ms Fusion Benchmark:** Executes 4-sensor multi-modal fusion across 2,744 spatial points in **~25 ms**.

---

## 🤖 AI Explanation Providers: Grok & OpenAI Pipeline

To ensure strict scientific grounding, the integration with external AI explanation APIs follows a non-leaking, forward-only pipeline:

```
[ User Query ]
      │
      ▼
[ Intent Parser ] ──► [ Deterministic Physical Query Engine ]
                                    │
                                    ▼
                      [ Grounded Physical Result ]
                        • Query: "Peak Temperature"
                        • Answer: "78.4°C at (0.2, 0.5, 0.0)"
                        • Epistemic Entropy: 0.12 (High Confidence)
                        • Sensor Trace: ["thermal_flir_01"]
                                    │
                                    ▼
                        [ Secure Express Backend ]
                                    │
                    (System Prompt Enforces Strict Grounding)
                                    ▼
                     [ AI Explanation Layer ]
                     1. xAI Grok (Primary)
                     2. OpenAI GPT-4o (Secondary)
                                    │
                                    ▼
                [ Conversational Scientific Explanation ]
```

### Supported Providers
1. **xAI / Grok** (Default / Primary): `grok-2-latest`
2. **OpenAI** (Secondary): `gpt-4o`, `gpt-4o-mini`

### Security & Privacy
* Server-side keys (`GROK_API_KEY`, `OPENAI_API_KEY`) are kept isolated in the Node.js backend (`server.ts`) and never transmitted to client browsers.
* Temporary session keys entered in the UI modal are held only in browser session memory and forwarded per-request over the secure backend proxy.

---

## 📦 Scientific Data Export

The application supports exporting full research-grade datasets formatted for machine learning benchmarks and reproducibility:
* **`metadata.json`**: Grid dimensions, spatial resolution, sensor configurations, and epistemic distribution.
* **`field.json`**: Complete array of all 2,744 voxels with 14-channel vectors, density matrix parameters, and provenance tags.
* **`events.json`**: Chronological log of detected state anomalies and threshold triggers.
* **`snapshots.json`**: Temporal evolution records over simulated sensory sweeps.
* **`metrics.json`**: Mean Von Neumann entropy, information gain ($\Delta I$), and energy distributions.

---

## 🔬 Scientific Scope & Disclaimer

This application is a **classical computational research prototype** running on standard semiconductor hardware (CPU / GPU via WebGL). 

- It utilizes the **mathematical formalism of quantum mechanics** (density matrices, state vectors, trace operations, and Von Neumann entropy) as an expressive mathematical framework for continuous multi-property representation and epistemic uncertainty quantification.
- It does **not** utilize physical quantum computing hardware.
- It does **not** claim to reproduce physical quantum mechanics or macroscopic superposition.
- The system represents an inferred computational physical state, not absolute physical truth.
- External AI models are optional verbalization layers. The deterministic Physical Query Engine remains the authoritative source for all physical-state queries.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
<strong>Physical State Field (PSF) • World Model v1.0</strong><br />
Empirical grounding • Deterministic physics • Mathematical rigor
</div>
