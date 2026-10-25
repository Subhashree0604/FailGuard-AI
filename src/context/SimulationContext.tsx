import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  Incident,
  NavigationTab,
  RecoveryRecommendation,
  Service,
  ServiceId,
  ServiceMetrics,
  ServiceStatus,
  SimulationSettings,
  WhatIfScenario,
} from '../types';
import { DEFAULT_SETTINGS, INITIAL_SERVICES, PREBUILT_SCENARIOS, TOPOLOGY_EDGES } from '../utils/constants';
import {
  applyNormalJitter,
  applySimulatedRecovery,
  calculateServiceRisk,
  calculateSystemHealthScore,
  detectAndGenerateIncident,
  propagateCascadingFailures,
} from '../utils/simulationEngine';
import {
  analyzeIncidentWithAi,
  fetchAiRecommendations,
  fetchSystemApiStatus,
  ApiStatus,
} from '../services/api';

interface SimulationContextType {
  services: Service[];
  systemHealthScore: number;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedServiceId: ServiceId | null;
  setSelectedServiceId: (id: ServiceId | null) => void;
  selectedService: Service | null;
  incidents: Incident[];
  activeIncident: Incident | null;
  recommendations: RecoveryRecommendation[];
  isAutoPlay: boolean;
  toggleAutoPlay: () => void;
  tickSpeedMs: number;
  setTickSpeedMs: (ms: number) => void;
  stepSimulationTick: () => void;
  resetSimulation: () => void;
  loadDemoScenario: () => void;
  applyScenario: (scenario: WhatIfScenario) => void;
  injectCustomFault: (serviceId: ServiceId, metrics: Partial<ServiceMetrics>, isOutage?: boolean) => void;
  applyRecoveryAction: (recommendationId: string) => void;
  settings: SimulationSettings;
  updateSettings: (newSettings: Partial<SimulationSettings>) => void;
  apiStatus: ApiStatus;
  refreshAiStatus: () => Promise<void>;
  isAnalyzingAi: boolean;
  triggerAiIncidentAnalysis: (incidentId?: string) => Promise<void>;
  statusNotification: string | null;
  dismissNotification: () => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  activeScenarioId: string | null;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const LOCAL_STORAGE_INCIDENTS_KEY = 'failguard_ai_incidents_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'failguard_ai_settings_v1';

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [selectedServiceId, setSelectedServiceId] = useState<ServiceId | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<SimulationSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(settings.isAutoPlay);
  const [tickSpeedMs, setTickSpeedMsState] = useState<number>(settings.tickIntervalMs);

  // API Status (Gemini vs fallback)
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    status: 'checking',
    aiEnabled: false,
    model: 'initializing',
    version: '1.0.0',
  });

  // Services initial calculation
  const [services, setServices] = useState<Service[]>(() => {
    const initialized = INITIAL_SERVICES.map((s) => {
      const evaluation = calculateServiceRisk(s, INITIAL_SERVICES, DEFAULT_SETTINGS);
      return {
        ...s,
        ...evaluation,
        history: [
          {
            ...s.metrics,
            timestamp: Date.now() - 10000,
            riskScore: evaluation.riskScore,
          },
          {
            ...s.metrics,
            timestamp: Date.now(),
            riskScore: evaluation.riskScore,
          },
        ],
      };
    });
    return initialized;
  });

  // Incidents
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_INCIDENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  // Recommendations
  const [recommendations, setRecommendations] = useState<RecoveryRecommendation[]>([]);

  // System Health Score
  const systemHealthScore = calculateSystemHealthScore(services);

  const selectedService = services.find((s) => s.id === selectedServiceId) || null;
  const activeIncident = incidents.find((inc) => inc.status === 'Active' || inc.status === 'Investigating') || null;

  // Persist settings
  const updateSettings = (newSettings: Partial<SimulationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const setTickSpeedMs = (ms: number) => {
    setTickSpeedMsState(ms);
    updateSettings({ tickIntervalMs: ms });
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay((prev) => {
      const next = !prev;
      updateSettings({ isAutoPlay: next });
      return next;
    });
  };

  const dismissNotification = () => setStatusNotification(null);

  // Check backend Gemini status on mount
  const refreshAiStatus = useCallback(async () => {
    const status = await fetchSystemApiStatus();
    setApiStatus(status);
  }, []);

  useEffect(() => {
    refreshAiStatus();
  }, [refreshAiStatus]);

  // Persist incidents
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_INCIDENTS_KEY, JSON.stringify(incidents));
    } catch (e) {
      // ignore
    }
  }, [incidents]);

  // Core Simulation Step function
  const stepSimulationTick = useCallback(() => {
    setServices((currentServices) => {
      // 1. Apply baseline jitter
      const jittered = applyNormalJitter(currentServices);

      // 2. Cascade degradation
      const cascaded = propagateCascadingFailures(jittered);

      // 3. Recalculate risk scores and append history
      const now = Date.now();
      const recalculated = cascaded.map((s) => {
        const evaluation = calculateServiceRisk(s, cascaded, settings);
        const newHistory = [
          ...(s.history || []).slice(-24),
          {
            ...s.metrics,
            timestamp: now,
            riskScore: evaluation.riskScore,
          },
        ];
        return {
          ...s,
          ...evaluation,
          history: newHistory,
        };
      });

      return recalculated;
    });
  }, [settings]);

  // Interval ticker
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      stepSimulationTick();
    }, tickSpeedMs);
    return () => clearInterval(interval);
  }, [isAutoPlay, tickSpeedMs, stepSimulationTick]);

  // Automatic Incident Detection on state change
  const lastIncidentCheckRef = useRef<number>(0);
  useEffect(() => {
    const now = Date.now();
    // Throttle incident detection to once every 6 seconds to avoid incident spam
    if (now - lastIncidentCheckRef.current < 6000) return;

    const detected = detectAndGenerateIncident(services);
    if (detected) {
      lastIncidentCheckRef.current = now;
      setIncidents((prev) => {
        // Check if an active incident for this service already exists
        const exists = prev.some(
          (inc) =>
            inc.triggeringServiceId === detected.triggeringServiceId &&
            (inc.status === 'Active' || inc.status === 'Investigating')
        );
        if (exists) return prev;
        return [detected, ...prev.slice(0, 49)];
      });
    }
  }, [services]);

  // Generate / Refresh Recommendations when critical services exist
  useEffect(() => {
    const atRisk = services.filter((s) => s.riskScore >= 55 || s.status === 'critical' || s.status === 'down');
    if (atRisk.length === 0) {
      setRecommendations([]);
      return;
    }

    let isMounted = true;
    fetchAiRecommendations(atRisk, systemHealthScore, activeIncident).then((res) => {
      if (isMounted && res.recommendations && res.recommendations.length > 0) {
        setRecommendations((prev) => {
          // Merge preserving applied state
          return res.recommendations.map((rec) => {
            const prior = prev.find((p) => p.id === rec.id);
            return prior ? { ...rec, applied: prior.applied } : rec;
          });
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [services, systemHealthScore, activeIncident]);

  // Trigger Gemini or fallback AI Analysis for active incident
  const triggerAiIncidentAnalysis = async (incidentId?: string) => {
    const targetIncident = incidentId ? incidents.find((i) => i.id === incidentId) : activeIncident;
    if (!targetIncident) {
      setStatusNotification('No active incident selected to analyze.');
      return;
    }

    setIsAnalyzingAi(true);
    setStatusNotification('FailGuard AI analyzing telemetry, call graph, and logs...');

    try {
      const res = await analyzeIncidentWithAi(targetIncident, services, TOPOLOGY_EDGES);
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id === targetIncident.id) {
            return {
              ...inc,
              aiAnalysis: {
                ...res.analysis,
                mode: res.mode,
              },
            };
          }
          return inc;
        })
      );
      setStatusNotification(
        res.mode === 'gemini'
          ? 'Gemini AI incident diagnosis complete.'
          : 'Rule-based SRE diagnostic report generated (Fallback Mode).'
      );
    } catch (e) {
      setStatusNotification('Failed to generate AI analysis.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Reset system to pristine nominal baseline
  const resetSimulation = () => {
    setActiveScenarioId(null);
    const pristine = INITIAL_SERVICES.map((s) => {
      const evaluation = calculateServiceRisk(s, INITIAL_SERVICES, settings);
      return {
        ...s,
        ...evaluation,
        history: [
          {
            ...s.metrics,
            timestamp: Date.now() - 5000,
            riskScore: evaluation.riskScore,
          },
          {
            ...s.metrics,
            timestamp: Date.now(),
            riskScore: evaluation.riskScore,
          },
        ],
      };
    });

    setServices(pristine);
    // Resolve active incidents
    setIncidents((prev) =>
      prev.map((inc) => (inc.status === 'Active' || inc.status === 'Investigating' ? { ...inc, status: 'Resolved' } : inc))
    );
    setRecommendations([]);
    setStatusNotification('System telemetry reset to nominal healthy baseline (All 8 services operational).');
  };

  // Load the comprehensive Demo Scenario specified in Section 16
  const loadDemoScenario = () => {
    setActiveScenarioId('demo-cascading-db-overload');

    setServices((current) => {
      const updated = current.map((s) => {
        if (s.id === 'postgres-db') {
          return {
            ...s,
            status: 'critical' as const,
            metrics: {
              cpu: 96,
              memory: 88,
              latency: 1450,
              errorRate: 14.8,
              throughput: 310,
            },
          };
        }
        if (s.id === 'payment-service') {
          return {
            ...s,
            status: 'critical' as const,
            metrics: {
              cpu: 84,
              memory: 76,
              latency: 980,
              errorRate: 28.5,
              throughput: 160,
            },
          };
        }
        if (s.id === 'order-service') {
          return {
            ...s,
            status: 'warning' as const,
            metrics: {
              cpu: 78,
              memory: 68,
              latency: 520,
              errorRate: 14.2,
              throughput: 340,
            },
          };
        }
        if (s.id === 'api-gateway') {
          return {
            ...s,
            status: 'warning' as const,
            metrics: {
              cpu: 64,
              memory: 55,
              latency: 240,
              errorRate: 5.6,
              throughput: 1250,
            },
          };
        }
        return s;
      });

      // Cascade & recalculate
      const cascaded = propagateCascadingFailures(updated);
      const recalculated = cascaded.map((s) => {
        const evaluation = calculateServiceRisk(s, cascaded, settings);
        return {
          ...s,
          ...evaluation,
          history: [
            ...(s.history || []).slice(-20),
            { ...s.metrics, timestamp: Date.now(), riskScore: evaluation.riskScore },
          ],
        };
      });

      return recalculated;
    });

    // Create high-severity Demo Incident
    const demoIncident: Incident = {
      id: `INC-DEMO-${Date.now().toString().slice(-4)}`,
      title: 'Cascading Failure: PostgreSQL Connection & IOPS Starvation',
      timestamp: Date.now(),
      severity: 'P1 - Critical',
      triggeringServiceId: 'postgres-db',
      triggeringServiceName: 'PostgreSQL Database',
      initialAnomaly: 'PostgreSQL CPU reached 96% and latency escalated to 1,450ms. Payment Service queue stalled.',
      suspectedRootCause: 'PostgreSQL connection pool depletion and IO lock contention stalling Payment & Inventory pipelines.',
      evidence: [
        'PostgreSQL CPU utilization at 96% (Critical Threshold: 80%)',
        'p99 Query response time spiked from 14ms to 1,450ms',
        'Payment Service latency surged to 980ms with 28.5% timeout rate',
        'Order Service worker thread saturation causing 14.2% checkout failures',
        'API Gateway returning HTTP 504 Gateway Timeouts to edge users',
      ],
      cascadingPath: ['PostgreSQL Database', 'Payment Service & Inventory Service', 'Order Service', 'API Gateway'],
      recommendedInvestigation: [
        'Check active database locks via pg_stat_activity',
        'Inspect connection pool capacity (active: 198/200)',
        'Enable circuit breakers between Order Service and Payment Service',
        'Route non-transactional read traffic to Cache Service',
      ],
      alternativeHypotheses: [
        'Sudden surge in unindexed product inventory lookup transactions',
        'Deadlock cascade caused by concurrent stock reservation writes',
      ],
      status: 'Active',
      isSimulated: true,
    };

    setIncidents((prev) => [demoIncident, ...prev.slice(0, 49)]);
    setStatusNotification('Loaded Demo Scenario: PostgreSQL Overload cascading to Payment, Order & API Gateway.');

    // Auto trigger analysis
    setTimeout(() => {
      triggerAiIncidentAnalysis(demoIncident.id);
    }, 400);
  };

  // Apply a Prebuilt Scenario
  const applyScenario = (scenario: WhatIfScenario) => {
    setActiveScenarioId(scenario.id);

    setServices((current) => {
      const updated = current.map((s) => {
        if (s.id === scenario.targetService) {
          return {
            ...s,
            status: (scenario.isOutage ? 'down' : 'critical') as ServiceStatus,
            metrics: {
              ...s.metrics,
              ...scenario.modifications,
            },
          };
        }
        return s;
      });

      const cascaded = propagateCascadingFailures(updated);
      const recalculated = cascaded.map((s) => {
        const evaluation = calculateServiceRisk(s, cascaded, settings);
        return {
          ...s,
          ...evaluation,
          history: [
            ...(s.history || []).slice(-20),
            { ...s.metrics, timestamp: Date.now(), riskScore: evaluation.riskScore },
          ],
        };
      });

      return recalculated;
    });

    setStatusNotification(`Activated scenario: "${scenario.name}". Cascade propagation calculated.`);
  };

  // Custom Fault Injection
  const injectCustomFault = (
    serviceId: ServiceId,
    metrics: Partial<ServiceMetrics>,
    isOutage: boolean = false
  ) => {
    setActiveScenarioId(`custom-${serviceId}`);

    setServices((current) => {
      const updated = current.map((s) => {
        if (s.id === serviceId) {
          return {
            ...s,
            status: (isOutage ? 'down' : 'critical') as ServiceStatus,
            metrics: {
              ...s.metrics,
              ...metrics,
            },
          };
        }
        return s;
      });

      const cascaded = propagateCascadingFailures(updated);
      const recalculated = cascaded.map((s) => {
        const evaluation = calculateServiceRisk(s, cascaded, settings);
        return {
          ...s,
          ...evaluation,
          history: [
            ...(s.history || []).slice(-20),
            { ...s.metrics, timestamp: Date.now(), riskScore: evaluation.riskScore },
          ],
        };
      });

      return recalculated;
    });

    const target = services.find((s) => s.id === serviceId);
    setStatusNotification(`Injected custom fault on ${target?.name || serviceId}. Recomputed failure propagation.`);
  };

  // Apply simulated recovery recommendation
  const applyRecoveryAction = (recommendationId: string) => {
    const rec = recommendations.find((r) => r.id === recommendationId);
    if (!rec) return;

    const { updatedServices, feedbackMessage } = applySimulatedRecovery(services, rec);

    // Re-evaluate
    const finalServices = updatedServices.map((s) => {
      const evaluation = calculateServiceRisk(s, updatedServices, settings);
      return {
        ...s,
        ...evaluation,
        history: [
          ...(s.history || []).slice(-20),
          { ...s.metrics, timestamp: Date.now(), riskScore: evaluation.riskScore },
        ],
      };
    });

    setServices(finalServices);

    setRecommendations((prev) =>
      prev.map((r) => (r.id === recommendationId ? { ...r, applied: true } : r))
    );

    // If active incident corresponds to healed service, mark mitigating
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.triggeringServiceId === rec.targetServiceId && inc.status === 'Active'
          ? { ...inc, status: 'Mitigating' }
          : inc
      )
    );

    setStatusNotification(feedbackMessage);
  };

  return (
    <SimulationContext.Provider
      value={{
        services,
        systemHealthScore,
        activeTab,
        setActiveTab,
        selectedServiceId,
        setSelectedServiceId,
        selectedService,
        incidents,
        activeIncident,
        recommendations,
        isAutoPlay,
        toggleAutoPlay,
        tickSpeedMs,
        setTickSpeedMs,
        stepSimulationTick,
        resetSimulation,
        loadDemoScenario,
        applyScenario,
        injectCustomFault,
        applyRecoveryAction,
        settings,
        updateSettings,
        apiStatus,
        refreshAiStatus,
        isAnalyzingAi,
        triggerAiIncidentAnalysis,
        statusNotification,
        dismissNotification,
        isCopilotOpen,
        setIsCopilotOpen,
        activeScenarioId,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export function useSimulation(): SimulationContextType {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
