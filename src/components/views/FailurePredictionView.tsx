import React from 'react';
import {
  AlertTriangle,
  Flame,
  Info,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  ShieldAlert,
  GitFork,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSimulation } from '../../context/SimulationContext';
import { Service, ServiceId } from '../../types';

export const FailurePredictionView: React.FC = () => {
  const { services, settings, setSelectedServiceId, setActiveTab } = useSimulation();

  // Sort services by risk score descending
  const sortedServices = [...services].sort((a, b) => b.riskScore - a.riskScore);

  // Prepare multi-line historical risk trend chart data
  const maxHist = Math.max(...services.map((s) => s.history?.length || 0), 1);
  const riskTrendData = Array.from({ length: Math.min(maxHist, 16) }).map((_, idx) => {
    const point: any = { time: `t-${16 - idx}` };
    services.forEach((s) => {
      const histItem =
        s.history?.[s.history.length - 16 + idx] ||
        s.history?.[s.history.length - 1] || { riskScore: s.riskScore };
      point[s.id] = histItem.riskScore;
    });
    return point;
  });

  const serviceColors: Record<ServiceId, string> = {
    'api-gateway': '#06b6d4',
    'auth-service': '#3b82f6',
    'order-service': '#f59e0b',
    'payment-service': '#ec4899',
    'inventory-service': '#8b5cf6',
    'notification-service': '#10b981',
    'postgres-db': '#f43f5e',
    'cache-service': '#14b8a6',
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case 'Critical':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/80';
      case 'High':
        return 'text-orange-400 bg-orange-950/40 border-orange-800/80';
      case 'Moderate':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/80';
      default:
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/80';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Empirical Heuristic Transparency Banner (Required by Section 7) */}
      <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-4 flex items-start space-x-3.5 shadow-lg shadow-cyan-950/30">
        <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-white text-sm">Transparent Failure Prediction Methodology</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Heuristic Engine
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            FailGuard AI calculates failure risk scores using a transparent, multi-factor heuristic model grounded in distributed telemetry and dependency call chains.
            <strong> Note:</strong> Predictions represent simulation estimates derived from queue build-up and latency drift, not a scientifically validated machine learning model.
          </p>
        </div>
      </div>

      {/* Transparent Scoring Formula & Configured Weights */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Heuristic Scoring Weights & Formula</h3>
            <p className="text-xs text-slate-400">Configured weights used to calculate the 0–100 composite risk score</p>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Weights in Settings</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>CPU Weight</span>
              <span className="font-mono font-bold text-cyan-400">{settings.weights.cpu}%</span>
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Compute Load</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Triggers when worker thread saturation risks task throttling.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Memory Weight</span>
              <span className="font-mono font-bold text-cyan-400">{settings.weights.memory}%</span>
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Heap Pressure</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Monitors GC pause latency and out-of-memory risk.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Latency Weight</span>
              <span className="font-mono font-bold text-cyan-400">{settings.weights.latency}%</span>
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-1">p99 Roundtrip</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Detects synchronous queue pile-up and SLA breaches.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Errors Weight</span>
              <span className="font-mono font-bold text-cyan-400">{settings.weights.errorRate}%</span>
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-1">HTTP 5xx & RPC</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Identifies circuit breaker breaches and dropped requests.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Deps Weight</span>
              <span className="font-mono font-bold text-cyan-400">{settings.weights.dependencies}%</span>
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Cascade Propagation</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Penalizes callers when downstream dependencies degrade.</p>
          </div>
        </div>

        {/* Risk Classification Scale */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium">Risk Score Classification:</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800">
              0 – 29: Low
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800">
              30 – 59: Moderate
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-orange-950/60 text-orange-300 border border-orange-800">
              60 – 79: High
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800 animate-pulse">
              80 – 100: Critical
            </span>
          </div>
        </div>
      </div>

      {/* Historical Risk Trend Multi-Line Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Service Risk Score Trajectory</h3>
            <p className="text-xs text-slate-400">Dynamic risk acceleration over recent simulation ticks</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Score Range: 0 (Nominal) - 100 (Crisis)</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={riskTrendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {services.map((s) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={serviceColors[s.id] || '#64748b'}
                  strokeWidth={s.riskScore > 60 ? 2.5 : 1.2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Failure Prediction Cards Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Service Failure Risk & Blast Radius Forecast</h3>
            <p className="text-xs text-slate-400">Real-time heuristic evaluation of failure windows and propagation paths</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {sortedServices.map((service) => {
            const isHighRisk = service.riskScore >= 60;
            return (
              <div
                key={service.id}
                className={`p-4 rounded-xl border transition-all ${
                  isHighRisk
                    ? 'bg-rose-950/20 border-rose-900/60 shadow-md shadow-rose-950/20'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        service.status === 'healthy'
                          ? 'bg-emerald-400'
                          : service.status === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-rose-500 animate-pulse'
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{service.name}</h4>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {service.type.toUpperCase()} • Current Latency: {service.metrics.latency}ms • CPU: {service.metrics.cpu}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Failure Window */}
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-slate-300 font-medium">{service.predictedFailureWindow}</span>
                    </div>

                    {/* Risk Badge */}
                    <span
                      className={`px-3 py-1 rounded text-xs font-mono font-bold border ${getRiskColor(
                        service.riskTier
                      )}`}
                    >
                      {service.riskScore} / 100 ({service.riskTier})
                    </span>
                  </div>
                </div>

                {/* Details Row: Contributing Factors & Next Affected */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Primary Contributing Factor */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/70">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase">Primary Risk Driver</span>
                    <p className="text-slate-200 mt-1 text-[11px]">
                      {service.riskFactors?.sort((a, b) => b.weightedScore - a.weightedScore)[0]?.explanation ||
                        'Telemetry within standard tolerance.'}
                    </p>
                  </div>

                  {/* Downstream Blast Radius */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/70">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase">Likely Affected Next</span>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {service.dependents?.length > 0 ? (
                        service.dependents.map((depId) => {
                          const target = services.find((s) => s.id === depId);
                          return (
                            <span
                              key={depId}
                              className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800 font-mono text-[10px]"
                            >
                              {target?.name || depId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No upstream callers (Edge)</span>
                      )}
                    </div>
                  </div>

                  {/* Evidence Level & Action */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/70 flex flex-col justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] font-semibold uppercase">Evidence Confidence</span>
                      <div className="text-slate-200 mt-1 text-[11px] font-medium flex items-center space-x-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            service.evidenceLevel === 'High heuristic match'
                              ? 'bg-rose-400'
                              : service.evidenceLevel === 'Moderate telemetry drift'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span>{service.evidenceLevel}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setActiveTab('dependency-graph');
                      }}
                      className="mt-2 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold flex items-center space-x-1"
                    >
                      <span>Simulate Cascade Path</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
