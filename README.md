<div align="center">

# Physical State Field (PSF)
### Sparse Multi-Sensor Quantum-Embedding 3D Substrate & World Model Simulator

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%207.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-Backend%20Proxy-lightgrey?logo=express&logoColor=black)](https://expressjs.com/)
[![OpenAI](https://img.shields.io/badge/ChatGPT%20%2F%20OpenAI-GPT--4o%20Proxy-412991?logo=openai&logoColor=white)](https://platform.openai.com/)
[![Tests](https://img.shields.io/badge/Tests-49%2F49%20Passing-brightgreen?logo=vitest&logoColor=white)](#scientific-validation-suite)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*A deterministic spatial world-model simulator unifying multi-modal perception (RGB-D depth, micro-bolometer thermal, FMCW radar Doppler, tactile contact force), quantum density matrix embeddings, and epistemic uncertainty quantification.*

---

</div>

## 🌌 Overview

The **Physical State Field** is a classical simulation architecture designed for robotic perception, spatial AI, and physics-grounded scene understanding. Traditional world models often rely on 2D image backbones or photometric rendering proxies (such as NeRFs or Gaussian Splatting) which fail to maintain an explicit representation of unobserved regions, contact forces, or multi-spectral sensor physics.

This system discretizes 3D space into a sparse, adaptive volumetric grid where each voxel maintains a **14-channel quantum-embedded physical state vector**. By representing occupancy as a 2-level Hilbert space ($|\text{Void}\rangle$ vs. $|\text{Matter}\rangle$) and multi-sensor fusion through density matrices ($\rho$), the substrate provides mathematically rigorous quantification of **epistemic uncertainty** (lack of sensor data) versus **aleatoric noise** (sensor variance).

### 🏛️ Core Epistemic Axiom

> **"The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance."**

Large Language Models (such as OpenAI's **GPT-4o**, **ChatGPT**, or xAI's **Grok**) are utilized exclusively as downstream interpreters and scientific verbalizers. The LLM is **never** permitted to hallucinate or dictate physical reality: it receives strictly structured, deterministic query results produced directly by the Substrate's Physical Query Engine.

---

## ⚡ Key Architectural Pillars

### 1. Invariant: `UNKNOWN != 0` & Occlusion Preservation
In standard computer vision systems, empty space and unobserved space are frequently conflated with zero. In the Physical State Field:
- **Vacuum / Unobserved Space:** Starts with maximal Von Neumann entropy ($S = 1.0$), zero confidence, and an explicit `knownMask = 0`.
- **Occlusion Shadows:** Regions located behind opaque physical obstacles during an RGB-D sweep are explicitly labeled `unknownSubtype = "occluded"` and strictly maintain $S = 1.0$.
- **Matter vs. Void:** Confirmed matter exhibits low entropy ($S \to 0$), high occupancy ($p > 0.9$), and `knownMask = 1`. Confirmed free space exhibits $p < 0.05$ with low entropy ($S \to 0$).

### 2. Multi-Sensor Direct Fusion Pipeline
The field ingests raw physical streams from four heterogeneous sensor modalities:
* **RGB-D Depth Camera:** Raycasts depth vectors to carve out free space (`KNOWN_EMPTY`) and register surface points (`KNOWN_MATTER`). Identifies occluded camera shadow frustums.
* **Thermal Micro-Bolometer:** Ingests radiant thermal signatures ($T \in [-20^\circ\text{C}, 150^\circ\text{C}]$), modeling thermal diffusion gradients across solid matter.
* **FMCW Radar Doppler:** Emits frequency-modulated continuous waves to detect Doppler velocity vectors ($v \in [-15, +15]\,\text{m/s}$), capable of partial penetration through low-dielectric obstacles.
* **High-Frequency Tactile Force Probe:** Ingests normal contact forces and shear stress tensors ($P \in [0, 500]\,\text{kPa}$) directly into the substrate surface voxels.

### 3. Quantum Density Matrix Formulation
Rather than tracking heuristic confidence scores, each voxel models occupancy state using the mathematical apparatus of quantum mechanics:

$$\rho = |\psi\rangle \langle\psi| = \begin{pmatrix} |\alpha|^2 & \alpha \beta^* \\ \alpha^* \beta & |\beta|^2 \end{pmatrix}$$

Where:
* $|\psi\rangle = \alpha |\text{Void}\rangle + \beta |\text{Matter}\rangle$, with $|\alpha|^2 + |\beta|^2 = 1$.
* **Purity:** $\gamma = \text{Tr}(\rho^2) \in [0.5, 1.0]$. A pure state ($\gamma = 1.0$) indicates complete observation certainty; a maximally mixed state ($\gamma = 0.5$) represents complete ignorance.
* **Von Neumann Entropy:** $S(\rho) = -\text{Tr}(\rho \log_2 \rho)$.
* **Information Gain:** $\Delta I = S_{\text{prior}} - S_{\text{posterior}}$ (bits gained per sensory sweep).

### 4. Deterministic Physical Query Engine
Users and autonomous agents query the field using natural language (e.g., *"What is the peak temperature behind the barrier?"*, *"Is any moving object detected?"*).
1. The engine deterministically parses physical intents (spatial bounding box, target observable, threshold conditions).
2. Direct volumetric traversal evaluates the mathematical field state.
3. If an unobserved region is targeted, it deterministically reports `UNKNOWN` with empirical provenance.
4. Optional verbalization via **ChatGPT / GPT-4o proxy** translates the structured output into natural scientific discourse without risk of factual deviation.

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
├── server.ts                    # Express backend proxy for ChatGPT / OpenAI / Grok
├── src/
│   ├── components/              # React UI & Three.js 3D Viewport
│   │   ├── AboutFieldModal.tsx          # Scientific principles & quantum formalism guide
│   │   ├── ApiKeyModal.tsx              # OpenAI / Grok key configuration & latency tester
│   │   ├── ExperimentPresets.tsx        # Scientific benchmark scenarios
│   │   ├── QueryConsole.tsx             # Interactive physical query interface
│   │   ├── ScientificExportModal.tsx    # Raw telemetry & state bundle exporter
│   │   ├── SensorControlPanel.tsx       # Live controls for RGB-D, Thermal, Radar, Tactile
│   │   ├── StateInspectorModal.tsx      # Deep voxel quantum state viewer
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
│   │   └── llmQueryService.ts           # Grounded ChatGPT / OpenAI query pipeline
│   ├── types/
│   │   └── quantumField.ts              # TypeScript type declarations for quantum state
│   ├── utils/
│   │   └── scientificExport.ts          # Comprehensive JSON bundle generation
│   ├── App.tsx                  # Main application orchestrator
│   ├── index.css                # Tailwind CSS v4 styling rules
│   └── main.tsx                 # React 19 root entry
├── .env.example                 # Environment variables template
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
   git clone https://github.com/WalboyTheKing/Sparse-Multi-Sensor-Quantum-Embedding-3D-Substrate-.git
   cd Sparse-Multi-Sensor-Quantum-Embedding-3D-Substrate-
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
   *(Optional)* Add your OpenAI API key to enable natural language explanations with ChatGPT:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   PORT=3000
   ```
   > **Note:** The entire Physical State Field operates **100% offline and deterministically** without any API key. An API key is only required if you want ChatGPT / GPT-4o to verbalize the structured query results into conversational scientific text.

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
* ✅ **Sub-100ms Fusion Benchmark:** Executes 4-sensor multi-modal fusion across 2,744 spatial points in **~24 ms**.

---

## 🤖 ChatGPT & OpenAI Integration Architecture

To ensure strict scientific grounding, the integration with OpenAI's Chat Completions API follows a non-leaking, forward-only pipeline:

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
                       [ OpenAI API: GPT-4o ]
                                   │
                                   ▼
               [ Conversational Scientific Explanation ]
```

### Security & Privacy
* Server-side keys (`OPENAI_API_KEY`) are kept isolated in the Node.js backend (`server.ts`) and never transmitted to client browsers.
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

## 🔬 Scientific Disclaimer

This application is a **classical computational simulation** running on standard semiconductor hardware (CPU / GPU via WebGL). It utilizes the **mathematical formalism of quantum mechanics** (density matrices, state vectors, trace operations, and Von Neumann entropy) as a rigorous mathematical foundation for continuous multi-property representation and epistemic uncertainty quantification. It does *not* utilize physical quantum computing hardware.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Developed and architected with assistance from <strong>OpenAI ChatGPT</strong>.<br />
Empirical grounding • Deterministic physics • Mathematical rigor
</div>
