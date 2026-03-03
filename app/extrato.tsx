// ─── Extrato Screen ──────────────────────────────────────────────────
// Account statement — shows Pix, debit purchases, and other movements.

import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { useCustomerStore } from '@/stores'
import { useTransactions, transactionKeys, financialKeys } from '@/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { ActionButton } from '@/components/ui'
import { formatCurrency } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'
import type { Transaction } from '@/types'

function getTransactionIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'pix_sent': return 'arrow-up-outline'
    case 'pix_received': return 'arrow-down-outline'
    case 'debit_purchase': return 'cart-outline'
    case 'credit_purchase': return 'card-outline'
    case 'transfer_in': return 'arrow-down-outline'
    case 'transfer_out': return 'arrow-up-outline'
    case 'bill_payment': return 'receipt-outline'
    default: return 'swap-horizontal-outline'
  }
}

function getTransactionColor(_type: string, amount: number) {
  // Use amount sign from backend
  return amount >= 0 ? colors.success : colors.error
}

function isInflow(_type: string, amount: number) {
  // Use amount sign from backend
  return amount >= 0
}

export default function ExtratoScreen() {
  const customerId = useCustomerStore((s) => s.customerId)
  const { data: transactions, isLoading, isRefetching, refetch } = useTransactions(customerId)
  const queryClient = useQueryClient()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    queryClient.invalidateQueries({ queryKey: financialKeys.all })
    refetch()
  }, [queryClient, refetch])

  const filtered = useMemo(() => {
    if (!transactions) return []
    // All filtering/classification is done by backend — front just displays
    return transactions
  }, [transactions])

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.itauOrange}
            colors={[colors.itauOrange]}
          />
        }
      >
        <Text style={styles.title}>Extrato</Text>
        <Text style={styles.subtitle}>Movimentações da sua conta PJ</Text>

        {/* Transaction list */}
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Carregando...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma movimentação</Text>
            <Text style={styles.emptySubtext}>
              Suas transações de Pix e débito aparecerão aqui
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filtered.map((tx, index) => {
              const iconColor = getTransactionColor(tx.type, tx.amount)
              const inflow = isInflow(tx.type, tx.amount)
              return (
                <View key={tx.id ?? index}>
                  <TouchableOpacity
                    style={styles.txRow}
                    onPress={() => setSelectedTx(tx)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.txIcon, { backgroundColor: `${iconColor}15` }]}>
                      <Ionicons name={getTransactionIcon(tx.type)} size={18} color={iconColor} />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                      <Text style={styles.txMeta}>
                        {tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        {tx.date ? ` · ${new Date(tx.date).toLocaleDateString('pt-BR')}` : ''}
                      </Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: inflow ? colors.success : colors.textPrimary }]}>
                        {inflow ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                  {index < filtered.length - 1 && <View style={styles.txDivider} />}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal visible={!!selectedTx} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Detalhes da movimentação</Text>
            {selectedTx && (() => {
              const inflow = isInflow(selectedTx.type, selectedTx.amount)
              const iconColor = getTransactionColor(selectedTx.type, selectedTx.amount)
              return (
                <View style={styles.detailContent}>
                  <View style={[styles.detailIconWrap, { backgroundColor: `${iconColor}15` }]}>
                    <Ionicons name={getTransactionIcon(selectedTx.type)} size={28} color={iconColor} />
                  </View>
                  <Text style={[styles.detailAmount, { color: inflow ? colors.success : colors.textPrimary }]}>
                    {inflow ? '+' : '-'} {formatCurrency(Math.abs(selectedTx.amount))}
                  </Text>
                  <Text style={styles.detailDesc}>{selectedTx.description}</Text>
                  <View style={styles.detailGrid}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tipo</Text>
                      <Text style={styles.detailValue}>
                        {selectedTx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Data</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedTx.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hora</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedTx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Categoria</Text>
                      <Text style={styles.detailValue}>{selectedTx.category || '—'}</Text>
                    </View>
                    {selectedTx.counterparty && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Contraparte</Text>
                        <Text style={styles.detailValue}>{selectedTx.counterparty}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )
            })()}
            <ActionButton title="Fechar" onPress={() => setSelectedTx(null)} variant="secondary" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing['4xl'] },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -spacing.md },

  listCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  txMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing['2xs'],
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 56,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing.xl,
    gap: spacing.lg,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  detailContent: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  detailIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAmount: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  detailDesc: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailGrid: {
    width: '100%',
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
})
