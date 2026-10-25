import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { Incident } from '../../types';

export const IncidentHistoryView: React.FC = () => {
  const { incidents, setActiveTab, triggerAiIncidentAnalysis, loadDemoScenario } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.triggeringServiceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.suspectedRootCause.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === 'all' || inc.severity.toLowerCase().includes(severityFilter.toLowerCase());

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident history by ID, service, or root cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 px-2 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Severity:</span>
          </span>
          {['all', 'critical', 'high', 'moderate'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                severityFilter === sev
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table / List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white">Simulated Incident Ledger</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              LocalStorage Persisted
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">{filteredIncidents.length} record(s)</span>
        </div>

        {filteredIncidents.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {filteredIncidents.map((incident) => {
              const isCritical = incident.severity.includes('Critical');
              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className="p-4 hover:bg-slate-800/50 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">{incident.id}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isCritical
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {incident.severity}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {incident.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(incident.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{incident.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-2xl line-clamp-1">
                        Root Cause: <span className="text-slate-300">{incident.suspectedRootCause}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] text-slate-400">Triggering Node:</div>
                      <div className="font-semibold text-white font-mono">{incident.triggeringServiceName}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncident(incident);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No Incidents Found</p>
            <p className="mt-1">Adjust your search query or load the demo crisis scenario.</p>
            <button
              onClick={loadDemoScenario}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs inline-flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Scenario</span>
            </button>
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{selectedIncident.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    {selectedIncident.severity}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedIncident.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedIncident.title}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Timestamp: {new Date(selectedIncident.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Triggering Service:</span>
                <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-white font-mono text-xs">
                  {selectedIncident.triggeringServiceName}
                </span>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Initial Anomaly:</span>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200">
                  {selectedIncident.initialAnomaly}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Suspected Root Cause:</span>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed">
                  {selectedIncident.suspectedRootCause}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Cascading Failure Path:</span>
                <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
                  {selectedIncident.cascadingPath?.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-rose-300 font-mono text-[11px] border border-rose-900/60">
                        {step}
                      </span>
                      {idx < selectedIncident.cascadingPath.length - 1 && (
                        <span className="text-slate-500 font-bold">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Evidence Records:</span>
                <div className="space-y-1 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  {selectedIncident.evidence?.map((e, idx) => (
                    <div key={idx}>• {e}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedIncident(null);
                  setActiveTab('root-cause');
                  triggerAiIncidentAnalysis(selectedIncident.id);
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open in Root Cause Analysis</span>
              </button>
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
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
