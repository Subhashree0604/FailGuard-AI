import React, { useState } from 'react';
import {
  FlaskConical,
  Zap,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Server,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertOctagon,
  Flame,
  Layers,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { PREBUILT_SCENARIOS } from '../../utils/constants';
import { ServiceId, WhatIfScenario } from '../../types';

export const WhatIfSimulatorView: React.FC = () => {
  const {
    services,
    applyScenario,
    injectCustomFault,
    resetSimulation,
    activeScenarioId,
    systemHealthScore,
    setActiveTab,
  } = useSimulation();

  // Custom fault form state
  const [targetService, setTargetService] = useState<ServiceId>('postgres-db');
  const [customCpu, setCustomCpu] = useState<number>(95);
  const [customMemory, setCustomMemory] = useState<number>(85);
  const [customLatency, setCustomLatency] = useState<number>(1200);
  const [customErrorRate, setCustomErrorRate] = useState<number>(15);
  const [isOutage, setIsOutage] = useState<boolean>(false);

  const selectedServiceObj = services.find((s) => s.id === targetService);

  const handleRunCustomSimulation = () => {
    injectCustomFault(
      targetService,
      {
        cpu: customCpu,
        memory: customMemory,
        latency: customLatency,
        errorRate: customErrorRate,
      },
      isOutage
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Simulation Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>Interactive Chaos & Cascading Failure Simulator</span>
          </h2>
          <p className="text-xs text-slate-400">
            Inject synthetic resource starvation or dependency drops to observe cascading propagation across caller services.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeScenarioId && (
            <button
              onClick={resetSimulation}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Baseline</span>
            </button>
          )}
        </div>
      </div>

      {/* Pre-built Chaos Scenarios Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Pre-built Distributed Crisis Scenarios</span>
          </h3>
          <span className="text-xs text-slate-400">One-click realistic failure topologies</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREBUILT_SCENARIOS.map((scenario) => {
            const isActive = activeScenarioId === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`p-4.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-rose-950/20 border-rose-500 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {scenario.category}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                        RUNNING
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2 tracking-tight">{scenario.name}</h4>
                  <p className="text-xs text-cyan-300/80 font-medium mt-0.5">{scenario.shortDesc}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{scenario.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Target: <strong className="text-slate-300">{scenario.targetService}</strong>
                  </span>
                  <button
                    onClick={() => applyScenario(scenario)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow flex items-center space-x-1.5 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Run Scenario</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Fault Injection Console & Impact Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Fault Injector (Left col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Custom Telemetry & Outage Injector</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Precision Fault Dial</span>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            {/* Service Target Selector */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Service to Destabilize</label>
              <select
                value={targetService}
                onChange={(e) => setTargetService(e.target.value as ServiceId)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type}) - Current Risk: {s.riskScore}/100
                  </option>
                ))}
              </select>
            </div>

            {/* Outage Toggle */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Simulate Complete Outage (Crash / Deadlock)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Overrides metrics with 100% dropped connections</p>
              </div>
              <input
                type="checkbox"
                checked={isOutage}
                onChange={(e) => setIsOutage(e.target.checked)}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Sliders */}
            <div className={`space-y-3 ${isOutage ? 'opacity-40 pointer-events-none' : ''}`}>
              {/* CPU */}
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="flex items-center space-x-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>CPU Utilization:</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-400">{customCpu}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customCpu}
                  onChange={(e) => setCustomCpu(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Memory */}
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="flex items-center space-x-1">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Memory Pressure:</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{customMemory}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={customMemory}
                  onChange={(e) => setCustomMemory(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Latency */}
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Latency Spike:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400">{customLatency} ms</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="3000"
                  step="50"
                  value={customLatency}
                  onChange={(e) => setCustomLatency(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Error Rate */}
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Error Rate:</span>
                  </span>
                  <span className="font-mono font-bold text-rose-400">{customErrorRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customErrorRate}
                  onChange={(e) => setCustomErrorRate(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunCustomSimulation}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 flex items-center justify-center space-x-2 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Inject Fault & Calculate Cascade Propagation</span>
            </button>
          </div>
        </div>

        {/* Live Cascade Impact Matrix (Right col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Simulated System Impact & Cascade Path</span>
              </h3>
              <span className="text-xs font-mono font-bold text-rose-400">
                Health Score: {systemHealthScore}%
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-300 mb-1">Immediate Degradation Blast Radius</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  When <strong>{selectedServiceObj?.name}</strong> experiences failure or thread pool exhaustion, the following synchronous callers suffer backpressure:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedServiceObj?.dependents?.length ? (
                    selectedServiceObj.dependents.map((dep) => (
                      <span
                        key={dep}
                        className="px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800 font-mono text-[11px]"
                      >
                        {dep}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">No direct upstream callers.</span>
                  )}
                </div>
              </div>

              {/* Before vs After Telemetry Comparison */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-300 mb-2">Service Mesh State Comparison</div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {services.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/70 border border-slate-800/60"
                    >
                      <span className="text-slate-300">{s.name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400">{s.metrics.latency}ms</span>
                        <span className={s.riskScore >= 60 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {s.riskScore}/100
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Drilldown buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('dependency-graph')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
            >
              <span>View in Topology Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('root-cause')}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
            >
              <span>Inspect Root Cause</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
