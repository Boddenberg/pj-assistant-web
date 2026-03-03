// ─── Health Card ──────────────────────────────────────────────────────
// Itaú-styled service health card with status indicator.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Card } from '@/components/ui'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'
import type { ServiceHealth } from '@/types'

interface HealthCardProps {
  service: ServiceHealth
}

const STATUS_CONFIG = {
  healthy: { color: colors.success, bg: colors.successLight, icon: 'checkmark-circle' as const, label: 'Saudável' },
  degraded: { color: colors.warning, bg: colors.warningLight, icon: 'warning' as const, label: 'Degradado' },
  unhealthy: { color: colors.error, bg: colors.errorLight, icon: 'close-circle' as const, label: 'Indisponível' },
} as const

export function HealthCard({ service }: HealthCardProps) {
  const config = STATUS_CONFIG[service.status]

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{service.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
            <View style={[styles.dot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Latência</Text>
          <Text style={styles.metricValue}>{service.latencyMs}<Text style={styles.metricUnit}>ms</Text></Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Uptime</Text>
          <Text style={styles.metricValue}>{(service.uptimePercent * 100).toFixed(1)}<Text style={styles.metricUnit}>%</Text></Text>
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  metricUnit: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
  },
  separator: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLight,
  },
})
