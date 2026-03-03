// ─── Section Header ──────────────────────────────────────────────────
// Clean section heading with subtle orange accent — generous spacing.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface SectionHeaderProps {
  title: string
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.accent} />
      <Text style={styles.heading}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  accent: {
    width: 3,
    height: 18,
    borderRadius: radius.xs,
    backgroundColor: colors.itauOrange,
  },
  heading: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
})
