export type ServiceId =
  | 'api-gateway'
  | 'auth-service'
  | 'order-service'
  | 'payment-service'
  | 'inventory-service'
  | 'notification-service'
  | 'postgres-db'
  | 'cache-service';

export type ServiceStatus = 'healthy' | 'warning' | 'critical' | 'down';

export type RiskTier = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface ServiceMetrics {
  cpu: number; // percentage (0 - 100)
  memory: number; // percentage (0 - 100)
  latency: number; // ms
  errorRate: number; // percentage (0 - 100)
  throughput: number; // requests/sec
}

export interface MetricSnapshot extends ServiceMetrics {
  timestamp: number;
  riskScore: number;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  explanation: string;
}

export interface Service {
  id: ServiceId;
  name: string;
  type: 'gateway' | 'compute' | 'database' | 'cache' | 'worker';
  description: string;
  status: ServiceStatus;
  metrics: ServiceMetrics;
  dependencies: ServiceId[]; // services this service depends on (downstream)
  dependents: ServiceId[]; // services that depend on this service (upstream)
  riskScore: number; // 0 - 100
  riskTier: RiskTier;
  riskFactors: RiskFactor[];
  predictedFailureWindow: string; // e.g., "< 3 min (estimated)", "10-20 min", "Stable"
  evidenceLevel: 'High heuristic match' | 'Moderate telemetry drift' | 'Nominal baseline';
  affectedDownstream: ServiceId[];
  isSPOF: boolean; // Single Point of Failure
  history: MetricSnapshot[];
  recentLogs?: { timestamp: string; level: 'INFO' | 'WARN' | 'ERROR'; message: string }[];
}

export interface Incident {
  id: string;
  title: string;
  timestamp: number;
  severity: 'P1 - Critical' | 'P2 - High' | 'P3 - Moderate' | 'P4 - Low';
  triggeringServiceId: ServiceId;
  triggeringServiceName: string;
  initialAnomaly: string;
  suspectedRootCause: string;
  evidence: string[];
  cascadingPath: string[];
  recommendedInvestigation: string[];
  alternativeHypotheses: string[];
  status: 'Active' | 'Investigating' | 'Mitigating' | 'Resolved';
  isSimulated: boolean;
  aiAnalysis?: {
    executiveSummary: string;
    suspectedRootCause: string;
    cascadingPathExplanation: string;
    telemetryEvidence: string[];
    investigationSteps: string[];
    alternativeHypotheses: string[];
    confidenceScore: number;
    mode: 'gemini' | 'fallback';
  };
}

export type ActionType =
  | 'scale_up'
  | 'rate_limit'
  | 'restart_service'
  | 'rollback_deploy'
  | 'expand_conn_pool'
  | 'flush_cache'
  | 'circuit_breaker'
  | 'retry_backoff'
  | 'disable_background'
  | 'reroute_traffic';

export interface RecoveryRecommendation {
  id: string;
  title: string;
  targetServiceId: ServiceId;
  targetServiceName: string;
  actionType: ActionType;
  suggestedAction: string;
  reason: string;
  supportingMetrics: string;
  expectedBenefit: string;
  potentialRisk: string;
  priority: 'P1 - Immediate' | 'P2 - High' | 'P3 - Medium';
  requiresApproval: boolean;
  applied: boolean;
  timestamp: number;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  shortDesc: string;
  description: string;
  targetService: ServiceId;
  modifications: Partial<ServiceMetrics>;
  isOutage?: boolean;
  category: 'database' | 'payment' | 'gateway' | 'auth' | 'cache';
}

export interface SimulationSettings {
  tickIntervalMs: number;
  isAutoPlay: boolean;
  weights: {
    cpu: number;
    memory: number;
    latency: number;
    errorRate: number;
    dependencies: number;
  };
  thresholds: {
    lowMax: number;
    moderateMax: number;
    highMax: number;
  };
  aiMode: 'auto' | 'manual' | 'fallback-only';
  soundAlerts: boolean;
}

export type NavigationTab =
  | 'overview'
  | 'monitoring'
  | 'prediction'
  | 'dependency-graph'
  | 'root-cause'
  | 'recovery'
  | 'what-if'
  | 'history'
  | 'settings';
