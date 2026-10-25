import {
  Incident,
  RecoveryRecommendation,
  RiskFactor,
  RiskTier,
  Service,
  ServiceId,
  ServiceMetrics,
  ServiceStatus,
  SimulationSettings,
} from '../types';

/**
 * Normalizes a metric into a 0 - 100 raw risk score
 */
export function calculateRawMetricRisk(
  value: number,
  thresholds: { normal: number; warning: number; critical: number }
): number {
  if (value <= thresholds.normal) {
    return Math.max(0, (value / thresholds.normal) * 25);
  }
  if (value <= thresholds.warning) {
    const ratio = (value - thresholds.normal) / (thresholds.warning - thresholds.normal);
    return 25 + ratio * 35; // 25 - 60
  }
  if (value <= thresholds.critical) {
    const ratio = (value - thresholds.warning) / (thresholds.critical - thresholds.warning);
    return 60 + ratio * 30; // 60 - 90
  }
  // Above critical
  return Math.min(100, 90 + ((value - thresholds.critical) / thresholds.critical) * 10);
}

/**
 * Calculates risk score and detailed factor breakdown for a single service
 */
export function calculateServiceRisk(
  service: Service,
  allServices: Service[],
  settings: SimulationSettings
): {
  riskScore: number;
  riskTier: RiskTier;
  riskFactors: RiskFactor[];
  status: ServiceStatus;
  predictedFailureWindow: string;
  evidenceLevel: 'High heuristic match' | 'Moderate telemetry drift' | 'Nominal baseline';
} {
  const m = service.metrics;
  const w = settings.weights;
  const totalWeight = w.cpu + w.memory + w.latency + w.errorRate + w.dependencies;

  // 1. CPU Score (Normal < 50%, Warning 75%, Critical 90%)
  const cpuRaw = calculateRawMetricRisk(m.cpu, { normal: 45, warning: 75, critical: 90 });
  const cpuFactor: RiskFactor = {
    factor: 'CPU Saturation',
    weight: w.cpu,
    rawScore: Math.round(cpuRaw),
    weightedScore: Math.round((cpuRaw * w.cpu) / totalWeight),
    explanation:
      m.cpu > 80
        ? `Elevated compute load (${Math.round(m.cpu)}%) threatens thread availability.`
        : `Compute usage (${Math.round(m.cpu)}%) within standard headroom.`,
  };

  // 2. Memory Score (Normal < 60%, Warning 80%, Critical 90%)
  const memRaw = calculateRawMetricRisk(m.memory, { normal: 55, warning: 80, critical: 92 });
  const memFactor: RiskFactor = {
    factor: 'Memory Pressure',
    weight: w.memory,
    rawScore: Math.round(memRaw),
    weightedScore: Math.round((memRaw * w.memory) / totalWeight),
    explanation:
      m.memory > 80
        ? `Heap utilization (${Math.round(m.memory)}%) risks garbage collection pauses or OOM.`
        : `Memory consumption (${Math.round(m.memory)}%) stable.`,
  };

  // 3. Latency Score (Normal < 40ms, Warning 150ms, Critical 600ms)
  const latThreshold = service.type === 'database' ? 50 : service.type === 'gateway' ? 60 : 120;
  const latRaw = calculateRawMetricRisk(m.latency, {
    normal: latThreshold,
    warning: latThreshold * 3,
    critical: latThreshold * 8,
  });
  const latFactor: RiskFactor = {
    factor: 'Latency Degradation',
    weight: w.latency,
    rawScore: Math.round(latRaw),
    weightedScore: Math.round((latRaw * w.latency) / totalWeight),
    explanation:
      m.latency > latThreshold * 2
        ? `Response time (${Math.round(m.latency)}ms) exceeds SLA baseline.`
        : `Roundtrip latency (${Math.round(m.latency)}ms) within expected bounds.`,
  };

  // 4. Error Rate Score (Normal < 0.5%, Warning 2.5%, Critical 8%)
  const errRaw = calculateRawMetricRisk(m.errorRate, { normal: 0.5, warning: 2.5, critical: 8.0 });
  const errFactor: RiskFactor = {
    factor: 'Error Rate Anomalies',
    weight: w.errorRate,
    rawScore: Math.round(errRaw),
    weightedScore: Math.round((errRaw * w.errorRate) / totalWeight),
    explanation:
      m.errorRate > 2.0
        ? `HTTP 5xx / RPC failure rate (${m.errorRate.toFixed(2)}%) triggering circuit breach alert.`
        : `Error rate (${m.errorRate.toFixed(2)}%) nominal.`,
  };

  // 5. Dependency Propagation Penalty (Inspect downstream dependencies)
  let dependencyPenaltyRaw = 0;
  const unhealthyDeps: string[] = [];
  service.dependencies.forEach((depId) => {
    const depService = allServices.find((s) => s.id === depId);
    if (depService) {
      if (depService.riskScore >= 70 || depService.status === 'critical' || depService.status === 'down') {
        dependencyPenaltyRaw += 75;
        unhealthyDeps.push(`${depService.name} (Critical)`);
      } else if (depService.riskScore >= 45 || depService.status === 'warning') {
        dependencyPenaltyRaw += 35;
        unhealthyDeps.push(`${depService.name} (Degraded)`);
      }
    }
  });

  const cappedDepRaw = Math.min(100, dependencyPenaltyRaw);
  const depFactor: RiskFactor = {
    factor: 'Dependency Health Cascade',
    weight: w.dependencies,
    rawScore: Math.round(cappedDepRaw),
    weightedScore: Math.round((cappedDepRaw * w.dependencies) / totalWeight),
    explanation:
      unhealthyDeps.length > 0
        ? `Unhealthy downstream services (${unhealthyDeps.join(', ')}) propagate backpressure.`
        : 'All downstream dependencies are operating with nominal health.',
  };

  const riskFactors = [cpuFactor, memFactor, latFactor, errFactor, depFactor];
  const combinedScore = Math.min(
    100,
    Math.round(riskFactors.reduce((acc, f) => acc + f.weightedScore, 0))
  );

  // Determine Risk Tier
  let riskTier: RiskTier = 'Low';
  if (combinedScore > settings.thresholds.highMax) {
    riskTier = 'Critical';
  } else if (combinedScore > settings.thresholds.moderateMax) {
    riskTier = 'High';
  } else if (combinedScore > settings.thresholds.lowMax) {
    riskTier = 'Moderate';
  }

  // Determine Service Status
  let status: ServiceStatus = 'healthy';
  if (m.errorRate >= 60 || m.cpu >= 99) {
    status = 'down';
  } else if (riskTier === 'Critical' || m.errorRate >= 10 || m.latency >= 1000) {
    status = 'critical';
  } else if (riskTier === 'High' || riskTier === 'Moderate' || m.errorRate >= 2 || m.cpu >= 75) {
    status = 'warning';
  }

  // Predicted Failure Window
  let predictedFailureWindow = 'Stable (> 24h)';
  let evidenceLevel: 'High heuristic match' | 'Moderate telemetry drift' | 'Nominal baseline' =
    'Nominal baseline';

  if (riskTier === 'Critical') {
    predictedFailureWindow = '< 3 min (Critical degradation imminent)';
    evidenceLevel = 'High heuristic match';
  } else if (riskTier === 'High') {
    predictedFailureWindow = '5 - 15 min (Accelerating drift)';
    evidenceLevel = 'High heuristic match';
  } else if (riskTier === 'Moderate') {
    predictedFailureWindow = '25 - 60 min (Potential queue build-up)';
    evidenceLevel = 'Moderate telemetry drift';
  }

  return {
    riskScore: combinedScore,
    riskTier,
    riskFactors,
    status,
    predictedFailureWindow,
    evidenceLevel,
  };
}

/**
 * Propagate cascading failures through the dependency graph
 * If downstream service is slow/failing, upstream caller metrics suffer
 */
export function propagateCascadingFailures(services: Service[]): Service[] {
  // Clone to avoid in-place race mutation
  const updated = services.map((s) => ({
    ...s,
    metrics: { ...s.metrics },
  }));

  // Map for fast lookup
  const serviceMap = new Map<ServiceId, Service>();
  updated.forEach((s) => serviceMap.set(s.id, s));

  // 1. If postgres-db is degraded, cascade to payment-service and inventory-service
  const db = serviceMap.get('postgres-db');
  if (db && (db.metrics.latency > 250 || db.metrics.cpu > 75 || db.metrics.errorRate > 5)) {
    const payment = serviceMap.get('payment-service');
    const inventory = serviceMap.get('inventory-service');

    if (payment) {
      payment.metrics.latency = Math.max(
        payment.metrics.latency,
        Math.round(62 + db.metrics.latency * 0.45)
      );
      if (db.metrics.errorRate > 5) {
        payment.metrics.errorRate = Math.min(
          95,
          Math.max(payment.metrics.errorRate, db.metrics.errorRate * 0.8)
        );
      }
      payment.metrics.cpu = Math.min(96, Math.max(payment.metrics.cpu, payment.metrics.cpu + 8));
    }

    if (inventory) {
      inventory.metrics.latency = Math.max(
        inventory.metrics.latency,
        Math.round(32 + db.metrics.latency * 0.3)
      );
      if (db.metrics.errorRate > 10) {
        inventory.metrics.errorRate = Math.min(
          90,
          Math.max(inventory.metrics.errorRate, db.metrics.errorRate * 0.5)
        );
      }
    }
  }

  // 2. If payment-service or inventory-service or cache is degraded, cascade to order-service
  const order = serviceMap.get('order-service');
  const payment = serviceMap.get('payment-service');
  const inventory = serviceMap.get('inventory-service');
  const cache = serviceMap.get('cache-service');

  if (order) {
    let extraLatency = 0;
    let extraError = 0;

    if (payment && payment.metrics.latency > 150) {
      extraLatency += Math.round((payment.metrics.latency - 60) * 0.6);
      extraError += payment.metrics.errorRate * 0.7;
    }
    if (inventory && inventory.metrics.latency > 100) {
      extraLatency += Math.round((inventory.metrics.latency - 30) * 0.3);
      extraError += inventory.metrics.errorRate * 0.3;
    }
    if (cache && cache.metrics.errorRate > 20) {
      extraLatency += 80;
      extraError += 4.5;
    }

    if (extraLatency > 0) {
      order.metrics.latency = Math.max(order.metrics.latency, 48 + extraLatency);
      order.metrics.errorRate = Math.min(95, Math.max(order.metrics.errorRate, extraError));
      order.metrics.cpu = Math.min(98, Math.max(order.metrics.cpu, 35 + extraLatency * 0.05));
    }
  }

  // 3. If order-service or auth-service is degraded, cascade to api-gateway
  const gateway = serviceMap.get('api-gateway');
  const auth = serviceMap.get('auth-service');

  if (gateway) {
    let edgeLatency = 24;
    let edgeErrors = 0.1;

    if (order && order.metrics.latency > 150) {
      edgeLatency += Math.round((order.metrics.latency - 50) * 0.4);
      edgeErrors += order.metrics.errorRate * 0.5;
    }
    if (auth && (auth.metrics.errorRate > 5 || auth.metrics.latency > 150)) {
      edgeLatency += Math.round(auth.metrics.latency * 0.5);
      edgeErrors += auth.metrics.errorRate * 0.8;
    }

    gateway.metrics.latency = Math.max(gateway.metrics.latency, edgeLatency);
    gateway.metrics.errorRate = Math.min(98, Math.max(gateway.metrics.errorRate, edgeErrors));
  }

  // 4. Cache outage triggers direct DB stampede
  if (cache && (cache.metrics.errorRate > 50 || cache.status === 'down')) {
    if (db) {
      db.metrics.cpu = Math.min(98, Math.max(db.metrics.cpu, db.metrics.cpu + 25));
      db.metrics.latency = Math.max(db.metrics.latency, db.metrics.latency + 180);
    }
  }

  return updated;
}

/**
 * Simulate one normal clock tick with subtle realistic jitter for healthy nodes
 */
export function applyNormalJitter(services: Service[]): Service[] {
  return services.map((s) => {
    // If service has been manually broken or is in crisis, don't jitter back to nominal
    const isCrisis = s.riskScore > 65 || s.status === 'critical' || s.status === 'down';
    if (isCrisis) {
      // Slight variation within crisis range
      const jitter = (Math.random() - 0.5) * 2;
      return {
        ...s,
        metrics: {
          ...s.metrics,
          cpu: Math.max(10, Math.min(100, Math.round(s.metrics.cpu + jitter))),
          latency: Math.max(5, Math.round(s.metrics.latency + jitter * 3)),
        },
      };
    }

    // Normal healthy drift
    const cpuDelta = (Math.random() - 0.5) * 3;
    const memDelta = (Math.random() - 0.5) * 1.5;
    const latDelta = (Math.random() - 0.5) * 4;
    const errDelta = (Math.random() - 0.5) * 0.04;
    const tputDelta = (Math.random() - 0.5) * 30;

    const baseMinMax = getNominalBounds(s.id);

    return {
      ...s,
      metrics: {
        cpu: Math.max(baseMinMax.cpuMin, Math.min(baseMinMax.cpuMax, Math.round(s.metrics.cpu + cpuDelta))),
        memory: Math.max(baseMinMax.memMin, Math.min(baseMinMax.memMax, Math.round(s.metrics.memory + memDelta))),
        latency: Math.max(baseMinMax.latMin, Math.min(baseMinMax.latMax, Math.round(s.metrics.latency + latDelta))),
        errorRate: Math.max(0.01, Math.min(0.5, Number((s.metrics.errorRate + errDelta).toFixed(2)))),
        throughput: Math.max(50, Math.round(s.metrics.throughput + tputDelta)),
      },
    };
  });
}

function getNominalBounds(id: ServiceId) {
  switch (id) {
    case 'api-gateway':
      return { cpuMin: 20, cpuMax: 38, memMin: 32, memMax: 48, latMin: 18, latMax: 35 };
    case 'auth-service':
      return { cpuMin: 18, cpuMax: 30, memMin: 28, memMax: 42, latMin: 14, latMax: 26 };
    case 'order-service':
      return { cpuMin: 25, cpuMax: 45, memMin: 38, memMax: 54, latMin: 38, latMax: 65 };
    case 'payment-service':
      return { cpuMin: 22, cpuMax: 40, memMin: 34, memMax: 48, latMin: 45, latMax: 78 };
    case 'inventory-service':
      return { cpuMin: 20, cpuMax: 36, memMin: 30, memMax: 44, latMin: 24, latMax: 44 };
    case 'notification-service':
      return { cpuMin: 12, cpuMax: 26, memMin: 24, memMax: 38, latMin: 10, latMax: 22 };
    case 'postgres-db':
      return { cpuMin: 28, cpuMax: 48, memMin: 45, memMax: 62, latMin: 10, latMax: 24 };
    case 'cache-service':
      return { cpuMin: 14, cpuMax: 28, memMin: 38, memMax: 52, latMin: 2, latMax: 6 };
    default:
      return { cpuMin: 20, cpuMax: 40, memMin: 30, memMax: 50, latMin: 20, latMax: 50 };
  }
}

/**
 * Calculates overall system health score (0 - 100)
 */
export function calculateSystemHealthScore(services: Service[]): number {
  if (services.length === 0) return 100;
  const avgRisk = services.reduce((acc, s) => acc + s.riskScore, 0) / services.length;
  // Weight down if any critical service is down/critical
  const worstRisk = Math.max(...services.map((s) => s.riskScore));
  const blendedRisk = avgRisk * 0.5 + worstRisk * 0.5;
  return Math.max(0, Math.min(100, Math.round(100 - blendedRisk)));
}

/**
 * Generates an active incident object when an anomaly is observed
 */
export function detectAndGenerateIncident(services: Service[]): Incident | null {
  const atRisk = [...services]
    .filter((s) => s.riskScore >= 60 || s.status === 'critical' || s.status === 'down')
    .sort((a, b) => b.riskScore - a.riskScore);

  if (atRisk.length === 0) return null;

  const trigger = atRisk[0];
  const severity =
    trigger.riskScore >= 80 || trigger.status === 'down'
      ? 'P1 - Critical'
      : trigger.riskScore >= 65
      ? 'P2 - High'
      : 'P3 - Moderate';

  const cascadingPath = [trigger.name, ...trigger.dependents.map((d) => d)];

  return {
    id: `INC-${Date.now().toString().slice(-6)}`,
    title: `Cascading Degradation Originating in ${trigger.name}`,
    timestamp: Date.now(),
    severity,
    triggeringServiceId: trigger.id,
    triggeringServiceName: trigger.name,
    initialAnomaly: `Telemetry alert: ${trigger.name} CPU @ ${trigger.metrics.cpu}%, Latency @ ${trigger.metrics.latency}ms, Error Rate @ ${trigger.metrics.errorRate}%`,
    suspectedRootCause: `${trigger.name} resource saturation causing synchronous backpressure to caller services.`,
    evidence: [
      `${trigger.name} p99 response time surged to ${trigger.metrics.latency}ms`,
      `CPU utilization reached ${trigger.metrics.cpu}%`,
      `Service error rate rose to ${trigger.metrics.errorRate}%`,
      `Downstream callers observed connection queue build-up`,
    ],
    cascadingPath,
    recommendedInvestigation: [
      `Check slow query logs and active transaction locks on ${trigger.name}`,
      `Review thread pool metrics and heap utilization`,
      `Verify network connectivity and connection pool exhaustion`,
    ],
    alternativeHypotheses: [
      `Intermittent transit network latency spike`,
      `Unannounced batch job or analytics query burst`,
    ],
    status: 'Active',
    isSimulated: true,
  };
}

/**
 * Applies a simulated recovery action and updates service state
 */
export function applySimulatedRecovery(
  services: Service[],
  recommendation: RecoveryRecommendation
): { updatedServices: Service[]; feedbackMessage: string } {
  const updated = services.map((s) => {
    if (s.id === recommendation.targetServiceId) {
      // Heal the target service
      const bounds = getNominalBounds(s.id);
      return {
        ...s,
        status: 'healthy' as ServiceStatus,
        metrics: {
          ...s.metrics,
          cpu: Math.round(bounds.cpuMin + (bounds.cpuMax - bounds.cpuMin) * 0.4),
          memory: Math.round(bounds.memMin + (bounds.memMax - bounds.memMin) * 0.3),
          latency: Math.round(bounds.latMin + 8),
          errorRate: 0.08,
        },
      };
    }
    return { ...s };
  });

  // Re-run cascade propagation so caller services recover too
  const healed = propagateCascadingFailures(updated);

  return {
    updatedServices: healed,
    feedbackMessage: `Simulated action "${recommendation.suggestedAction}" executed successfully. Backpressure relieved and telemetry returning to nominal baseline.`,
  };
}
