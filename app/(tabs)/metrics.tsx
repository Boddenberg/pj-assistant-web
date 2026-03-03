// ─── Metrics Tab Screen ──────────────────────────────────────────────
// Dashboard completo: Agent Performance, RAG Quality, LLM Judge.

import React from 'react'
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { useHealthStatus, useChatMetrics } from '@/hooks'
import {
  HealthCard, MetricTile, SectionHeader,
  RagQualityCard, CriteriaBar, ImprovementCard,
} from '@/components/metrics'
import { Card } from '@/components/ui'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

export default function MetricsScreen() {
  const health = useHealthStatus()
  const metrics = useChatMetrics()

  const isLoading = health.isLoading || metrics.isLoading
  const isError = health.isError || metrics.isError
  const isRefreshing = health.isRefetching || metrics.isRefetching

  const handleRefresh = () => {
    health.refetch()
    metrics.refetch()
  }

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingCircle}>
          <ActivityIndicator size="large" color={colors.itauOrange} />
        </View>
        <Text style={styles.loadingText}>Carregando métricas…</Text>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCircle}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.error} />
        </View>
        <Text style={styles.errorTitle}>Sem conexão com o BFA</Text>
        <Text style={styles.errorBody}>
          Verifique se o backend está rodando{'\n'}e acessível
        </Text>
      </View>
    )
  }

  const healthData = health.data
  const m = metrics.data

  const overallStatus = healthData?.status ?? 'healthy'
  const statusConfig = {
    healthy: { color: colors.success, bg: colors.successLight, label: 'Todos os serviços operacionais', icon: 'checkmark-circle' as const },
    degraded: { color: colors.warning, bg: colors.warningLight, label: 'Serviços com degradação', icon: 'warning' as const },
    unhealthy: { color: colors.error, bg: colors.errorLight, label: 'Serviços com falha', icon: 'alert-circle' as const },
  }
  const sc = statusConfig[overallStatus]

  // LLM Judge helpers
  const judge = m?.llm_judge
  const judgeScoreColor = judge
    ? judge.avg_overall_score >= 8 ? colors.success
      : judge.avg_overall_score >= 6 ? colors.warning
      : colors.error
    : colors.textMuted

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.itauOrange}
          colors={[colors.itauOrange]}
        />
      }
    >
      {/* ── Status Banner ── */}
      <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
        <Ionicons name={sc.icon} size={18} color={sc.color} />
        <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
      </View>

      {/* ── Saúde dos Serviços ── */}
      <SectionHeader title="Saúde dos Serviços" />
      {healthData?.services.map((service) => (
        <View key={service.name} style={styles.cardWrap}>
          <HealthCard service={service} />
        </View>
      ))}

      {m && (
        <>
          {/* ── Desempenho do Agente ── */}
          <SectionHeader title="Desempenho do Agente" />
          <View style={styles.tileGrid}>
            <MetricTile
              icon="timer-outline"
              label="Latência Média"
              value={m.agent_performance.avg_latency_ms.toFixed(0)}
              unit="ms"
            />
            <MetricTile
              icon="flash-outline"
              label="P95 Latência"
              value={m.agent_performance.p95_latency_ms.toFixed(0)}
              unit="ms"
            />
          </View>
          <View style={styles.tileGrid}>
            <MetricTile
              icon="cloud-outline"
              label="BFA Latência Média"
              value={m.agent_performance.avg_bfa_latency_ms.toFixed(0)}
              unit="ms"
            />
            <MetricTile
              icon="cloud-done-outline"
              label="BFA P95 Latência"
              value={m.agent_performance.p95_bfa_latency_ms.toFixed(0)}
              unit="ms"
            />
          </View>
          <View style={styles.tileGrid}>
            <MetricTile
              icon="chatbubbles-outline"
              label="Total de Requisições"
              value={m.agent_performance.total_requests}
            />
            <MetricTile
              icon="alert-circle-outline"
              label="Taxa de Erro"
              value={m.agent_performance.error_rate_pct.toFixed(2)}
              unit="%"
            />
          </View>
          <View style={styles.tileGrid}>
            <MetricTile
              icon="document-text-outline"
              label="Tokens / Req."
              value={m.agent_performance.avg_tokens_per_request.toFixed(0)}
            />
            <MetricTile
              icon="server-outline"
              label="Tokens Totais"
              value={m.agent_performance.total_tokens.toLocaleString()}
            />
          </View>
          <View style={styles.tileGrid}>
            <MetricTile
              icon="cash-outline"
              label="Custo Estimado"
              value={`$${m.agent_performance.estimated_cost_usd.toFixed(4)}`}
            />
            <MetricTile
              icon="layers-outline"
              label="Acerto de Cache"
              value={m.agent_performance.cache_hit_rate_pct.toFixed(1)}
              unit="%"
            />
          </View>

          {/* ── Success / Error counts ── */}
          <View style={styles.countsRow}>
            <View style={[styles.countPill, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.countText, { color: colors.success }]}>
                {m.agent_performance.success_count} sucesso
              </Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="close-circle" size={14} color={colors.error} />
              <Text style={[styles.countText, { color: colors.error }]}>
                {m.agent_performance.error_count} erro{m.agent_performance.error_count !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* ── Qualidade RAG ── */}
          <SectionHeader title="Qualidade RAG" />
          <RagQualityCard data={m.rag_quality} />

          {/* ── LLM Judge ── */}
          <SectionHeader title="LLM Judge" />

          {/* Score card */}
          <Card style={styles.judgeCard}>
            <View style={styles.judgeHeader}>
              <View style={styles.judgeScoreCircle}>
                <Text style={[styles.judgeScoreValue, { color: judgeScoreColor }]}>
                  {judge!.avg_overall_score.toFixed(1)}
                </Text>
                <Text style={styles.judgeScoreMax}>/10</Text>
              </View>
              <View style={styles.judgeStats}>
                <View style={styles.judgeStat}>
                  <Text style={styles.judgeStatLabel}>Avaliações</Text>
                  <Text style={styles.judgeStatValue}>{judge!.total_evaluations}</Text>
                </View>
                <View style={styles.judgeStat}>
                  <Text style={styles.judgeStatLabel}>Taxa de Aprovação</Text>
                  <Text style={[styles.judgeStatValue, { color: colors.success }]}>
                    {judge!.pass_rate_pct.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.judgeStat}>
                  <Text style={styles.judgeStatLabel}>Turnos/Conversa</Text>
                  <Text style={styles.judgeStatValue}>{judge!.avg_turns_per_conversation.toFixed(1)}</Text>
                </View>
              </View>
            </View>

            {/* Pass / Warning / Fail pills */}
            <View style={styles.verdictRow}>
              <View style={[styles.verdictPill, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark" size={12} color={colors.success} />
                <Text style={[styles.verdictText, { color: colors.success }]}>
                  {judge!.pass_count} aprov.
                </Text>
              </View>
              <View style={[styles.verdictPill, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="warning" size={12} color={colors.warning} />
                <Text style={[styles.verdictText, { color: colors.warning }]}>
                  {judge!.warning_count} alerta
                </Text>
              </View>
              <View style={[styles.verdictPill, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="close" size={12} color={colors.error} />
                <Text style={[styles.verdictText, { color: colors.error }]}>
                  {judge!.fail_count} reprov.
                </Text>
              </View>
            </View>

            {/* Eval cost & duration */}
            <View style={styles.evalInfoRow}>
              <View style={styles.evalInfo}>
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Text style={styles.evalInfoText}>
                  {(judge!.avg_eval_duration_ms / 1000).toFixed(1)}s / avaliação
                </Text>
              </View>
              <View style={styles.evalInfo}>
                <Ionicons name="wallet-outline" size={12} color={colors.textMuted} />
                <Text style={styles.evalInfoText}>
                  ${judge!.total_eval_cost_usd.toFixed(4)} total
                </Text>
              </View>
            </View>
          </Card>

          {/* ── Critérios ── */}
          {judge!.criteria_breakdown.length > 0 && (
            <>
              <SectionHeader title="Critérios de Avaliação" />
              <Card style={styles.criteriaCard}>
                {judge!.criteria_breakdown.map((c) => (
                  <CriteriaBar
                    key={c.criterion}
                    criterion={c.criterion}
                    avgScore={c.avg_score}
                    maxScore={c.max_score}
                    avgPct={c.avg_pct}
                  />
                ))}
              </Card>
            </>
          )}

          {/* ── Melhorias Sugeridas ── */}
          {judge!.top_improvements.length > 0 && (
            <>
              <SectionHeader title="Melhorias Sugeridas" />
              <View style={styles.cardWrap}>
                {judge!.top_improvements.map((imp, idx) => (
                  <ImprovementCard
                    key={idx}
                    suggestion={imp.suggestion}
                    count={imp.count}
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}

      <View style={styles.footer}>
        <Ionicons name="refresh-outline" size={12} color={colors.textMuted} />
        <Text style={styles.footerText}>Puxe para atualizar • Auto-refresh 30s</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingBottom: spacing['4xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary, padding: spacing['3xl'] },
  loadingCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.itauOrangeSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  loadingText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
  errorCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  errorTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  errorBody: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.xl, marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: radius.xl },
  statusText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  cardWrap: { paddingHorizontal: spacing.xl },
  tileGrid: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, marginBottom: spacing.md },

  // ─── Counts Row ───────────────────────────────────────
  countsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  countPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // ─── LLM Judge ────────────────────────────────────────
  judgeCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  judgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  judgeScoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.borderLight,
  },
  judgeScoreValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    lineHeight: 28,
  },
  judgeScoreMax: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  judgeStats: {
    flex: 1,
    gap: spacing.sm,
  },
  judgeStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  judgeStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  judgeStatValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  verdictRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  verdictPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  verdictText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  evalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  evalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  evalInfoText: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
  },

  // ─── Criteria ─────────────────────────────────────────
  criteriaCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },

  // ─── Footer ───────────────────────────────────────────
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing['2xl'] },
  footerText: { fontSize: fontSize['2xs'], color: colors.textMuted },
})
