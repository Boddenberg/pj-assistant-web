// ─── Home Screen ─────────────────────────────────────────────────────
// Premium banking home — 2-column grid, orange-to-sheet transition.

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated, Alert, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'
import { formatCurrency, resetTempSessionId } from '@/lib'
import { useCustomerStore, useAuthStore, useChatStore } from '@/stores'
import { useTransactionSummary, useFinancialSummary, useAccount, transactionKeys, financialKeys, accountKeys } from '@/hooks'
import { useQueryClient } from '@tanstack/react-query'

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  route: string
  color: string
  bg: string
  variant: 'primary' | 'secondary'
}

const quickActions: QuickAction[] = [
  { icon: 'swap-horizontal-outline', label: 'Pix', route: '/pix', color: colors.textInverse, bg: colors.itauOrange, variant: 'primary' },
  { icon: 'card-outline', label: 'Cartão PJ', route: '/credit-card', color: '#8B5CF6', bg: '#F3EEFE', variant: 'secondary' },
  { icon: 'analytics-outline', label: 'Análise Financeira', route: '/financial-summary', color: colors.itauOrangeDark, bg: colors.itauOrangeSoft, variant: 'secondary' },
  { icon: 'receipt-outline', label: 'Extrato', route: '/extrato', color: colors.success, bg: colors.successLight, variant: 'secondary' },
  { icon: 'flash-outline', label: 'Pix no Crédito', route: '/pix-credit', color: colors.textInverse, bg: colors.itauNavy, variant: 'primary' },
]

export default function HomeScreen() {
  const router = useRouter()
  const customerId = useCustomerStore((s) => s.customerId)
  const customerName = useAuthStore((s) => s.customerName)
  const firstName = customerName?.split(' ')[0] ?? ''
  const logout = useAuthStore((s) => s.logout)
  const clearCustomer = useCustomerStore((s) => s.clear)

  const handleLogout = useCallback(() => {
    const doLogout = () => {
      useChatStore.getState().clearChat()
      resetTempSessionId()  // new temp ID for next anonymous session
      clearCustomer()
      logout()
    }

    if (Platform.OS === 'web') {
      doLogout()
      return
    }
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: doLogout,
        },
      ],
    )
  }, [logout, clearCustomer])

  // Fetch real balance data from backend
  const queryClient = useQueryClient()
  const { data: accountData, isRefetching: isRefetchingAccount } = useAccount(customerId)
  const { data: financialData, isRefetching: isRefetchingFinancial } = useFinancialSummary(customerId)
  const { data: summary, isRefetching: isRefetchingSummary } = useTransactionSummary(customerId)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      queryClient.invalidateQueries({ queryKey: financialKeys.all }),
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
    ])
    setRefreshing(false)
  }, [queryClient])

  // Priority: accounts endpoint > financial summary > transaction summary
  const balance = accountData?.balance ?? financialData?.balance?.current ?? summary?.balance ?? 0
  const totalCredits = financialData?.cashFlow?.totalIncome ?? summary?.totalCredits ?? 0
  const totalDebits = financialData?.cashFlow?.totalExpenses ?? summary?.totalDebits ?? 0

  // Pulsing glow animation for AI button
  const pulseAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start()
  }, [pulseAnim])

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    router.push(route as any)
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerExtension} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetchingAccount || isRefetchingFinancial || isRefetchingSummary}
            onRefresh={handleRefresh}
            tintColor={colors.textInverse}
            colors={[colors.itauOrange]}
            progressBackgroundColor="transparent"
          />
        }
      >
        {/* Welcome + Logout */}
        <View style={styles.welcomeRow}>
          {firstName ? (
            <View style={styles.welcomeWrap}>
              <Text style={styles.welcomeText}>Bem-vindo, <Text style={styles.welcomeName}>{firstName}</Text></Text>
            </View>
          ) : <View />}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponível</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceDotRow}>
                <View style={[styles.balanceDot, { backgroundColor: colors.success }]} />
                <Text style={styles.balanceItemLabel}>Entradas</Text>
              </View>
              <Text style={[styles.balanceItemValue, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(totalCredits)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <View style={styles.balanceDotRow}>
                <View style={[styles.balanceDot, { backgroundColor: colors.error }]} />
                <Text style={styles.balanceItemLabel}>Saídas</Text>
              </View>
              <Text style={[styles.balanceItemValue, { color: colors.error }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(totalDebits)}</Text>
            </View>
          </View>
        </View>

        {/* Assistente IA — full-width highlight button */}
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>Inteligência Artificial</Text>
        </View>

        <Animated.View style={[styles.aiButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => handlePress('/(tabs)/chat')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.itauOrange, colors.itauOrangeDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiGradient}
            >
              <View style={styles.aiIconWrap}>
                <Ionicons name="sparkles" size={24} color={colors.textInverse} />
              </View>
              <View style={styles.aiTextWrap}>
                <Text style={styles.aiTitle}>Assistente IA</Text>
                <Text style={styles.aiSubtitle}>Pergunte sobre finanças, faça operações por texto</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions — 2-column grid */}
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>Operações</Text>
        </View>

        <View style={styles.grid}>
          {quickActions.map((action) => {
            const isPrimary = action.variant === 'primary'
            return (
              <TouchableOpacity
                key={action.label}
                style={[
                  styles.gridCard,
                  { backgroundColor: action.bg },
                ]}
                onPress={() => handlePress(action.route)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.gridIconWrap,
                  { backgroundColor: isPrimary ? 'rgba(255,255,255,0.2)' : `${action.color}15` },
                ]}>
                  <Ionicons name={action.icon} size={22} color={isPrimary ? colors.textInverse : action.color} />
                </View>
                <Text style={[
                  styles.gridLabel,
                  { color: isPrimary ? colors.textInverse : colors.textPrimary },
                ]} numberOfLines={2}>
                  {action.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={isPrimary ? 'rgba(255,255,255,0.5)' : colors.textMuted}
                  style={styles.gridChevron}
                />
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  headerExtension: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.itauOrange,
    borderBottomLeftRadius: radius['3xl'],
    borderBottomRightRadius: radius['3xl'],
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['4xl'],
  },
  // Welcome + Logout
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    marginBottom: -spacing.xs,
  },
  welcomeWrap: {},
  welcomeText: {
    fontSize: fontSize.md,
    color: colors.textInverse,
    fontWeight: fontWeight.regular,
  },
  welcomeName: {
    fontWeight: fontWeight.bold,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Balance card
  balanceCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.itauNavy,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: spacing.xs,
  },
  balanceValue: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    marginBottom: spacing.xl,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    gap: spacing.xs,
  },
  balanceDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  balanceDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: spacing.md,
  },
  balanceItemLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.45)',
  },
  balanceItemValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  accentBar: {
    width: 3,
    height: 18,
    borderRadius: radius.xs,
    backgroundColor: colors.itauOrange,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  // AI highlight button
  aiButtonOuter: {
    marginHorizontal: spacing.xl,
  },
  aiButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.md,
  },
  aiGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  aiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextWrap: {
    flex: 1,
  },
  aiTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    marginBottom: spacing['2xs'],
  },
  aiSubtitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
  },
  // 2-column grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  gridCard: {
    width: '47%',
    borderRadius: radius.xl,
    padding: spacing.lg,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gridLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
  },
  gridChevron: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
})
