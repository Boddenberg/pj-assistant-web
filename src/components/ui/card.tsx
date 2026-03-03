import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, radius, spacing } from '@/theme'

interface CardProps {
  children: React.ReactNode
  style?: object
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
})
