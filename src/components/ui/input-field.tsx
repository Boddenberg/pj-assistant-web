// ─── Input Field ─────────────────────────────────────────────────────
// Itaú-styled text input — clean, generous padding.

import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface InputFieldProps extends TextInputProps {
  label: string
  error?: string
  hint?: string
}

export function InputField({ label, error, hint, style, ...props }: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
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
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: colors.itauOrange,
    backgroundColor: colors.bgSecondary,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
})
