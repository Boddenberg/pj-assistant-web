// ─── Improvement Card ────────────────────────────────────────────────
// Shows top improvement suggestions from LLM Judge.
// Tap to expand/collapse long suggestions.

import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/ui'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface ImprovementCardProps {
  suggestion: string
  count: number
}

export function ImprovementCard({ suggestion, count }: ImprovementCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [needsExpand, setNeedsExpand] = useState(false)

  const onTextLayout = useCallback((e: { nativeEvent: { lines: unknown[] } }) => {
    // If the text has more than 2 lines, show the expand affordance
    if (e.nativeEvent.lines.length > 2) {
      setNeedsExpand(true)
    }
  }, [])

  return (
    <Pressable onPress={() => needsExpand && setExpanded((v) => !v)}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="bulb-outline" size={16} color={colors.warning} />
          </View>
          <View style={styles.textCol}>
            <Text
              style={styles.suggestion}
              numberOfLines={expanded ? undefined : 2}
              onTextLayout={onTextLayout as never}
            >
              {suggestion}
            </Text>
            <View style={styles.bottomRow}>
              <Text style={styles.count}>{count}× mencionado</Text>
              {needsExpand && (
                <Text style={styles.toggle}>
                  {expanded ? 'ver menos' : 'ver mais'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  suggestion: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  count: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: spacing['2xs'],
  },
  toggle: {
    fontSize: fontSize['2xs'],
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
})
