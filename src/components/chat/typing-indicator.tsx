// ─── Typing Indicator ────────────────────────────────────────────────
// Itaú-styled animated typing dots.

import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay(500),
        ]),
      )
    }

    const a1 = animate(dot1, 0)
    const a2 = animate(dot2, 200)
    const a3 = animate(dot3, 400)

    a1.start()
    a2.start()
    a3.start()

    return () => {
      a1.stop()
      a2.stop()
      a3.stop()
    }
  }, [dot1, dot2, dot3])

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
  })

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Ionicons name="sparkles" size={14} color={colors.textInverse} />
      </View>
      <View style={styles.bubbleCol}>
        <Text style={styles.label}>Assistente digitando</Text>
        <View style={styles.bubble}>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, dotStyle(dot1)]} />
            <Animated.View style={[styles.dot, dotStyle(dot2)]} />
            <Animated.View style={[styles.dot, dotStyle(dot3)]} />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.itauOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  bubbleCol: {
    gap: spacing['2xs'],
  },
  label: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubble: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    borderTopLeftRadius: radius.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.itauOrange,
  },
})
