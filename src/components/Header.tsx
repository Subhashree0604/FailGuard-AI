import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sparkles,
  Bot,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  X,
  Gauge,
  Info,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const Header: React.FC = () => {
  const {
    activeTab,
    isAutoPlay,
    toggleAutoPlay,
    stepSimulationTick,
    resetSimulation,
    loadDemoScenario,
    tickSpeedMs,
    setTickSpeedMs,
    systemHealthScore,
    setIsCopilotOpen,
    statusNotification,
    dismissNotification,
    activeScenarioId,
  } = useSimulation();

  const tabLabels: Record<string, { title: string; subtitle: string }> = {
    overview: { title: 'Executive SRE Overview', subtitle: 'Live system telemetry, KPI health metrics, and failure risk velocity' },
    monitoring: { title: 'Service Monitoring & Telemetry', subtitle: 'Interconnected microservice metrics, throughput, and error rates' },
    prediction: { title: 'Cascading Failure Prediction', subtitle: 'Transparent heuristic risk scoring, failure windows, and blast radius' },
    'dependency-graph': { title: 'Interactive Service Dependency Graph', subtitle: 'Topology map, synchronous RPC paths, and cascading failure propagation' },
    'root-cause': { title: 'Root Cause Analysis (RCA)', subtitle: 'Anomaly origin isolation, evidence correlation, and mitigation paths' },
    recovery: { title: 'Intelligent Recovery Recommendations', subtitle: 'SRE mitigations, circuit breaker actions, and simulated healing' },
    'what-if': { title: 'What-If Failure Simulator', subtitle: 'Deliberate fault injection, chaos testing, and cascade impact preview' },
    history: { title: 'Incident History & Audit Log', subtitle: 'Chronological timeline of system anomalies and simulated mitigations' },
    settings: { title: 'System Settings & Heuristics', subtitle: 'Configure risk scoring weights, telemetry intervals, and AI modes' },
  };

  const currentTab = tabLabels[activeTab] || { title: 'Dashboard', subtitle: 'FailGuard AI' };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur sticky top-0 z-20">
      <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-bold text-white tracking-tight">{currentTab.title}</h1>
            {activeScenarioId && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                Active Scenario: {activeScenarioId.replace('demo-', '').replace('custom-', '')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{currentTab.subtitle}</p>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Simulation Ticker Controls */}
          <div className="flex items-center bg-slate-950/80 rounded-lg p-1 border border-slate-800">
            <button
              onClick={toggleAutoPlay}
              title={isAutoPlay ? 'Pause real-time simulation' : 'Resume real-time simulation'}
              className={`p-1.5 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                isAutoPlay
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[11px] pr-1">{isAutoPlay ? 'Pause' : 'Live'}</span>
            </button>

            <button
              onClick={stepSimulationTick}
              disabled={isAutoPlay}
              title="Step simulation forward one tick"
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <StepForward className="w-3.5 h-3.5" />
            </button>

            {/* Speed Selector */}
            <div className="flex items-center border-l border-slate-800 ml-1 pl-1 space-x-0.5">
              {[
                { label: '1s', val: 1000 },
                { label: '2.5s', val: 2500 },
                { label: '5s', val: 5000 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setTickSpeedMs(s.val)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                    tickSpeedMs === s.val
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Load Demo Scenario button */}
          <button
            onClick={loadDemoScenario}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Load Demo Scenario</span>
          </button>

          {/* Reset System */}
          <button
            onClick={resetSimulation}
            title="Reset simulation telemetry to nominal healthy baseline"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Baseline</span>
          </button>

          {/* Ask Copilot */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Copilot</span>
          </button>
        </div>
      </div>

      {/* Simulated Telemetry Banner Notice */}
      <div className="bg-slate-950/70 border-t border-slate-800/60 px-6 py-1 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            <strong className="text-slate-300 font-medium">Demonstration Notice:</strong> All metrics, latencies, and service topologies are simulated for SRE failure analysis and educational testing.
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Heuristic Risk Scoring</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono">Tick: {tickSpeedMs / 1000}s</span>
        </div>
      </div>

      {/* Dynamic Action Notification Toast */}
      {statusNotification && (
        <div className="bg-gradient-to-r from-slate-900 to-cyan-950/90 border-t border-cyan-500/40 px-6 py-2 flex items-center justify-between animate-fadeIn text-xs text-cyan-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
          <button
            onClick={dismissNotification}
            className="p-1 rounded text-cyan-400 hover:text-white hover:bg-cyan-950 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};
