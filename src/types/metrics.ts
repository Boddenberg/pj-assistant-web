// ─── Metrics Types ───────────────────────────────────────────────────
// Models for /v1/chat/metrics endpoint (BFA backend).

// ─── Agent Performance ──────────────────────────────────────────────
export interface AgentPerformance {
  readonly avg_latency_ms: number
  readonly p95_latency_ms: number
  readonly avg_bfa_latency_ms: number
  readonly p95_bfa_latency_ms: number
  readonly avg_tokens_per_request: number
  readonly total_tokens: number
  readonly estimated_cost_usd: number
  readonly total_requests: number
  readonly error_rate_pct: number
  readonly error_count: number
  readonly success_count: number
  readonly cache_hit_rate_pct: number
}

// ─── RAG Quality ────────────────────────────────────────────────────
export interface RagQuality {
  readonly score_pct: number
  readonly label: string
  readonly avg_faithfulness: number
  readonly avg_context_relevance: number
}

// ─── LLM Judge ──────────────────────────────────────────────────────
export interface CriterionBreakdown {
  readonly criterion: string
  readonly avg_score: number
  readonly max_score: number
  readonly avg_pct: number
}

export interface Improvement {
  readonly suggestion: string
  readonly count: number
}

export interface LlmJudge {
  readonly total_evaluations: number
  readonly avg_overall_score: number
  readonly pass_rate_pct: number
  readonly pass_count: number
  readonly fail_count: number
  readonly warning_count: number
  readonly avg_turns_per_conversation: number
  readonly avg_eval_duration_ms: number
  readonly total_eval_cost_usd: number
  readonly criteria_breakdown: CriterionBreakdown[]
  readonly top_improvements: Improvement[]
}

// ─── Full Metrics Response ──────────────────────────────────────────
export interface ChatMetrics {
  readonly agent_performance: AgentPerformance
  readonly rag_quality: RagQuality
  readonly llm_judge: LlmJudge
}

// ─── Health (unchanged) ─────────────────────────────────────────────
export interface HealthStatus {
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly services: ServiceHealth[]
}

export interface ServiceHealth {
  readonly name: string
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly latencyMs: number
  readonly uptimePercent: number
  readonly lastChecked: string
}
