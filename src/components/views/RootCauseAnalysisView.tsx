import React, { useState } from 'react';
import {
  SearchCode,
  AlertOctagon,
  Sparkles,
  Bot,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  ArrowRight,
  GitFork,
  HelpCircle,
  Activity,
  Layers,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { Incident } from '../../types';

export const RootCauseAnalysisView: React.FC = () => {
  const {
    incidents,
    activeIncident,
    services,
    triggerAiIncidentAnalysis,
    isAnalyzingAi,
    apiStatus,
    setActiveTab,
    loadDemoScenario,
  } = useSimulation();

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    activeIncident?.id || incidents[0]?.id || null
  );
  const [copied, setCopied] = useState(false);

  const incident = incidents.find((i) => i.id === selectedIncidentId) || activeIncident || incidents[0] || null;

  const handleCopyReport = () => {
    if (!incident) return;
    const text = `=== FailGuard AI Root Cause Analysis Report ===
Incident ID: ${incident.id}
Severity: ${incident.severity}
Trigger Service: ${incident.triggeringServiceName}
Timestamp: ${new Date(incident.timestamp).toLocaleString()}

Initial Anomaly:
${incident.initialAnomaly}

Suspected Root Cause:
${incident.aiAnalysis?.suspectedRootCause || incident.suspectedRootCause}

Evidence:
${(incident.aiAnalysis?.telemetryEvidence || incident.evidence).map((e) => ` - ${e}`).join('\n')}

Cascading Path:
${(incident.aiAnalysis?.cascadingPathExplanation || incident.cascadingPath.join(' -> '))}

Recommended Investigation Steps:
${(incident.aiAnalysis?.investigationSteps || incident.recommendedInvestigation).map((s) => ` [ ] ${s}`).join('\n')}

Alternative Hypotheses:
${(incident.aiAnalysis?.alternativeHypotheses || incident.alternativeHypotheses).map((h) => ` * ${h}`).join('\n')}
=================================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: AI Model Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white">AIOps Root Cause Diagnostic Engine</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {apiStatus.aiEnabled ? 'Gemini 3.8 Flash Active' : 'Deterministic SRE Rule Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluates telemetry drift, dependency graph paths, and thread pool exhaustion to isolate the originating trigger.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {incident && (
            <button
              onClick={() => triggerAiIncidentAnalysis(incident.id)}
              disabled={isAnalyzingAi}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAi ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingAi ? 'Diagnosing Incident...' : 'Run Gemini RCA'}</span>
            </button>
          )}

          {incident && (
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Export SRE Report'}</span>
            </button>
          )}
        </div>
      </div>

      {incident ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main RCA Narrative (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Incident Summary Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                    <AlertOctagon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{incident.title}</h3>
                    <div className="text-[11px] font-mono text-slate-400">
                      ID: <span className="text-cyan-400">{incident.id}</span> • Started:{' '}
                      {new Date(incident.timestamp).toLocaleTimeString()} • Status:{' '}
                      <span className="text-amber-400 font-semibold">{incident.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    {incident.severity}
                  </span>
                </div>
              </div>

              {/* Initial Anomaly Detection */}
              <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Initial Detected Anomaly
                </span>
                <p className="text-xs text-slate-200 font-mono mt-1">{incident.initialAnomaly}</p>
              </div>

              {/* Suspected Root Cause (Highlighted) */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-500/40 shadow-sm">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Suspected Root Cause & Trigger Origin</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {incident.aiAnalysis?.suspectedRootCause || incident.suspectedRootCause}
                </p>
                {incident.aiAnalysis?.confidenceScore && (
                  <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
                    <span>Diagnosis Confidence:</span>
                    <strong className="text-cyan-400 font-bold">{incident.aiAnalysis.confidenceScore}%</strong>
                    <span>({incident.aiAnalysis.mode === 'gemini' ? 'Gemini 3.8 Flash' : 'Rule Engine'})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Supporting Diagnosis */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Empirical Telemetry Evidence</span>
              </h4>
              <div className="space-y-2">
                {(incident.aiAnalysis?.telemetryEvidence || incident.evidence).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="font-mono">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cascading Path Explanation */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <GitFork className="w-4 h-4 text-rose-400" />
                <span>Cascading Propagation Breakdown</span>
              </h4>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {incident.aiAnalysis?.cascadingPathExplanation || (
                  <div className="flex flex-wrap items-center gap-2">
                    {incident.cascadingPath.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-2 py-1 rounded bg-slate-900 text-rose-300 font-mono text-xs border border-rose-900/50">
                          {step}
                        </span>
                        {idx < incident.cascadingPath.length - 1 && (
                          <span className="text-slate-500 font-bold">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Investigation Steps & Runbook */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Recommended On-Call Investigation Steps</span>
              </h4>
              <div className="space-y-2">
                {(incident.aiAnalysis?.investigationSteps || incident.recommendedInvestigation).map(
                  (step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-3 text-xs text-slate-200"
                    >
                      <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Alternative Hypotheses */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Alternative Hypotheses (Noise / Ambiguity)</span>
              </h4>
              <div className="space-y-2">
                {(incident.aiAnalysis?.alternativeHypotheses || incident.alternativeHypotheses).map(
                  (hypo, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 font-mono"
                    >
                      • {hypo}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Incident Selector Sidebar (1 col) */}
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active & Recent Incidents</h4>
                <span className="text-[10px] font-mono text-slate-400">{incidents.length} total</span>
              </div>

              <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto">
                {incidents.map((inc) => {
                  const isSelected = incident.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-950 border-cyan-500 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-cyan-400">{inc.id}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            inc.severity.includes('Critical')
                              ? 'bg-rose-950 text-rose-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {inc.severity.split(' - ')[0]}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white truncate">{inc.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Trigger: <strong className="text-slate-300">{inc.triggeringServiceName}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick SRE Recovery Action */}
            <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Next Recovery Step</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Review automated circuit breaker and scale-up recommendations generated for this incident.
              </p>
              <button
                onClick={() => setActiveTab('recovery')}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
              >
                <span>Open Recovery Recommendations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Active Incidents Detected</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All system tiers are operating nominally. To test the Root Cause Analysis engine with live telemetry and Gemini diagnosis, load the demo crisis scenario.
          </p>
          <button
            onClick={loadDemoScenario}
            className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Demo Crisis Scenario</span>
          </button>
        </div>
      )}
    </div>
  );
};
