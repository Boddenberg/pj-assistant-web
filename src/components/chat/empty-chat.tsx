// ─── Empty Chat State ────────────────────────────────────────────────
// Welcome screen with Itaú bank identity — orange accent, clean, premium.

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

const suggestions = [
  { icon: 'bar-chart-outline' as const, text: 'Resumo financeiro do mês' },
  { icon: 'swap-horizontal-outline' as const, text: 'Análise de fluxo de caixa' },
  { icon: 'card-outline' as const, text: 'Opções de crédito PJ' },
  { icon: 'receipt-outline' as const, text: 'Últimas transações' },
]

interface EmptyChatProps {
  onSuggestionPress?: (suggestion: string) => void
}

export function EmptyChat({ onSuggestionPress }: EmptyChatProps) {
  return (
    <View style={styles.container}>
      {/* Hero icon */}
      <View style={styles.heroCircle}>
        <View style={styles.heroInner}>
          <Ionicons name="business" size={32} color={colors.itauOrange} />
        </View>
      </View>

      <Text style={styles.greeting}>Olá! 👋</Text>
      <Text style={styles.title}>Como posso ajudar{'\n'}sua empresa hoje?</Text>
      <Text style={styles.subtitle}>
        Sou o assistente inteligente do Itaú para Pessoa Jurídica.
        Consulte saldos, analise transações ou peça recomendações.
      </Text>

      {/* Suggestion cards */}
      <View style={styles.suggestionsWrap}>
        {suggestions.map((s) => (
          <TouchableOpacity
            key={s.text}
            style={styles.chip}
            onPress={() => onSuggestionPress?.(s.text)}
            activeOpacity={0.6}
          >
            <View style={styles.chipIcon}>
              <Ionicons name={s.icon} size={16} color={colors.itauOrange} />
            </View>
            <Text style={styles.chipText}>{s.text}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark" size={12} color={colors.success} />
        <Text style={styles.securityText}>Conversa protegida com criptografia</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  heroCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.itauOrangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  heroInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing['3xl'],
    maxWidth: 280,
  },
  suggestionsWrap: {
    width: '100%',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.itauOrangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing['2xl'],
    opacity: 0.7,
  },
  securityText: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
  },
})
