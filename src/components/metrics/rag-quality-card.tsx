// ─── RAG Quality Card ────────────────────────────────────────────────
// Premium card showing RAG quality score with visual gauge.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/ui'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'
import type { RagQuality } from '@/types'

interface RagQualityCardProps {
  data: RagQuality
}

function getQualityConfig(pct: number) {
  if (pct >= 90) return { color: colors.success, bg: colors.successLight, icon: 'shield-checkmark' as const, tier: 'Excelente' }
  if (pct >= 75) return { color: colors.success, bg: colors.successLight, icon: 'checkmark-circle' as const, tier: 'Bom' }
  if (pct >= 50) return { color: colors.warning, bg: colors.warningLight, icon: 'warning' as const, tier: 'Regular' }
  return { color: colors.error, bg: colors.errorLight, icon: 'alert-circle' as const, tier: 'Crítico' }
}

export function RagQualityCard({ data }: RagQualityCardProps) {
  const cfg = getQualityConfig(data.score_pct)

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Qualidade RAG</Text>
          <View style={styles.tierRow}>
            <Text style={[styles.tierBadge, { color: cfg.color, backgroundColor: cfg.bg }]}>
              {cfg.tier}
            </Text>
          </View>
        </View>
        <Text style={[styles.scoreValue, { color: cfg.color }]}>{data.score_pct.toFixed(0)}%</Text>
      </View>

      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${Math.min(data.score_pct, 100)}%`, backgroundColor: cfg.color }]} />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Fidelidade</Text>
          <Text style={styles.metricValue}>{(data.avg_faithfulness * 100).toFixed(0)}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Relevância</Text>
          <Text style={styles.metricValue}>{(data.avg_context_relevance * 100).toFixed(0)}%</Text>
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  tierRow: {
    flexDirection: 'row',
    marginTop: spacing['2xs'],
  },
  tierBadge: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.xs,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scoreValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
  },
  gaugeTrack: {
    height: 8,
    borderRadius: radius.xs,
    backgroundColor: colors.borderLight,
    overflow: 'hidden' as const,
    marginBottom: spacing.xl,
  },
  gaugeFill: {
    height: '100%' as const,
    borderRadius: radius.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
    marginBottom: spacing['2xs'],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLight,
  },
})
