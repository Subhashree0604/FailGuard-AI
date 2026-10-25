import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Server,
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  Sliders,
  Flame,
  ArrowRight,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { RecoveryRecommendation } from '../../types';

export const RecoveryRecommendationsView: React.FC = () => {
  const {
    recommendations,
    applyRecoveryAction,
    systemHealthScore,
    services,
    loadDemoScenario,
    resetSimulation,
    apiStatus,
  } = useSimulation();

  const [filterPriority, setFilterPriority] = useState<string>('all');

  const criticalServices = services.filter((s) => s.riskScore >= 60);

  const filteredRecs = recommendations.filter((r) => {
    if (filterPriority === 'all') return true;
    return r.priority.toLowerCase().includes(filterPriority.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Simulation Advisory Notice Required by Section 10 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-start space-x-3.5">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-white text-sm">Advisory & Simulated Recovery Engine</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
              Safe Demonstration Environment
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            All recommendations below are advisory SRE runbooks generated from current telemetry. The <strong>"Apply Recovery (Simulated)"</strong> button simulates the effect of applying the mitigation in real time by relieving queue backpressure and stabilizing simulated metrics.
          </p>
        </div>
      </div>

      {/* Recommendations Header & Priority Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Prioritized SRE Recovery Actions ({recommendations.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Current System Health: <strong className="text-white font-mono">{systemHealthScore}%</strong> • At-Risk Services:{' '}
            <strong className="text-rose-400 font-mono">{criticalServices.length}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Filter Priority:</span>
          {['all', 'immediate', 'high', 'medium'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 rounded capitalize transition-colors ${
                filterPriority === p
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {filteredRecs.length > 0 ? (
        <div className="space-y-4">
          {filteredRecs.map((rec) => {
            const isP1 = rec.priority.includes('Immediate');

            return (
              <div
                key={rec.id}
                className={`p-5 rounded-xl border transition-all duration-200 ${
                  rec.applied
                    ? 'bg-emerald-950/20 border-emerald-800/60'
                    : isP1
                    ? 'bg-slate-900/90 border-rose-800/70 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800/70">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        rec.applied
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isP1
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {rec.applied ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">{rec.suggestedAction}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isP1
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {rec.priority}
                        </span>
                        {rec.requiresApproval && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                            Human Approval Required
                          </span>
                        )}
                        {rec.applied && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                            Applied in Simulation
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Target Service: <strong className="text-cyan-400 font-mono">{rec.targetServiceName || rec.targetServiceId}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Apply Recovery Action Button */}
                  <div>
                    {rec.applied ? (
                      <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Mitigation Active</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => applyRecoveryAction(rec.id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center space-x-1.5 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-200" />
                        <span>Apply Recovery (Simulated)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Details: Rationale, Metrics, Benefit & Risk */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Rationale */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                      Technical Rationale
                    </span>
                    <p className="text-slate-200 mt-1 leading-relaxed text-[11px]">{rec.reason}</p>
                  </div>

                  {/* Supporting Metrics */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                      Triggering Telemetry
                    </span>
                    <p className="text-rose-300 font-mono mt-1 text-[11px]">{rec.supportingMetrics}</p>
                  </div>

                  {/* Expected Benefit */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                      Expected SLA Recovery
                    </span>
                    <p className="text-slate-200 mt-1 leading-relaxed text-[11px]">{rec.expectedBenefit}</p>
                  </div>

                  {/* Potential Risk / Trade-off */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
                      Operational Trade-off
                    </span>
                    <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">{rec.potentialRisk}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">System Operating Within SLA Tolerance</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            No emergency recovery actions required. All services report nominal CPU, memory, and roundtrip latencies.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-3">
            <button
              onClick={loadDemoScenario}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulate Incident to Generate Actions</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
