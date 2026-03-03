// ─── Amount Input ────────────────────────────────────────────────────
// Currency input with BRL formatting — clean, premium feel.

import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  disabled?: boolean
}

export function AmountInput({ value, onChange, label, disabled }: AmountInputProps) {
  const [rawInput, setRawInput] = useState(value > 0 ? (value / 100).toFixed(2) : '')

  const handleChange = useCallback(
    (text: string) => {
      const clean = text.replace(/[^0-9]/g, '')
      const cents = parseInt(clean || '0', 10)
      setRawInput(cents > 0 ? (cents / 100).toFixed(2) : '')
      onChange(cents)
    },
    [onChange],
  )

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, disabled && styles.disabled]}>
        <Text style={styles.currency}>R$</Text>
        <TextInput
          style={styles.input}
          value={rawInput}
          onChangeText={handleChange}
          placeholder="0,00"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          editable={!disabled}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  currency: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    padding: 0,
  },
})
