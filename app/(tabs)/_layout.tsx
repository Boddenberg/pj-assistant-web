// ─── Tabs Layout ─────────────────────────────────────────────────────
// Bottom tab navigator — Itaú premium banking style.
// Active tab: solid orange bg with white icon/label.
// Header: orange → white sheet with rounded top corners.

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize, fontWeight, radius, shadow } from '@/theme'

function HeaderTitle({ title }: { title: string }) {
  return (
    <View style={headerStyles.wrap}>
      <View style={headerStyles.logoDot} />
      <Text style={headerStyles.title}>{title}</Text>
    </View>
  )
}

const headerStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textInverse, opacity: 0.85 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textOnOrange, letterSpacing: 0.3 },
})

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <View style={[tabIconStyles.wrap, focused && tabIconStyles.wrapActive]}>
      <Ionicons name={name} size={20} color={focused ? colors.textInverse : colors.textMuted} />
    </View>
  )
}

const tabIconStyles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapActive: {
    backgroundColor: colors.itauOrange,
    borderRadius: radius.md,
  },
})

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.itauOrange, ...shadow.none },
        headerTintColor: colors.textOnOrange,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.itauOrange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgTabBar,
          borderTopWidth: 0,
          height: 84,
          paddingBottom: 24,
          paddingTop: spacing.sm,
          ...shadow.sm,
        },
        tabBarLabelStyle: {
          fontSize: fontSize['2xs'],
          fontWeight: fontWeight.semibold,
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitle title="Itaú Empresas" />,
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerTitle: () => <HeaderTitle title="Assistente PJ" />,
          tabBarLabel: 'Chat',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'chatbubbles' : 'chatbubbles-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="metrics"
        options={{
          headerTitle: () => <HeaderTitle title="Observabilidade" />,
          tabBarLabel: 'Métricas',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'pulse' : 'pulse-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="devtools"
        options={{
          headerTitle: () => <HeaderTitle title="Dev Tools" />,
          tabBarLabel: 'Dev Tools',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'construct' : 'construct-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}
