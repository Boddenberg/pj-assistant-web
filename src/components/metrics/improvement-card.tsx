// ─── Improvement Card ────────────────────────────────────────────────
// Shows top improvement suggestions from LLM Judge.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/ui'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface ImprovementCardProps {
  suggestion: string
  count: number
}

export function ImprovementCard({ suggestion, count }: ImprovementCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="bulb-outline" size={16} color={colors.warning} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.suggestion}>{suggestion}</Text>
          <Text style={styles.count}>{count}× mencionado</Text>
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  suggestion: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  count: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
    marginTop: spacing['2xs'],
  },
})
