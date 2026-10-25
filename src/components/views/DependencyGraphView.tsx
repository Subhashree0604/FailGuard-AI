import React, { useState } from 'react';
import {
  GitFork,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { Service, ServiceId, ServiceStatus } from '../../types';
import { TOPOLOGY_EDGES, TOPOLOGY_NODES_CONFIG } from '../../utils/constants';

export const DependencyGraphView: React.FC = () => {
  const { services, selectedServiceId, setSelectedServiceId, setActiveTab } = useSimulation();

  const [highlightSPOF, setHighlightSPOF] = useState(false);
  const [highlightBlastRadius, setHighlightBlastRadius] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  const selectedService = services.find((s) => s.id === selectedServiceId) || null;

  // Compute blast radius: if node is selected, find all reachable upstream callers
  const getBlastRadiusSet = (targetId: ServiceId | null): Set<ServiceId> => {
    const set = new Set<ServiceId>();
    if (!targetId) return set;
    set.add(targetId);

    // Recursively collect dependents (upstream callers)
    const traverse = (id: ServiceId) => {
      const s = services.find((item) => item.id === id);
      if (s) {
        s.dependents.forEach((dep) => {
          if (!set.has(dep)) {
            set.add(dep);
            traverse(dep);
          }
        });
      }
    };
    traverse(targetId);
    return set;
  };

  const blastRadiusNodes = getBlastRadiusSet(selectedServiceId);

  // Helper for status colors
  const getNodeColor = (status: ServiceStatus) => {
    switch (status) {
      case 'healthy':
        return {
          bg: '#0f172a',
          border: '#10b981',
          glow: 'rgba(16, 185, 129, 0.25)',
          text: '#34d399',
        };
      case 'warning':
        return {
          bg: '#1e1b12',
          border: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.3)',
          text: '#fbbf24',
        };
      case 'critical':
        return {
          bg: '#221115',
          border: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.4)',
          text: '#fb7185',
        };
      case 'down':
        return {
          bg: '#2b0c10',
          border: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.6)',
          text: '#f87171',
        };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Topology Header Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <span>Distributed Microservices Call Graph & Cascade Topology</span>
          </h2>
          <p className="text-xs text-slate-400">
            Click nodes to trace upstream blast radius, single points of failure (SPOF), and latency backpressure.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={() => setHighlightBlastRadius((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition-colors ${
              highlightBlastRadius
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Highlight Blast Radius</span>
          </button>

          <button
            onClick={() => setHighlightSPOF((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition-colors ${
              highlightSPOF
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Show SPOFs</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1.5">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-400 hover:text-white rounded ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive SVG Topology Graph (3 cols) */}
        <div className="lg:col-span-3 bg-slate-950/90 border border-slate-800 rounded-xl p-4 overflow-hidden relative min-h-[520px] flex items-center justify-center shadow-inner">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Canvas */}
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            className="transition-transform duration-200"
          >
            <svg
              width="1020"
              height="520"
              viewBox="0 0 1020 520"
              className="overflow-visible select-none"
            >
              <defs>
                {/* Arrowhead Markers */}
                <marker
                  id="arrow-healthy"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>

                <marker
                  id="arrow-cascade"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                </marker>
              </defs>

              {/* Tier Background Guides */}
              <g className="text-slate-700 text-[10px] font-mono">
                <text x="120" y="30" textAnchor="middle" fill="#475569">
                  INGRESS LAYER
                </text>
                <line x1="250" y1="20" x2="250" y2="500" stroke="#1e293b" strokeDasharray="4 4" />
                <text x="515" y="30" textAnchor="middle" fill="#475569">
                  APPLICATION SERVICES
                </text>
                <line x1="770" y1="20" x2="770" y2="500" stroke="#1e293b" strokeDasharray="4 4" />
                <text x="890" y="30" textAnchor="middle" fill="#475569">
                  DATA & PERSISTENCE
                </text>
              </g>

              {/* Connection Edges */}
              {TOPOLOGY_EDGES.map((edge, idx) => {
                const srcPos = TOPOLOGY_NODES_CONFIG[edge.source];
                const dstPos = TOPOLOGY_NODES_CONFIG[edge.target];
                const srcService = services.find((s) => s.id === edge.source);
                const dstService = services.find((s) => s.id === edge.target);

                const isCascadeActive =
                  (dstService && (dstService.riskScore >= 60 || dstService.status === 'critical')) ||
                  (srcService && (srcService.riskScore >= 60 || srcService.status === 'critical'));

                const isHighlighted =
                  highlightBlastRadius &&
                  selectedServiceId &&
                  (blastRadiusNodes.has(edge.source) || blastRadiusNodes.has(edge.target));

                // Bezier curve control points
                const dx = dstPos.x - srcPos.x;
                const dy = dstPos.y - srcPos.y;
                const pathD = `M ${srcPos.x + 75} ${srcPos.y + 25} C ${srcPos.x + 75 + dx * 0.4} ${
                  srcPos.y + 25
                }, ${dstPos.x - dx * 0.4} ${dstPos.y + 25}, ${dstPos.x - 10} ${dstPos.y + 25}`;

                return (
                  <g key={idx}>
                    {/* Underlying line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        isCascadeActive
                          ? '#f43f5e'
                          : isHighlighted
                          ? '#38bdf8'
                          : '#334155'
                      }
                      strokeWidth={isCascadeActive ? 2.5 : isHighlighted ? 2 : 1.2}
                      strokeDasharray={isCascadeActive ? '5 5' : 'none'}
                      markerEnd={isCascadeActive ? 'url(#arrow-cascade)' : 'url(#arrow-healthy)'}
                      className={isCascadeActive ? 'animate-pulse' : ''}
                    />

                    {/* Edge Label on hover/display */}
                    <text
                      x={(srcPos.x + dstPos.x) / 2 + 30}
                      y={(srcPos.y + dstPos.y) / 2 + 15}
                      fill={isCascadeActive ? '#fb7185' : '#64748b'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {/* Service Nodes */}
              {services.map((service) => {
                const pos = TOPOLOGY_NODES_CONFIG[service.id];
                const isSelected = selectedServiceId === service.id;
                const colors = getNodeColor(service.status);
                const inBlastRadius = highlightBlastRadius && selectedServiceId && blastRadiusNodes.has(service.id);
                const isSPOFHighlighted = highlightSPOF && service.isSPOF;

                return (
                  <g
                    key={service.id}
                    transform={`translate(${pos.x - 80}, ${pos.y})`}
                    onClick={() => setSelectedServiceId(service.id)}
                    className="cursor-pointer transition-transform duration-150 hover:scale-105"
                  >
                    {/* Pulsing ring for critical status */}
                    {(service.status === 'critical' || service.status === 'down') && (
                      <rect
                        x="-4"
                        y="-4"
                        width="168"
                        height="64"
                        rx="12"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2"
                        className="animate-ping opacity-30"
                      />
                    )}

                    {/* Main Node Card */}
                    <rect
                      x="0"
                      y="0"
                      width="160"
                      height="56"
                      rx="10"
                      fill={isSelected ? '#0f172a' : colors.bg}
                      stroke={isSelected ? '#06b6d4' : colors.border}
                      strokeWidth={isSelected ? 2.5 : inBlastRadius ? 2 : 1.2}
                      style={{
                        filter: isSelected
                          ? 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))'
                          : `drop-shadow(0 0 6px ${colors.glow})`,
                      }}
                    />

                    {/* Status Dot */}
                    <circle
                      cx="14"
                      cy="18"
                      r="4.5"
                      fill={colors.border}
                      className={service.status === 'critical' ? 'animate-pulse' : ''}
                    />

                    {/* Service Name */}
                    <text
                      x="26"
                      y="21"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {service.name.length > 17 ? service.name.slice(0, 16) + '..' : service.name}
                    </text>

                    {/* SPOF Tag */}
                    {isSPOFHighlighted && (
                      <text x="144" y="20" fill="#f59e0b" fontSize="8" fontWeight="bold">
                        SPOF
                      </text>
                    )}

                    {/* Metrics Row inside Node */}
                    <text
                      x="14"
                      y="42"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {service.metrics.latency}ms • {service.metrics.cpu}% CPU
                    </text>

                    {/* Risk Badge */}
                    <text
                      x="146"
                      y="42"
                      fill={colors.text}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {service.riskScore}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Canvas Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center space-x-4 text-[11px] text-slate-300">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Healthy</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Warning</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Critical / Cascade</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>SPOF</span>
            </span>
          </div>
        </div>

        {/* Selected Node Inspector Panel (1 col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Node Inspector</h3>
              {selectedService && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedService.id}
                </span>
              )}
            </div>

            {selectedService ? (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-base font-bold text-white">{selectedService.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedService.description}</p>
                </div>

                {/* Status & Risk Card */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Health Status:</span>
                    <span className="font-semibold text-white uppercase">{selectedService.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Composite Risk:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {selectedService.riskScore} / 100 ({selectedService.riskTier})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Failure Window:</span>
                    <span className="text-amber-300 font-mono text-[11px]">
                      {selectedService.predictedFailureWindow}
                    </span>
                  </div>
                </div>

                {/* Telemetry Snapshot */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Roundtrip Latency</div>
                    <div className="font-bold text-white mt-0.5">{selectedService.metrics.latency} ms</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Error Rate</div>
                    <div className="font-bold text-rose-400 mt-0.5">{selectedService.metrics.errorRate}%</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">CPU Load</div>
                    <div className="font-bold text-white mt-0.5">{selectedService.metrics.cpu}%</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Throughput</div>
                    <div className="font-bold text-cyan-400 mt-0.5">{selectedService.metrics.throughput} r/s</div>
                  </div>
                </div>

                {/* Upstream & Downstream Blast Radius List */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-rose-400 text-[11px] mb-1 flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Cascading Blast Radius (Callers):</span>
                    </div>
                    {selectedService.dependents.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedService.dependents.map((dep) => (
                          <span
                            key={dep}
                            onClick={() => setSelectedServiceId(dep)}
                            className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800 cursor-pointer text-[10px] font-mono hover:bg-rose-900/60"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No upstream callers.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <GitFork className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>Select any service node on the canvas to inspect dependencies, call routes, and failure impact.</p>
              </div>
            )}
          </div>

          {selectedService && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => setActiveTab('root-cause')}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow flex items-center justify-center space-x-1 transition-colors"
              >
                <span>Analyze Service Incidents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
