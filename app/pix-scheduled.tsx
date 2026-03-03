// ─── Pix Agendado Screen ─────────────────────────────────────────────

import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, BackHandler } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useNavigation, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { usePixStore, useCustomerStore } from '@/stores'
import { InputField, AmountInput, ActionButton, Card, SuccessSheet } from '@/components/ui'
import { formatCurrency, formatPixKey } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'
import type { PixKeyType } from '@/types'

const SCHEDULED_KEY_TYPES: { label: string; value: PixKeyType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'CPF/CNPJ', value: 'cpf', icon: 'person-outline' },
  { label: 'E-mail', value: 'email', icon: 'mail-outline' },
  { label: 'Telefone', value: 'phone', icon: 'call-outline' },
  { label: 'Chave aleatória', value: 'random', icon: 'key-outline' },
]

export default function PixScheduledScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const customerId = useCustomerStore((s) => s.customerId)
  const { recipient, isLookingUp, lastSchedule, isScheduling, error, lookupKey, schedule, reset } = usePixStore()

  const [keyType, setKeyType] = useState<PixKeyType>('cpf')
  const [pixKey, setPixKey] = useState('')
  const [amount, setAmount] = useState(0)
  const [scheduledDate, setScheduledDate] = useState('')
  const [description, setDescription] = useState('')
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input')

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

  const formatDateInput = (text: string): string => {
    const digits = text.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  // Formatters
  const formatCPFInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  const formatCNPJInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/\/(\d{4})(\d)/, '/$1-$2')
  }
  const formatDocumentInput = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) return formatCPFInput(value)
    return formatCNPJInput(value)
  }
  const formatPhoneInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handleKeyInput = (value: string) => {
    if (keyType === 'cpf') setPixKey(formatDocumentInput(value))
    else if (keyType === 'phone') setPixKey(formatPhoneInput(value))
    else setPixKey(value)
  }

  const getScheduledPlaceholder = () => {
    switch (keyType) {
      case 'cpf': return '000.000.000-00 ou CNPJ'
      case 'email': return 'email@dominio.com'
      case 'phone': return '(11) 99999-9999'
      case 'random': return 'Chave aleatória'
      default: return 'Chave Pix'
    }
  }

  const getScheduledKeyboardType = () => {
    switch (keyType) {
      case 'cpf': return 'number-pad' as const
      case 'phone': return 'phone-pad' as const
      case 'email': return 'email-address' as const
      default: return 'default' as const
    }
  }

  const handleLookup = useCallback(async () => {
    if (!pixKey.trim()) return
    await lookupKey(pixKey.trim(), keyType)
  }, [pixKey, keyType, lookupKey])

  const handleConfirm = useCallback(() => {
    if (amount <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.')
      return
    }
    if (!scheduledDate.trim() || scheduledDate.length < 10) {
      Alert.alert('Data inválida', 'Informe uma data no formato DD/MM/AAAA.')
      return
    }
    setStep('confirm')
  }, [amount, scheduledDate])

  const handleSchedule = useCallback(async () => {
    await schedule(customerId ?? '', pixKey.trim(), keyType, amount / 100, scheduledDate, description)
    const { error: schedError } = usePixStore.getState()
    if (!schedError) {
      setStep('success')
    }
  }, [customerId, pixKey, keyType, amount, scheduledDate, description, schedule])

  const handleDone = () => {
    reset()
    router.back()
  }

  if (step === 'success' && lastSchedule) {
    return (
      <SuccessSheet
        title="Pix agendado!"
        message={`Agendamento de ${formatCurrency(lastSchedule.amount)} para ${lastSchedule.scheduledDate} criado.`}
        details={[
          { label: 'Para', value: lastSchedule.recipient.name },
          { label: 'Valor', value: formatCurrency(lastSchedule.amount) },
          { label: 'Data', value: lastSchedule.scheduledDate },
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
            <Text style={styles.stepTitle}>Agendar Pix</Text>
            <Text style={styles.subtitle}>Escolha a data e o valor para transferência futura.</Text>

            {/* Key type selector */}
            <View style={styles.keyTypeRow}>
              {SCHEDULED_KEY_TYPES.map((kt) => (
                <TouchableOpacity
                  key={kt.value}
                  style={[styles.keyTypeChip, keyType === kt.value && styles.keyTypeChipActive]}
                  onPress={() => { setKeyType(kt.value); setPixKey('') }}
                >
                  <Ionicons
                    name={kt.icon}
                    size={14}
                    color={keyType === kt.value ? colors.itauOrange : colors.textMuted}
                  />
                  <Text style={[styles.keyTypeLabel, keyType === kt.value && styles.keyTypeLabelActive]}>
                    {kt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <InputField
              label="Chave Pix do destinatário"
              value={pixKey}
              onChangeText={handleKeyInput}
              placeholder={getScheduledPlaceholder()}
              autoCapitalize="none"
              keyboardType={getScheduledKeyboardType()}
            />

            {recipient && (
              <Card style={styles.recipientCard}>
                <View style={styles.recipientRow}>
                  <View style={styles.recipientAvatar}>
                    <Ionicons name="person" size={18} color={colors.itauBlue} />
                  </View>
                  <View>
                    <Text style={styles.recipientName}>{recipient.name}</Text>
                    <Text style={styles.recipientBank}>{recipient.bank}</Text>
                  </View>
                </View>
              </Card>
            )}

            {!recipient && (
              <ActionButton
                title="Buscar destinatário"
                onPress={handleLookup}
                variant="secondary"
                loading={isLookingUp}
                disabled={!pixKey.trim()}
              />
            )}

            <InputField
              label="Data do agendamento"
              value={scheduledDate}
              onChangeText={(v) => setScheduledDate(formatDateInput(v))}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
            />

            <AmountInput value={amount} onChange={setAmount} label="Valor" />

            <InputField
              label="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Aluguel mensal"
            />

            <View style={styles.buttonWrap}>
              <ActionButton title="Revisar agendamento" onPress={handleConfirm} disabled={amount <= 0 || !scheduledDate} />
            </View>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Text style={styles.stepTitle}>Confirmar agendamento</Text>

            <Card style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Destinatário</Text>
                <Text style={styles.confirmValue}>{recipient?.name ?? pixKey}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Data</Text>
                <Text style={styles.confirmValue}>{scheduledDate}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Valor</Text>
                <Text style={styles.confirmValueBig}>{formatCurrency(amount / 100)}</Text>
              </View>
            </Card>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <ActionButton title="Editar" onPress={() => setStep('input')} variant="secondary" />
              <ActionButton title="Agendar" onPress={handleSchedule} loading={isScheduling} />
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
  keyTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  keyTypeChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgSecondary, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1.5, borderColor: colors.borderLight },
  keyTypeChipActive: { borderColor: colors.itauOrange, backgroundColor: colors.itauOrangeSoft },
  keyTypeLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.medium },
  keyTypeLabelActive: { color: colors.itauOrange },
  recipientCard: { padding: spacing.lg },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  recipientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.infoLight, alignItems: 'center', justifyContent: 'center' },
  recipientName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  recipientBank: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },
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
