// ─── Credit Card PJ — Clean & Minimal ────────────────────────────────

import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Platform, Alert, Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Slider from '@react-native-community/slider'

import { useQueryClient } from '@tanstack/react-query'
import { useCustomerStore } from '@/stores'
import {
  useCreditCards, useCreditCardInvoice, useRequestCreditCard, useCancelCreditCard,
  useCreditLimit, useAvailableCards, transactionKeys, creditCardKeys, accountKeys,
} from '@/hooks'
import { ActionButton, StatusBadge, SuccessSheet } from '@/components/ui'
import { formatCurrency, AppError } from '@/lib'
import { creditCardService } from '@/services'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'
import type { CreditCard, CreditCardTransaction, CardProduct, CardProductId, AvailableCardProduct } from '@/types'

const { width: SW } = Dimensions.get('window')

// ─── Visual config per product (not from API) ────────────────────────

interface ProductVisual {
  gradient: readonly [string, string, string]
  accent: string
  textColor: string
  textSecondary: string
  logoText: string
}

const PRODUCT_VISUALS: Record<CardProductId, ProductVisual> = {
  'itau-pj-basic': {
    gradient: ['#F5F5F8', '#EAEAEF', '#E0E0E5'], accent: '#EC7000',
    textColor: '#1A1A1A', textSecondary: '#8C8C8C', logoText: 'BASIC',
  },
  'itau-pj-gold': {
    gradient: ['#EC7000', '#FF8C2E', '#EC7000'], accent: '#FFFFFF',
    textColor: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.75)', logoText: 'GOLD',
  },
  'itau-pj-platinum': {
    gradient: ['#1A1A1A', '#2D2D2D', '#1A1A1A'], accent: '#EC7000',
    textColor: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.6)', logoText: 'PLATINUM',
  },
  'itau-pj-virtual': {
    gradient: ['#003882', '#1A5BA6', '#003882'], accent: '#EC7000',
    textColor: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.65)', logoText: 'VIRTUAL',
  },
}

const DEFAULT_VISUAL: ProductVisual = {
  gradient: ['#555', '#666', '#555'], accent: '#EC7000',
  textColor: '#FFF', textSecondary: 'rgba(255,255,255,0.6)', logoText: '?',
}

function enrichProduct(raw: AvailableCardProduct): CardProduct {
  const visual = PRODUCT_VISUALS[raw.id] ?? DEFAULT_VISUAL
  return {
    productId: raw.id,
    name: raw.name,
    brand: raw.brand.toLowerCase() as CardProduct['brand'],
    description: raw.description,
    minLimit: raw.minLimit,
    maxLimit: raw.maxLimit,
    annualFee: raw.annualFee,
    isVirtual: raw.cardType === 'virtual',
    benefits: raw.benefits.split(',').map((b) => b.trim()).filter(Boolean),
    customerMaxLimit: raw.customerMaxLimit,
    ...visual,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }

function brandLabel(brand: string) {
  const map: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', elo: 'Elo', amex: 'Amex' }
  return map[brand.toLowerCase()] ?? brand
}

// ─── Main Screen ─────────────────────────────────────────────────────

export default function CreditCardScreen() {
  const customerId = useCustomerStore((s) => s.customerId)
  const queryClient = useQueryClient()

  const { data: cards, isLoading } = useCreditCards(customerId)
  const { data: totalCreditLimit, isLoading: isLoadingLimit } = useCreditLimit(customerId)
  const { data: availableData, isLoading: isLoadingAvailable } = useAvailableCards(customerId)
  const requestCard = useRequestCreditCard()
  const cancelCard = useCancelCreditCard()

  const activeCards = useMemo(() => cards?.filter((c) => c.status !== 'cancelled') ?? [], [cards])
  const usedCreditLimit = useMemo(() => activeCards.reduce((sum, c) => sum + c.limit, 0), [activeCards])
  const availableCredit = Math.max(0, (totalCreditLimit ?? 0) - usedCreditLimit)
  const catalogProducts = useMemo(() => (availableData?.products ?? []).map(enrichProduct), [availableData])

  const [tab, setTab] = useState<'cards' | 'catalog'>('cards')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: creditCardKeys.all }),
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
    ])
    setRefreshing(false)
  }, [queryClient])

  // Contract
  const [contractProduct, setContractProduct] = useState<CardProduct | null>(null)
  const [reqLimit, setReqLimit] = useState(5000)
  const [dueDay, setDueDay] = useState(10)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successInfo, setSuccessInfo] = useState<{ name: string; limit: number; dueDay: number } | null>(null)

  // Detail / Invoice
  const [detailCard, setDetailCard] = useState<CreditCard | null>(null)
  const [invoiceCard, setInvoiceCard] = useState<CreditCard | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [payDone, setPayDone] = useState(false)

  const openContract = useCallback((p: CardProduct) => {
    haptic()
    const maxForCustomer = Math.min(p.customerMaxLimit, availableCredit)
    if (maxForCustomer < p.minLimit) {
      Alert.alert('Limite insuficiente',
        `Você precisa de pelo menos ${formatCurrency(p.minLimit)} de limite disponível para contratar este cartão.\n\nSeu limite disponível atual é ${formatCurrency(availableCredit)}.`)
      return
    }
    setContractProduct(p)
    setReqLimit(Math.min(maxForCustomer, Math.max(p.minLimit, 5000)))
    setDueDay(10)
  }, [availableCredit])

  const handleContract = useCallback(async () => {
    if (!contractProduct || !customerId) return
    haptic()
    try {
      await requestCard.mutateAsync({
        customerId,
        productId: contractProduct.productId,
        requestedLimit: reqLimit,
        dueDay,
      })
      setContractProduct(null)
      setSuccessInfo({ name: contractProduct.name, limit: reqLimit, dueDay })
      setShowSuccess(true)
      queryClient.invalidateQueries({ queryKey: creditCardKeys.all })
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
    } catch (err) {
      const msg = err instanceof AppError ? err.message : 'Não foi possível contratar. Verifique seu limite de crédito.'
      Alert.alert('Erro', msg)
    }
  }, [customerId, contractProduct, reqLimit, dueDay, requestCard, queryClient])

  const handlePay = useCallback(async () => {
    if (!invoiceCard || !customerId || invoiceCard.usedLimit <= 0) return
    haptic()
    setIsPaying(true)
    try {
      await creditCardService.payInvoice(customerId, invoiceCard.id, invoiceCard.usedLimit)
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: creditCardKeys.all })
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      setPayDone(true)
      setTimeout(() => { setShowPayModal(false); setPayDone(false); setIsPaying(false); setInvoiceCard(null) }, 2200)
    } catch (err) {
      Alert.alert('Erro', err instanceof AppError ? err.message : 'Erro ao pagar fatura.')
      setIsPaying(false)
    }
  }, [invoiceCard, customerId, queryClient])

  const handleCancel = useCallback((card: CreditCard) => {
    Alert.alert('Cancelar cartão', `Cancelar cartão •••• ${card.lastFourDigits}?\nEsta ação não pode ser desfeita.`, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Confirmar', style: 'destructive', onPress: async () => {
          haptic()
          try {
            await cancelCard.mutateAsync({ cardId: card.id, customerId: customerId ?? '' })
            setDetailCard(null)
          } catch { Alert.alert('Erro', 'Não foi possível cancelar.') }
        },
      },
    ])
  }, [customerId, cancelCard])

  // ─── Success ──────────────────────────────────────────────────────
  if (showSuccess && successInfo) {
    return (
      <SuccessSheet
        title="Cartão aprovado!"
        message={`Seu ${successInfo.name} PJ já está disponível.`}
        details={[
          { label: 'Limite', value: formatCurrency(successInfo.limit) },
          { label: 'Vencimento', value: `Dia ${successInfo.dueDay}` },
        ]}
        onDone={() => { setShowSuccess(false); setSuccessInfo(null); setTab('cards') }}
      />
    )
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {/* Tabs */}
      <View style={s.tabBar}>
        {(['cards', 'catalog'] as const).map((t) => (
          <TouchableOpacity
            key={t} style={[s.tab, tab === t && s.tabActive]}
            onPress={() => { haptic(); setTab(t) }}
          >
            <Text style={[s.tabLabel, tab === t && s.tabLabelActive]}>
              {t === 'cards' ? 'Meus Cartões' : 'Contratar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.itauOrange}
            colors={[colors.itauOrange]}
          />
        }
      >
        {/* ── Credit Limit Banner ────────────────────────────── */}
        {totalCreditLimit != null && totalCreditLimit > 0 && (
          <View style={s.limitBanner}>
            <View style={s.limitRow}>
              <View>
                <Text style={s.limitLabel}>Limite total aprovado</Text>
                <Text style={s.limitValue}>{formatCurrency(totalCreditLimit)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.limitLabel}>Disponível</Text>
                <Text style={[s.limitValue, { color: availableCredit > 0 ? colors.success : colors.error }]}>
                  {formatCurrency(availableCredit)}
                </Text>
              </View>
            </View>
            <View style={s.limitBarBg}>
              <View style={[s.limitBarFill, { width: `${totalCreditLimit > 0 ? Math.min((usedCreditLimit / totalCreditLimit) * 100, 100) : 0}%` }]} />
            </View>
            <Text style={s.limitHint}>
              {usedCreditLimit > 0 ? `${formatCurrency(usedCreditLimit)} alocado em ${activeCards.length} cartão(ões)` : 'Nenhum cartão contratado'}
            </Text>
          </View>
        )}

        {/* ── MY CARDS ───────────────────────────────────────── */}
        {tab === 'cards' && (
          <>
            {isLoading ? (
              <View style={s.center}>
                <ActivityIndicator size="large" color={colors.itauOrange} />
              </View>
            ) : activeCards.length > 0 ? (
              <View style={s.cardList}>
                {activeCards.map((card) => (
                  <CardRow
                    key={card.id}
                    card={card}
                    onPress={() => { haptic(); setDetailCard(card) }}
                  />
                ))}
              </View>
            ) : (
              <View style={s.empty}>
                <Ionicons name="card-outline" size={40} color={colors.textMuted} />
                <Text style={s.emptyTitle}>Nenhum cartão PJ</Text>
                <Text style={s.emptyDesc}>Contrate seu primeiro cartão corporativo.</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => { haptic(); setTab('catalog') }} activeOpacity={0.8}>
                  <Text style={s.emptyBtnText}>Ver cartões disponíveis</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ── CATALOG ────────────────────────────────────────── */}
        {tab === 'catalog' && (
          <>
            <Text style={s.sectionTitle}>Cartões disponíveis</Text>
            {isLoadingLimit ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
                <ActivityIndicator size="small" color={colors.itauOrange} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm }}>Carregando limite...</Text>
              </View>
            ) : isLoadingAvailable ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
                <ActivityIndicator size="small" color={colors.itauOrange} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm }}>Carregando catálogo...</Text>
              </View>
            ) : catalogProducts.map((p) => {
              const maxForCustomer = Math.min(p.customerMaxLimit, availableCredit)
              const disabled = totalCreditLimit != null && totalCreditLimit > 0 ? maxForCustomer < p.minLimit : false
              return (
                <CatalogCard
                  key={p.productId}
                  product={p}
                  disabled={disabled}
                  availableCredit={availableCredit}
                  onContract={() => openContract(p)}
                />
              )
            })}
          </>
        )}
      </ScrollView>

      {/* ── Card Detail Sheet ────────────────────────────────── */}
      <BottomSheet visible={!!detailCard} onClose={() => setDetailCard(null)}>
        {detailCard && (
          <CardDetail
            card={detailCard}
            onInvoice={() => { setInvoiceCard(detailCard); setDetailCard(null) }}
            onCancel={() => handleCancel(detailCard)}
          />
        )}
      </BottomSheet>

      {/* ── Contract Sheet ───────────────────────────────────── */}
      <BottomSheet visible={!!contractProduct} onClose={() => setContractProduct(null)}>
        {contractProduct && (
          <ContractSheet
            product={contractProduct}
            availableCredit={availableCredit}
            limit={reqLimit}
            onLimitChange={setReqLimit}
            dueDay={dueDay}
            onDueDayChange={setDueDay}
            loading={requestCard.isPending}
            onConfirm={handleContract}
            onCancel={() => setContractProduct(null)}
          />
        )}
      </BottomSheet>

      {/* ── Invoice View ─────────────────────────────────────── */}
      {invoiceCard && (
        <InvoiceScreen
          card={invoiceCard}
          customerId={customerId}
          onClose={() => setInvoiceCard(null)}
          onPay={() => setShowPayModal(true)}
        />
      )}

      {/* ── Pay Modal ────────────────────────────────────────── */}
      <BottomSheet visible={showPayModal} onClose={() => { if (!isPaying) { setShowPayModal(false); setIsPaying(false) } }}>
        {payDone ? (
          <View style={s.center}>
            <View style={s.checkCircle}><Ionicons name="checkmark" size={28} color="#FFF" /></View>
            <Text style={s.payDoneTitle}>Fatura paga!</Text>
            <Text style={s.payDoneSub}>{invoiceCard ? formatCurrency(invoiceCard.usedLimit) : ''} debitado do saldo</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.xl }}>
            <Text style={s.sheetTitle}>Pagar fatura</Text>
            <Text style={s.sheetSub}>Cartão •••• {invoiceCard?.lastFourDigits}</Text>
            <View style={s.payBox}>
              <Text style={s.payBoxLabel}>Valor total</Text>
              <Text style={s.payBoxValue}>{invoiceCard ? formatCurrency(invoiceCard.usedLimit) : ''}</Text>
            </View>
            <View style={s.btnRow}>
              <ActionButton title="Cancelar" variant="secondary" onPress={() => { setShowPayModal(false); setIsPaying(false) }} />
              <ActionButton title="Pagar" onPress={handlePay} loading={isPaying} />
            </View>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  )
}

// ─── Card Row (list item for "Meus Cartões") ────────────────────────

function CardRow({ card, onPress }: { card: CreditCard; onPress: () => void }) {
  const usagePct = card.limit > 0 ? (card.usedLimit / card.limit) * 100 : 0
  const barColor = usagePct > 80 ? colors.error : usagePct > 50 ? colors.warning : colors.itauOrange

  return (
    <TouchableOpacity style={s.cardRow} onPress={onPress} activeOpacity={0.7}>
      {/* Card visual */}
      <View style={[s.miniChip, { backgroundColor: card.isVirtual ? colors.itauBlue : colors.itauNavy }]}>
        <Text style={s.miniChipLabel}>itaú <Text style={{ fontWeight: fontWeight.regular }}>PJ</Text></Text>
        <Text style={s.miniChipDigits}>•••• {card.lastFourDigits}</Text>
        <Text style={s.miniChipBrand}>{brandLabel(card.brand)}</Text>
      </View>

      {/* Info */}
      <View style={s.cardRowInfo}>
        <View style={s.cardRowTop}>
          <Text style={s.cardRowName} numberOfLines={1}>{card.holderName || 'Cartão PJ'}</Text>
          <StatusBadge
            label={card.status === 'active' ? 'Ativo' : card.status === 'blocked' ? 'Bloq.' : card.status}
            variant={card.status === 'active' ? 'success' : 'warning'}
          />
        </View>

        <View style={s.cardRowLimits}>
          <View>
            <Text style={s.cardRowLimitLabel}>Utilizado</Text>
            <Text style={s.cardRowLimitValue}>{formatCurrency(card.usedLimit)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.cardRowLimitLabel}>Limite</Text>
            <Text style={s.cardRowLimitValue}>{formatCurrency(card.limit)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.cardRowLimitLabel}>Disponível</Text>
            <Text style={[s.cardRowLimitValue, { color: colors.success }]}>{formatCurrency(card.availableLimit)}</Text>
          </View>
        </View>

        <View style={s.cardRowBarBg}>
          <View style={[s.cardRowBarFill, { width: `${Math.min(usagePct, 100)}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Card Detail (bottom sheet content) ──────────────────────────────

function CardDetail({ card, onInvoice, onCancel }: {
  card: CreditCard; onInvoice: () => void; onCancel: () => void
}) {
  const usagePct = card.limit > 0 ? (card.usedLimit / card.limit) * 100 : 0

  return (
    <View style={{ gap: spacing.xl }}>
      {/* Header */}
      <View style={s.detailHeader}>
        <View style={[s.detailChip, { backgroundColor: card.isVirtual ? colors.itauBlue : colors.itauNavy }]}>
          <Text style={s.detailChipLine1}>itaú <Text style={{ fontWeight: fontWeight.regular }}>PJ</Text></Text>
          <Text style={s.detailChipDigits}>•••• {card.lastFourDigits}</Text>
          <Text style={s.detailChipBrand}>{brandLabel(card.brand)}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.detailName}>{card.holderName || 'Cartão PJ'}</Text>
          <Text style={s.detailSub}>{card.cardType || 'Corporate'} · {brandLabel(card.brand)}</Text>
          <StatusBadge
            label={card.status === 'active' ? 'Ativo' : card.status}
            variant={card.status === 'active' ? 'success' : 'warning'}
          />
        </View>
      </View>

      {/* Limits */}
      <View style={s.detailLimits}>
        <Row label="Limite total" value={formatCurrency(card.limit)} />
        <Row label="Utilizado" value={formatCurrency(card.usedLimit)} valueColor={card.usedLimit > 0 ? colors.itauOrange : undefined} />
        <Row label="Disponível" value={formatCurrency(card.availableLimit)} valueColor={colors.success} />
        <View style={s.miniBarBg}>
          <View style={[s.miniBarFill, { width: `${Math.min(usagePct, 100)}%` }]} />
        </View>
      </View>

      {/* Info */}
      <View style={s.detailInfo}>
        <Row label="Vencimento" value={`Dia ${card.dueDay}`} />
        <Row label="Fechamento" value={`Dia ${card.closingDay}`} />
        <Row label="Anuidade" value={card.annualFee === 0 ? 'Isento' : formatCurrency(card.annualFee)} />
        <Row label="Virtual" value={card.isVirtual ? 'Sim' : 'Não'} />
        <Row label="Criado em" value={new Date(card.createdAt).toLocaleDateString('pt-BR')} />
      </View>

      {/* Actions */}
      <View style={s.detailActions}>
        <TouchableOpacity style={s.detailAction} onPress={onInvoice} activeOpacity={0.7}>
          <Ionicons name="receipt-outline" size={20} color={colors.itauOrange} />
          <Text style={s.detailActionLabel}>Ver fatura</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.detailAction, { borderColor: colors.error }]} onPress={onCancel} activeOpacity={0.7}>
          <Ionicons name="close-circle-outline" size={20} color={colors.error} />
          <Text style={[s.detailActionLabel, { color: colors.error }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Catalog Card ────────────────────────────────────────────────────

function CatalogCard({ product, disabled, availableCredit, onContract }: {
  product: CardProduct; disabled: boolean; availableCredit: number; onContract: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const maxForCustomer = Math.min(product.customerMaxLimit, availableCredit)

  return (
    <View style={[s.catalogCard, disabled && { opacity: 0.5 }]}>
      {/* Mini visual */}
      <View style={[s.catalogVisual, { backgroundColor: product.gradient[0] }]}>
        <Text style={[s.catalogVisualName, { color: product.textColor }]}>itaú PJ {product.name}</Text>
        <Text style={[s.catalogVisualBrand, { color: product.textSecondary }]}>{brandLabel(product.brand)}</Text>
        {product.isVirtual && (
          <View style={s.virtualTag}>
            <Ionicons name="phone-portrait-outline" size={10} color="#FFF" />
            <Text style={s.virtualTagText}>Virtual</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={s.catalogInfo}>
        <Text style={s.catalogName}>{product.name}</Text>
        <Text style={s.catalogDesc}>{product.description}</Text>

        <View style={s.catalogMeta}>
          <MetaItem label="Limite até" value={formatCurrency(disabled ? 0 : maxForCustomer)} />
          <MetaItem label="Anuidade" value={product.annualFee === 0 ? 'Grátis' : `${formatCurrency(product.annualFee)}/mês`} highlight={product.annualFee === 0} />
          <MetaItem label="Bandeira" value={brandLabel(product.brand)} />
        </View>

        {/* Benefits toggle */}
        <TouchableOpacity style={s.benefitsBtn} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
          <Text style={s.benefitsBtnText}>{expanded ? 'Ocultar' : 'Benefícios'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.itauOrange} />
        </TouchableOpacity>

        {expanded && (
          <View style={s.benefitsList}>
            {product.benefits.map((b: string, i: number) => (
              <View key={i} style={s.benefitItem}>
                <Ionicons name="checkmark" size={14} color={colors.success} />
                <Text style={s.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        {disabled ? (
          <View style={s.disabledMsg}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
            <Text style={s.disabledMsgText}>Limite insuficiente ({formatCurrency(availableCredit)} disp.)</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.contractBtn} onPress={onContract} activeOpacity={0.8}>
            <Text style={s.contractBtnText}>Contratar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── Contract Sheet ──────────────────────────────────────────────────

function ContractSheet({ product, availableCredit, limit, onLimitChange, dueDay, onDueDayChange, loading, onConfirm, onCancel }: {
  product: CardProduct; availableCredit: number; limit: number; onLimitChange: (v: number) => void
  dueDay: number; onDueDayChange: (d: number) => void; loading: boolean
  onConfirm: () => void; onCancel: () => void
}) {
  const maxForCustomer = Math.min(product.customerMaxLimit, availableCredit)

  return (
    <View style={{ gap: spacing.lg }}>
      <Text style={s.sheetTitle}>Contratar {product.name}</Text>

      {/* Limit info */}
      <View style={s.creditInfo}>
        <Ionicons name="information-circle-outline" size={16} color={colors.itauBlue} />
        <Text style={s.creditInfoText}>
          Limite disponível: <Text style={{ fontWeight: fontWeight.bold, color: colors.success }}>{formatCurrency(availableCredit)}</Text>
        </Text>
      </View>

      {/* Slider */}
      <View>
        <Text style={s.fieldLabel}>Limite do cartão</Text>
        <Text style={s.sliderVal}>{formatCurrency(limit)}</Text>
        <Slider
          style={{ width: '100%', height: 36 }}
          minimumValue={product.minLimit}
          maximumValue={maxForCustomer}
          step={100}
          value={limit}
          onValueChange={(v) => onLimitChange(Math.round(v / 100) * 100)}
          minimumTrackTintColor={colors.itauOrange}
          maximumTrackTintColor={colors.bgInput}
          thumbTintColor={colors.itauOrange}
        />
        <View style={s.sliderLabels}>
          <Text style={s.sliderMin}>{formatCurrency(product.minLimit)}</Text>
          <Text style={s.sliderMin}>{formatCurrency(maxForCustomer)}</Text>
        </View>
      </View>

      {/* Due day */}
      <View>
        <Text style={s.fieldLabel}>Vencimento</Text>
        <View style={s.dueDayRow}>
          {[1, 5, 10, 15, 20, 25].map((d) => (
            <TouchableOpacity
              key={d} style={[s.dueDayChip, dueDay === d && s.dueDayActive]}
              onPress={() => { haptic(); onDueDayChange(d) }}
            >
              <Text style={[s.dueDayText, dueDay === d && s.dueDayTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary */}
      <View style={s.summary}>
        <Row label="Produto" value={`${product.name} (${brandLabel(product.brand)})`} />
        <Row label="Limite" value={formatCurrency(limit)} />
        <Row label="Vencimento" value={`Dia ${dueDay}`} />
        <Row label="Anuidade" value={product.annualFee === 0 ? 'Isento' : `${formatCurrency(product.annualFee)}/mês`} />
        <Row label="Tipo" value={product.isVirtual ? 'Virtual' : 'Físico'} />
      </View>

      <View style={s.btnRow}>
        <ActionButton title="Cancelar" variant="secondary" onPress={onCancel} />
        <ActionButton title="Confirmar" onPress={onConfirm} loading={loading} />
      </View>
    </View>
  )
}

// ─── Invoice Screen ──────────────────────────────────────────────────

function InvoiceScreen({ card, customerId, onClose, onPay }: {
  card: CreditCard; customerId: string | null; onClose: () => void; onPay: () => void
}) {
  const month = new Date().toISOString().slice(0, 7)
  const { data: invoice } = useCreditCardInvoice(customerId, card.id, month)
  const [detailTx, setDetailTx] = useState<CreditCardTransaction | null>(null)
  const insets = useSafeAreaInsets()

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[s.invoiceSafe, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.invoiceHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={22} color={colors.itauOrange} />
          </TouchableOpacity>
          <Text style={s.invoiceHTitle}>Fatura — •••• {card.lastFourDigits}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {/* Total */}
          <View style={s.invoiceTotal}>
            <Text style={s.invoiceTotalLabel}>Total da fatura</Text>
            <Text style={s.invoiceTotalVal}>
              {invoice ? formatCurrency(invoice.totalAmount) : formatCurrency(card.usedLimit)}
            </Text>
            <Text style={s.invoiceTotalDue}>Vencimento: dia {card.dueDay}</Text>
            <StatusBadge
              label={card.usedLimit === 0 ? 'Em dia' : 'Pendente'}
              variant={card.usedLimit === 0 ? 'success' : 'warning'}
            />
          </View>

          {/* Transactions */}
          {invoice && invoice.transactions.length > 0 ? (
            <View style={s.txSection}>
              <Text style={s.txSectionTitle}>Lançamentos</Text>
              {invoice.transactions.map((tx, i) => (
                <TouchableOpacity key={tx.id ?? i} style={s.txRow} onPress={() => setDetailTx(tx)} activeOpacity={0.6}>
                  <View style={s.txDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.txDesc} numberOfLines={1}>{tx.description}</Text>
                    <Text style={s.txMeta}>{tx.category} · {new Date(tx.date).toLocaleDateString('pt-BR')}</Text>
                  </View>
                  <Text style={s.txAmount}>{formatCurrency(tx.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : card.usedLimit > 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyDesc}>Utilizado: {formatCurrency(card.usedLimit)}</Text>
            </View>
          ) : (
            <View style={s.empty}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={s.emptyTitle}>Tudo em dia</Text>
            </View>
          )}

          {card.usedLimit > 0 && <ActionButton title="Pagar fatura" onPress={onPay} />}
        </ScrollView>
      </View>

      {/* Tx detail */}
      <BottomSheet visible={!!detailTx} onClose={() => setDetailTx(null)}>
        {detailTx && (
          <View style={{ gap: spacing.lg, alignItems: 'center' }}>
            <Text style={s.sheetTitle}>{formatCurrency(detailTx.amount)}</Text>
            <Text style={s.sheetSub}>{detailTx.description}</Text>
            <View style={[s.summary, { width: '100%' }]}>
              <Row label="Data" value={new Date(detailTx.date).toLocaleDateString('pt-BR')} />
              <Row label="Categoria" value={detailTx.category || '—'} />
              {detailTx.installment && <Row label="Parcela" value={detailTx.installment} />}
            </View>
            <ActionButton title="Fechar" variant="secondary" onPress={() => setDetailTx(null)} />
          </View>
        )}
      </BottomSheet>
    </Modal>
  )
}

// ─── Small components ────────────────────────────────────────────────

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  )
}

function MetaItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.metaItem}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={[s.metaValue, highlight && { color: colors.success }]}>{value}</Text>
    </View>
  )
}

function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  body: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing['4xl'] },

  // Tabs
  tabBar: { flexDirection: 'row', marginHorizontal: spacing.xl, marginTop: spacing.sm, backgroundColor: colors.bgInput, borderRadius: radius.lg, padding: 3 },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.bgSecondary, ...shadow.sm },
  tabLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted },
  tabLabelActive: { color: colors.textPrimary },

  // Credit limit banner
  limitBanner: { backgroundColor: colors.bgSecondary, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md, ...shadow.sm },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between' },
  limitLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  limitValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  limitBarBg: { height: 4, backgroundColor: colors.bgInput, borderRadius: 2, overflow: 'hidden' },
  limitBarFill: { height: 4, borderRadius: 2, backgroundColor: colors.itauOrange },
  limitHint: { fontSize: fontSize.xs, color: colors.textMuted },

  // Card list
  cardList: { gap: spacing.md },
  cardRow: { backgroundColor: colors.bgSecondary, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, ...shadow.sm },
  miniChip: { width: 80, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 2, alignSelf: 'flex-start' },
  miniChipLabel: { fontSize: 9, fontWeight: fontWeight.bold, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3 },
  miniChipBrand: { fontSize: 8, fontWeight: fontWeight.bold, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  miniChipDigits: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#FFF' },
  cardRowInfo: { flex: 1, gap: spacing.md },
  cardRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRowName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  cardRowLimits: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardRowLimitLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  cardRowLimitValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  cardRowBarBg: { height: 5, backgroundColor: colors.bgInput, borderRadius: 3, overflow: 'hidden' },
  cardRowBarFill: { height: 5, borderRadius: 3, backgroundColor: colors.itauOrange },
  miniBarBg: { height: 4, backgroundColor: colors.bgInput, borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: 4, borderRadius: 2, backgroundColor: colors.itauOrange },

  // Empty
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.md },
  emptyTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  emptyDesc: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  emptyBtn: { marginTop: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.itauOrange },
  emptyBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.itauOrange },

  sectionTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },

  // Catalog card
  catalogCard: { backgroundColor: colors.bgSecondary, borderRadius: radius.xl, overflow: 'hidden', ...shadow.sm },
  catalogVisual: { paddingVertical: spacing.xl, paddingHorizontal: spacing.xl, gap: 2 },
  catalogVisualName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, letterSpacing: 0.3 },
  catalogVisualBrand: { fontSize: fontSize.xs },
  virtualTag: { position: 'absolute', top: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  virtualTagText: { fontSize: 9, fontWeight: fontWeight.bold, color: '#FFF' },
  catalogInfo: { padding: spacing.xl, gap: spacing.lg },
  catalogName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  catalogDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -spacing.sm },
  catalogMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { alignItems: 'center', gap: 2 },
  metaLabel: { fontSize: fontSize['2xs'], color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  metaValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
  benefitsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  benefitsBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.itauOrange },
  benefitsList: { gap: spacing.sm },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  benefitText: { fontSize: fontSize.sm, color: colors.textPrimary },
  disabledMsg: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  disabledMsgText: { fontSize: fontSize.sm, color: colors.error },
  contractBtn: { backgroundColor: colors.itauOrange, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center' },
  contractBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#FFF' },

  // Detail sheet
  detailHeader: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  detailChip: { width: 72, height: 48, borderRadius: radius.md, padding: spacing.sm, justifyContent: 'space-between' },
  detailChipLine1: { fontSize: 9, fontWeight: fontWeight.bold, color: '#FFF' },
  detailChipDigits: { fontSize: fontSize['2xs'], fontWeight: fontWeight.bold, color: '#FFF' },
  detailChipBrand: { fontSize: 7, color: 'rgba(255,255,255,0.6)', fontWeight: fontWeight.bold },
  detailName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  detailSub: { fontSize: fontSize.xs, color: colors.textMuted },
  detailLimits: { backgroundColor: colors.bgInput, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  detailInfo: { gap: spacing.md },
  detailActions: { flexDirection: 'row', gap: spacing.md },
  detailAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.itauOrange },
  detailActionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.itauOrange },

  // Contract sheet
  creditInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.infoLight, borderRadius: radius.md, padding: spacing.md },
  creditInfoText: { fontSize: fontSize.sm, color: colors.itauBlue, flex: 1 },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary, marginBottom: spacing.xs },
  sliderVal: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.itauOrange, textAlign: 'center' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderMin: { fontSize: fontSize.xs, color: colors.textMuted },
  dueDayRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  dueDayChip: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgInput },
  dueDayActive: { backgroundColor: colors.itauOrange },
  dueDayText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted },
  dueDayTextActive: { color: '#FFF' },

  summary: { backgroundColor: colors.bgInput, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rowValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },

  btnRow: { flexDirection: 'row', gap: spacing.md },

  // Bottom sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bgSecondary, borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'], padding: spacing.xl, maxHeight: '85%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderLight, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sheetSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: -spacing.sm },

  // Pay
  payBox: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.bgInput, borderRadius: radius.xl, gap: spacing.sm },
  payBoxLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  payBoxValue: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.itauOrange },
  center: { alignItems: 'center', paddingVertical: spacing['2xl'], gap: spacing.lg },
  checkCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  payDoneTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  payDoneSub: { fontSize: fontSize.sm, color: colors.textMuted },

  // Invoice
  invoiceSafe: { flex: 1, backgroundColor: colors.bgPrimary },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  invoiceHTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  invoiceTotal: { backgroundColor: colors.bgSecondary, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, ...shadow.sm },
  invoiceTotalLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  invoiceTotalVal: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  invoiceTotalDue: { fontSize: fontSize.xs, color: colors.textMuted },
  txSection: { backgroundColor: colors.bgSecondary, borderRadius: radius.xl, padding: spacing.lg, ...shadow.sm },
  txSectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  txDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.itauOrange },
  txDesc: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary },
  txMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  txAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
})
