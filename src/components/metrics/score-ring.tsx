// ─── Score Ring ───────────────────────────────────────────────────────
// Circular score indicator — Itaú-styled.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fontSize, fontWeight } from '@/theme'

interface ScoreRingProps {
  score: number
  maxScore: number
  label: string
  size?: number
  color?: string
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return colors.success
  if (pct >= 60) return colors.warning
  return colors.error
}

export function ScoreRing({ score, maxScore, label, size = 80, color }: ScoreRingProps) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
  const ringColor = color ?? getScoreColor(pct)
  const borderW = 4
  const innerSize = size - borderW * 2

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: borderW,
            borderColor: `${ringColor}20`,
          },
        ]}
      >
        {/* Colored arc simulation — full border colored by percentage */}
        <View
          style={[
            styles.ringFill,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: `${ringColor}10`,
            },
          ]}
        >
          <Text style={[styles.scoreValue, { color: ringColor, fontSize: size * 0.28 }]}>
            {score.toFixed(1)}
          </Text>
          <Text style={[styles.scoreMax, { color: ringColor }]}>
            /{maxScore}
          </Text>
        </View>
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontWeight: fontWeight.bold,
    lineHeight: 28,
  },
  scoreMax: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.medium,
  },
  label: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
})
