// ─── Credit Card PJ Screen ───────────────────────────────────────────
// Corporate card carousel with premium visual cards per brand,
// detail panel below, invoice view, payment, contract flow.

import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Platform, Alert, Dimensions, FlatList,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Slider from '@react-native-community/slider'
import { LinearGradient } from 'expo-linear-gradient'

import { useQueryClient } from '@tanstack/react-query'
import { useCustomerStore } from '@/stores'
import {
  useCreditCards, useCreditCardInvoice, useRequestCreditCard, useCancelCreditCard,
  transactionKeys, creditCardKeys,
} from '@/hooks'
import { ActionButton, StatusBadge, SuccessSheet } from '@/components/ui'
import { formatCurrency, httpClient, AppError } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'
import type { CreditCardBrand, CreditCard, CreditCardTransaction } from '@/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH - 64
const CARD_HEIGHT = CARD_WIDTH * 0.6
const CARD_SPACING = 16

// ─── Brand Visual Config ─────────────────────────────────────────────
interface BrandTheme {
  gradient: readonly [string, string, string]
  accent: string
  label: string
  logoText: string
  chipColor: string
  textColor: string
  textSecondary: string
}

const BRAND_THEMES: Record<CreditCardBrand, BrandTheme> = {
  amex: {
    gradient: ['#2D2D2D', '#3A3A3A', '#1A1A1A'],
    accent: '#EC7000',
    label: 'Cartão Corporativo Amex',
    logoText: 'AMEX',
    chipColor: '#C0C0C0',
    textColor: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
  },
  elo: {
    gradient: ['#8C8C8C', '#A0A0A0', '#6E6E6E'],
    accent: '#EC7000',
    label: 'Cartão Corporativo Elo',
    logoText: 'ELO',
    chipColor: '#D0D0D0',
    textColor: '#1A1A1A',
    textSecondary: 'rgba(26,26,26,0.65)',
  },
  mastercard: {
    gradient: ['#EC7000', '#FF8C2E', '#CC5F00'],
    accent: '#003882',
    label: 'Cartão Corporativo Mastercard',
    logoText: 'MC',
    chipColor: '#E0E0E0',
    textColor: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.8)',
  },
  visa: {
    gradient: ['#0D1B2A', '#162D4A', '#091320'],
    accent: '#EC7000',
    label: 'Cartão Corporativo Visa',
    logoText: 'VISA',
    chipColor: '#C0C0C0',
    textColor: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
  },
}

const BRAND_ACCENT: Record<CreditCardBrand, string> = {
  amex: '#2D2D2D',
  elo: '#6E6E6E',
  mastercard: '#EC7000',
  visa: '#0D1B2A',
}

export default function CreditCardScreen() {
  const customerId = useCustomerStore((s) => s.customerId)
  const queryClient = useQueryClient()
  const { data: cards } = useCreditCards(customerId)
  const requestCard = useRequestCreditCard()
  const cancelCard = useCancelCreditCard()

  // Only active cards (filter out cancelled) — status comes from backend
  const activeCards = useMemo(() => cards?.filter((c) => c.status !== 'cancelled') ?? [], [cards])

  const hasCards = activeCards.length > 0
  const [tab, setTab] = useState<'cards' | 'offers'>('cards')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedCard = activeCards[selectedIndex] ?? null

  // Contract modal state
  const [selectedBrand, setSelectedBrand] = useState<CreditCardBrand>('visa')
  const [selectedDueDay, setSelectedDueDay] = useState(10)
  const [requestedLimit, setRequestedLimit] = useState(5000)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Invoice & payment state
  const [invoiceCard, setInvoiceCard] = useState<CreditCard | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  // Transaction detail is handled inside InvoiceView

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const openContract = useCallback((brand: CreditCardBrand) => {
    haptic()
    setSelectedBrand(brand)
    setRequestedLimit(5000)
    setShowContractModal(true)
  }, [])

  const handleContract = useCallback(async () => {
    haptic()
    try {
      await requestCard.mutateAsync({
        customerId: customerId ?? '',
        preferredBrand: selectedBrand,
        requestedLimit,
      })
      setShowContractModal(false)
      setShowSuccess(true)
    } catch (err) {
      Alert.alert(
        'Erro ao contratar',
        err instanceof AppError ? err.message : 'Não foi possível contratar o cartão. Tente novamente.',
      )
    }
  }, [customerId, selectedBrand, requestedLimit, requestCard])

  const handlePayInvoice = useCallback(async () => {
    if (!invoiceCard || invoiceCard.usedLimit <= 0) return
    haptic()
    setIsPaying(true)
    try {
      await httpClient.post(
        `/v1/customers/${customerId}/credit-cards/${invoiceCard.id}/invoice/pay`,
        { amount: invoiceCard.usedLimit, paymentType: 'total' },
      )
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: creditCardKeys.all })
      setPaymentDone(true)
      setTimeout(() => {
        setShowPaymentModal(false)
        setPaymentDone(false)
        setIsPaying(false)
        setInvoiceCard(null)
      }, 2500)
    } catch (err) {
      Alert.alert('Erro', err instanceof AppError ? err.message : 'Erro ao pagar fatura.')
      setIsPaying(false)
    }
  }, [invoiceCard, customerId, queryClient])

  const handleCancelCard = useCallback((card: CreditCard) => {
    Alert.alert(
      'Cancelar cartão',
      `Tem certeza que deseja cancelar o cartão •••• ${card.lastFourDigits} (${card.brand.toUpperCase()})?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Cancelar cartão',
          style: 'destructive',
          onPress: async () => {
            haptic()
            try {
              await cancelCard.mutateAsync({ cardId: card.id, customerId: customerId ?? '' })
              Alert.alert('Cartão cancelado', `O cartão •••• ${card.lastFourDigits} foi cancelado.`)
            } catch {
              Alert.alert('Erro', 'Não foi possível cancelar o cartão.')
            }
          },
        },
      ],
    )
  }, [customerId, cancelCard])

  // Carousel scroll handler
  const onCarouselScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING))
    if (idx >= 0 && idx < activeCards.length && idx !== selectedIndex) {
      setSelectedIndex(idx)
      haptic()
    }
  }, [activeCards.length, selectedIndex])

  // ─── Success result ──────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <SuccessSheet
        title="Cartão aprovado!"
        message={requestCard.data?.message ?? 'Seu cartão foi contratado com sucesso!'}
        details={[
          { label: 'Status', value: 'Ativo' },
          { label: 'Bandeira', value: selectedBrand.toUpperCase() },
          { label: 'Limite', value: formatCurrency(requestedLimit) },
          { label: 'Vencimento', value: `Dia ${selectedDueDay}` },
        ]}
        onDone={() => {
          setShowSuccess(false)
          setTab('cards')
        }}
      />
    )
  }

  // ─── Main render ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Tab header */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'cards' && styles.tabBtnActive]}
          onPress={() => setTab('cards')}
        >
          <Text style={[styles.tabText, tab === 'cards' && styles.tabTextActive]}>Meus Cartões</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'offers' && styles.tabBtnActive]}
          onPress={() => setTab('offers')}
        >
          <Text style={[styles.tabText, tab === 'offers' && styles.tabTextActive]}>Disponíveis</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* ─── My Cards tab ───────────────────────────────────────── */}
        {tab === 'cards' && (
          <>
            {hasCards ? (
              <>
                {/* ─── Carousel ────────────────────────────────── */}
                <FlatList
                  data={activeCards}
                  keyExtractor={(c) => c.id}
                  horizontal
                  pagingEnabled={false}
                  snapToInterval={CARD_WIDTH + CARD_SPACING}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContent}
                  onMomentumScrollEnd={onCarouselScroll}
                  renderItem={({ item, index }) => (
                    <CorporateCardVisual
                      card={item}
                      isActive={index === selectedIndex}
                    />
                  )}
                />

                {/* Dot indicators */}
                {activeCards.length > 1 && (
                  <View style={styles.dotRow}>
                    {activeCards.map((_, i) => (
                      <View
                        key={i}
                        style={[styles.dot, i === selectedIndex && styles.dotActive]}
                      />
                    ))}
                  </View>
                )}

                {/* ─── Detail Panel ──────────────────────────── */}
                {selectedCard && (
                  <CardDetailPanel
                    card={selectedCard}
                    onViewInvoice={() => { haptic(); setInvoiceCard(selectedCard) }}
                    onCancel={() => { haptic(); handleCancelCard(selectedCard) }}
                  />
                )}
              </>
            ) : (
              /* ─── Empty state with big CTA ──────────────────────── */
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="card-outline" size={48} color={colors.itauOrange} />
                </View>
                <Text style={styles.emptyTitle}>Nenhum cartão PJ</Text>
                <Text style={styles.emptySubtext}>
                  Contrate seu primeiro cartão de crédito empresarial e aproveite benefícios exclusivos.
                </Text>

                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => { haptic(); setTab('offers') }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={22} color={colors.textInverse} />
                  <Text style={styles.ctaText}>Contratar novo cartão</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ─── Offers tab ─────────────────────────────────────────── */}
        {tab === 'offers' && (
          <>
            <Text style={styles.offersTitle}>Contratar novo cartão</Text>
            <Text style={styles.offersSubtitle}>
              Escolha a bandeira do seu novo cartão corporativo PJ.
            </Text>

            {/* Brand card previews */}
            {(['visa', 'mastercard', 'elo', 'amex'] as CreditCardBrand[]).map((brand) => {
              const theme = BRAND_THEMES[brand]
              const isSelected = selectedBrand === brand
              return (
                <TouchableOpacity
                  key={brand}
                  activeOpacity={0.85}
                  onPress={() => { setSelectedBrand(brand); haptic() }}
                  style={[styles.offerCardWrap, isSelected && styles.offerCardWrapActive]}
                >
                  <LinearGradient
                    colors={theme.gradient as [string, string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.offerCardFace}
                  >
                    {/* Deco */}
                    <View style={[styles.cardDeco1, { backgroundColor: `${theme.accent}15` }]} />
                    <View style={[styles.cardDeco2, { backgroundColor: `${theme.accent}10` }]} />

                    {/* Top row */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.corporateTag}>
                        <Text style={[styles.corporateTagText, { color: theme.accent }]}>CORPORATE</Text>
                      </View>
                      <Text style={[styles.brandLogo, { color: theme.textColor }]}>{theme.logoText}</Text>
                    </View>

                    {/* Chip + contactless */}
                    <View style={styles.chipRow}>
                      <View style={[styles.chipEl, { backgroundColor: theme.chipColor }]}>
                        <View style={styles.chipLines}>
                          <View style={[styles.chipLine, { backgroundColor: `${theme.chipColor === '#D0D0D0' ? '#999' : '#A0A0A0'}` }]} />
                          <View style={[styles.chipLine, { backgroundColor: `${theme.chipColor === '#D0D0D0' ? '#999' : '#A0A0A0'}` }]} />
                          <View style={[styles.chipLine, { backgroundColor: `${theme.chipColor === '#D0D0D0' ? '#999' : '#A0A0A0'}` }]} />
                        </View>
                      </View>
                      <Ionicons name="wifi-outline" size={16} color={theme.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
                    </View>

                    {/* Card number placeholder */}
                    <Text style={[styles.cardNumberText, { color: theme.textColor, fontSize: fontSize.sm }]}>
                      •••• •••• •••• ••••
                    </Text>

                    {/* Bottom */}
                    <View style={styles.cardBottomRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.holderLabel, { color: theme.textSecondary }]}>CARTÃO CORPORATIVO</Text>
                        <Text style={[styles.holderName, { color: theme.textColor }]}>{theme.label.replace('Cartão Corporativo ', '')}</Text>
                      </View>
                      <View style={styles.bankLogo}>
                        <Text style={[styles.bankLogoText, { color: theme.accent }]}>itaú</Text>
                        <Text style={[styles.bankPJ, { color: theme.textSecondary }]}>PJ</Text>
                      </View>
                    </View>

                    {/* Accent stripe */}
                    <View style={[styles.accentStripe, { backgroundColor: theme.accent }]} />
                  </LinearGradient>

                  {/* Selected indicator */}
                  {isSelected && (
                    <View style={styles.offerSelectedBadge}>
                      <Ionicons name="checkmark-circle" size={22} color={colors.itauOrange} />
                      <Text style={styles.offerSelectedText}>Selecionado</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}

            <ActionButton
              title={`Solicitar ${BRAND_THEMES[selectedBrand].logoText}`}
              onPress={() => openContract(selectedBrand)}
            />
          </>
        )}
      </ScrollView>

      {/* ─── Invoice View ───────────────────────────────────────────── */}
      {invoiceCard && (
        <InvoiceView
          card={invoiceCard}
          onClose={() => setInvoiceCard(null)}
          onPayPress={() => setShowPaymentModal(true)}
        />
      )}

      {/* ─── Contract Modal (slider + due day) ──────────────────────── */}
      <Modal visible={showContractModal} animationType="slide" transparent onRequestClose={() => setShowContractModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowContractModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
          <ScrollView contentContainerStyle={styles.contractScroll}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.modalTitle}>Contratar cartão {selectedBrand.toUpperCase()}</Text>

              {/* Limite — backend valida os limites mín/máx permitidos */}
              <Text style={styles.fieldLabel}>Limite desejado</Text>
              <Text style={styles.sliderValue}>{formatCurrency(requestedLimit)}</Text>

              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1000}
                maximumValue={50000}
                step={100}
                value={requestedLimit}
                onValueChange={(v) => setRequestedLimit(Math.round(v / 100) * 100)}
                minimumTrackTintColor={colors.itauOrange}
                maximumTrackTintColor={colors.bgInput}
                thumbTintColor={colors.itauOrange}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderMinMax}>{formatCurrency(1000)}</Text>
                <Text style={styles.sliderMinMax}>{formatCurrency(50000)}</Text>
              </View>

              <Text style={styles.fieldLabel}>Dia do vencimento da fatura</Text>
              <View style={styles.dueDayRow}>
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dueDayChip, selectedDueDay === d && styles.dueDayChipActive]}
                    onPress={() => setSelectedDueDay(d)}
                  >
                    <Text style={[styles.dueDayText, selectedDueDay === d && styles.dueDayTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.summaryCard}>
                <SummaryLine label="Bandeira" value={selectedBrand.toUpperCase()} />
                <SummaryLine label="Limite" value={formatCurrency(requestedLimit)} />
                <SummaryLine label="Vencimento" value={`Dia ${selectedDueDay}`} />
              </View>

              <View style={styles.btnRow}>
                <ActionButton title="Cancelar" onPress={() => setShowContractModal(false)} variant="secondary" />
                <ActionButton title="Contratar" onPress={handleContract} loading={requestCard.isPending} />
              </View>
            </View>
          </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Payment Modal ──────────────────────────────────────────── */}
      <Modal visible={showPaymentModal} animationType="fade" transparent onRequestClose={() => { setShowPaymentModal(false); setIsPaying(false) }}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { if (!isPaying && !paymentDone) { setShowPaymentModal(false); setIsPaying(false) } }}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalSheet, { maxHeight: 480 }]}>
            <View style={styles.sheetHandle} />
            {paymentDone ? (
              <View style={styles.paymentDone}>
                <View style={styles.paymentCheck}>
                  <Ionicons name="checkmark" size={32} color={colors.textInverse} />
                </View>
                <Text style={styles.paymentDoneTitle}>Fatura paga!</Text>
                <Text style={styles.paymentDoneSub}>
                  O valor de {invoiceCard ? formatCurrency(invoiceCard.usedLimit) : ''} foi debitado do seu saldo.
                </Text>
                <View style={styles.receiptCard}>
                  <SummaryLine label="Cartão" value={`•••• ${invoiceCard?.lastFourDigits ?? ''}`} />
                  <SummaryLine label="Valor pago" value={invoiceCard ? formatCurrency(invoiceCard.usedLimit) : ''} />
                  <SummaryLine label="Data" value={new Date().toLocaleDateString('pt-BR')} />
                  <SummaryLine
                    label="Hora"
                    value={new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Pagar fatura</Text>
                <Text style={styles.paymentSub}>Cartão •••• {invoiceCard?.lastFourDigits}</Text>
                <View style={styles.paymentBox}>
                  <Text style={styles.paymentLabel}>Valor total pendente</Text>
                  <Text style={styles.paymentValue}>
                    {invoiceCard ? formatCurrency(invoiceCard.usedLimit) : ''}
                  </Text>
                  <Text style={styles.paymentNote}>Será debitado do seu saldo em conta</Text>
                </View>
                <View style={styles.btnRow}>
                  <ActionButton
                    title="Cancelar"
                    onPress={() => { setShowPaymentModal(false); setIsPaying(false) }}
                    variant="secondary"
                  />
                  <ActionButton title="Pagar fatura" onPress={handlePayInvoice} loading={isPaying} />
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Invoice Sub-view ────────────────────────────────────────────────
function InvoiceView({
  card,
  onClose,
  onPayPress,
}: {
  card: CreditCard
  onClose: () => void
  onPayPress: () => void
}) {
  const month = new Date().toISOString().slice(0, 7)
  const { data: invoice } = useCreditCardInvoice(card.id, month)
  const [detailTx, setDetailTx] = useState<CreditCardTransaction | null>(null)
  const insets = useSafeAreaInsets()
  const theme = BRAND_THEMES[card.brand] ?? BRAND_THEMES.visa

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.invoiceSafe, { paddingTop: insets.top }]}>
        <View style={styles.invoiceHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.invoiceBackBtn}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.6}
          >
            <Ionicons name="arrow-back" size={22} color={colors.itauOrange} />
            <Text style={styles.invoiceBackText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.invoiceHTitle}>Fatura Atual</Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Summary */}
          <View style={styles.invoiceSummary}>
            <Text style={styles.invoiceSumLabel}>{theme.label} · •••• {card.lastFourDigits}</Text>
            <Text style={styles.invoiceTotal}>
              {invoice ? formatCurrency(invoice.totalAmount) : formatCurrency(card.usedLimit)}
            </Text>
            <Text style={styles.invoiceDue}>Vencimento: dia {card.dueDay}</Text>
            <StatusBadge
              label={card.usedLimit === 0 ? 'Sem pendências' : 'Pendente'}
              variant={card.usedLimit === 0 ? 'success' : 'warning'}
            />
          </View>

          {/* Transactions */}
          {invoice && invoice.transactions.length > 0 ? (
            <View style={styles.invoiceTxList}>
              <Text style={styles.invoiceTxTitle}>Compras do cartão</Text>
              {invoice.transactions.map((tx, i) => (
                <TouchableOpacity
                  key={tx.id ?? i}
                  style={styles.invoiceTxRow}
                  onPress={() => setDetailTx(tx)}
                  activeOpacity={0.6}
                >
                  <View style={styles.invoiceTxIcon}>
                    <Ionicons name="cart-outline" size={16} color={colors.itauOrange} />
                  </View>
                  <View style={styles.invoiceTxInfo}>
                    <Text style={styles.invoiceTxDesc} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.invoiceTxMeta}>
                      {tx.category}{tx.installment ? ` · ${tx.installment}` : ''} · {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <View style={styles.invoiceTxRight}>
                    <Text style={styles.invoiceTxAmount}>{formatCurrency(tx.amount)}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : card.usedLimit > 0 ? (
            <View style={styles.emptyInvoice}>
              <Text style={styles.emptySubtext}>Total utilizado: {formatCurrency(card.usedLimit)}</Text>
            </View>
          ) : (
            <View style={styles.emptyInvoice}>
              <Ionicons name="checkmark-circle" size={36} color={colors.success} />
              <Text style={styles.emptyTitle}>Tudo em dia!</Text>
              <Text style={styles.emptySubtext}>Nenhuma compra pendente</Text>
            </View>
          )}

          {/* Pay button */}
          {card.usedLimit > 0 && (
            <ActionButton title="Pagar fatura" onPress={onPayPress} />
          )}

          {/* Extra bottom spacing for safe area */}
          <View style={{ height: Platform.OS === 'ios' ? 34 : 16 }} />
        </ScrollView>
      </View>

      {/* Transaction detail popup — inside the invoice modal so it renders on top */}
      <Modal visible={!!detailTx} animationType="fade" transparent onRequestClose={() => setDetailTx(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailTx(null)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalSheet, { maxHeight: 420 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Detalhes da compra</Text>
            {detailTx && (
              <View style={styles.txDetailContent}>
                <View style={styles.txDetailIconWrap}>
                  <Ionicons name="cart" size={28} color={colors.itauOrange} />
                </View>
                <Text style={styles.txDetailAmount}>{formatCurrency(detailTx.amount)}</Text>
                <Text style={styles.txDetailDesc}>{detailTx.description}</Text>
                <View style={styles.txDetailGrid}>
                  <SummaryLine label="Data" value={new Date(detailTx.date).toLocaleDateString('pt-BR')} />
                  <SummaryLine
                    label="Hora"
                    value={new Date(detailTx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <SummaryLine label="Categoria" value={detailTx.category || '—'} />
                  {detailTx.installment && <SummaryLine label="Parcela" value={detailTx.installment} />}
                  <SummaryLine label="Cartão" value={`•••• ${card.lastFourDigits}`} />
                  <SummaryLine label="Bandeira" value={card.brand.toUpperCase()} />
                </View>
              </View>
            )}
            <ActionButton title="Fechar" onPress={() => setDetailTx(null)} variant="secondary" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  )
}

// ─── Helper components ───────────────────────────────────────────────
function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

// ─── Corporate Card Visual ───────────────────────────────────────────
function CorporateCardVisual({ card, isActive }: { card: CreditCard; isActive: boolean }) {
  const theme = BRAND_THEMES[card.brand] ?? BRAND_THEMES.visa

  return (
    <View style={[styles.cardWrapper, isActive && styles.cardWrapperActive]}>
      <LinearGradient
        colors={theme.gradient as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardFace}
      >
        {/* Decorative shapes */}
        <View style={[styles.cardDeco1, { backgroundColor: `${theme.accent}15` }]} />
        <View style={[styles.cardDeco2, { backgroundColor: `${theme.accent}10` }]} />

        {/* Top row: Corporate label + Brand logo */}
        <View style={styles.cardTopRow}>
          <View style={styles.corporateTag}>
            <Text style={[styles.corporateTagText, { color: theme.accent }]}>CORPORATE</Text>
          </View>
          <Text style={[styles.brandLogo, { color: theme.textColor }]}>{theme.logoText}</Text>
        </View>

        {/* Chip */}
        <View style={styles.chipRow}>
          <View style={[styles.chipEl, { backgroundColor: theme.chipColor }]}>
            <View style={styles.chipLines}>
              <View style={[styles.chipLine, { backgroundColor: `${theme.chipColor === '#D0D0D0' ? '#999' : '#A0A0A0'}` }]} />
              <View style={[styles.chipLine, { backgroundColor: `${theme.chipColor === '#D0D0D0' ? '#999' : '#A0A0A0'}` }]} />
              <View style={[styles.chipLine, { backgroundColor: `${theme.chipColor === '#D0D0D0' ? '#999' : '#A0A0A0'}` }]} />
            </View>
          </View>
          <Ionicons name="wifi-outline" size={18} color={theme.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
        </View>

        {/* Card number */}
        <Text style={[styles.cardNumberText, { color: theme.textColor }]}>
          •••• •••• •••• {card.lastFourDigits}
        </Text>

        {/* Bottom row: holder + bank */}
        <View style={styles.cardBottomRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.holderLabel, { color: theme.textSecondary }]}>PORTADOR</Text>
            <Text style={[styles.holderName, { color: theme.textColor }]} numberOfLines={1}>
              {card.holderName || 'TITULAR'}
            </Text>
          </View>
          <View style={styles.bankLogo}>
            <Text style={[styles.bankLogoText, { color: theme.accent }]}>itaú</Text>
            <Text style={[styles.bankPJ, { color: theme.textSecondary }]}>PJ</Text>
          </View>
        </View>

        {/* Accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: theme.accent }]} />
      </LinearGradient>
    </View>
  )
}

// ─── Detail Panel (below carousel) ──────────────────────────────────
function CardDetailPanel({
  card,
  onViewInvoice,
  onCancel,
}: {
  card: CreditCard
  onViewInvoice: () => void
  onCancel: () => void
}) {
  const theme = BRAND_THEMES[card.brand] ?? BRAND_THEMES.visa
  const accent = BRAND_ACCENT[card.brand] ?? colors.itauNavy
  const usagePercent = card.limit > 0 ? Math.min((card.usedLimit / card.limit) * 100, 100) : 0

  return (
    <View style={styles.detailPanel}>
      {/* Header */}
      <View style={styles.detailPanelHeader}>
        <View style={[styles.detailBrandDot, { backgroundColor: accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.detailCardName}>{theme.label}</Text>
          <Text style={styles.detailCardSub}>
            {card.cardType === 'corporate' ? 'Corporate PJ' : (card.cardType || 'PJ')} · •••• {card.lastFourDigits}
          </Text>
        </View>
        <StatusBadge label="Ativo" variant="success" />
      </View>

      {/* Identification */}
      <View style={styles.detailSection}>
        <DetailInfoRow icon="person-outline" label="Portador" value={card.holderName || '—'} />
        <DetailInfoRow icon="card-outline" label="Bandeira" value={card.brand.toUpperCase()} />
        <DetailInfoRow icon="business-outline" label="Tipo" value={card.cardType === 'corporate' ? 'Corporate PJ' : (card.cardType || 'PJ')} />
        <DetailInfoRow icon="calendar-outline" label="Vencimento" value={`Dia ${card.dueDay}`} />
        <DetailInfoRow icon="today-outline" label="Fechamento" value={`Dia ${card.closingDay}`} />
      </View>

      {/* Financial block */}
      <View style={styles.detailFinancial}>
        <View style={styles.limitGrid}>
          <View style={styles.limitGridItem}>
            <Text style={styles.limitGridLabel}>Limite Total</Text>
            <Text style={styles.limitGridValue}>{formatCurrency(card.limit)}</Text>
          </View>
          <View style={styles.limitGridItem}>
            <Text style={styles.limitGridLabel}>Utilizado</Text>
            <Text style={[styles.limitGridValue, { color: card.usedLimit > 0 ? colors.itauOrange : colors.textPrimary }]}>
              {formatCurrency(card.usedLimit)}
            </Text>
          </View>
          <View style={[styles.limitGridItem, styles.limitGridItemFull]}>
            <Text style={styles.limitGridLabel}>Disponível</Text>
            <Text style={[styles.limitGridValue, { color: colors.success }]}>
              {formatCurrency(card.availableLimit)}
            </Text>
          </View>
        </View>

        {/* Usage bar */}
        <View style={styles.usageBarContainer}>
          <View style={styles.usageBarBg}>
            <View style={[styles.usageBarFill, { width: `${usagePercent}%`, backgroundColor: accent }]} />
          </View>
          <Text style={styles.usagePercent}>{usagePercent.toFixed(0)}% utilizado</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.detailActions}>
        <ActionIconButton icon="receipt-outline" label="Ver Fatura" color={accent} onPress={onViewInvoice} />
        <ActionIconButton icon="phone-portrait-outline" label="Cartão Virtual" color={colors.itauBlue} onPress={() => Alert.alert('Cartão Virtual', 'Em breve!')} />
        <ActionIconButton icon="lock-closed-outline" label="Bloquear" color={colors.warning} onPress={() => Alert.alert('Bloqueio', 'Em breve!')} />
        <ActionIconButton icon="close-circle-outline" label="Cancelar" color={colors.error} onPress={onCancel} />
      </View>
    </View>
  )
}

function ActionIconButton({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionIconBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIconCircle, { backgroundColor: `${color}12` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionIconLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  )
}

function DetailInfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailInfoRow}>
      <View style={styles.detailInfoLeft}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
        <Text style={styles.detailInfoLabel}>{label}</Text>
      </View>
      <Text style={styles.detailInfoValue}>{value}</Text>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing['4xl'] },

  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.md },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.full, backgroundColor: colors.bgInput },
  tabBtnActive: { backgroundColor: colors.itauOrange },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted },
  tabTextActive: { color: colors.textInverse },

  // ─── Carousel ──────────────────────────────────────────────────────
  carouselContent: { paddingHorizontal: 32 },

  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
    transform: [{ scale: 0.95 }],
    opacity: 0.75,
  },
  cardWrapperActive: {
    transform: [{ scale: 1 }],
    opacity: 1,
  },
  cardFace: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: radius.xl,
    padding: spacing.xl,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadow.lg,
  },
  cardDeco1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
  },
  cardDeco2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -50,
    left: -30,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  corporateTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  corporateTagText: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.bold,
    letterSpacing: 1.5,
  },
  brandLogo: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: 2,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chipEl: {
    width: 40,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chipLines: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-evenly',
    paddingHorizontal: 4,
  },
  chipLine: {
    height: 1.5,
    borderRadius: 1,
  },
  cardNumberText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  holderLabel: {
    fontSize: 8,
    fontWeight: fontWeight.medium,
    letterSpacing: 1,
    marginBottom: 2,
  },
  holderName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  bankLogo: {
    alignItems: 'flex-end',
  },
  bankLogoText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    fontStyle: 'italic',
  },
  bankPJ: {
    fontSize: 8,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginTop: -2,
  },
  accentStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },

  // Dot indicators
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    backgroundColor: colors.itauOrange,
    width: 24,
  },

  // ─── Detail Panel ──────────────────────────────────────────────────
  detailPanel: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xl,
    ...shadow.sm,
  },
  detailPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailBrandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailCardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  detailCardSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  detailSection: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailInfoLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  detailInfoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  detailFinancial: {
    gap: spacing.lg,
  },
  limitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  limitGridItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  limitGridItemFull: {
    flex: 2,
    minWidth: '90%',
  },
  limitGridLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  limitGridValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  usageBarContainer: {
    gap: spacing.xs,
  },
  usageBarBg: {
    height: 6,
    backgroundColor: colors.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: 6,
    borderRadius: 3,
  },
  usagePercent: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionIconBtn: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 72,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconLabel: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ─── Empty state ──────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: spacing['3xl'], backgroundColor: colors.bgSecondary, borderRadius: radius.xl, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.itauOrangeSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.itauOrange, borderRadius: radius.xl,
    paddingVertical: spacing.xl, paddingHorizontal: spacing['2xl'],
    ...shadow.md,
  },
  ctaText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textInverse },

  // Offers
  offersTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  offersSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -spacing.md },

  // Offer card previews
  offerCardWrap: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  offerCardWrapActive: {
    borderColor: colors.itauOrange,
    ...shadow.md,
  },
  offerCardFace: {
    width: '100%',
    height: CARD_HEIGHT * 0.85,
    borderRadius: radius.xl - 2,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  offerSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.itauOrangeSoft,
  },
  offerSelectedText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.itauOrange,
  },

  // Contract modal
  contractScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bgSecondary, borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'], padding: spacing.xl, gap: spacing.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderLight, alignSelf: 'center' },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary },
  btnRow: { flexDirection: 'row', gap: spacing.md },

  // Slider visual
  sliderValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.itauOrange, textAlign: 'center' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderMinMax: { fontSize: fontSize.xs, color: colors.textMuted },

  dueDayRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  dueDayChip: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgInput, borderWidth: 1.5, borderColor: colors.borderLight },
  dueDayChipActive: { borderColor: colors.itauOrange, backgroundColor: colors.itauOrangeSoft },
  dueDayText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted },
  dueDayTextActive: { color: colors.itauOrange },

  summaryCard: { backgroundColor: colors.bgInput, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  summaryValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },

  // Payment
  paymentSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -spacing.sm },
  paymentBox: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.bgInput, borderRadius: radius.xl, gap: spacing.sm },
  paymentLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  paymentValue: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.itauOrange },
  paymentNote: { fontSize: fontSize.xs, color: colors.textMuted },
  paymentDone: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.lg },
  paymentCheck: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  paymentDoneTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  paymentDoneSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  receiptCard: { width: '100%', backgroundColor: colors.bgInput, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },

  // Invoice
  invoiceSafe: { flex: 1, backgroundColor: colors.bgPrimary },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  invoiceBackBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minWidth: 80, paddingVertical: spacing.sm },
  invoiceBackText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.itauOrange },
  invoiceHTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  invoiceSummary: { backgroundColor: colors.bgSecondary, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, ...shadow.sm },
  invoiceSumLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  invoiceTotal: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  invoiceDue: { fontSize: fontSize.xs, color: colors.textMuted },
  invoiceTxList: { backgroundColor: colors.bgSecondary, borderRadius: radius.xl, padding: spacing.lg, ...shadow.sm },
  invoiceTxTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.lg },
  invoiceTxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  invoiceTxIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.itauOrangeSoft, alignItems: 'center', justifyContent: 'center' },
  invoiceTxInfo: { flex: 1 },
  invoiceTxDesc: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  invoiceTxMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },
  invoiceTxRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  invoiceTxAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
  emptyInvoice: { alignItems: 'center', paddingVertical: spacing['3xl'], backgroundColor: colors.bgSecondary, borderRadius: radius.xl, gap: spacing.md },

  // Transaction detail
  txDetailContent: { alignItems: 'center', gap: spacing.lg },
  txDetailIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.itauOrangeSoft, alignItems: 'center', justifyContent: 'center' },
  txDetailAmount: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  txDetailDesc: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  txDetailGrid: { width: '100%', backgroundColor: colors.bgInput, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
})
