import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius, fontSize, fontWeight, spacing } from '@/theme'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: string
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: '#F3F4F6', text: '#374151' },
  success: { bg: '#ECFDF5', text: '#065F46' },
  warning: { bg: '#FFFBEB', text: '#92400E' },
  error: { bg: '#FEF2F2', text: '#991B1B' },
  info: { bg: '#EFF6FF', text: '#1E40AF' },
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const c = variantColors[variant]
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
})
