// ─── Debit Purchase Screen ───────────────────────────────────────────
// Simulate a debit card purchase.

import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { useCustomerStore } from '@/stores'
import { financialService } from '@/services'
import { InputField, AmountInput, ActionButton, SuccessSheet } from '@/components/ui'
import { formatCurrency, AppError, ErrorCode } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'
import type { DebitPurchaseResponse } from '@/types'

export default function DebitPurchaseScreen() {
  const router = useRouter()
  const customerId = useCustomerStore((s) => s.customerId)

  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<DebitPurchaseResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = useCallback(async () => {
    if (!merchant.trim()) {
      Alert.alert('Estabelecimento', 'Informe o nome do estabelecimento.')
      return
    }
    if (amount <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.')
      return
    }

    setIsProcessing(true)
    setError(null)
    try {
      const response = await financialService.debitPurchase({
        customerId: customerId ?? '',
        merchantName: merchant.trim(),
        amount: amount / 100,
        description: description.trim() || undefined,
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erro ao processar compra.')
    } finally {
      setIsProcessing(false)
    }
  }, [customerId, merchant, amount, description])

  if (result) {
    return (
      <SuccessSheet
        title={result.status === 'completed' ? 'Compra realizada!' : 'Saldo insuficiente'}
        message={
          result.status === 'completed'
            ? `Compra de ${formatCurrency(result.amount)} no débito processada.`
            : 'Não foi possível completar a compra. Verifique seu saldo.'
        }
        details={[
          { label: 'Valor', value: formatCurrency(result.amount) },
          { label: 'Novo saldo', value: formatCurrency(result.newBalance) },
        ]}
        onDone={() => router.back()}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Compra no débito</Text>
        <Text style={styles.subtitle}>Simule uma compra utilizando o saldo da conta.</Text>

        <InputField
          label="Estabelecimento"
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Nome do estabelecimento"
        />

        <AmountInput value={amount} onChange={setAmount} label="Valor" />

        <InputField
          label="Descrição (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Detalhes da compra"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonWrap}>
          <ActionButton
            title="Confirmar compra"
            onPress={handlePurchase}
            loading={isProcessing}
            disabled={!merchant.trim() || amount <= 0}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -spacing.md },
  errorText: { fontSize: fontSize.sm, color: colors.error },
  buttonWrap: { marginTop: spacing.md },
})
