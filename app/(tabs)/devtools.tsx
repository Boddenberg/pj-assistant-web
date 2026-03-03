// ─── Dev Tools Screen ─────────────────────────────────────────────────
// Testing utilities — add balance, credit limit, generate transactions.

import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform, TextInput, Modal, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useQueryClient } from '@tanstack/react-query'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'
import { useCustomerStore } from '@/stores'
import { transactionKeys, useCreditCards, creditCardKeys, financialKeys } from '@/hooks'
import { httpClient, formatCurrency, AppError } from '@/lib'

interface DevAction {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle: string
  color: string
  bg: string
}

interface GeneratedTransaction {
  id?: string
  date?: string
  description?: string
  amount?: number
  type?: string
  category?: string
}

export default function DevToolsScreen() {
  const queryClient = useQueryClient()
  const customerId = useCustomerStore((s) => s.customerId)
  const { data: cards } = useCreditCards(customerId)
  const [loading, setLoading] = useState<string | null>(null)
  const [balanceAmount, setBalanceAmount] = useState(10000)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [generatedTxs, setGeneratedTxs] = useState<GeneratedTransaction[]>([])
  const [showTxModal, setShowTxModal] = useState(false)

  // Credit card purchase state
  const [ccPurchaseAmount, setCcPurchaseAmount] = useState('150')
  const [ccSelectedCard, setCcSelectedCard] = useState<string | null>(null)
  const [ccPurchaseCount, setCcPurchaseCount] = useState(3)

  const activeCards = cards?.filter((c) => c.status === 'active') ?? []

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const runAction = useCallback(async (action: string, body: Record<string, unknown>) => {
    setLoading(action)
    setLastResult(null)
    haptic()
    try {
      const { data } = await httpClient.post(`/v1/dev/${action}`, {
        customerId: customerId ?? 'dev-customer',
        ...body,
      })

      // For generate-transactions, use backend's summary fields
      if (action === 'generate-transactions') {
        // Backend returns: { success, generated, income, expenses, netImpact, message, transactions? }
        const count = data?.generated ?? 0
        const totalIn = data?.income ?? 0
        const totalOut = data?.expenses ?? 0
        const netImpact = data?.netImpact ?? (totalIn - totalOut)

        // Also capture transactions list for detail popup if available
        const txList: GeneratedTransaction[] = Array.isArray(data?.transactions)
          ? data.transactions
          : []
        setGeneratedTxs(txList)
        if (txList.length > 0) {
          setShowTxModal(true)
        }

        setLastResult(`✅ ${count} transações geradas — receitas (${formatCurrency(totalIn)}) / despesas (${formatCurrency(totalOut)}) · Impacto no saldo: ${netImpact >= 0 ? '+' : ''}${formatCurrency(netImpact)}`)
      } else if (action === 'add-balance') {
        // Also generate a credit transaction so it shows as income in financial analysis
        try {
          await httpClient.post(`/v1/dev/generate-transactions`, {
            customerId: customerId ?? 'dev-customer',
            count: 1,
            period: 'current-month',
            forceType: 'credit',
            forceAmount: body.amount,
            forceDescription: 'Depósito / Aporte',
          })
        } catch { /* best-effort — backend may not support forceType */ }
        setLastResult(`✅ ${action}: Saldo atualizado — ${formatCurrency(data?.newBalance ?? body.amount as number)}`)
      } else {
        setLastResult(`✅ ${action}: ${JSON.stringify(data).slice(0, 120)}`)
      }

      // Refresh balance & transactions on Home after any dev action
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: creditCardKeys.all })
      queryClient.invalidateQueries({ queryKey: financialKeys.all })
    } catch (err) {
      const msg = err instanceof AppError ? err.message : 'Erro desconhecido'
      setLastResult(`❌ ${action}: ${msg}`)
    } finally {
      setLoading(null)
    }
  }, [customerId, queryClient])

  const BALANCE_PRESETS = [1000, 5000, 10000, 50000, 100000]

  return (
    <>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Warning banner */}
      <View style={styles.banner}>
        <Ionicons name="construct" size={20} color={colors.warning} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Modo Desenvolvedor</Text>
          <Text style={styles.bannerSubtitle}>Ferramentas de teste — não disponível em produção</Text>
        </View>
      </View>

      {/* Add Balance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.successLight }]}>  
            <Ionicons name="cash-outline" size={20} color={colors.success} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Adicionar Saldo</Text>
            <Text style={styles.sectionSubtitle}>Crédito direto na conta</Text>
          </View>
        </View>

        <View style={styles.presetRow}>
          {BALANCE_PRESETS.map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.presetChip, balanceAmount === v && styles.presetChipActive]}
              onPress={() => setBalanceAmount(v)}
            >
              <Text style={[styles.presetText, balanceAmount === v && styles.presetTextActive]}>
                {formatCurrency(v)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.success }]}
          onPress={() => runAction('add-balance', { amount: balanceAmount })}
          disabled={loading === 'add-balance'}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.textInverse} />
          <Text style={styles.actionBtnText}>
            {loading === 'add-balance' ? 'Adicionando...' : `Adicionar ${formatCurrency(balanceAmount)}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Generate Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.itauOrangeSoft }]}>  
            <Ionicons name="shuffle-outline" size={20} color={colors.itauOrange} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Transações Aleatórias</Text>
            <Text style={styles.sectionSubtitle}>Gera movimentações para teste</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.itauOrange }]}
          onPress={() => runAction('generate-transactions', { count: 10, period: 'current-month' })}
          disabled={loading === 'generate-transactions'}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.textInverse} />
          <Text style={styles.actionBtnText}>
            {loading === 'generate-transactions' ? 'Gerando...' : 'Gerar no mês atual'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.itauNavy }]}
          onPress={() => runAction('generate-transactions', { count: 30, period: 'last-12-months' })}
          disabled={loading === 'generate-transactions'}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={20} color={colors.textInverse} />
          <Text style={styles.actionBtnText}>
            {loading === 'generate-transactions' ? 'Gerando...' : 'Gerar últimos 12 meses'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Credit Card Purchases */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#FDE8E8' }]}>
            <Ionicons name="cart-outline" size={20} color={colors.error} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Compras no Cartão</Text>
            <Text style={styles.sectionSubtitle}>Adiciona compras na fatura do cartão</Text>
          </View>
        </View>

        {activeCards.length > 0 ? (
          <>
            {/* Card selector */}
            <Text style={styles.fieldLabel}>Selecionar cartão</Text>
            <View style={styles.presetRow}>
              {activeCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.presetChip, ccSelectedCard === card.id && styles.presetChipActive]}
                  onPress={() => setCcSelectedCard(card.id)}
                >
                  <Text style={[styles.presetText, ccSelectedCard === card.id && styles.presetTextActive]}>
                    •••• {card.lastFourDigits}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount input */}
            <Text style={styles.fieldLabel}>Valor da compra (R$)</Text>
            <TextInput
              style={styles.textInput}
              value={ccPurchaseAmount}
              onChangeText={setCcPurchaseAmount}
              keyboardType="numeric"
              placeholder="150.00"
              placeholderTextColor={colors.textMuted}
            />

            {/* Count for random purchases */}
            <Text style={styles.fieldLabel}>Quantidade (para datas aleatórias)</Text>
            <View style={styles.presetRow}>
              {[1, 3, 5, 10].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.presetChip, ccPurchaseCount === n && styles.presetChipActive]}
                  onPress={() => setCcPurchaseCount(n)}
                >
                  <Text style={[styles.presetText, ccPurchaseCount === n && styles.presetTextActive]}>{n}x</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action buttons */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error }]}
              onPress={async () => {
                if (!ccSelectedCard) { Alert.alert('Cartão', 'Selecione um cartão primeiro.'); return }
                const card = activeCards.find((c) => c.id === ccSelectedCard)
                const purchaseVal = parseFloat(ccPurchaseAmount) || 150
                setLoading('add-card-purchase')
                setLastResult(null)
                haptic()
                try {
                  await httpClient.post(`/v1/dev/card-purchase`, {
                    customerId: customerId ?? '',
                    cardId: ccSelectedCard,
                    amount: purchaseVal,
                    count: 1,
                  })
                  queryClient.invalidateQueries({ queryKey: creditCardKeys.all })
                  setLastResult(`✅ Compra de ${formatCurrency(purchaseVal)} adicionada ao cartão •••• ${card?.lastFourDigits}`)
                } catch (err) {
                  setLastResult(`❌ ${err instanceof AppError ? err.message : 'Erro ao adicionar compra'}`)
                } finally {
                  setLoading(null)
                }
              }}
              disabled={loading === 'add-card-purchase'}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.textInverse} />
              <Text style={styles.actionBtnText}>
                {loading === 'add-card-purchase' ? 'Adicionando...' : 'Adicionar compra hoje'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={async () => {
                if (!ccSelectedCard) { Alert.alert('Cartão', 'Selecione um cartão primeiro.'); return }
                const card = activeCards.find((c) => c.id === ccSelectedCard)
                const purchaseVal = parseFloat(ccPurchaseAmount) || 150
                setLoading('add-card-purchase')
                setLastResult(null)
                haptic()
                try {
                  await httpClient.post(`/v1/dev/card-purchase`, {
                    customerId: customerId ?? '',
                    cardId: ccSelectedCard,
                    amount: purchaseVal,
                    count: ccPurchaseCount,
                  })
                  queryClient.invalidateQueries({ queryKey: creditCardKeys.all })
                  setLastResult(`✅ ${ccPurchaseCount} compra(s) de ${formatCurrency(purchaseVal)} adicionada(s) ao cartão •••• ${card?.lastFourDigits}`)
                } catch (err) {
                  setLastResult(`❌ ${err instanceof AppError ? err.message : 'Erro ao adicionar compras'}`)
                } finally {
                  setLoading(null)
                }
              }}
              disabled={loading === 'add-card-purchase'}
              activeOpacity={0.7}
            >
              <Ionicons name="shuffle-outline" size={20} color={colors.textInverse} />
              <Text style={styles.actionBtnText}>
                {loading === 'add-card-purchase' ? 'Adicionando...' : `Adicionar ${ccPurchaseCount}x em datas aleatórias`}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noCardsText}>Nenhum cartão ativo. Contrate um cartão primeiro.</Text>
        )}
      </View>

      {/* Result feedback */}
      {lastResult && (
        <View style={[styles.resultBanner, lastResult.startsWith('✅') ? styles.resultSuccess : styles.resultError]}>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      )}

      <View style={{ height: spacing['4xl'] }} />
    </ScrollView>

    {/* ─── Generated Transactions Detail Modal ─────────────────── */}
    <Modal visible={showTxModal} animationType="slide" transparent>
      <TouchableOpacity
        style={styles.txModalOverlay}
        activeOpacity={1}
        onPress={() => setShowTxModal(false)}
      >
        <TouchableOpacity activeOpacity={1} style={styles.txModalSheet}>
          <View style={styles.txModalHandle} />
          <Text style={styles.txModalTitle}>Transações Geradas</Text>
          <Text style={styles.txModalSubtitle}>
            {generatedTxs.length} transação(ões) criada(s)
          </Text>

          <FlatList
            data={generatedTxs}
            keyExtractor={(item, i) => item.id ?? String(i)}
            style={styles.txModalList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isCredit = item.type === 'credit' || item.type === 'pix_received' || item.type === 'transfer_in'
              return (
                <View style={styles.txModalRow}>
                  <View style={[styles.txModalIcon, { backgroundColor: isCredit ? colors.successLight : colors.errorLight }]}>
                    <Ionicons
                      name={isCredit ? 'arrow-down' : 'arrow-up'}
                      size={14}
                      color={isCredit ? colors.success : colors.error}
                    />
                  </View>
                  <View style={styles.txModalInfo}>
                    <Text style={styles.txModalDesc} numberOfLines={1}>
                      {item.description ?? 'Transação'}
                    </Text>
                    <Text style={styles.txModalMeta}>
                      {item.category ?? '—'} • {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '—'}
                    </Text>
                  </View>
                  <Text style={[styles.txModalAmount, { color: isCredit ? colors.success : colors.error }]}>
                    {isCredit ? '+' : '-'}{formatCurrency(item.amount ?? 0)}
                  </Text>
                </View>
              )
            }}
            ListEmptyComponent={
              <Text style={styles.txModalEmpty}>Nenhuma transação retornada pelo backend.</Text>
            }
          />

          <TouchableOpacity
            style={styles.txModalCloseBtn}
            onPress={() => setShowTxModal(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.txModalCloseBtnText}>Fechar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: spacing.xl, gap: spacing.xl },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.warningLight,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  bannerSubtitle: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing['2xs'] },

  section: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sectionSubtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },

  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  presetChipActive: {
    borderColor: colors.itauOrange,
    backgroundColor: colors.itauOrangeSoft,
  },
  presetText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  presetTextActive: {
    color: colors.itauOrange,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  actionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },

  resultBanner: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  resultSuccess: { backgroundColor: colors.successLight },
  resultError: { backgroundColor: colors.errorLight },
  resultText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: -spacing.sm,
  },
  textInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  noCardsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Generated transactions modal
  txModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  txModalSheet: { backgroundColor: colors.bgSecondary, borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'], padding: spacing.xl, maxHeight: '80%' },
  txModalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderLight, alignSelf: 'center', marginBottom: spacing.lg },
  txModalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  txModalSubtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.lg },
  txModalList: { flexGrow: 0, maxHeight: 400 },
  txModalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  txModalIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txModalInfo: { flex: 1 },
  txModalDesc: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  txModalMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },
  txModalAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  txModalEmpty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  txModalCloseBtn: { backgroundColor: colors.itauOrange, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.lg },
  txModalCloseBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textInverse },
})
