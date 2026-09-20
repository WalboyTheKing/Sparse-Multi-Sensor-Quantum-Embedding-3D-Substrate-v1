import React, { useState, useEffect } from 'react';
import { 
  ApiSettings, 
  saveApiSettings, 
  fetchServerConfig, 
  ServerApiConfig,
  testProviderConnection 
} from '../services/llmQueryService';
import { 
  X, 
  Key, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onSave: (newSettings: ApiSettings) => void;
}

export const ApiKeyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [provider, setProvider] = useState<'none' | 'openai' | 'grok'>(settings.provider);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiKey);
  const [grokKey, setGrokKey] = useState(settings.grokKey);
  const [modelName, setModelName] = useState(settings.modelName || '');
  const [serverConfig, setServerConfig] = useState<ServerApiConfig | null>(null);

  // Connection Test States
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'connected' | 'error';
    latencyMs?: number;
    message?: string;
  }>({ status: 'idle' });

  const [showKeyText, setShowKeyText] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServerConfig().then(setServerConfig);
      setProvider(settings.provider);
      setOpenaiKey(settings.openaiKey);
      setGrokKey(settings.grokKey);
      setModelName(settings.modelName || '');
      setTestResult({ status: 'idle' });
      setShowKeyText(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const currentKey = provider === 'openai' ? openaiKey : grokKey;
  const isServerKeyActive = provider === 'openai' ? serverConfig?.hasOpenAiKey : serverConfig?.hasGrokKey;
  const hasEffectiveKey = Boolean(isServerKeyActive || currentKey.trim());

  const handleTestConnection = async () => {
    if (provider === 'none') return;
    setIsTesting(true);
    setTestResult({ status: 'idle' });

    const targetModel = modelName || (provider === 'openai' ? 'gpt-4o-mini' : 'grok-2-latest');
    const res = await testProviderConnection(provider, currentKey, targetModel);

    setIsTesting(false);
    if (res.success) {
      setTestResult({
        status: 'connected',
        latencyMs: res.latencyMs,
        message: `Successfully connected (${res.latencyMs}ms)`,
      });
    } else {
      setTestResult({
        status: 'error',
        message: res.error || 'Connection refused or unauthorized',
      });
    }
  };

  const handleRemoveKey = () => {
    if (provider === 'openai') {
      setOpenaiKey('');
    } else if (provider === 'grok') {
      setGrokKey('');
    }
    setTestResult({ status: 'idle' });
  };

  const handleSave = () => {
    const updated: ApiSettings = {
      provider,
      openaiKey: openaiKey.trim(),
      grokKey: grokKey.trim(),
      modelName: modelName.trim() || (provider === 'openai' ? 'gpt-4o-mini' : provider === 'grok' ? 'grok-2-latest' : ''),
    };
    saveApiSettings(updated);
    onSave(updated);
    onClose();
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••••••';
    return key.slice(0, 4) + '••••••••••••' + key.slice(-4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-md w-full p-5 text-slate-200 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-semibold text-sm text-white">AI Provider & API Settings</h3>
              <p className="text-[10px] text-slate-400">Natural-language explanation layer (Deterministic physics preserved)</p>
            </div>
          </div>
          <button
            id="btn-close-api-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Epistemic Guardrail Notice */}
        <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-900/50 text-[11px] text-cyan-300 leading-relaxed flex items-start gap-2">
          <Server className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-white">Deterministic Substrate Authority:</div>
            <p className="text-slate-400 text-[10px] leading-normal">
              The Physical State Field is the sole authority for physical reality. External AI providers (xAI Grok / OpenAI) are optional verbalization layers that explain structured deterministic results without altering measured data or inventing UNKNOWN states.
            </p>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">AI Explanation Provider:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="btn-provider-none"
              onClick={() => { setProvider('none'); setTestResult({ status: 'idle' }); }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                provider === 'none'
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-900/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Deterministic</span>
            </button>

            <button
              type="button"
              id="btn-provider-grok"
              onClick={() => { setProvider('grok'); setTestResult({ status: 'idle' }); }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                provider === 'grok'
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-900/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>xAI / Grok</span>
            </button>

            <button
              type="button"
              id="btn-provider-openai"
              onClick={() => { setProvider('openai'); setTestResult({ status: 'idle' }); }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                provider === 'openai'
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-900/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>OpenAI</span>
            </button>
          </div>
        </div>

        {/* Provider Config Box */}
        {provider !== 'none' ? (
          <div className="flex flex-col gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            {/* Connection Status Badge */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Connection Status:</span>
              <div className="flex items-center gap-1.5">
                {hasEffectiveKey ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Configured</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                    <AlertCircle className="w-3 h-3" />
                    <span>Not configured</span>
                  </span>
                )}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Selected Model:
              </label>
              {provider === 'openai' ? (
                <div className="flex gap-2">
                  {['gpt-4o-mini', 'gpt-4o'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModelName(m)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                        (modelName || 'gpt-4o-mini') === m
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {['grok-2-latest', 'grok-beta'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModelName(m)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                        (modelName || 'grok-2-latest') === m
                          ? 'bg-purple-950 border-purple-500 text-purple-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* API Key Input with Masking & Removal */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-300">
                  {provider === 'openai' ? 'OpenAI API Key' : 'xAI API Key'}:
                </label>
                {currentKey && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Key</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  id={`input-${provider}-key`}
                  type={showKeyText ? 'text' : 'password'}
                  value={currentKey}
                  onChange={(e) => {
                    if (provider === 'openai') setOpenaiKey(e.target.value);
                    else setGrokKey(e.target.value);
                    setTestResult({ status: 'idle' });
                  }}
                  placeholder={provider === 'openai' ? 'sk-...' : 'xai-...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 pr-8 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                {currentKey && (
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    title={showKeyText ? 'Hide Key' : 'Show Key'}
                  >
                    {showKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {isServerKeyActive && !currentKey && (
                <p className="text-[10px] text-emerald-400 mt-1">
                  &bull; Backend container has {provider.toUpperCase()}_API_KEY configured.
                </p>
              )}
            </div>

            {/* Test Connection Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                id="btn-test-connection"
                onClick={handleTestConnection}
                disabled={isTesting || !hasEffectiveKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all disabled:opacity-40 cursor-pointer"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              {testResult.status === 'connected' && (
                <span className="text-[11px] text-emerald-400 font-mono">
                  {testResult.message}
                </span>
              )}
              {testResult.status === 'error' && (
                <span className="text-[11px] text-rose-400 font-mono truncate max-w-[200px]" title={testResult.message}>
                  {testResult.message}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Deterministic Physics Mode Info */
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="text-slate-200 font-semibold block mb-0.5">Self-Contained Deterministic Physics Substrate:</span>
              Queries evaluate directly against the spatial density matrix, sensor coverage cones, and physical state field. Zero external network tokens or credentials required.
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            id="btn-cancel-settings"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-save-settings"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
