// ─── Financial Summary / Analysis Screen ─────────────────────────────
// Modern dashboard — crash-proof with proper null guards & error states.

import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { useCustomerStore } from '@/stores'
import { useFinancialSummary, useTransactionSummary, useCreditCards, useTransactions, useAccount } from '@/hooks'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Fornecedores': 'cube-outline',
  'Salários': 'people-outline',
  'Impostos': 'document-text-outline',
  'Serviços': 'construct-outline',
  'Marketing': 'megaphone-outline',
  'Transporte': 'car-outline',
  'Alimentação': 'restaurant-outline',
  'Outros': 'ellipsis-horizontal-outline',
}

const CATEGORY_COLORS = [
  colors.itauOrange, colors.itauBlue, colors.success,
  colors.warning, '#8B5CF6', colors.error, '#06B6D4', colors.textMuted,
]

export default function FinancialSummaryScreen() {
  const router = useRouter()
  const customerId = useCustomerStore((s) => s.customerId)
  const { data, isLoading, isRefetching, refetch, isError } = useFinancialSummary(customerId)
  const { data: summary } = useTransactionSummary(customerId)
  const { data: accountData } = useAccount(customerId)
  const { data: cards } = useCreditCards(customerId)
  const { data: transactions } = useTransactions(customerId, 100)

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Build a map of date → transactions for the calendar (grouping only — no business classification)
  const txByDate = useMemo(() => {
    const map: Record<string, { credits: number; debits: number; count: number }> = {}
    if (!transactions || !Array.isArray(transactions)) return map
    for (const tx of transactions) {
      const day = tx.date.slice(0, 10) // YYYY-MM-DD
      if (!map[day]) map[day] = { credits: 0, debits: 0, count: 0 }
      map[day].count++
      // Use amount sign from backend — positive = credit, negative = debit
      if (tx.amount >= 0) map[day].credits += tx.amount
      else map[day].debits += Math.abs(tx.amount)
    }
    return map
  }, [transactions])

  // Get transactions for selected date
  const selectedDateTxs = useMemo(() => {
    if (!selectedDate || !transactions || !Array.isArray(transactions)) return []
    return transactions.filter((tx) => tx.date.startsWith(selectedDate))
  }, [selectedDate, transactions])

  // Calendar helpers
  const calYear = calendarMonth.getFullYear()
  const calMonth = calendarMonth.getMonth()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay() // 0=Sun
  const monthLabel = calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const prevMonth = () => setCalendarMonth(new Date(calYear, calMonth - 1, 1))
  const nextMonth = () => setCalendarMonth(new Date(calYear, calMonth + 1, 1))

  // Safe accessors — priority: accounts endpoint > financial summary > transaction summary
  const balance = accountData?.balance ?? data?.balance?.current ?? summary?.balance ?? 0
  const available = accountData?.availableBalance ?? data?.balance?.available ?? balance
  const invested = data?.balance?.invested ?? 0

  const totalIncome = data?.cashFlow?.totalIncome ?? summary?.totalCredits ?? 0
  const totalExpenses = data?.cashFlow?.totalExpenses ?? summary?.totalDebits ?? 0
  const netCashFlow = data?.cashFlow?.netCashFlow ?? 0
  const comparedPeriod = data?.cashFlow?.comparedToPreviousPeriod ?? null

  const categories = data?.topCategories ?? []
  const spending = data?.spending ?? null
  const monthlyTrend = data?.monthlyTrend ?? []

  // Credit card data — values come from backend
  const activeCards = cards?.filter((c) => c.status === 'active') ?? []
  const totalCreditUsed = activeCards.reduce((sum, c) => sum + (c.usedLimit ?? 0), 0)
  const totalCreditLimit = activeCards.reduce((sum, c) => sum + (c.limit ?? 0), 0)

  // Loading
  if (isLoading && !isRefetching) {
    return (
      <View style={styles.center}>
        <Ionicons name="analytics" size={48} color={colors.itauOrange} />
        <Text style={styles.loadingText}>Analisando seus dados…</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.itauOrange}
            colors={[colors.itauOrange]}
          />
        }
      >
        {/* ─── Balance Overview ──────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Análise Financeira</Text>
          <Text style={styles.pageSubtitle}>Visão completa das suas finanças PJ</Text>
        </View>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo atual</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Disponível</Text>
              <Text style={[styles.balanceItemValue, { color: colors.success }]}>
                {formatCurrency(available)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Investido</Text>
              <Text style={[styles.balanceItemValue, { color: colors.itauBlue }]}>
                {formatCurrency(invested)}
              </Text>
            </View>
          </View>
        </Card>

        {/* ─── Error banner (non-blocking) ───────────────────────── */}
        {isError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={styles.errorBannerText}>
              Alguns dados podem estar desatualizados. Puxe para atualizar.
            </Text>
          </View>
        )}

        {/* ─── Cash Flow ─────────────────────────────────────────── */}
        <SectionTitle title="Fluxo de Caixa" icon="trending-up" />
        <Card style={styles.cashFlowCard}>
          <View style={styles.cfRow}>
            <View style={styles.cfItem}>
              <View style={styles.cfHeader}>
                <View style={[styles.cfDot, { backgroundColor: colors.success }]} />
                <Text style={styles.cfLabel}>Receitas</Text>
              </View>
              <Text style={[styles.cfValue, { color: colors.success }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View style={styles.cfItem}>
              <View style={styles.cfHeader}>
                <View style={[styles.cfDot, { backgroundColor: colors.error }]} />
                <Text style={styles.cfLabel}>Despesas</Text>
              </View>
              <Text style={[styles.cfValue, { color: colors.error }]}>
                {formatCurrency(totalExpenses)}
              </Text>
            </View>
          </View>

          <View style={styles.cfNetRow}>
            <Text style={styles.cfNetLabel}>Resultado líquido</Text>
            <Text style={[styles.cfNetValue, { color: netCashFlow >= 0 ? colors.success : colors.error }]}>
              {formatCurrency(netCashFlow)}
            </Text>
          </View>

          {comparedPeriod != null && (
            <View style={styles.trendRow}>
              <Ionicons
                name={comparedPeriod >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={comparedPeriod >= 0 ? colors.success : colors.error}
              />
              <Text style={[styles.trendText, { color: comparedPeriod >= 0 ? colors.success : colors.error }]}>
                {Math.abs(comparedPeriod).toFixed(1)}% vs mês anterior
              </Text>
            </View>
          )}
        </Card>

        {/* ─── Calendar Panorama ─────────────────────────────────── */}
        <SectionTitle title="Panorama por Dia" icon="calendar" />
        <Card style={styles.calendarCard}>
          {/* Month navigation */}
          <View style={styles.calNavRow}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={22} color={colors.itauOrange} />
            </TouchableOpacity>
            <Text style={styles.calMonthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={22} color={colors.itauOrange} />
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.calWeekRow}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <Text key={d} style={styles.calWeekDay}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calGrid}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`e-${i}`} style={styles.calCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const info = txByDate[dateStr]
              const isSelected = selectedDate === dateStr
              const hasData = !!info
              const isToday = dateStr === new Date().toISOString().slice(0, 10)

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calCell,
                    isSelected && styles.calCellSelected,
                    isToday && !isSelected && styles.calCellToday,
                  ]}
                  onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                  activeOpacity={0.6}
                >
                  <Text style={[
                    styles.calDayNum,
                    isSelected && styles.calDayNumSelected,
                    isToday && !isSelected && styles.calDayNumToday,
                  ]}>
                    {day}
                  </Text>
                  {hasData && (
                    <View style={styles.calDots}>
                      {info.credits > 0 && <View style={[styles.calDot, { backgroundColor: colors.success }]} />}
                      {info.debits > 0 && <View style={[styles.calDot, { backgroundColor: colors.error }]} />}
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Legend */}
          <View style={styles.calLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Receita</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={styles.legendText}>Despesa</Text>
            </View>
          </View>
        </Card>

        {/* Selected date detail */}
        {selectedDate && (
          <Card style={styles.calDetailCard}>
            <Text style={styles.calDetailTitle}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            {txByDate[selectedDate] && (
              <View style={styles.calDetailSummary}>
                <View style={styles.calDetailItem}>
                  <Ionicons name="arrow-down" size={14} color={colors.success} />
                  <Text style={[styles.calDetailValue, { color: colors.success }]}>
                    {formatCurrency(txByDate[selectedDate].credits)}
                  </Text>
                </View>
                <View style={styles.calDetailItem}>
                  <Ionicons name="arrow-up" size={14} color={colors.error} />
                  <Text style={[styles.calDetailValue, { color: colors.error }]}>
                    {formatCurrency(txByDate[selectedDate].debits)}
                  </Text>
                </View>
                <Text style={styles.calDetailCount}>
                  {txByDate[selectedDate].count} transação(ões)
                </Text>
              </View>
            )}
            {selectedDateTxs.length > 0 ? (
              selectedDateTxs.map((tx, i) => {
                // Use amount sign from backend — positive = credit, negative = debit
                const showAsCredit = tx.amount >= 0
                return (
                  <View key={tx.id ?? i} style={styles.calTxRow}>
                    <View style={[styles.calTxIcon, { backgroundColor: showAsCredit ? colors.successLight : colors.errorLight }]}>
                      <Ionicons name={showAsCredit ? 'arrow-down' : 'arrow-up'} size={12} color={showAsCredit ? colors.success : colors.error} />
                    </View>
                    <View style={styles.calTxInfo}>
                      <Text style={styles.calTxDesc} numberOfLines={1}>{tx.description}</Text>
                      <Text style={styles.calTxCat}>{tx.category}</Text>
                    </View>
                    <Text style={[styles.calTxAmount, { color: showAsCredit ? colors.success : colors.error }]}>
                      {showAsCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                  </View>
                )
              })
            ) : (
              <Text style={styles.calNoTx}>Nenhuma transação neste dia</Text>
            )}
          </Card>
        )}

        {/* ─── Credit Card Summary ───────────────────────────────── */}
        {activeCards.length > 0 && (
          <>
            <SectionTitle title="Cartões de Crédito" icon="card" />
            <Card style={styles.ccSummaryCard}>
              <View style={styles.ccRow}>
                <View style={styles.ccItem}>
                  <Text style={styles.ccItemLabel}>Fatura atual</Text>
                  <Text style={[styles.ccItemValue, { color: totalCreditUsed > 0 ? colors.itauOrange : colors.success }]}>
                    {formatCurrency(totalCreditUsed)}
                  </Text>
                </View>
                <View style={styles.ccItem}>
                  <Text style={styles.ccItemLabel}>Limite total</Text>
                  <Text style={styles.ccItemValueMuted}>{formatCurrency(totalCreditLimit)}</Text>
                </View>
              </View>
              <View style={styles.usageBarBg}>
                <View
                  style={[
                    styles.usageBarFill,
                    { width: totalCreditLimit > 0 ? `${Math.min((totalCreditUsed / totalCreditLimit) * 100, 100)}%` : '0%' },
                  ]}
                />
              </View>
              <Text style={styles.ccUtilLabel}>
                {totalCreditLimit > 0
                  ? `${((totalCreditUsed / totalCreditLimit) * 100).toFixed(1)}% do limite utilizado`
                  : 'Sem limite definido'}
              </Text>
              {activeCards.map((card) => (
                <View key={card.id} style={styles.ccCardRow}>
                  <Ionicons name="card" size={16} color={colors.textMuted} />
                  <Text style={styles.ccCardLabel}>•••• {card.lastFourDigits}</Text>
                  <Text style={styles.ccCardUsed}>{formatCurrency(card.usedLimit)}</Text>
                  <Text style={styles.ccCardLimit}>/ {formatCurrency(card.limit)}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* ─── Spending by Category ──────────────────────────────── */}
        {categories.length > 0 && (
          <>
            <SectionTitle title="Gastos por Categoria" icon="pie-chart" />
            {categories.map((cat, i) => {
              const barColor = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
              return (
                <Card key={cat.category} style={styles.categoryCard}>
                  <View style={styles.catRow}>
                    <View style={[styles.catIcon, { backgroundColor: `${barColor}15` }]}>
                      <Ionicons
                        name={CATEGORY_ICONS[cat.category] ?? 'ellipsis-horizontal-outline'}
                        size={18}
                        color={barColor}
                      />
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{cat.category}</Text>
                      <Text style={styles.catCount}>{cat.transactionCount} transações</Text>
                    </View>
                    <View style={styles.catRight}>
                      <Text style={styles.catAmount}>{formatCurrency(cat.amount)}</Text>
                      <View style={styles.catPercentRow}>
                        <Ionicons
                          name={cat.trend === 'up' ? 'trending-up' : cat.trend === 'down' ? 'trending-down' : 'remove'}
                          size={10}
                          color={cat.trend === 'down' ? colors.success : cat.trend === 'up' ? colors.error : colors.textMuted}
                        />
                        <Text style={styles.catPercent}>{cat.percentage.toFixed(1)}%</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.catBarBg}>
                    <View style={[styles.catBarFill, { width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: barColor }]} />
                  </View>
                </Card>
              )
            })}
          </>
        )}

        {/* ─── Monthly Trend ─────────────────────────────────────── */}
        {monthlyTrend.length > 0 && (
          <>
            <SectionTitle title="Tendência Mensal" icon="bar-chart" />
            <Card style={styles.trendCard}>
              {monthlyTrend.map((m, i) => {
                const maxVal = Math.max(...monthlyTrend.map((t) => Math.max(t.income, t.expenses)), 1)
                return (
                  <View key={m.month} style={styles.trendItem}>
                    <Text style={styles.trendMonth}>
                      {m.month.length >= 7 ? m.month.slice(5, 7) + '/' + m.month.slice(2, 4) : m.month}
                    </Text>
                    <View style={styles.trendBars}>
                      <View style={[styles.trendBarIn, { width: `${(m.income / maxVal) * 100}%` }]} />
                      <View style={[styles.trendBarOut, { width: `${(m.expenses / maxVal) * 100}%` }]} />
                    </View>
                    <Text style={styles.trendBalance}>{formatCurrency(m.balance)}</Text>
                  </View>
                )
              })}
              <View style={styles.trendLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Receitas</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={styles.legendText}>Despesas</Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* ─── Insights ──────────────────────────────────────────── */}
        {spending && (
          <>
            <SectionTitle title="Insights" icon="bulb" />
            {spending.highestExpense && (
              <Card style={styles.insightCard}>
                <View style={styles.insightRow}>
                  <View style={styles.insightIcon}>
                    <Ionicons name="bulb" size={20} color={colors.itauOrange} />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>Maior gasto do período</Text>
                    <Text style={styles.insightValue}>
                      {spending.highestExpense.description ?? '—'} — {formatCurrency(spending.highestExpense.amount ?? 0)}
                    </Text>
                    <Text style={styles.insightMeta}>
                      {spending.highestExpense.category ?? ''} • {spending.highestExpense.date ?? ''}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            <Card style={styles.insightCard}>
              <View style={styles.insightRow}>
                <View style={[styles.insightIcon, { backgroundColor: colors.infoLight }]}>
                  <Ionicons name="calendar" size={20} color={colors.itauBlue} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Média diária de gastos</Text>
                  <Text style={styles.insightValue}>{formatCurrency(spending.averageDaily ?? 0)}</Text>
                </View>
              </View>
            </Card>

            {spending.comparedToPreviousPeriod != null && (
              <Card style={styles.insightCard}>
                <View style={styles.insightRow}>
                  <View style={[styles.insightIcon, { backgroundColor: spending.comparedToPreviousPeriod >= 0 ? colors.errorLight : colors.successLight }]}>
                    <Ionicons
                      name={spending.comparedToPreviousPeriod >= 0 ? 'trending-up' : 'trending-down'}
                      size={20}
                      color={spending.comparedToPreviousPeriod >= 0 ? colors.error : colors.success}
                    />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>Variação de gastos</Text>
                    <Text style={styles.insightValue}>
                      {spending.comparedToPreviousPeriod >= 0 ? '+' : ''}{spending.comparedToPreviousPeriod.toFixed(1)}% vs mês anterior
                    </Text>
                    <Text style={styles.insightMeta}>
                      {spending.comparedToPreviousPeriod >= 0
                        ? 'Seus gastos aumentaram em relação ao mês passado'
                        : 'Ótimo! Seus gastos diminuíram em relação ao mês passado'
                      }
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </>
        )}

        {/* ─── Empty state ───────────────────────────────────────── */}
        {!isLoading && !spending && categories.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="analytics-outline" size={40} color={colors.itauOrange} />
            </View>
            <Text style={styles.emptyTitle}>Ainda sem dados suficientes</Text>
            <Text style={styles.emptySubtext}>
              Faça mais transações para que possamos gerar análises e insights sobre suas finanças.
            </Text>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/extrato' as any)} activeOpacity={0.7}>
            <Ionicons name="receipt-outline" size={18} color={colors.itauOrange} />
            <Text style={styles.quickBtnText}>Ver Extrato</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/credit-card' as any)} activeOpacity={0.7}>
            <Ionicons name="card-outline" size={18} color={colors.itauOrange} />
            <Text style={styles.quickBtnText}>Cartões</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Section Title Helper ────────────────────────────────────────────
function SectionTitle({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.accentBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing['4xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary, gap: spacing.lg },
  loadingText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },

  header: { padding: spacing.xl, paddingBottom: 0 },
  pageTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  pageSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.xl, backgroundColor: colors.warningLight, borderRadius: radius.lg, padding: spacing.lg },
  errorBannerText: { fontSize: fontSize.xs, color: colors.textSecondary, flex: 1 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing['2xl'], marginBottom: spacing.lg, paddingHorizontal: spacing.xl },
  accentBar: { width: 3, height: 18, borderRadius: radius.xs, backgroundColor: colors.itauOrange },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, letterSpacing: 0.2 },

  // Balance
  balanceCard: { marginHorizontal: spacing.xl, backgroundColor: colors.itauNavy, borderColor: 'transparent' },
  balanceLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.55)' },
  balanceValue: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.textInverse, marginVertical: spacing.md },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  balanceItem: { flex: 1 },
  balanceDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)' },
  balanceItemLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.45)', marginBottom: spacing.xs },
  balanceItemValue: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },

  // Cash flow
  cashFlowCard: { marginHorizontal: spacing.xl, gap: spacing.lg },
  cfRow: { flexDirection: 'row', gap: spacing.xl },
  cfItem: { flex: 1, gap: spacing.sm },
  cfHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cfDot: { width: 8, height: 8, borderRadius: 4 },
  cfLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  cfValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  cfNetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  cfNetLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary },
  cfNetValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trendText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },

  // Credit card summary
  ccSummaryCard: { marginHorizontal: spacing.xl, gap: spacing.lg },
  ccRow: { flexDirection: 'row', gap: spacing.xl },
  ccItem: { flex: 1 },
  ccItemLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs },
  ccItemValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  ccItemValueMuted: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  usageBarBg: { height: 6, backgroundColor: colors.bgInput, borderRadius: 3, overflow: 'hidden' },
  usageBarFill: { height: 6, backgroundColor: colors.itauOrange, borderRadius: 3 },
  ccUtilLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  ccCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  ccCardLabel: { fontSize: fontSize.sm, color: colors.textPrimary, flex: 1 },
  ccCardUsed: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.itauOrange },
  ccCardLimit: { fontSize: fontSize.xs, color: colors.textMuted },

  // Category
  categoryCard: { marginHorizontal: spacing.xl, marginBottom: spacing.md, gap: spacing.lg },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  catIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  catInfo: { flex: 1 },
  catName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  catCount: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },
  catRight: { alignItems: 'flex-end' },
  catAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  catPercentRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing['2xs'] },
  catPercent: { fontSize: fontSize.xs, color: colors.textMuted },
  catBarBg: { height: 4, backgroundColor: colors.bgInput, borderRadius: 2, overflow: 'hidden' },
  catBarFill: { height: 4, borderRadius: 2 },

  // Monthly trend
  trendCard: { marginHorizontal: spacing.xl, gap: spacing.lg },
  trendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  trendMonth: { fontSize: fontSize.xs, color: colors.textMuted, width: 40 },
  trendBars: { flex: 1, gap: spacing.xs },
  trendBarIn: { height: 4, backgroundColor: colors.success, borderRadius: 2, minWidth: 4 },
  trendBarOut: { height: 4, backgroundColor: colors.error, borderRadius: 2, minWidth: 4 },
  trendBalance: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textPrimary, width: 70, textAlign: 'right' },
  trendLegend: { flexDirection: 'row', gap: spacing.xl, justifyContent: 'center', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: fontSize.xs, color: colors.textMuted },

  // Insight
  insightCard: { marginHorizontal: spacing.xl, marginBottom: spacing.md },
  insightRow: { flexDirection: 'row', gap: spacing.lg },
  insightIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.itauOrangeSoft, alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1, gap: spacing.xs },
  insightTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  insightValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  insightMeta: { fontSize: fontSize.xs, color: colors.textMuted },

  // Empty
  emptyState: { alignItems: 'center', marginHorizontal: spacing.xl, paddingVertical: spacing['3xl'], backgroundColor: colors.bgSecondary, borderRadius: radius.xl },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.itauOrangeSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.xl, marginTop: spacing.xl },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.itauOrangeSoft, borderRadius: radius.lg, paddingVertical: spacing.lg },
  quickBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.itauOrange },

  // Calendar
  calendarCard: { marginHorizontal: spacing.xl, gap: spacing.md },
  calNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calMonthLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, textTransform: 'capitalize' },
  calWeekRow: { flexDirection: 'row' },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semibold, paddingVertical: spacing.xs },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: spacing.sm, minHeight: 44 },
  calCellSelected: { backgroundColor: colors.itauOrange, borderRadius: radius.md },
  calCellToday: { backgroundColor: colors.itauOrangeSoft, borderRadius: radius.md },
  calDayNum: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  calDayNumSelected: { color: colors.textInverse, fontWeight: fontWeight.bold },
  calDayNumToday: { color: colors.itauOrange, fontWeight: fontWeight.bold },
  calDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  calLegend: { flexDirection: 'row', gap: spacing.xl, justifyContent: 'center', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  calDetailCard: { marginHorizontal: spacing.xl, gap: spacing.md },
  calDetailTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, textTransform: 'capitalize' },
  calDetailSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  calDetailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  calDetailValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  calDetailCount: { fontSize: fontSize.xs, color: colors.textMuted, marginLeft: 'auto' },
  calTxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  calTxIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  calTxInfo: { flex: 1 },
  calTxDesc: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  calTxCat: { fontSize: fontSize.xs, color: colors.textMuted },
  calTxAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  calNoTx: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
})
