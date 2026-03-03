// ─── Pix Transfer Screen ─────────────────────────────────────────────

import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Platform, BackHandler } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useNavigation, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'

import { useQueryClient } from '@tanstack/react-query'
import { usePixStore, useCustomerStore, useAuthStore } from '@/stores'
import { transactionKeys, useFinancialSummary } from '@/hooks'
import { InputField, AmountInput, ActionButton, Card } from '@/components/ui'
import { formatCurrency, formatPixKey, httpClient, AppError } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'
import type { PixKeyType } from '@/types'

const KEY_TYPES: { label: string; value: PixKeyType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'CNPJ', value: 'cnpj', icon: 'business-outline' },
  { label: 'E-mail', value: 'email', icon: 'mail-outline' },
  { label: 'Telefone', value: 'phone', icon: 'call-outline' },
  { label: 'Chave aleatória', value: 'random', icon: 'key-outline' },
]

const TRANSFER_KEY_TYPES: { label: string; value: PixKeyType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'CPF/CNPJ', value: 'cpf', icon: 'person-outline' },
  { label: 'E-mail', value: 'email', icon: 'mail-outline' },
  { label: 'Telefone', value: 'phone', icon: 'call-outline' },
  { label: 'Chave aleatória', value: 'random', icon: 'key-outline' },
]

interface RegisteredKey {
  type: PixKeyType
  value: string
}

export default function PixScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const customerId = useCustomerStore((s) => s.customerId)
  const companyData = useAuthStore((s) => s.companyData)
  const loadCompanyData = useAuthStore((s) => s.loadCompanyData)
  const { recipient, isLookingUp, lastTransfer, isTransferring, error, lookupKey, transfer, reset, dismissError } = usePixStore()

  const [keyType, setKeyType] = useState<PixKeyType>('cpf')
  const [pixKey, setPixKey] = useState('')
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [step, setStep] = useState<'menu' | 'key' | 'amount' | 'confirm' | 'success' | 'manage-keys'>('menu')

  // Pix key registration
  const [registeredKeys, setRegisteredKeys] = useState<RegisteredKey[]>([])
  const [registerKeyType, setRegisterKeyType] = useState<PixKeyType>('cnpj')
  const [registerKeyValue, setRegisterKeyValue] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const navigation = useNavigation()

  // Load company data for Pix key suggestions
  useEffect(() => { loadCompanyData() }, [loadCompanyData])

  // Fetch balance for display during transfer
  const { data: financialData } = useFinancialSummary(customerId)
  const accountBalance = financialData?.balance?.current ?? 0

  // Load registered Pix keys from backend on mount
  useEffect(() => {
    if (!customerId) return
    ;(async () => {
      try {
        const { data } = await httpClient.get<
          | { keys: { key_type: string; key_value: string; formatted_value?: string }[] }
          | { key_type: string; key_value: string; formatted_value?: string }
          | { key_type: string; key_value: string; formatted_value?: string }[]
        >(`/v1/customers/${encodeURIComponent(customerId)}/pix/keys`)

        let list: { key_type: string; key_value: string; formatted_value?: string }[] = []
        if (data && typeof data === 'object') {
          if ('keys' in data && Array.isArray((data as { keys: unknown }).keys)) {
            list = (data as { keys: { key_type: string; key_value: string; formatted_value?: string }[] }).keys
          } else if (Array.isArray(data)) {
            list = data
          } else if ('key_type' in data) {
            // Single object response
            list = [data as { key_type: string; key_value: string; formatted_value?: string }]
          }
        }

        if (list.length > 0) {
          setRegisteredKeys(list.map((k) => ({
            type: k.key_type as PixKeyType,
            value: k.key_value,
          })))
        }
      } catch {
        // No keys registered yet or endpoint unavailable — start with empty list
      }
    })()
  }, [customerId])

  // Intercept hardware back & header back: navigate internal steps before popping screen
  const goBack = useCallback(() => {
    switch (step) {
      case 'key': setStep('menu'); return true
      case 'amount': setStep('key'); return true
      case 'confirm': setStep('amount'); return true
      case 'manage-keys': setStep('menu'); return true
      default: return false // allow default back (pop screen)
    }
  }, [step])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack)
    return () => sub.remove()
  }, [goBack])

  // Override Stack header back button — useFocusEffect ensures cleanup on blur (not just unmount)
  useFocusEffect(
    useCallback(() => {
      if (step !== 'menu') {
        navigation.setOptions({
          headerLeft: () => (
            <TouchableOpacity onPress={goBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ paddingLeft: 8 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textOnOrange} />
            </TouchableOpacity>
          ),
        })
      } else {
        navigation.setOptions({ headerLeft: undefined })
      }
      return () => { navigation.setOptions({ headerLeft: undefined }) }
    }, [step, navigation, goBack])
  )

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handleLookup = useCallback(async () => {
    if (!pixKey.trim()) return
    // Strip formatting for types that use digits only (cpf, cnpj, phone)
    const cleanKey = (keyType === 'cpf' || keyType === 'cnpj' || keyType === 'phone')
      ? pixKey.replace(/\D/g, '').trim()
      : pixKey.trim()
    await lookupKey(cleanKey, keyType)
    // Only advance to the amount step if lookup found a recipient
    const { recipient: found } = usePixStore.getState()
    if (found) {
      setStep('amount')
    }
  }, [pixKey, keyType, lookupKey])

  const handleConfirm = useCallback(() => {
    if (amount <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.')
      return
    }
    setStep('confirm')
  }, [amount])

  const handleTransfer = useCallback(async () => {
    // Strip formatting for types that use digits only
    const cleanKey = (keyType === 'cpf' || keyType === 'cnpj' || keyType === 'phone')
      ? pixKey.replace(/\D/g, '').trim()
      : pixKey.trim()
    await transfer(customerId ?? '', cleanKey, keyType, amount / 100, description)
    const { error: txError, lastTransfer: result } = usePixStore.getState()
    if (!txError && result) {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['financial'] }) // Atualiza saldo
      // Navigate to receipt screen
      router.replace({ pathname: '/pix-receipt', params: { transferId: result.transactionId } })
      reset()
    }
  }, [customerId, pixKey, keyType, amount, description, transfer, queryClient, router, reset])

  const handleRegisterKey = useCallback(async () => {
    if (registerKeyType !== 'random' && !registerKeyValue.trim()) {
      Alert.alert('Chave obrigatória', 'Informe o valor da chave.')
      return
    }
    setIsRegistering(true)
    haptic()
    try {
      // For non-email types, strip formatting; for email keep as-is
      const cleanValue = registerKeyType === 'email'
        ? registerKeyValue.trim()
        : registerKeyValue.replace(/\D/g, '').trim()

      const { data } = await httpClient.post<{ keyId: string; keyType: string; keyValue: string; key?: string; status: string }>('/v1/pix/keys/register', {
        customerId: customerId ?? '',
        keyType: registerKeyType,
        keyValue: registerKeyType === 'random' ? undefined : cleanValue,
      })
      const generatedKey = data.keyValue || data.key || registerKeyValue.trim()
      setRegisteredKeys((prev) => [...prev, { type: registerKeyType, value: generatedKey }])
      setRegisterKeyValue('')

      if (registerKeyType === 'random') {
        Alert.alert(
          'Chave aleatória cadastrada!',
          `Sua chave: ${generatedKey}`,
          [
            {
              text: 'Copiar chave',
              onPress: () => Clipboard.setStringAsync(generatedKey),
            },
            { text: 'OK' },
          ],
        )
      } else {
        const typeName = registerKeyType === 'cnpj' ? 'CNPJ' : registerKeyType === 'email' ? 'E-mail' : registerKeyType === 'phone' ? 'Telefone' : registerKeyType
        Alert.alert('Chave cadastrada!', `Chave ${typeName} registrada com sucesso.`)
      }
    } catch (err) {
      const msg = err instanceof AppError ? err.message : 'Erro ao cadastrar chave.'
      // Detect duplicate key errors and show a friendly message
      const isDuplicate = err instanceof AppError && (
        err.code === 'VALIDATION' ||
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('duplicate') ||
        msg.toLowerCase().includes('já') ||
        msg.toLowerCase().includes('conflict')
      )
      if (isDuplicate) {
        Alert.alert(
          'Chave já cadastrada',
          'Essa chave Pix já está vinculada a outra conta. Cada chave só pode ser registrada em uma conta por vez.',
        )
      } else {
        Alert.alert('Erro ao cadastrar chave', msg)
      }
    } finally {
      setIsRegistering(false)
    }
  }, [customerId, registerKeyType, registerKeyValue])

  const handleDeleteKey = useCallback(async (key: RegisteredKey, index: number) => {
    Alert.alert(
      'Excluir chave',
      `Deseja excluir a chave ${key.type.toUpperCase()}: ${key.value}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            haptic()
            try {
              await httpClient.delete('/v1/pix/keys', {
                data: { customerId: customerId ?? '', keyType: key.type, keyValue: key.value },
              })
              setRegisteredKeys((prev) => prev.filter((_, i) => i !== index))
              Alert.alert('Chave excluída', 'Chave Pix removida com sucesso.')
            } catch (err) {
              Alert.alert('Erro', err instanceof AppError ? err.message : 'Erro ao excluir chave.')
            }
          },
        },
      ],
    )
  }, [customerId])

  const handleCopyKey = useCallback(async (value: string) => {
    await Clipboard.setStringAsync(value)
    haptic()
    Alert.alert('Copiado!', 'Chave copiada para a área de transferência.')
  }, [])

  const getKeyPlaceholder = (type: PixKeyType): string => {
    switch (type) {
      case 'cnpj': return '00.000.000/0001-00'
      case 'email': return 'empresa@dominio.com'
      case 'phone': return '(11) 99999-9999'
      case 'random': return 'Gerada automaticamente'
      default: return ''
    }
  }

  // Format CNPJ: 00.000.000/0000-00
  const formatCNPJInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/\/(\d{4})(\d)/, '/$1-$2')
  }

  // Format CPF: 000.000.000-00
  const formatCPFInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // Format phone: (DD) 99999-9999
  const formatPhoneInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  // Auto-detect CPF vs CNPJ and format accordingly
  const formatDocumentInput = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) return formatCPFInput(value)
    return formatCNPJInput(value)
  }

  // Get formatted value for registration key input
  const formatRegisterKeyInput = (value: string, type: PixKeyType): string => {
    switch (type) {
      case 'cnpj': return formatCNPJInput(value)
      case 'phone': return formatPhoneInput(value)
      default: return value
    }
  }

  // Get keyboard type for key registration
  const getRegisterKeyboardType = (type: PixKeyType) => {
    switch (type) {
      case 'cnpj': return 'number-pad' as const
      case 'phone': return 'phone-pad' as const
      case 'email': return 'email-address' as const
      default: return 'default' as const
    }
  }

  // Get max length for key registration
  const getRegisterMaxLength = (type: PixKeyType) => {
    switch (type) {
      case 'cnpj': return 18
      case 'phone': return 15
      default: return undefined
    }
  }

  // Format transfer key input based on selected type
  const handleTransferKeyInput = (value: string) => {
    if (keyType === 'cpf' || keyType === 'cnpj') {
      setPixKey(formatDocumentInput(value))
    } else if (keyType === 'phone') {
      setPixKey(formatPhoneInput(value))
    } else {
      setPixKey(value)
    }
  }

  // Get keyboard type for transfer key
  const getTransferKeyboardType = () => {
    switch (keyType) {
      case 'cpf': return 'number-pad' as const
      case 'phone': return 'phone-pad' as const
      case 'email': return 'email-address' as const
      default: return 'default' as const
    }
  }

  // Get max length for transfer key
  const getTransferMaxLength = () => {
    switch (keyType) {
      case 'cpf': return 18 // CNPJ max
      case 'phone': return 15
      default: return undefined
    }
  }

  // Get placeholder for transfer key
  const getTransferPlaceholder = () => {
    switch (keyType) {
      case 'cpf': return '000.000.000-00 ou 00.000.000/0001-00'
      case 'email': return 'email@dominio.com'
      case 'phone': return '(11) 99999-9999'
      case 'random': return 'Chave aleatória'
      default: return 'Digite a chave do destinatário'
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Menu */}
        {step === 'menu' && (
          <>
            <Text style={styles.stepTitle}>Pix</Text>
            <Text style={styles.subtitle}>Envie ou gerencie suas chaves Pix</Text>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => { haptic(); setStep('key') }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.itauOrangeSoft }]}>
                <Ionicons name="send-outline" size={22} color={colors.itauOrange} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Enviar Pix</Text>
                <Text style={styles.menuSubtitle}>Transferência instantânea</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => { haptic(); setStep('manage-keys') }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="key-outline" size={22} color={colors.itauBlue} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Minhas Chaves</Text>
                <Text style={styles.menuSubtitle}>Cadastrar e gerenciar chaves Pix</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </>
        )}

        {/* Manage Pix Keys */}
        {step === 'manage-keys' && (
          <>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => setStep('menu')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepTitle}>Minhas Chaves Pix</Text>
            </View>

            {/* Registered keys */}
            {registeredKeys.length > 0 && (
              <View style={styles.keysCard}>
                {registeredKeys.map((k, i) => (
                  <View key={i} style={styles.keyRow}>
                    <View style={[styles.keyIcon, { backgroundColor: colors.successLight }]}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    </View>
                    <View style={styles.keyInfo}>
                      <Text style={styles.keyType}>{k.type === 'random' ? 'CHAVE ALEATÓRIA' : k.type.toUpperCase()}</Text>
                      <Text style={styles.keyValue} numberOfLines={1}>
                        {k.type === 'cnpj' ? formatCNPJInput(k.value) : k.type === 'cpf' ? formatCPFInput(k.value) : k.type === 'phone' ? formatPhoneInput(k.value) : k.value}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCopyKey(k.value)}
                      style={styles.keyActionBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="copy-outline" size={18} color={colors.itauBlue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteKey(k, i)}
                      style={styles.keyActionBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Register new key */}
            <Card style={styles.registerCard}>
              <Text style={styles.registerTitle}>Cadastrar nova chave</Text>

              {/* Auto-suggest from company data */}
              {companyData && (
                <View style={styles.suggestSection}>
                  <Text style={styles.suggestLabel}>Sugestões com base nos seus dados:</Text>
                  <View style={styles.suggestRow}>
                    {companyData.cnpj && !registeredKeys.some((k) => k.type === 'cnpj') && (
                      <TouchableOpacity
                        style={styles.suggestChip}
                        onPress={() => { setRegisterKeyType('cnpj'); setRegisterKeyValue(formatCNPJInput(companyData.cnpj!)) }}
                      >
                        <Ionicons name="business-outline" size={14} color={colors.itauBlue} />
                        <Text style={styles.suggestChipText}>CNPJ</Text>
                      </TouchableOpacity>
                    )}
                    {companyData.email && !registeredKeys.some((k) => k.type === 'email') && (
                      <TouchableOpacity
                        style={styles.suggestChip}
                        onPress={() => { setRegisterKeyType('email'); setRegisterKeyValue(companyData.email!) }}
                      >
                        <Ionicons name="mail-outline" size={14} color={colors.itauBlue} />
                        <Text style={styles.suggestChipText}>E-mail</Text>
                      </TouchableOpacity>
                    )}
                    {companyData.phone && !registeredKeys.some((k) => k.type === 'phone') && (
                      <TouchableOpacity
                        style={styles.suggestChip}
                        onPress={() => { setRegisterKeyType('phone'); setRegisterKeyValue(formatPhoneInput(companyData.phone!)) }}
                      >
                        <Ionicons name="call-outline" size={14} color={colors.itauBlue} />
                        <Text style={styles.suggestChipText}>Telefone</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.keyTypeRow}>
                {KEY_TYPES.map((kt) => (
                  <TouchableOpacity
                    key={kt.value}
                    style={[styles.keyTypeChip, registerKeyType === kt.value && styles.keyTypeChipActive]}
                    onPress={() => { setRegisterKeyType(kt.value); setRegisterKeyValue('') }}
                  >
                    <Ionicons
                      name={kt.icon}
                      size={14}
                      color={registerKeyType === kt.value ? colors.itauOrange : colors.textMuted}
                    />
                    <Text style={[styles.keyTypeLabel, registerKeyType === kt.value && styles.keyTypeLabelActive]}>
                      {kt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {registerKeyType !== 'random' && (
                <InputField
                  label={`Valor da chave (${registerKeyType === 'cnpj' ? 'CNPJ' : registerKeyType === 'email' ? 'E-mail' : registerKeyType === 'phone' ? 'Telefone' : registerKeyType})`}
                  value={registerKeyValue}
                  onChangeText={(v) => setRegisterKeyValue(formatRegisterKeyInput(v, registerKeyType))}
                  placeholder={getKeyPlaceholder(registerKeyType)}
                  autoCapitalize="none"
                  keyboardType={getRegisterKeyboardType(registerKeyType)}
                  maxLength={getRegisterMaxLength(registerKeyType)}
                />
              )}

              {registerKeyType === 'random' && (
                <View style={styles.randomInfo}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.itauBlue} />
                  <Text style={styles.randomText}>Uma chave aleatória será gerada automaticamente pelo sistema.</Text>
                </View>
              )}

              <ActionButton
                title={isRegistering ? 'Cadastrando...' : 'Cadastrar chave'}
                onPress={handleRegisterKey}
                loading={isRegistering}
                disabled={registerKeyType !== 'random' && !registerKeyValue.trim()}
              />
            </Card>
          </>
        )}

        {/* Step 1: Key input */}
        {step === 'key' && (
          <>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => setStep('menu')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepTitle}>Para quem você quer enviar?</Text>
            </View>

            <View style={styles.keyTypeRow}>
              {TRANSFER_KEY_TYPES.map((kt) => (
                <TouchableOpacity
                  key={kt.value}
                  style={[styles.keyTypeChip, keyType === kt.value && styles.keyTypeChipActive]}
                  onPress={() => { setKeyType(kt.value) }}
                >
                  <Ionicons
                    name={kt.icon}
                    size={16}
                    color={keyType === kt.value ? colors.itauOrange : colors.textMuted}
                  />
                  <Text
                    style={[styles.keyTypeLabel, keyType === kt.value && styles.keyTypeLabelActive]}
                  >
                    {kt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <InputField
              label="Chave Pix"
              value={pixKey}
              onChangeText={handleTransferKeyInput}
              placeholder={getTransferPlaceholder()}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={getTransferKeyboardType()}
              maxLength={getTransferMaxLength()}
            />

            <View style={styles.buttonWrap}>
              <ActionButton
                title="Continuar"
                onPress={handleLookup}
                loading={isLookingUp}
                disabled={!pixKey.trim()}
              />
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>
                  {error.code === 'NOT_FOUND' || error.message.includes('não encontrad')
                    ? 'Chave Pix não encontrada. Verifique os dados e tente novamente.'
                    : error.message}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && (
          <>
            {recipient && (
              <Card style={styles.recipientCard}>
                <View style={styles.recipientRow}>
                  <View style={styles.recipientAvatar}>
                    <Ionicons name="person" size={20} color={colors.itauOrange} />
                  </View>
                  <View style={styles.recipientInfo}>
                    <Text style={styles.recipientName}>{recipient.name}</Text>
                    <Text style={styles.recipientDoc}>{formatPixKey(pixKey, keyType)}</Text>
                    <Text style={styles.recipientBank}>{recipient.bank}</Text>
                  </View>
                </View>
              </Card>
            )}

            <Text style={styles.stepTitle}>Qual o valor?</Text>

            <View style={styles.balanceBanner}>
              <Ionicons name="wallet-outline" size={16} color={colors.itauBlue} />
              <Text style={styles.balanceBannerText}>Saldo disponível: </Text>
              <Text style={styles.balanceBannerValue}>{formatCurrency(accountBalance)}</Text>
            </View>

            <AmountInput value={amount} onChange={setAmount} />

            <InputField
              label="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Pagamento fornecedor"
            />

            <View style={styles.buttonGroup}>
              <ActionButton title="Voltar" onPress={() => setStep('key')} variant="secondary" />
              <ActionButton title="Revisar" onPress={handleConfirm} disabled={amount <= 0} />
            </View>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <>
            <Text style={styles.stepTitle}>Confirme a transferência</Text>

            <Card style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Destinatário</Text>
                <Text style={styles.confirmValue}>{recipient?.name ?? pixKey}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Chave Pix</Text>
                <Text style={styles.confirmValue}>{formatPixKey(pixKey, keyType)}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Valor</Text>
                <Text style={styles.confirmValueBig}>{formatCurrency(amount / 100)}</Text>
              </View>
              {description ? (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Descrição</Text>
                  <Text style={styles.confirmValue}>{description}</Text>
                </View>
              ) : null}
            </Card>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <ActionButton title="Editar" onPress={() => setStep('amount')} variant="secondary" />
              <ActionButton title="Confirmar Pix" onPress={handleTransfer} loading={isTransferring} />
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
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },

  // Menu
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.sm,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  menuSubtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },

  // Key management
  keysCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  keyIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  keyInfo: { flex: 1 },
  keyType: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.itauOrange },
  keyValue: { fontSize: fontSize.sm, color: colors.textPrimary, marginTop: spacing['2xs'] },
  keyActionBtn: { padding: spacing.sm },

  registerCard: { gap: spacing.lg },
  registerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },

  randomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  randomText: { flex: 1, fontSize: fontSize.xs, color: colors.itauBlue },

  // Transfer flow
  keyTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  keyTypeChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgSecondary, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1.5, borderColor: colors.borderLight },
  keyTypeChipActive: { borderColor: colors.itauOrange, backgroundColor: colors.itauOrangeSoft },
  keyTypeLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.medium },
  keyTypeLabelActive: { color: colors.itauOrange },
  balanceBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.infoLight, padding: spacing.lg, borderRadius: radius.lg },
  balanceBannerText: { fontSize: fontSize.sm, color: colors.itauBlue },
  balanceBannerValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.itauBlue },
  buttonWrap: { marginTop: spacing.md },
  buttonGroup: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  recipientCard: { padding: spacing.xl },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  recipientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.itauOrangeSoft, alignItems: 'center', justifyContent: 'center' },
  recipientInfo: { flex: 1 },
  recipientName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  recipientDoc: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing['2xs'] },
  recipientBank: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing['2xs'] },
  confirmCard: { gap: spacing.lg },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  confirmValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary, textAlign: 'right', maxWidth: '60%' },
  confirmValueBig: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.itauOrange },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.errorLight, padding: spacing.lg, borderRadius: radius.lg },
  errorText: { fontSize: fontSize.sm, color: colors.error, flex: 1 },

  // Suggestions
  suggestSection: { backgroundColor: colors.infoLight, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  suggestLabel: { fontSize: fontSize.xs, color: colors.itauBlue, fontWeight: fontWeight.medium },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  suggestChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgSecondary, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.itauBlue },
  suggestChipText: { fontSize: fontSize.xs, color: colors.itauBlue, fontWeight: fontWeight.semibold },
})
