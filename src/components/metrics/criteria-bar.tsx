// ─── Criteria Bar ────────────────────────────────────────────────────
// Horizontal bar for LLM Judge criteria breakdown.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface CriteriaBarProps {
  criterion: string
  avgScore: number
  maxScore: number
  avgPct: number
}

const CRITERION_LABELS: Record<string, string> = {
  coherence: 'Coerência',
  correctness: 'Correção',
  faithfulness: 'Fidelidade',
  safety: 'Segurança',
  helpfulness: 'Utilidade',
  relevance: 'Relevância',
  completeness: 'Completude',
  fluency: 'Fluência',
  clarity: 'Clareza',
  accuracy: 'Precisão',
  conciseness: 'Concisão',
  groundedness: 'Fundamentação',
  context_relevance: 'Relevância do Contexto',
  context_precision: 'Precisão do Contexto',
  answer_relevance: 'Relevância da Resposta',
  toxicity: 'Toxicidade',
  bias: 'Viés',
}

function getBarColor(pct: number): string {
  if (pct >= 90) return colors.success
  if (pct >= 70) return colors.itauOrange
  if (pct >= 50) return colors.warning
  return colors.error
}

export function CriteriaBar({ criterion, avgScore, maxScore, avgPct }: CriteriaBarProps) {
  const label = CRITERION_LABELS[criterion] ?? criterion
  const barColor = getBarColor(avgPct)

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.score, { color: barColor }]}>
          {avgScore.toFixed(1)}/{maxScore}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(avgPct, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  score: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  track: {
    height: 8,
    borderRadius: radius.xs,
    backgroundColor: colors.borderLight,
    overflow: 'hidden' as const,
  },
  fill: {
    height: '100%' as const,
    borderRadius: radius.xs,
  },
})
