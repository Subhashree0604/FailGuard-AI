import React, { useState } from 'react';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  AlertOctagon,
  X,
  FileText,
  GitFork,
  ExternalLink,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useSimulation } from '../../context/SimulationContext';
import { Service, ServiceId, ServiceStatus } from '../../types';

export const ServiceMonitoringView: React.FC = () => {
  const { services, selectedServiceId, setSelectedServiceId, setActiveTab } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all');

  // Filtered services
  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedService = services.find((s) => s.id === selectedServiceId) || null;

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Healthy</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Warning</span>
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Critical</span>
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/80 text-red-200 border border-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Outage</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter services by name (e.g. Gateway, Database)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 px-2 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Status:</span>
          </span>
          {(['all', 'healthy', 'warning', 'critical', 'down'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid (8 Services) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredServices.map((service) => {
          const isSelected = selectedServiceId === service.id;
          const isSevere = service.status === 'critical' || service.status === 'down';

          return (
            <div
              key={service.id}
              onClick={() => setSelectedServiceId(service.id)}
              className={`bg-slate-900/80 border rounded-xl p-4.5 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-lg ${
                isSelected
                  ? 'border-cyan-500 ring-1 ring-cyan-500/30 bg-slate-900'
                  : isSevere
                  ? 'border-rose-800/80 hover:border-rose-700 bg-rose-950/10'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">{service.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono capitalize">
                      {service.type} {service.isSPOF && '• SPOF'}
                    </span>
                  </div>
                  {getStatusBadge(service.status)}
                </div>

                {/* Risk Score Pill */}
                <div className="mt-3 flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Risk Score:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      service.riskScore >= 75
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : service.riskScore >= 40
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {service.riskScore} / 100
                  </span>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {/* CPU */}
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/60">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="flex items-center space-x-1">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        <span>CPU</span>
                      </span>
                      <span className="font-mono text-white font-medium">{service.metrics.cpu}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          service.metrics.cpu > 80 ? 'bg-rose-500' : service.metrics.cpu > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${Math.min(100, service.metrics.cpu)}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory */}
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/60">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3 text-slate-400" />
                        <span>Memory</span>
                      </span>
                      <span className="font-mono text-white font-medium">{service.metrics.memory}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          service.metrics.memory > 80 ? 'bg-rose-500' : service.metrics.memory > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, service.metrics.memory)}%` }}
                      />
                    </div>
                  </div>

                  {/* Latency */}
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/60">
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Latency</span>
                    </div>
                    <div className="mt-1 font-mono text-xs font-bold text-white">
                      {service.metrics.latency} <span className="text-[10px] text-slate-400 font-normal">ms</span>
                    </div>
                  </div>

                  {/* Error Rate */}
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/60">
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <AlertTriangle className="w-3 h-3 text-slate-400" />
                      <span>Errors</span>
                    </div>
                    <div
                      className={`mt-1 font-mono text-xs font-bold ${
                        service.metrics.errorRate > 2.0 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {service.metrics.errorRate.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Throughput */}
                <div className="mt-2.5 px-2 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Throughput:</span>
                  <span className="text-white font-semibold">{service.metrics.throughput.toLocaleString()} req/s</span>
                </div>
              </div>

              {/* Dependencies Summary */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Deps: <strong className="text-slate-300 font-mono">{service.dependencies.length}</strong> down •{' '}
                  <strong className="text-slate-300 font-mono">{service.dependents.length}</strong> up
                </span>
                <span className="text-cyan-400 group-hover:text-cyan-300 flex items-center space-x-0.5 font-medium">
                  <span>Inspect</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Service Detailed Inspection Drawer / Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-scaleUp">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white tracking-tight">{selectedService.name}</h2>
                    {getStatusBadge(selectedService.status)}
                    {selectedService.isSPOF && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Single Point of Failure
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedService.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              {/* Telemetry Sparklines */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Real-time Telemetry History ({selectedService.name})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Latency History */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Latency History</span>
                      <span className="font-mono text-cyan-400 font-bold">{selectedService.metrics.latency} ms</span>
                    </div>
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedService.history || []}>
                          <XAxis dataKey="timestamp" hide />
                          <YAxis hide domain={['dataMin - 10', 'dataMax + 20']} />
                          <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '11px' }} />
                          <Area type="monotone" dataKey="latency" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* CPU History */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>CPU Utilization History</span>
                      <span className="font-mono text-blue-400 font-bold">{selectedService.metrics.cpu}%</span>
                    </div>
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedService.history || []}>
                          <XAxis dataKey="timestamp" hide />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '11px' }} />
                          <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Factors Breakdown */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Failure Risk Factors Breakdown</span>
                </h4>
                <div className="space-y-2">
                  {selectedService.riskFactors?.map((f, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{f.factor}</span>
                        <span className="font-mono text-slate-400">
                          Weight: {f.weight}% • Weighted Score: <strong className="text-white">{f.weightedScore}</strong>
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upstream & Downstream Dependencies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Downstream Dependencies */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                    <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Downstream Dependencies (Calls To)</span>
                  </h4>
                  {selectedService.dependencies.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No downstream dependencies (leaf node).</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedService.dependencies.map((depId) => {
                        const target = services.find((s) => s.id === depId);
                        return (
                          <div
                            key={depId}
                            onClick={() => setSelectedServiceId(depId)}
                            className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-200">{target?.name || depId}</span>
                            <span className="font-mono text-slate-400 text-[11px]">{target?.metrics.latency}ms</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Upstream Callers */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upstream Callers (Dependent On This)</span>
                  </h4>
                  {selectedService.dependents.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No upstream callers (edge ingress).</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedService.dependents.map((upId) => {
                        const target = services.find((s) => s.id === upId);
                        return (
                          <div
                            key={upId}
                            onClick={() => setSelectedServiceId(upId)}
                            className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-200">{target?.name || upId}</span>
                            <span className="font-mono text-slate-400 text-[11px]">{target?.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Simulated Logs */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Recent Telemetry Logs (Simulated)</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300 max-h-32 overflow-y-auto">
                  {selectedService.recentLogs?.map((log, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span
                        className={`font-bold shrink-0 ${
                          log.level === 'ERROR' ? 'text-rose-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-cyan-400'
                        }`}
                      >
                        {log.level}:
                      </span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedServiceId(null);
                  setActiveTab('dependency-graph');
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
              >
                <span>View in Interactive Dependency Graph</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedServiceId(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
