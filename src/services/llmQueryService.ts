import { VoxelPoint, PhysicalQuery } from '../types/quantumField';
import { evaluatePhysicalQuery } from '../core/physicalQueryEngine';
import { computeFieldMetrics } from '../core/quantumEmbedding';

export interface ApiSettings {
  provider: 'none' | 'openai' | 'grok';
  openaiKey: string;
  grokKey: string;
  modelName?: string;
}

export interface ServerApiConfig {
  hasOpenAiKey: boolean;
  hasGrokKey: boolean;
  scientificStandard: string;
}

const STORAGE_KEY = 'psf_api_settings';

export function loadApiSettings(): ApiSettings {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    provider: 'none',
    openaiKey: '',
    grokKey: '',
    modelName: '',
  };
}

export function saveApiSettings(settings: ApiSettings): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * Checks server-side configuration to see if OPENAI_API_KEY or GROK_API_KEY
 * are hosted securely on the backend container.
 */
export async function fetchServerConfig(): Promise<ServerApiConfig> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback if server is booting or static
  }
  return {
    hasOpenAiKey: false,
    hasGrokKey: false,
    scientificStandard: 'The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance.',
  };
}

/**
 * Tests connection to selected AI provider through backend proxy.
 */
export async function testProviderConnection(
  provider: 'openai' | 'grok',
  clientApiKey: string,
  modelName?: string
): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  try {
    const res = await fetch('/api/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        clientApiKey: clientApiKey.trim() || undefined,
        modelName: modelName?.trim() || undefined,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, latencyMs: data.latencyMs };
    }
    return { success: false, error: data.error || `HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network unreachable' };
  }
}

/**
 * Explains an already-computed deterministic physical result using optional server-side LLM.
 */
export async function explainPhysicalResult(
  prompt: string,
  physicalResult: PhysicalQuery,
  grid: Map<string, VoxelPoint>,
  settings: ApiSettings
): Promise<{ explanation: string; provider: string; model?: string }> {
  if (settings.provider === 'none') {
    return { explanation: physicalResult.answer, provider: 'none' };
  }

  const clientKey = settings.provider === 'openai' ? settings.openaiKey.trim() : settings.grokKey.trim();
  const metricsSummary = buildFieldMetadataContext(grid);

  const res = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      physicalResult,
      metricsSummary,
      provider: settings.provider,
      modelName: settings.modelName,
      clientApiKey: clientKey || undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || 'Server LLM proxy error');
  }

  const data = await res.json();
  return {
    explanation: data.explanation || physicalResult.answer,
    provider: data.provider || settings.provider,
    model: data.model,
  };
}

/**
 * Executes query following the strict epistemic pipeline:
 * User language -> Intent extraction -> Physical Query Engine -> Structured physical result -> Optional Server-side LLM explanation (/api/explain)
 *
 * SCIENTIFIC AXIOM:
 * The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance.
 * The LLM is NEVER the source of physical reality.
 */
export async function executePhysicalQuery(
  prompt: string,
  grid: Map<string, VoxelPoint>,
  settings: ApiSettings
): Promise<PhysicalQuery> {
  // Step 1 & 2: Intent extraction and deterministic physical query directly against the substrate
  const physicalResult = evaluatePhysicalQuery(prompt, grid);

  // If no LLM verbalization is requested, return the deterministic physics query directly
  if (settings.provider === 'none') {
    return physicalResult;
  }

  // Step 3: Secure backend proxy route /api/explain
  const clientKey = settings.provider === 'openai' ? settings.openaiKey.trim() : settings.grokKey.trim();

  try {
    const metricsSummary = buildFieldMetadataContext(grid);
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        physicalResult,
        metricsSummary,
        provider: settings.provider,
        modelName: settings.modelName,
        clientApiKey: clientKey || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.explanation) {
        return {
          ...physicalResult,
          answer: data.explanation,
          source: 'llm_verbalization',
        };
      }
    } else {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.warn('[Server LLM Proxy Notice]', errData.error);
      return {
        ...physicalResult,
        evidence: `${physicalResult.evidence} | [Server LLM Proxy: ${errData.error}]`,
      };
    }
  } catch (err: any) {
    console.warn('[Server LLM Proxy Network Error]', err);
    return {
      ...physicalResult,
      evidence: `${physicalResult.evidence} | [Proxy offline, deterministic physics preserved]`,
    };
  }

  return physicalResult;
}

function buildFieldMetadataContext(grid: Map<string, VoxelPoint>): string {
  const voxelStateMap = new Map();
  for (const [k, v] of grid.entries()) {
    voxelStateMap.set(k, v.state);
  }
  const metrics = computeFieldMetrics(voxelStateMap);

  return `Physical State Field Substrate Summary:
Total points: ${metrics.totalVoxels}
Observed points: ${metrics.observedVoxels}
Unobserved points (high entropy): ${metrics.unobservedVoxels}
Mean field Von Neumann entropy S: ${metrics.meanEntropy}
Max observed temp: ${metrics.maxTemperature}°C
Max observed velocity: ${metrics.maxVelocity} m/s
Max contact stress: ${metrics.maxPressure} kPa
Axiom: The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance.`;
}
