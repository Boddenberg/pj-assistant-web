// ─── Bill Payment Screen ─────────────────────────────────────────────
// Pay bills by barcode — type, paste, or scan.

import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { useBillPaymentStore, useCustomerStore } from '@/stores'
import { InputField, ActionButton, Card, SuccessSheet } from '@/components/ui'
import { formatCurrency, isValidDigitableLine, formatDigitableLine } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'
import type { BarcodeInputMethod } from '@/types'

export default function BillPaymentScreen() {
  const router = useRouter()
  const customerId = useCustomerStore((s) => s.customerId)
  const { barcodeData, isValidating, lastPayment, isPaying, error, validateBarcode, pay, reset, dismissError } = useBillPaymentStore()

  const [barcode, setBarcode] = useState('')
  const [inputMethod, setInputMethod] = useState<BarcodeInputMethod>('typed')
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input')

  const handleValidate = useCallback(async () => {
    const clean = barcode.replace(/\D/g, '')
    if (!isValidDigitableLine(clean)) {
      Alert.alert('Código inválido', 'O código precisa ter 47 ou 48 dígitos.')
      return
    }
    await validateBarcode(clean)
    setStep('review')
  }, [barcode, validateBarcode])

  const handlePay = useCallback(async () => {
    const clean = barcode.replace(/\D/g, '')
    await pay(customerId ?? '', clean, inputMethod)
    setStep('success')
  }, [customerId, barcode, inputMethod, pay])

  const handleScan = () => {
    router.push('/barcode-scanner' as any)
  }

  const handlePaste = async () => {
    // In a real app, read from clipboard
    setInputMethod('pasted')
  }

  const handleDone = () => {
    reset()
    router.back()
  }

  if (step === 'success' && lastPayment) {
    return (
      <SuccessSheet
        title="Pagamento realizado!"
        message={`Conta de ${formatCurrency(lastPayment.amount)} paga com sucesso.`}
        details={[
          { label: 'Beneficiário', value: lastPayment.beneficiary },
          { label: 'Valor', value: formatCurrency(lastPayment.amount) },
          { label: 'Autenticação', value: lastPayment.authentication.slice(0, 12) + '...' },
        ]}
        onDone={handleDone}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'input' && (
          <>
            <Text style={styles.stepTitle}>Pagar conta</Text>
            <Text style={styles.subtitle}>
              Digite, cole ou escaneie o código de barras do boleto.
            </Text>

            {/* Input method cards */}
            <View style={styles.methodRow}>
              <TouchableOpacity style={styles.methodCard} onPress={handleScan} activeOpacity={0.6}>
                <View style={[styles.methodIcon, { backgroundColor: colors.itauOrangeSoft }]}>
                  <Ionicons name="camera-outline" size={24} color={colors.itauOrange} />
                </View>
                <Text style={styles.methodLabel}>Câmera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.methodCard} onPress={handlePaste} activeOpacity={0.6}>
                <View style={[styles.methodIcon, { backgroundColor: colors.infoLight }]}>
                  <Ionicons name="clipboard-outline" size={24} color={colors.itauBlue} />
                </View>
                <Text style={styles.methodLabel}>Colar</Text>
              </TouchableOpacity>
            </View>

            <InputField
              label="Linha digitável"
              value={barcode}
              onChangeText={(text) => {
                setBarcode(text)
                setInputMethod('typed')
              }}
              placeholder="Digite os números do código de barras"
              keyboardType="numeric"
              hint="47 dígitos (boleto) ou 48 dígitos (concessionária)"
            />

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <View style={styles.buttonWrap}>
              <ActionButton
                title="Validar código"
                onPress={handleValidate}
                loading={isValidating}
                disabled={barcode.replace(/\D/g, '').length < 44}
              />
            </View>
          </>
        )}

        {step === 'review' && barcodeData && (
          <>
            <Text style={styles.stepTitle}>Revise o pagamento</Text>

            <Card style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Beneficiário</Text>
                <Text style={styles.reviewValue}>{barcodeData.beneficiary ?? 'Não identificado'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Valor</Text>
                <Text style={styles.reviewValueBig}>{formatCurrency(barcodeData.totalAmount)}</Text>
              </View>
              {barcodeData.dueDate && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Vencimento</Text>
                  <Text style={styles.reviewValue}>{barcodeData.dueDate}</Text>
                </View>
              )}
              {barcodeData.discount ? (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Desconto</Text>
                  <Text style={[styles.reviewValue, { color: colors.success }]}>-{formatCurrency(barcodeData.discount)}</Text>
                </View>
              ) : null}
              {barcodeData.interest ? (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Juros/Multa</Text>
                  <Text style={[styles.reviewValue, { color: colors.error }]}>+{formatCurrency(barcodeData.interest + (barcodeData.fine ?? 0))}</Text>
                </View>
              ) : null}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Código</Text>
                <Text style={styles.reviewCode}>{formatDigitableLine(barcodeData.digitableLine).slice(0, 30)}...</Text>
              </View>
            </Card>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <ActionButton title="Voltar" onPress={() => setStep('input')} variant="secondary" />
              <ActionButton title="Pagar" onPress={handlePay} loading={isPaying} />
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
  stepTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginTop: -spacing.md },
  methodRow: { flexDirection: 'row', gap: spacing.md },
  methodCard: { flex: 1, backgroundColor: colors.bgSecondary, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  methodIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  buttonWrap: { marginTop: spacing.md },
  buttonGroup: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  reviewCard: { gap: spacing.lg },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  reviewValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary, textAlign: 'right', maxWidth: '60%' },
  reviewValueBig: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.itauOrange },
  reviewCode: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: 'monospace' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.errorLight, padding: spacing.lg, borderRadius: radius.lg },
  errorText: { fontSize: fontSize.sm, color: colors.error, flex: 1 },
})
