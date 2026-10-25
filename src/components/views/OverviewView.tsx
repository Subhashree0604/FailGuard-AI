import React from 'react';
import {
  Server,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Cpu,
  Database,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Bot,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useSimulation } from '../../context/SimulationContext';
import { Service, ServiceId } from '../../types';

export const OverviewView: React.FC = () => {
  const {
    services,
    systemHealthScore,
    incidents,
    activeIncident,
    isAutoPlay,
    toggleAutoPlay,
    resetSimulation,
    loadDemoScenario,
    setSelectedServiceId,
    setActiveTab,
    triggerAiIncidentAnalysis,
    isAnalyzingAi,
    apiStatus,
  } = useSimulation();

  // Categorize services
  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const warningCount = services.filter((s) => s.status === 'warning').length;
  const criticalCount = services.filter((s) => s.status === 'critical' || s.status === 'down').length;
  const atRiskCount = warningCount + criticalCount;

  // Top services at risk
  const topAtRisk = [...services].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);

  // Synthesize timeline data for charts from services history
  // Find maximum history length
  const maxHistoryLen = Math.max(...services.map((s) => s.history?.length || 0), 1);
  const chartData = Array.from({ length: Math.min(maxHistoryLen, 16) }).map((_, idx) => {
    const point: any = { time: `t-${16 - idx}s` };
    let totalCpu = 0;
    let totalMem = 0;
    let maxLat = 0;
    let avgErr = 0;

    services.forEach((s) => {
      const histItem = s.history?.[s.history.length - 16 + idx] || s.history?.[s.history.length - 1] || {
        cpu: s.metrics.cpu,
        memory: s.metrics.memory,
        latency: s.metrics.latency,
        errorRate: s.metrics.errorRate,
      };
      totalCpu += histItem.cpu;
      totalMem += histItem.memory;
      maxLat = Math.max(maxLat, histItem.latency);
      avgErr += histItem.errorRate;
      point[s.id] = histItem.latency;
    });

    point.avgCpu = Math.round(totalCpu / services.length);
    point.avgMem = Math.round(totalMem / services.length);
    point.p99Latency = maxLat;
    point.avgError = Number((avgErr / services.length).toFixed(2));
    return point;
  });

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case 'Critical':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
      case 'High':
        return 'text-orange-400 bg-orange-950/40 border-orange-800/60';
      case 'Moderate':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      default:
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Simulation Quick Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Live SRE Monitoring Simulation</h2>
            <p className="text-xs text-slate-400">
              Generating dynamic distributed telemetry across 8 microservices with cascading failure detection.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={toggleAutoPlay}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isAutoPlay
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
            }`}
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlay ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>
          <button
            onClick={loadDemoScenario}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Crisis</span>
          </button>
          <button
            onClick={resetSimulation}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Cards Requested in Prompt */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Services */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Services</span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{services.length}</span>
            <span className="text-[11px] font-mono text-slate-400">8 monitored</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
            <span className="text-cyan-400 font-medium">100%</span>
            <span>telemetry coverage</span>
          </div>
        </div>

        {/* Healthy Services */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Healthy Services</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">{healthyCount}</span>
            <span className="text-[11px] font-mono text-emerald-400/80">
              {Math.round((healthyCount / services.length) * 100)}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Nominal baseline metrics</div>
        </div>

        {/* At-Risk Services */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">At-Risk Services</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${atRiskCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {atRiskCount}
            </span>
            <span className="text-[11px] font-mono text-amber-400/80">{warningCount} warning</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Telemetry drifting from SLA</div>
        </div>

        {/* Critical Services */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Critical Services</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${criticalCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
              {criticalCount}
            </span>
            <span className="text-[11px] font-mono text-rose-400/80">{criticalCount > 0 ? 'Urgent SLA breach' : '0 breach'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Cascade propagation origin</div>
        </div>

        {/* Predicted Incidents */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Predicted Incidents</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-cyan-400">{incidents.length}</span>
            <span className="text-[11px] font-mono text-cyan-300">
              {incidents.filter((i) => i.status === 'Active').length} active
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Heuristic early warning</div>
        </div>
      </div>

      {/* Health Gauge & AI Incident Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health & Risk Gauge Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white">System Reliability Index</h3>
                <p className="text-xs text-slate-400">Blended health across all dependency tiers</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-slate-300">
                Live Gauge
              </span>
            </div>

            {/* Circular / Radial Gauge Visual */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Radial Gauge */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={
                      systemHealthScore >= 80 ? '#10b981' : systemHealthScore >= 50 ? '#f59e0b' : '#f43f5e'
                    }
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - systemHealthScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    {systemHealthScore}%
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Health Score
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="mt-3 text-center">
                <div
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    systemHealthScore >= 80
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : systemHealthScore >= 50
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      systemHealthScore >= 80 ? 'bg-emerald-400' : systemHealthScore >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                  />
                  <span>
                    {systemHealthScore >= 80
                      ? 'Optimal Service Operations'
                      : systemHealthScore >= 50
                      ? 'Moderate Cascade Danger'
                      : 'Severe Multi-Tier Degradation'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Failure Risk</div>
              <div className="font-mono font-bold text-white mt-0.5">{100 - systemHealthScore}%</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Blast Radius</div>
              <div className="font-mono font-bold text-cyan-400 mt-0.5">
                {criticalCount > 0 ? `${criticalCount * 2 + 1} Services` : 'Contained'}
              </div>
            </div>
          </div>
        </div>

        {/* AI Incident & Executive SRE Summary (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Incident Summary & Root Cause</h3>
                  <p className="text-xs text-slate-400">Automated diagnostic synthesis from live telemetry</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {apiStatus.aiEnabled ? 'Gemini 3.8 Flash' : 'Rule Engine Fallback'}
                </span>
                <button
                  onClick={() => triggerAiIncidentAnalysis()}
                  disabled={isAnalyzingAi}
                  className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium border border-cyan-500/40 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAnalyzingAi ? 'Analyzing...' : 'Re-analyze'}</span>
                </button>
              </div>
            </div>

            {/* AI Narrative Body */}
            <div className="mt-4 space-y-3">
              {activeIncident ? (
                <>
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold text-rose-400 mb-1">
                      <span className="flex items-center space-x-1.5">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>{activeIncident.title}</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800">
                        {activeIncident.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeIncident.aiAnalysis?.executiveSummary ||
                        activeIncident.initialAnomaly ||
                        'Cascading anomaly detected in service mesh.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <div className="font-semibold text-amber-400 text-[11px] mb-1">Suspected Root Cause</div>
                      <p className="text-slate-300 text-[11px]">
                        {activeIncident.aiAnalysis?.suspectedRootCause || activeIncident.suspectedRootCause}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <div className="font-semibold text-cyan-400 text-[11px] mb-1">Cascading Propagation Path</div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
                        {activeIncident.cascadingPath?.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">
                              {step}
                            </span>
                            {idx < activeIncident.cascadingPath.length - 1 && (
                              <span className="text-slate-500 font-bold">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 px-4 rounded-lg bg-slate-950 border border-slate-800/80 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <h4 className="text-sm font-semibold text-slate-200">All Microservices Operating Nominally</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    No active cascading anomalies detected. Telemetry across edge gateway, order processing, and database tiers remain within SLA tolerance.
                  </p>
                  <button
                    onClick={loadDemoScenario}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 inline-flex items-center space-x-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Trigger Crisis Demo Scenario</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              Grounded in live simulated telemetry and synchronous RPC dependency graph.
            </span>
            <button
              onClick={() => setActiveTab('root-cause')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 transition-colors"
            >
              <span>Full Root Cause Analysis</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Recharts: CPU, Memory, Latency, Error Rate */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">System Telemetry Trends</h3>
            <p className="text-xs text-slate-400">Real-time aggregate performance metrics over recent simulation ticks</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Window: 16 ticks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart 1: Latency Trend */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-xs font-semibold text-white">Max p99 Latency (ms)</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {Math.max(...services.map((s) => s.metrics.latency))} ms
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="p99Latency" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#latencyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Error Rate Trend */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-xs font-semibold text-white">Average Error Rate (%)</span>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">
                {(services.reduce((acc, s) => acc + s.metrics.errorRate, 0) / services.length).toFixed(2)}%
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="avgError" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#errorGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: CPU Utilization */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-semibold text-white">Mean CPU Utilization (%)</span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400">
                {Math.round(services.reduce((acc, s) => acc + s.metrics.cpu, 0) / services.length)}%
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="avgCpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Memory Utilization */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-white">Mean Memory Pressure (%)</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {Math.round(services.reduce((acc, s) => acc + s.metrics.memory, 0) / services.length)}%
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="avgMem" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Services at Risk & Live Health Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Services at Risk List (1 col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Top Services at Risk</h3>
              <span className="text-[11px] text-slate-400 font-mono">Ranked by Risk Score</span>
            </div>

            <div className="mt-4 space-y-3">
              {topAtRisk.map((service, rank) => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setActiveTab('monitoring');
                  }}
                  className="p-3 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                      {rank + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {service.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        CPU {service.metrics.cpu}% • {service.metrics.latency}ms lat
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getRiskColor(
                        service.riskTier
                      )}`}
                    >
                      {service.riskScore}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('prediction')}
            className="mt-4 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-1 transition-colors"
          >
            <span>View Full Failure Prediction Engine</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Service Health Summary Grid (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Live Service Mesh Status</h3>
              <button
                onClick={() => setActiveTab('monitoring')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
              >
                <span>All Service Metrics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedServiceId(s.id);
                    setActiveTab('monitoring');
                  }}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        s.status === 'healthy'
                          ? 'bg-emerald-400'
                          : s.status === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-rose-500 animate-pulse'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{s.status}</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate" title={s.name}>
                    {s.name}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{s.metrics.latency}ms</span>
                    <span className={s.metrics.errorRate > 2 ? 'text-rose-400' : 'text-slate-400'}>
                      {s.metrics.errorRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Click any service node to view detailed telemetry, logs, and upstream/downstream callers.</span>
            <button
              onClick={() => setActiveTab('dependency-graph')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
            >
              <span>Explore Topology Graph</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
