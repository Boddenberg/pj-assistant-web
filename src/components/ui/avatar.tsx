import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius, fontWeight, fontSize } from '@/theme'

interface AvatarProps {
  name: string
  size?: number
}

export function Avatar({ name, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.itauBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textInverse,
    fontWeight: fontWeight.semibold,
  },
})
