// ─── Action Button ───────────────────────────────────────────────────
// Primary/secondary button — Itaú premium style, clean and bold.

import React from 'react'
import {
  TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface ActionButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
}

export function ActionButton({
  title, onPress, variant = 'primary', disabled, loading,
}: ActionButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    onPress()
  }

  const isPrimary = variant === 'primary'
  const isDanger = variant === 'danger'
  const bgColor = isDanger ? colors.error : isPrimary ? colors.itauOrange : colors.bgSecondary
  const textColor = isPrimary || isDanger ? colors.textInverse : colors.itauOrange
  const borderColor = isPrimary || isDanger ? 'transparent' : colors.borderLight

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor },
        (disabled || loading) && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
})
