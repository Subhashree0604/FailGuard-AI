import React from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Clock,
  Bot,
  Bell,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { DEFAULT_SETTINGS } from '../../utils/constants';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    apiStatus,
    refreshAiStatus,
    resetSimulation,
    isAutoPlay,
    toggleAutoPlay,
  } = useSimulation();

  const handleWeightChange = (key: keyof typeof settings.weights, value: number) => {
    updateSettings({
      weights: {
        ...settings.weights,
        [key]: value,
      },
    });
  };

  const handleResetToDefaults = () => {
    updateSettings(DEFAULT_SETTINGS);
    resetSimulation();
  };

  const totalWeights =
    settings.weights.cpu +
    settings.weights.memory +
    settings.weights.latency +
    settings.weights.errorRate +
    settings.weights.dependencies;

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* AI Engine Status Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Analysis Engine Connectivity</h3>
              <p className="text-xs text-slate-400">Status of server-side Google Gemini 3.8 Flash API integration</p>
            </div>
          </div>
          <button
            onClick={() => refreshAiStatus()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Check Connectivity</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Engine Status</span>
            <div className="mt-1 flex items-center space-x-1.5 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiStatus.aiEnabled ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
              />
              <span className={apiStatus.aiEnabled ? 'text-cyan-300' : 'text-amber-300'}>
                {apiStatus.aiEnabled ? 'Gemini AI Online' : 'Deterministic Rule Engine (Fallback)'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Model Specification</span>
            <div className="mt-1 font-mono font-bold text-white">
              {apiStatus.aiEnabled ? 'gemini-3.8-flash' : 'sre-heuristic-engine-v1'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Proxy Architecture</span>
            <div className="mt-1 font-mono text-slate-300">
              Secure Server Proxy (/api/gemini/*)
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
          {apiStatus.aiEnabled
            ? 'FailGuard AI is connected to Google Gemini via server-side proxy. Root cause analysis, recovery runbooks, and SRE Copilot chats are powered by Gemini 3.8 Flash.'
            : 'Gemini API key is not attached in the environment secrets. FailGuard AI is running in deterministic rule-based SRE fallback mode, providing instant local diagnostic analysis without external network calls.'}
        </p>
      </div>

      {/* Heuristic Scoring Weights */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Risk Scoring Weights</h3>
            <p className="text-xs text-slate-400">Adjust the impact of each telemetry metric on composite failure scores</p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400">Total: {totalWeights}%</span>
        </div>

        <div className="space-y-4 text-xs">
          {/* CPU Weight */}
          <div>
            <div className="flex items-center justify-between mb-1 text-slate-300 font-semibold">
              <span>CPU Saturation Weight:</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.weights.cpu}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={settings.weights.cpu}
              onChange={(e) => handleWeightChange('cpu', parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Memory Weight */}
          <div>
            <div className="flex items-center justify-between mb-1 text-slate-300 font-semibold">
              <span>Memory Pressure Weight:</span>
              <span className="font-mono text-emerald-400 font-bold">{settings.weights.memory}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={settings.weights.memory}
              onChange={(e) => handleWeightChange('memory', parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Latency Weight */}
          <div>
            <div className="flex items-center justify-between mb-1 text-slate-300 font-semibold">
              <span>p99 Latency Weight:</span>
              <span className="font-mono text-amber-400 font-bold">{settings.weights.latency}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={settings.weights.latency}
              onChange={(e) => handleWeightChange('latency', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Error Rate Weight */}
          <div>
            <div className="flex items-center justify-between mb-1 text-slate-300 font-semibold">
              <span>Error Rate Weight:</span>
              <span className="font-mono text-rose-400 font-bold">{settings.weights.errorRate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={settings.weights.errorRate}
              onChange={(e) => handleWeightChange('errorRate', parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Dependencies Weight */}
          <div>
            <div className="flex items-center justify-between mb-1 text-slate-300 font-semibold">
              <span>Dependency Health Penalty Weight:</span>
              <span className="font-mono text-purple-400 font-bold">{settings.weights.dependencies}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={settings.weights.dependencies}
              onChange={(e) => handleWeightChange('dependencies', parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Simulation Controls & Ticking */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
          Simulation Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Tick Interval */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-semibold text-white block mb-1">Telemetry Update Interval</span>
            <p className="text-[11px] text-slate-400 mb-2">Controls clock frequency of background metric simulation.</p>
            <div className="flex items-center space-x-2">
              {[1000, 2500, 5000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => updateSettings({ tickIntervalMs: ms })}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                    settings.tickIntervalMs === ms
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {ms / 1000}s
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Play State */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Real-time Simulation Active</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Toggle live background metric generation.</p>
            </div>
            <button
              onClick={toggleAutoPlay}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                isAutoPlay
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isAutoPlay ? 'Active' : 'Paused'}
            </button>
          </div>
        </div>
      </div>

      {/* Reset System Data */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Reset Simulation Data</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Restore baseline healthy telemetry, clear active crisis scenarios, and reset scoring weights to defaults.
          </p>
        </div>
        <button
          onClick={handleResetToDefaults}
          className="px-4 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All to Defaults</span>
        </button>
      </div>
    </div>
  );
};
