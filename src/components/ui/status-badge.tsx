// ─── Status Badge ────────────────────────────────────────────────────
// Small pill for showing status in lists.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusBadgeProps {
  label: string
  variant?: BadgeVariant
}

const VARIANT_CONFIG: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: colors.successLight, color: colors.success },
  warning: { bg: colors.warningLight, color: colors.warning },
  error: { bg: colors.errorLight, color: colors.error },
  info: { bg: colors.infoLight, color: colors.itauBlue },
  neutral: { bg: colors.bgInput, color: colors.textSecondary },
}

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  const config = VARIANT_CONFIG[variant]

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})
