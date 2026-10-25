import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google Gemini API client if GEMINI_API_KEY is available
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[FailGuard AI] Gemini AI initialized successfully with gemini-3.8-flash.');
  } catch (err) {
    console.error('[FailGuard AI] Failed to initialize Gemini API:', err);
  }
} else {
  console.log('[FailGuard AI] GEMINI_API_KEY not configured or placeholder detected. Operating in Rule-Based Deterministic Fallback Mode.');
}

// API Health / Status Endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiEnabled: !!ai,
    model: ai ? 'gemini-3.8-flash' : 'deterministic-rule-engine-fallback',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Gemini Incident Analysis Endpoint
app.post('/api/gemini/analyze-incident', async (req: Request, res: Response) => {
  const { incident, services, topology } = req.body;

  if (!ai) {
    // Return high quality deterministic SRE analysis
    return res.json({
      success: true,
      mode: 'fallback',
      analysis: generateRuleBasedIncidentAnalysis(incident, services),
    });
  }

  try {
    const prompt = `You are FailGuard AI, a Principal Site Reliability Engineer (SRE) and AIOps diagnostic specialist.
Analyze this simulated distributed systems incident and telemetry snapshot.
DO NOT fabricate metrics or invent services not present in the data. Clearly ground your analysis in the telemetry provided.

Incident Context:
${JSON.stringify(incident, null, 2)}

Service Telemetry Snapshot:
${JSON.stringify(services, null, 2)}

Topology Connections:
${JSON.stringify(topology, null, 2)}

Format your response strictly as JSON with this schema:
{
  "executiveSummary": "2-3 sentences summarizing the failure and overall risk to operations.",
  "suspectedRootCause": "Clear explanation of the originating trigger and why it failed.",
  "cascadingPathExplanation": "Detailed step-by-step propagation narrative showing how the fault cascades from the root cause to downstream dependencies.",
  "telemetryEvidence": ["Specific observed metric anomaly with numbers (e.g. postgres-db CPU at 94% with 850ms latency)"],
  "investigationSteps": ["Actionable diagnostic step for on-call engineers"],
  "alternativeHypotheses": ["Secondary or alternative contributing factor if telemetry is noisy"],
  "confidenceScore": 88
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return res.json({
      success: true,
      mode: 'gemini',
      analysis: parsed,
    });
  } catch (error: any) {
    console.error('[FailGuard AI] Gemini Analysis Error:', error);
    return res.json({
      success: true,
      mode: 'fallback',
      warning: 'Gemini API call timed out or failed; falling back to deterministic SRE engine.',
      analysis: generateRuleBasedIncidentAnalysis(incident, services),
    });
  }
});

// Gemini Recovery Recommendations Endpoint
app.post('/api/gemini/recommendations', async (req: Request, res: Response) => {
  const { criticalServices, systemHealthScore, incident } = req.body;

  if (!ai) {
    return res.json({
      success: true,
      mode: 'fallback',
      recommendations: generateRuleBasedRecommendations(criticalServices),
    });
  }

  try {
    const prompt = `You are FailGuard AI, an automated SRE recovery specialist.
Based on the current at-risk services and incident state, provide 3 to 5 targeted, prioritized recovery recommendations.
Advisory only: do not claim to execute live production commands.

Critical Services:
${JSON.stringify(criticalServices, null, 2)}

Current Incident Context:
${JSON.stringify(incident, null, 2)}

System Health Score: ${systemHealthScore}/100

Format your response strictly as JSON array with objects matching:
[
  {
    "id": "rec-1",
    "targetServiceId": "service-id",
    "suggestedAction": "Specific mitigation (e.g., Enable Circuit Breaker on Order Service -> Payment Service)",
    "reason": "Why this action halts cascading degradation",
    "supportingMetrics": "Observed trigger metric (e.g., 42% 504 Gateway Timeouts, 1200ms DB latency)",
    "expectedBenefit": "Predicted metric recovery (e.g., Prevents thread exhaustion in API Gateway, drops error rate to <2%)",
    "potentialRisk": "Trade-offs or user impacts (e.g., Temporary degraded checkout experience with retry queue)",
    "priority": "P1 - Immediate",
    "requiresApproval": true
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    const parsed = JSON.parse(text);

    return res.json({
      success: true,
      mode: 'gemini',
      recommendations: parsed,
    });
  } catch (error: any) {
    console.error('[FailGuard AI] Gemini Recommendations Error:', error);
    return res.json({
      success: true,
      mode: 'fallback',
      recommendations: generateRuleBasedRecommendations(criticalServices),
    });
  }
});

// Gemini Interactive SRE Copilot Chat Endpoint
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  const { question, systemContext } = req.body;

  if (!ai) {
    return res.json({
      success: true,
      mode: 'fallback',
      answer: generateRuleBasedChatAnswer(question, systemContext),
    });
  }

  try {
    const prompt = `You are FailGuard AI SRE Copilot, a calm, analytical, and highly technical Site Reliability Engineering advisor.
Answer the user's question accurately using ONLY the simulated system context below.
If the data is insufficient to answer definitively, state what additional metrics would be required.
Do not pretend to monitor a real production data center.
Keep answers structured with crisp technical clarity (using bullet points and bold highlights).

Current Simulated System State:
- Health Score: ${systemContext.healthScore}/100
- Risk Level: ${systemContext.riskLevel}
- Total Services: ${systemContext.services?.length || 8}
- Active Incidents: ${JSON.stringify(systemContext.recentIncidents || [])}
- Services Snapshot:
${JSON.stringify(
  (systemContext.services || []).map((s: any) => ({
    name: s.name,
    status: s.status,
    risk: s.riskScore,
    cpu: `${s.metrics?.cpu}%`,
    latency: `${s.metrics?.latency}ms`,
    errors: `${s.metrics?.errorRate}%`,
    deps: s.dependencies,
  })),
  null,
  2
)}

User Question: "${question}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return res.json({
      success: true,
      mode: 'gemini',
      answer: response.text || 'No response generated from Gemini AI.',
    });
  } catch (error: any) {
    console.error('[FailGuard AI] Gemini Chat Error:', error);
    return res.json({
      success: true,
      mode: 'fallback',
      answer: generateRuleBasedChatAnswer(question, systemContext),
    });
  }
});

// Deterministic SRE Fallback Engines
function generateRuleBasedIncidentAnalysis(incident: any, services: any[]) {
  const triggerService = services?.find(
    (s) => s.id === incident?.triggeringServiceId || s.name === incident?.triggeringServiceName
  ) || services?.find((s) => s.status === 'critical' || s.riskScore > 75) || services?.[0];

  const highestLatency = [...(services || [])].sort((a, b) => b.metrics.latency - a.metrics.latency)[0];
  const highestCpu = [...(services || [])].sort((a, b) => b.metrics.cpu - a.metrics.cpu)[0];

  return {
    executiveSummary: `FailGuard detected critical degradation originating in ${triggerService?.name || 'upstream cluster'}. High resource pressure is causing upstream request queueing and latency amplification across dependent tiers.`,
    suspectedRootCause: triggerService
      ? `${triggerService.name} experienced metric saturation (${triggerService.metrics.cpu}% CPU, ${triggerService.metrics.latency}ms latency), causing synchronous thread pool exhaustion in calling services.`
      : 'Resource contention and connection starvation in core database tier.',
    cascadingPathExplanation: `${triggerService?.name || 'Primary service'} -> Cascaded to caller services (${triggerService?.dependents?.join(', ') || 'Order Service, Payment Service'}) -> Reached edge API Gateway resulting in elevated 5xx error rates.`,
    telemetryEvidence: [
      `${triggerService?.name || 'Trigger'} CPU utilization reached ${triggerService?.metrics.cpu || 88}% (threshold: 80%)`,
      `${highestLatency?.name || 'Downstream'} p99 latency surged to ${highestLatency?.metrics.latency || 450}ms`,
      `Downstream error rate amplified to ${triggerService?.metrics.errorRate || 6.2}%`,
      `Inter-service connection pool wait times exceeded SLA threshold`,
    ],
    investigationSteps: [
      `Inspect slow queries and locked connections on ${triggerService?.name || 'primary backend'}`,
      `Verify if recent deployment or traffic spike coincided with queue depth increase`,
      `Check circuit breaker trip status between API Gateway and ${triggerService?.name || 'order-service'}`,
      `Review garbage collection pauses and worker thread pool saturation`,
    ],
    alternativeHypotheses: [
      'Transient network packet loss or inter-zone routing latency spike',
      'Sudden burst in un-cached synthetic traffic or cache stampede',
    ],
    confidenceScore: 84,
  };
}

function generateRuleBasedRecommendations(criticalServices: any[]) {
  const recs = [];
  const primary = criticalServices?.[0];

  if (primary?.id === 'postgres-db' || primary?.name?.includes('Database')) {
    recs.push({
      id: 'rec-pg-1',
      targetServiceId: 'postgres-db',
      suggestedAction: 'Scale Up Connection Pool & Terminate Idle Locks',
      reason: 'PostgreSQL thread starvation is blocking synchronous transactions from Payment and Inventory services.',
      supportingMetrics: `DB CPU at ${primary.metrics.cpu}%, Latency at ${primary.metrics.latency}ms`,
      expectedBenefit: 'Reduces queue wait time by ~75% and unblocks Order Service checkout requests.',
      potentialRisk: 'Brief 2-second connection reset during pool re-initialization.',
      priority: 'P1 - Immediate',
      requiresApproval: true,
      applied: false,
    });
    recs.push({
      id: 'rec-order-1',
      targetServiceId: 'order-service',
      suggestedAction: 'Activate Circuit Breaker with Fallback Queue',
      reason: 'Isolates the database from further request overload and responds gracefully to clients.',
      supportingMetrics: 'Error rate at 18.4% on Payment & Order pipelines',
      expectedBenefit: 'Immediately stabilizes API Gateway latency back to < 80ms.',
      potentialRisk: 'Transactions queued for asynchronous background processing.',
      priority: 'P1 - Immediate',
      requiresApproval: false,
      applied: false,
    });
  } else if (primary?.id === 'payment-service' || primary?.name?.includes('Payment')) {
    recs.push({
      id: 'rec-pay-1',
      targetServiceId: 'payment-service',
      suggestedAction: 'Enable Exponential Backoff Retries & Shed Load',
      reason: 'Payment service gateway timeouts are causing thread pile-up in Order Service.',
      supportingMetrics: `Payment latency ${primary.metrics.latency}ms, Error rate ${primary.metrics.errorRate}%`,
      expectedBenefit: 'Stops cascading worker pool exhaustion in Order Service.',
      potentialRisk: 'Non-critical payment webhooks delayed up to 60 seconds.',
      priority: 'P1 - Immediate',
      requiresApproval: false,
      applied: false,
    });
  } else {
    recs.push({
      id: 'rec-gen-1',
      targetServiceId: primary?.id || 'api-gateway',
      suggestedAction: 'Apply Token-Bucket Rate Limiting at API Gateway',
      reason: 'Prevents total system saturation by throttling non-essential upstream requests by 30%.',
      supportingMetrics: 'System-wide error rate > 5%, Edge latency elevated',
      expectedBenefit: 'Recovers degraded services by dropping ingress load to sustainable levels.',
      potentialRisk: 'Some non-essential guest requests will receive HTTP 429 status codes.',
      priority: 'P1 - Immediate',
      requiresApproval: false,
      applied: false,
    });
  }

  recs.push({
    id: 'rec-cache-1',
    targetServiceId: 'cache-service',
    suggestedAction: 'Pre-warm Cache & Enable Read Replica Fallback',
    reason: 'Offloads read pressure from database during heavy load spikes.',
    supportingMetrics: 'Cache hit ratio dropped below 70%',
    expectedBenefit: 'Reduces database read IOPS by 40%.',
    potentialRisk: 'Potential 5-minute read staleness for volatile inventory counters.',
    priority: 'P2 - High',
    requiresApproval: false,
    applied: false,
  });

  return recs;
}

function generateRuleBasedChatAnswer(question: string, context: any) {
  const q = question.toLowerCase();
  const services = context.services || [];
  const atRisk = services.filter((s: any) => s.riskScore > 50).sort((a: any, b: any) => b.riskScore - a.riskScore);

  if (q.includes('fail next') || q.includes('most likely')) {
    if (atRisk.length > 0) {
      const target = atRisk[0];
      return `**Most Likely Next Failure: ${target.name}**\n\n- **Current Risk Score:** ${target.riskScore}/100 (${target.status.toUpperCase()})\n- **Observed Metrics:** CPU ${target.metrics.cpu}%, Latency ${target.metrics.latency}ms, Error Rate ${target.metrics.errorRate}%\n- **Cascade Risk:** Downstream dependents **${target.dependents?.join(', ') || 'API Gateway'}** are already observing response latency propagation.\n- **Recommended Action:** Inspect thread pool and apply circuit breaking immediately.`;
    }
    return `Currently all 8 monitored services are operating within safe heuristic thresholds (System Health: ${context.healthScore}/100). No imminent failure is predicted.`;
  }

  if (q.includes('database') || q.includes('postgres')) {
    const db = services.find((s: any) => s.id === 'postgres-db') || { metrics: { cpu: 85, latency: 450 } };
    return `**Impact Analysis: PostgreSQL Database Failure**\n\n- **Role:** Central state store for Payment Service and Inventory Service.\n- **Cascading Chain:** If the database becomes unresponsive, both **Payment Service** and **Inventory Service** will queue transactions and exhaust thread pools.\n- **Blast Radius:** Next, **Order Service** will fail with HTTP 504 timeouts, propagating to **API Gateway**.\n- **Mitigation:** Enable read replicas, expand DB connection pool, and ensure Cache Service handles catalog queries.`;
  }

  if (q.includes('payment')) {
    const pay = services.find((s: any) => s.id === 'payment-service') || { riskScore: 70, metrics: { latency: 320 } };
    return `**Payment Service Health & Risk Breakdown**\n\n- **Risk Score:** ${pay.riskScore}/100\n- **Key Factors:** Upstream dependencies on PostgreSQL database and checkout checkout throughput.\n- **Blast Radius:** Order Service relies directly on synchronous payment verification. A payment stall causes instant order queue backups.`;
  }

  if (q.includes('reduce') || q.includes('mitigate') || q.includes('prevent')) {
    return `**Top Strategies to Prevent Cascading Failures:**\n\n1. **Implement Circuit Breakers:** Wrap downstream RPC calls with Hystrix/Resilience4j style circuit breakers so callers fail fast instead of hanging.\n2. **Apply Bulkheading:** Segregate thread and connection pools so a slow Payment call cannot consume the entire Order Service thread pool.\n3. **Exponential Backoff with Jitter:** Prevent thundering herd retries against already struggling databases.\n4. **Aggressive Caching:** Serve stale catalog data rather than dropping client requests.`;
  }

  return `**FailGuard Observability Analysis**\n\n- Current System Health Score: **${context.healthScore}/100**\n- At-Risk Services: **${atRisk.map((s: any) => s.name).join(', ') || 'None (all healthy)'}**\n- Primary Bottleneck: Review PostgreSQL database IOPS and inter-service latency in the Dependency Graph view to trace propagation paths.`;
}

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FailGuard AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FailGuard AI] Failed to start server:', err);
});
