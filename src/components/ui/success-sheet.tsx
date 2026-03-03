// ─── Success Sheet ───────────────────────────────────────────────────
// Full-screen success confirmation — clean, premium banking feel.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ActionButton } from './action-button'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface SuccessSheetProps {
  title: string
  message: string
  details?: { label: string; value: string }[]
  buttonTitle?: string
  onDone: () => void
}

export function SuccessSheet({ title, message, details, buttonTitle = 'Fechar', onDone }: SuccessSheetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={44} color={colors.success} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {details && details.length > 0 && (
        <View style={styles.detailsCard}>
          {details.map((d, i) => (
            <View key={d.label} style={[styles.detailRow, i > 0 && styles.detailBorder]}>
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.buttonWrap}>
        <ActionButton title={buttonTitle} onPress={onDone} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  buttonWrap: {
    width: '100%',
  },
})
