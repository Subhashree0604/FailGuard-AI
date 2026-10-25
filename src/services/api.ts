import { Incident, RecoveryRecommendation, Service } from '../types';

export interface ApiStatus {
  status: string;
  aiEnabled: boolean;
  model: string;
  version: string;
}

export async function fetchSystemApiStatus(): Promise<ApiStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    return {
      status: 'offline',
      aiEnabled: false,
      model: 'deterministic-rule-engine-fallback',
      version: '1.0.0',
    };
  }
}

export async function analyzeIncidentWithAi(
  incident: Incident,
  services: Service[],
  topology: any
): Promise<{ success: boolean; mode: 'gemini' | 'fallback'; analysis: any; warning?: string }> {
  try {
    const res = await fetch('/api/gemini/analyze-incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident, services, topology }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('[FailGuard API] AI Analysis request failed, using client fallback', error);
    return {
      success: true,
      mode: 'fallback',
      analysis: {
        executiveSummary: `FailGuard detected critical degradation originating in ${incident.triggeringServiceName}. High resource pressure is causing upstream request queueing and latency amplification across dependent tiers.`,
        suspectedRootCause: `${incident.triggeringServiceName} resource exhaustion causing synchronous worker thread starvation.`,
        cascadingPathExplanation: `${incident.triggeringServiceName} -> Cascaded to caller services -> Reached API Gateway resulting in elevated 5xx error rates.`,
        telemetryEvidence: incident.evidence || ['CPU utilization exceeded 85%', 'p99 Latency spiked > 500ms'],
        investigationSteps: [
          'Inspect connection pool utilization and lock contention',
          'Review recent configuration and traffic spikes',
          'Check circuit breaker trip states',
        ],
        alternativeHypotheses: ['Transient cross-datacenter network jitter', 'Unannounced traffic surge'],
        confidenceScore: 82,
      },
      warning: 'Server request failed; client deterministic SRE engine active.',
    };
  }
}

export async function fetchAiRecommendations(
  criticalServices: Service[],
  systemHealthScore: number,
  incident?: Incident | null
): Promise<{ success: boolean; mode: 'gemini' | 'fallback'; recommendations: RecoveryRecommendation[] }> {
  try {
    const res = await fetch('/api/gemini/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criticalServices, systemHealthScore, incident }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('[FailGuard API] Recommendations fetch failed, using fallback', error);
    return {
      success: true,
      mode: 'fallback',
      recommendations: [
        {
          id: 'rec-fallback-1',
          title: 'Activate Circuit Breaker',
          targetServiceId: criticalServices[0]?.id || 'order-service',
          targetServiceName: criticalServices[0]?.name || 'Order Service',
          actionType: 'circuit_breaker',
          suggestedAction: `Enable Circuit Breaker on ${criticalServices[0]?.name || 'Order Service'}`,
          reason: 'Prevents thread starvation from propagating upstream to API Gateway.',
          supportingMetrics: 'Latency > 500ms, Error rate elevated',
          expectedBenefit: 'Isolates failing component and stabilizes client response times.',
          potentialRisk: 'Transient fallback responses served to users during recovery.',
          priority: 'P1 - Immediate',
          requiresApproval: false,
          applied: false,
          timestamp: Date.now(),
        },
      ],
    };
  }
}

export async function askAiCopilot(
  question: string,
  systemContext: any
): Promise<{ success: boolean; mode: 'gemini' | 'fallback'; answer: string }> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, systemContext }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('[FailGuard API] Chat Copilot request failed, using client fallback', error);
    return {
      success: true,
      mode: 'fallback',
      answer: `**FailGuard Telemetry Analysis** (Fallback Mode)\n\nSystem Health Score is currently at **${systemContext.healthScore}/100** with **${systemContext.atRiskCount || 0} services at risk**.\n\n- Primary focus: Check highest latency and error rates in the Monitoring tab.\n- Recommendation: Enable circuit breakers or rate limit at the API Gateway to prevent cascading propagation.`,
    };
  }
}
