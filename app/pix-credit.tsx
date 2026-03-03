// ─── Pix com Cartão de Crédito Screen ────────────────────────────────
// Send Pix using a credit card with installments.

import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, BackHandler } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useNavigation, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { useQueryClient } from '@tanstack/react-query'
import { usePixStore, useCustomerStore } from '@/stores'
import { useCreditCards, transactionKeys } from '@/hooks'
import { InputField, AmountInput, ActionButton, Card } from '@/components/ui'
import { formatCurrency, formatPixKey, maskDocument } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'
import type { PixKeyType } from '@/types'

export default function PixCreditScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const customerId = useCustomerStore((s) => s.customerId)
  const { data: cards } = useCreditCards(customerId)
  const { recipient, isLookingUp, lastCreditCardPix, isTransferring, error, lookupKey, transferWithCreditCard, reset } = usePixStore()

  const [pixKey, setPixKey] = useState('')
  const [keyType, setKeyType] = useState<PixKeyType>('cpf')
  const [amount, setAmount] = useState(0)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [installments, setInstallments] = useState(1)
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input')

  const handlePixKeyInput = useCallback((value: string) => {
    setPixKey(value)
  }, [])

  const goBack = useCallback(() => {
    if (step === 'confirm') { setStep('input'); return true }
    if (step === 'success') { router.back(); return true }
    return false
  }, [step, router])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack)
    return () => sub.remove()
  }, [goBack])

  useFocusEffect(
    useCallback(() => {
      if (step !== 'input') {
        navigation.setOptions({
          headerLeft: () => (
            <TouchableOpacity onPress={goBack} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
        })
      } else {
        navigation.setOptions({ headerLeft: undefined })
      }
      return () => { navigation.setOptions({ headerLeft: undefined }) }
    }, [step, navigation, goBack])
  )

  const handleLookup = useCallback(async () => {
    if (!pixKey.trim()) return
    const cleanKey = (keyType === 'cpf' || keyType === 'cnpj' || keyType === 'phone')
      ? pixKey.replace(/\D/g, '').trim()
      : pixKey.trim()
    await lookupKey(cleanKey, keyType)
  }, [pixKey, keyType, lookupKey])

  const handleConfirm = useCallback(() => {
    if (amount <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.')
      return
    }
    if (!selectedCard) {
      Alert.alert('Cartão', 'Selecione um cartão de crédito.')
      return
    }
    // Validação de limite é feita pelo backend
    setStep('confirm')
  }, [amount, selectedCard])

  const queryClient = useQueryClient()

  const handleTransfer = useCallback(async () => {
    // Strip formatting for types that use digits only
    const cleanKey = (keyType === 'cpf' || keyType === 'cnpj' || keyType === 'phone')
      ? pixKey.replace(/\D/g, '').trim()
      : pixKey.trim()
    await transferWithCreditCard(
      customerId ?? '', selectedCard!, cleanKey,
      keyType, amount / 100, installments,
    )
    // Check store state — the store catches errors internally and never throws
    const { error: txErr, lastCreditCardPix: result } = usePixStore.getState()
    if (!txErr && result) {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['financial'] })
      // Navigate to receipt screen — passes transferId, backend has all fee data
      router.replace({ pathname: '/pix-receipt', params: { transferId: result.transactionId } })
      reset()
    }
  }, [customerId, selectedCard, pixKey, keyType, amount, installments, transferWithCreditCard, queryClient, router, reset])

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'input' && (
          <>
            <Text style={styles.title}>Pix com cartão de crédito</Text>
            <Text style={styles.subtitle}>
              Envie Pix e pague com seu cartão corporativo, à vista ou parcelado.
            </Text>

            <InputField
              label="Chave Pix do destinatário"
              value={pixKey}
              onChangeText={handlePixKeyInput}
              placeholder="CPF, e-mail, telefone ou chave"
              autoCapitalize="none"
            />

            {/* Key type selector */}
            <View style={styles.keyTypeRow}>
              {(['cpf', 'email', 'phone', 'random'] as PixKeyType[]).map((kt) => (
                <TouchableOpacity
                  key={kt}
                  style={[styles.keyTypeChip, keyType === kt && styles.keyTypeChipActive]}
                  onPress={() => { setKeyType(kt); reset() }}
                >
                  <Text style={[styles.keyTypeText, keyType === kt && styles.keyTypeTextActive]}>
                    {kt === 'cpf' ? 'CPF' : kt === 'email' ? 'E-mail' : kt === 'phone' ? 'Telefone' : 'Aleatória'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!recipient && (
              <ActionButton
                title="Buscar destinatário"
                onPress={handleLookup}
                variant="secondary"
                loading={isLookingUp}
                disabled={!pixKey.trim()}
              />
            )}

            {error && !recipient && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            {recipient && (
              <Card style={styles.recipientCard}>
                <View style={styles.recipientRow}>
                  <View style={styles.recipientAvatar}>
                    <Ionicons name="person" size={18} color={colors.itauBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipientName}>{recipient.name}</Text>
                    <Text style={styles.recipientBank}>{recipient.bank}</Text>
                    {recipient.document && (
                      <Text style={styles.recipientDoc}>CPF: {maskDocument(recipient.document)}</Text>
                    )}
                    <Text style={styles.recipientKey}>Chave: {formatPixKey(pixKey, keyType)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { reset(); setPixKey('') }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            <AmountInput value={amount} onChange={setAmount} label="Valor" />

            {/* Card selector */}
            <View>
              <Text style={styles.fieldLabel}>Cartão de crédito</Text>
              {cards && cards.length > 0 ? (
                <View style={styles.cardsList}>
                  {cards.filter(c => c.status === 'active').map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.cardOption, selectedCard === card.id && styles.cardOptionActive]}
                      onPress={() => setSelectedCard(card.id)}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="card" size={18} color={selectedCard === card.id ? colors.itauOrange : colors.textMuted} />
                      <Text style={[styles.cardOptionText, selectedCard === card.id && styles.cardOptionTextActive]}>
                        •••• {card.lastFourDigits}
                      </Text>
                      <Text style={styles.cardOptionLimit}>
                        Disp: {formatCurrency(card.availableLimit)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noCards}>Nenhum cartão ativo. Solicite um cartão primeiro.</Text>
              )}
            </View>

            {/* Installments — backend valida opções disponíveis */}
            <View>
              <Text style={styles.fieldLabel}>Parcelas</Text>
              <View style={styles.installmentRow}>
                {[1, 2, 3, 6, 12].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.installmentChip, installments === n && styles.installmentChipActive]}
                    onPress={() => setInstallments(n)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.installmentText, installments === n && styles.installmentTextActive]}>
                      {n}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {amount > 0 && (
                <Text style={styles.installmentInfo}>
                  {installments === 1
                    ? `${formatCurrency(amount / 100)} à vista`
                    : `${installments}x (valor final calculado pelo banco)`
                  }
                </Text>
              )}
            </View>

            <View style={styles.buttonWrap}>
              <ActionButton
                title="Revisar"
                onPress={handleConfirm}
                disabled={amount <= 0 || !selectedCard}
              />
            </View>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Text style={styles.title}>Confirmar Pix com crédito</Text>

            <Card style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Destinatário</Text>
                <Text style={styles.confirmValue}>{recipient?.name ?? pixKey}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Valor do Pix</Text>
                <Text style={styles.confirmValueBig}>{formatCurrency(amount / 100)}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Parcelas</Text>
                <Text style={styles.confirmValue}>{installments}x no cartão de crédito</Text>
              </View>
              {installments > 1 && (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Taxas</Text>
                  <Text style={[styles.confirmValue, { color: colors.textMuted, fontSize: 12 }]}>Calculadas pelo banco</Text>
                </View>
              )}
            </Card>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <ActionButton title="Editar" onPress={() => setStep('input')} variant="secondary" />
              <ActionButton title="Confirmar" onPress={handleTransfer} loading={isTransferring} />
            </View>
          </>
        )}
      </ScrollView>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginTop: -spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary, marginBottom: spacing.sm },
  recipientCard: { padding: spacing.lg },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  recipientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.infoLight, alignItems: 'center', justifyContent: 'center' },
  recipientName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  recipientBank: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },
  recipientDoc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing['2xs'] },
  recipientKey: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },
  keyTypeRow: { flexDirection: 'row', gap: spacing.sm },
  keyTypeChip: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.md, borderRadius: radius.full,
    backgroundColor: colors.bgInput, borderWidth: 1.5, borderColor: colors.borderLight,
  },
  keyTypeChipActive: { borderColor: colors.itauOrange, backgroundColor: colors.itauOrangeSoft },
  keyTypeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textMuted },
  keyTypeTextActive: { color: colors.itauOrange },
  cardsList: { gap: spacing.md },
  cardOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    backgroundColor: colors.bgSecondary, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1.5, borderColor: colors.borderLight,
  },
  cardOptionActive: { borderColor: colors.itauOrange, backgroundColor: colors.itauOrangeSoft },
  cardOptionText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, letterSpacing: 1 },
  cardOptionTextActive: { color: colors.itauOrange },
  cardOptionLimit: { marginLeft: 'auto', fontSize: fontSize.xs, color: colors.textMuted },
  noCards: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
  installmentRow: { flexDirection: 'row', gap: spacing.sm },
  installmentChip: {
    flex: 1, alignItems: 'center',
    backgroundColor: colors.bgSecondary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, borderWidth: 1.5, borderColor: colors.borderLight,
  },
  installmentChipActive: { borderColor: colors.itauOrange, backgroundColor: colors.itauOrangeSoft },
  installmentText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted },
  installmentTextActive: { color: colors.itauOrange },
  installmentInfo: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm },
  buttonWrap: { marginTop: spacing.md },
  buttonGroup: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  confirmCard: { gap: spacing.lg },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  confirmValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  confirmValueBig: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.itauOrange },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.errorLight, padding: spacing.lg, borderRadius: radius.lg },
  errorText: { fontSize: fontSize.sm, color: colors.error, flex: 1 },
})
