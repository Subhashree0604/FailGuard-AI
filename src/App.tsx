/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AICopilotModal } from './components/AICopilotModal';
import { OverviewView } from './components/views/OverviewView';
import { ServiceMonitoringView } from './components/views/ServiceMonitoringView';
import { FailurePredictionView } from './components/views/FailurePredictionView';
import { DependencyGraphView } from './components/views/DependencyGraphView';
import { RootCauseAnalysisView } from './components/views/RootCauseAnalysisView';
import { RecoveryRecommendationsView } from './components/views/RecoveryRecommendationsView';
import { WhatIfSimulatorView } from './components/views/WhatIfSimulatorView';
import { IncidentHistoryView } from './components/views/IncidentHistoryView';
import { SettingsView } from './components/views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab } = useSimulation();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'monitoring':
        return <ServiceMonitoringView />;
      case 'prediction':
        return <FailurePredictionView />;
      case 'dependency-graph':
        return <DependencyGraphView />;
      case 'root-cause':
        return <RootCauseAnalysisView />;
      case 'recovery':
        return <RecoveryRecommendationsView />;
      case 'what-if':
        return <WhatIfSimulatorView />;
      case 'history':
        return <IncidentHistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header with Simulation Controls */}
        <Header />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating SRE Copilot Dialog */}
      <AICopilotModal />
    </div>
  );
};

export default function App() {
  return (
    <SimulationProvider>
      <MainLayout />
    </SimulationProvider>
  );
}
