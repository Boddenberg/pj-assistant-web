// ─── Metric Tile ─────────────────────────────────────────────────────
// Itaú-styled KPI card — clean, compact, informative.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Card } from '@/components/ui'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface MetricTileProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string | number
  delta?: number
  unit?: string
}

export function MetricTile({ icon, label, value, delta, unit }: MetricTileProps) {
  const deltaColor = delta !== undefined ? (delta >= 0 ? colors.success : colors.error) : undefined
  const deltaIcon = delta !== undefined ? (delta >= 0 ? 'trending-up' : 'trending-down') : undefined

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.itauOrange} />
        </View>
        {delta !== undefined && deltaIcon && (
          <View style={[styles.deltaPill, { backgroundColor: delta >= 0 ? colors.successLight : colors.errorLight }]}>
            <Ionicons name={deltaIcon} size={10} color={deltaColor} />
            <Text style={[styles.deltaText, { color: deltaColor }]}>
              {Math.abs(delta).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      <Text style={styles.label}>{label}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.itauOrangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
  },
  deltaText: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.semibold,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: spacing['2xs'],
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  unit: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
  },
  label: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})
