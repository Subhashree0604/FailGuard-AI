import React from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  GitFork,
  SearchCode,
  ShieldCheck,
  FlaskConical,
  History,
  Settings as SettingsIcon,
  Bot,
  Zap,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { NavigationTab } from '../types';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    systemHealthScore,
    apiStatus,
    setIsCopilotOpen,
    loadDemoScenario,
    incidents,
  } = useSimulation();

  const activeIncidentCount = incidents.filter(
    (i) => i.status === 'Active' || i.status === 'Investigating'
  ).length;

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Service Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'prediction', label: 'Failure Prediction', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'dependency-graph', label: 'Dependency Graph', icon: <GitFork className="w-4 h-4" /> },
    { id: 'root-cause', label: 'Root Cause Analysis', icon: <SearchCode className="w-4 h-4" />, badge: activeIncidentCount > 0 ? activeIncidentCount : undefined },
    { id: 'recovery', label: 'Recovery Actions', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'what-if', label: 'What-If Simulator', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'history', label: 'Incident History', icon: <History className="w-4 h-4" />, badge: incidents.length },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  const healthColor =
    systemHealthScore >= 80
      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
      : systemHealthScore >= 50
      ? 'text-amber-400 bg-amber-950/60 border-amber-800/60'
      : 'text-rose-400 bg-rose-950/60 border-rose-800/60';

  return (
    <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-screen shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-base tracking-tight">FailGuard</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">Cascading Failure Prevention</p>
          </div>
        </div>
      </div>

      {/* Quick Demo Action Button */}
      <div className="px-3 pt-3">
        <button
          onClick={loadDemoScenario}
          className="w-full group px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 hover:border-cyan-400/50 flex items-center justify-between transition-all duration-200 text-left"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-cyan-200">Load Demo Scenario</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/50">
            P1 DB
          </span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Observability & SRE
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-cyan-500/30 text-cyan-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* SRE Copilot Launcher & System Pill */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950">
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 transition-all text-xs font-medium text-slate-200"
        >
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>FailGuard Copilot</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
            Ask AI
          </span>
        </button>

        {/* System Health Status Indicator */}
        <div className={`p-2.5 rounded-lg border flex items-center justify-between ${healthColor}`}>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                systemHealthScore >= 80
                  ? 'bg-emerald-400 animate-pulse'
                  : systemHealthScore >= 50
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span className="text-xs font-semibold">
              {systemHealthScore >= 80 ? 'System Healthy' : systemHealthScore >= 50 ? 'System Degraded' : 'Cascade Crisis'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold">{systemHealthScore}%</span>
        </div>

        {/* AI Engine Status */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus.aiEnabled ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
            />
            <span>{apiStatus.aiEnabled ? 'Gemini 3.8 Flash' : 'Rule Engine (Fallback)'}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
