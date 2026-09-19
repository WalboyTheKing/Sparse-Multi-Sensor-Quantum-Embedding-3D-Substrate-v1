import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON body parsing
  app.use(express.json({ limit: '15mb' }));

  // API Route: Configuration status (informs frontend if server-side keys exist)
  app.get('/api/config', (req, res) => {
    res.json({
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()),
      hasGrokKey: Boolean(process.env.GROK_API_KEY && process.env.GROK_API_KEY.trim()),
      scientificStandard: 'The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance.',
    });
  });

  // API Route: Secure LLM Scientific Explanation Proxy
  // STRICT RULE: The server receives only the structured physical result from the Physical Query Engine.
  // The LLM is never allowed to dictate or fabricate physical reality.
  app.post('/api/explain', async (req, res) => {
    try {
      const {
        prompt,
        physicalResult,
        metricsSummary,
        provider,
        modelName,
        clientApiKey,
      } = req.body;

      if (!prompt || !physicalResult) {
        return res.status(400).json({ error: 'Missing prompt or structured physicalResult' });
      }

      // Prioritize server environment keys; fallback to client session key if provided
      let apiKey = '';
      let endpoint = '';
      let defaultModel = '';

      if (provider === 'openai') {
        apiKey = (process.env.OPENAI_API_KEY || clientApiKey || '').trim();
        endpoint = 'https://api.openai.com/v1/chat/completions';
        defaultModel = modelName || 'gpt-4o-mini';
      } else if (provider === 'grok') {
        apiKey = (process.env.GROK_API_KEY || clientApiKey || '').trim();
        endpoint = 'https://api.x.ai/v1/chat/completions';
        defaultModel = modelName || 'grok-2-latest';
      } else {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }

      if (!apiKey) {
        return res.status(401).json({
          error: `No API key available for ${provider.toUpperCase()}. Set ${provider === 'openai' ? 'OPENAI_API_KEY' : 'GROK_API_KEY'} on the server or provide a temporary session key in the settings panel.`,
        });
      }

      const systemPrompt = `You are an expert scientific communicator explaining structured deterministic outputs from the Physical State Field (Quantum-Embedding World Model).

SCIENTIFIC AXIOM:
"The Physical State Field is the authoritative computational representation of the currently inferred physical state, including uncertainty and provenance."

STRICT VERBALIZATION CONSTRAINTS:
1. The structured physicalResult is the sole and immutable empirical source of truth.
2. NEVER invent or hallucinate physical quantities, coordinates, or measurements.
3. If the physical state is UNKNOWN or an unobserved channel is null, you MUST state UNKNOWN. UNKNOWN != 0.
4. Clearly distinguish measured values from unobserved space.
5. Explain the epistemic uncertainty (Von Neumann entropy S, confidence, known mask) in clear scientific terms.

${metricsSummary || ''}`;

      const userContent = `User query: "${prompt}"

Deterministic Physical Result from Substrate:
- Query: ${physicalResult.query}
- Answer: ${physicalResult.answer}
- Value: ${JSON.stringify(physicalResult.value)} ${physicalResult.unit || ''}
- Overall Confidence: ${(physicalResult.confidence * 100).toFixed(1)}%
- Epistemic Uncertainty: ${(physicalResult.uncertainty * 100).toFixed(1)}%
- Substrate Evidence: ${physicalResult.evidence}
- Relevant Coordinates: ${JSON.stringify(physicalResult.relevantVoxelCoords || [])}

Provide a concise, rigorous scientific explanation synthesizing this measurement and its epistemic bounds.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0.2,
          max_tokens: 350,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[LLM Proxy Error] Provider: ${provider}, Status: ${response.status}`, errorText);
        return res.status(response.status).json({
          error: `External ${provider.toUpperCase()} API returned status ${response.status}: ${errorText.slice(0, 200)}`,
        });
      }

      const data = await response.json();
      const explanation = data?.choices?.[0]?.message?.content?.trim() || physicalResult.answer;

      return res.json({
        success: true,
        explanation,
        provider,
        model: defaultModel,
        source: 'server_llm_proxy',
      });
    } catch (err: any) {
      console.error('[API Explain Handler Error]', err);
      return res.status(500).json({ error: err?.message || 'Internal proxy error' });
    }
  });

  // API Route: Test Provider Connection
  app.post('/api/test-connection', async (req, res) => {
    const startTime = Date.now();
    try {
      const { provider, clientApiKey, modelName } = req.body;
      let apiKey = '';
      let endpoint = '';
      let testModel = '';

      if (provider === 'openai') {
        apiKey = (process.env.OPENAI_API_KEY || clientApiKey || '').trim();
        endpoint = 'https://api.openai.com/v1/chat/completions';
        testModel = modelName || 'gpt-4o-mini';
      } else if (provider === 'grok') {
        apiKey = (process.env.GROK_API_KEY || clientApiKey || '').trim();
        endpoint = 'https://api.x.ai/v1/chat/completions';
        testModel = modelName || 'grok-2-latest';
      } else {
        return res.status(400).json({ success: false, error: `Invalid provider: ${provider}` });
      }

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: `No API key supplied for ${provider.toUpperCase()}`,
        });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          success: false,
          latencyMs,
          error: `HTTP ${response.status}: ${errorText.slice(0, 160)}`,
        });
      }

      return res.json({
        success: true,
        latencyMs,
        provider,
        model: testModel,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        latencyMs: Date.now() - startTime,
        error: err?.message || 'Connection test failed',
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Physical State Field] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Physical State Field Server Failed to Start]', err);
  process.exit(1);
});
