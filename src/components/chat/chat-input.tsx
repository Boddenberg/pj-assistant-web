// ─── Chat Input ──────────────────────────────────────────────────────
// Itaú-styled input bar — clean, minimal, premium feel.

import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  secureTextEntry?: boolean
}

export function ChatInput({ onSend, isLoading, secureTextEntry }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    onSend(trimmed)
    setValue('')
  }

  const canSend = value.trim().length > 0 && !isLoading

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="Pergunte sobre sua conta PJ..."
          placeholderTextColor={colors.textMuted}
          multiline={!secureTextEntry}
          secureTextEntry={secureTextEntry}
          maxLength={2000}
          editable={!isLoading}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons
              name="arrow-up"
              size={20}
              color={canSend ? colors.textInverse : colors.textMuted}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.lg,
    backgroundColor: colors.bgSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.bgInput,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingLeft: spacing.xl,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  inputRowFocused: {
    borderColor: colors.itauOrange,
    backgroundColor: colors.bgSecondary,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    maxHeight: 100,
    minHeight: 36,
    paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    fontWeight: fontWeight.regular,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.itauOrange,
    ...shadow.sm,
  },
})
