// ─── Root Layout ─────────────────────────────────────────────────────
// Expo Router entry — wraps providers, Stack navigator for tabs + modals.

import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { queryClient } from '@/lib'
import { colors, spacing, fontSize, fontWeight } from '@/theme'
import { useAuthStore, useCustomerStore } from '@/stores'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AuthScreen from './auth'

function StackHeaderTitle({ title }: { title: string }) {
  return (
    <View style={headerStyles.wrap}>
      <View style={headerStyles.logoDot} />
      <Text style={headerStyles.title}>{title}</Text>
    </View>
  )
}

const headerStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textInverse, opacity: 0.9 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textOnOrange, letterSpacing: 0.3 },
})

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const hydrate = useAuthStore((s) => s.hydrate)
  const setCustomerId = useCustomerStore((s) => s.setCustomerId)

  useEffect(() => {
    const init = async () => {
      await hydrate()
      // Restore customerId from persisted auth
      try {
        const stored = await AsyncStorage.getItem('@itau_pj_auth')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.customerId) setCustomerId(parsed.customerId)
        }
      } catch {}
    }
    init()
  }, [hydrate, setCustomerId])

  if (!isHydrated) {
    return (
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: colors.itauOrange, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.textInverse} />
        </View>
      </QueryClientProvider>
    )
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AuthScreen />
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.itauOrange },
          headerTintColor: colors.textOnOrange,
          headerShadowVisible: false,
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: colors.bgPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pix" options={{ headerTitle: () => <StackHeaderTitle title="Pix" /> }} />
        <Stack.Screen name="pix-scheduled" options={{ headerTitle: () => <StackHeaderTitle title="Pix Agendado" /> }} />
        <Stack.Screen name="pix-credit" options={{ headerTitle: () => <StackHeaderTitle title="Pix no Crédito" /> }} />
        <Stack.Screen name="pix-receipt" options={{ headerTitle: () => <StackHeaderTitle title="Comprovante" /> }} />
        <Stack.Screen name="credit-card" options={{ headerTitle: () => <StackHeaderTitle title="Cartão PJ" /> }} />
        <Stack.Screen name="financial-summary" options={{ headerTitle: () => <StackHeaderTitle title="Análise Financeira" /> }} />
        <Stack.Screen name="extrato" options={{ headerTitle: () => <StackHeaderTitle title="Extrato" /> }} />
      </Stack>
    </QueryClientProvider>
  )
}
