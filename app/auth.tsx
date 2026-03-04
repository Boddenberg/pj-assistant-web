// ─── Auth Screen ─────────────────────────────────────────────────────
// Banking login / account creation — Itaú PJ premium identity.
// Multi-step: Welcome → Login | Register (3 steps)

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Dimensions, FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '@/stores/auth.store'
import { useCustomerStore, useOnboardingChatStore, useChatStore } from '@/stores'
import { authService } from '@/services/auth.service'
import { ChatBubble, ChatInput, TypingIndicator } from '@/components/chat'
import { getOnboardingProgress } from '@/types'
import { resetTempSessionId, AppError } from '@/lib'
import type {
  AuthStep, LoginRequest, RegisterStep1Data,
  RegisterStep2Data, RegisterStep3Data,
  ChatMessage,
} from '@/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ─── Formatters ──────────────────────────────────────────────────────

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3')
  }
  return digits.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3')
}

function formatDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
}

// ─── Styled Input ────────────────────────────────────────────────────

interface AuthInputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  keyboardType?: TextInput['props']['keyboardType']
  secureTextEntry?: boolean
  maxLength?: number
  error?: string
  autoCapitalize?: TextInput['props']['autoCapitalize']
}

function AuthInput({
  label, value, onChangeText, placeholder, keyboardType,
  secureTextEntry, maxLength, error, autoCapitalize,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[
        inputStyles.inputWrap,
        focused && inputStyles.inputFocused,
        error && inputStyles.inputError,
      ]}>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showPassword}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={inputStyles.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={inputStyles.error}>{error}</Text>}
    </View>
  )
}

const inputStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: colors.itauOrange,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  eyeBtn: {
    paddingRight: spacing.lg,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginLeft: spacing.xs,
  },
})

// ─── Animated AI Badge ───────────────────────────────────────────────

function AiBadge() {
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [pulseAnim])

  const translateY = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -3, 0],
  })

  const scale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  })

  return (
    <Animated.View
      style={[
        badgeStyles.container,
        { transform: [{ translateY }, { scale }] },
      ]}
    >
      <Ionicons name="sparkles" size={9} color="#FFD700" />
      <Text style={badgeStyles.text}>com IA</Text>
    </Animated.View>
  )
}

const badgeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    top: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.itauNavy,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: colors.itauNavy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  text: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
})

// ─── Main Screen ─────────────────────────────────────────────────────

export default function AuthScreen() {
  const { currentStep, setStep, setAuthenticated, savedCpf, loadSavedCpf, saveCpf, saveCompanyData, loadCompanyData } = useAuthStore()
  const { setCustomerId } = useCustomerStore()
  const fadeAnim = useRef(new Animated.Value(1)).current

  // Login state
  const [loginForm, setLoginForm] = useState<LoginRequest>({
    cpf: '', password: '',
  })

  // Register state
  const [reg1, setReg1] = useState<RegisterStep1Data>({
    cnpj: '', razaoSocial: '', nomeFantasia: '', email: '',
  })
  const [reg2, setReg2] = useState<RegisterStep2Data>({
    representanteName: '', representanteCpf: '',
    representantePhone: '', representanteBirthDate: '',
  })
  const [reg3, setReg3] = useState<RegisterStep3Data>({
    password: '', passwordConfirm: '', acceptTerms: false,
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState<{ agencia: string; conta: string } | null>(null)

  // Load saved CPF on mount
  useEffect(() => {
    loadSavedCpf().then((cpf) => {
      if (cpf) setLoginForm((prev) => ({ ...prev, cpf }))
    })
  }, [loadSavedCpf])

  const animateTransition = (nextStep: AuthStep) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep)
      setErrors({})
      setGeneralError('')
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start()
    })
  }

  const haptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  // ─── Login ───────────────────────────────────────────────────────

  const handleLogin = async () => {
    const newErrors: Record<string, string> = {}
    const cpf = loginForm.cpf.replace(/\D/g, '')
    if (cpf.length !== 11) newErrors.cpf = 'CPF deve ter 11 dígitos'
    if (loginForm.password.length < 6) newErrors.password = 'Senha deve ter 6 dígitos'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    haptic()
    setLoading(true)
    setGeneralError('')

    // Retry logic: up to 4 attempts (~15s total: 0 + 2s + 4s + 8s delays)
    const MAX_ATTEMPTS = 4
    let lastError: unknown = null

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await authService.login({
          cpf,
          password: loginForm.password,
        })
        setCustomerId(response.customerId)
        saveCpf(loginForm.cpf) // Remember CPF for next login
        // Clear chat — no need to reset temp ID, login uses real customerId
        useChatStore.getState().clearChat()

        setAuthenticated({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          customerId: response.customerId,
          customerName: response.customerName,
          companyName: response.companyName,
        })
        setLoading(false)
        return // success — exit early
      } catch (err) {
        lastError = err
        // Don't retry on auth errors (wrong credentials)
        const isAuthError =
          (err instanceof AppError &&
            (err.code === 'UNAUTHORIZED' || err.code === 'FORBIDDEN'))
        if (isAuthError) break

        // Wait before next attempt (2s, 4s, 8s)
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
        }
      }
    }

    // All attempts failed
    const isAuthError =
      (lastError instanceof AppError &&
        (lastError.code === 'UNAUTHORIZED' || lastError.code === 'FORBIDDEN'))
    if (isAuthError) {
      setGeneralError('CPF ou senha incorretos. Tente novamente.')
    } else {
      setGeneralError('Não foi possível conectar. Verifique sua internet e tente novamente.')
    }
    setLoading(false)
  }

  // ─── Register Validation ────────────────────────────────────────

  const validateReg1 = (): boolean => {
    const newErrors: Record<string, string> = {}
    const cnpj = reg1.cnpj.replace(/\D/g, '')
    if (cnpj.length !== 14) newErrors.cnpj = 'CNPJ deve ter 14 dígitos'
    if (!reg1.razaoSocial.trim()) newErrors.razaoSocial = 'Informe a razão social'
    if (!reg1.nomeFantasia.trim()) newErrors.nomeFantasia = 'Informe o nome fantasia'
    if (!reg1.email.includes('@')) newErrors.email = 'E-mail inválido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateReg2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!reg2.representanteName.trim()) newErrors.name = 'Informe o nome'
    const cpf = reg2.representanteCpf.replace(/\D/g, '')
    if (cpf.length !== 11) newErrors.cpf = 'CPF deve ter 11 dígitos'
    const phone = reg2.representantePhone.replace(/\D/g, '')
    if (phone.length < 10) newErrors.phone = 'Celular inválido'
    const birth = reg2.representanteBirthDate.replace(/\D/g, '')
    if (birth.length !== 8) newErrors.birth = 'Data inválida'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateReg3 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (reg3.password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 dígitos'
    if (reg3.password !== reg3.passwordConfirm) newErrors.confirm = 'Senhas não conferem'
    if (!reg3.acceptTerms) newErrors.terms = 'Aceite os termos para continuar'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateReg3()) return
    haptic()
    setLoading(true)
    setGeneralError('')
    try {
      const response = await authService.register({
        cnpj: reg1.cnpj.replace(/\D/g, ''),
        razaoSocial: reg1.razaoSocial,
        nomeFantasia: reg1.nomeFantasia,
        email: reg1.email,
        representanteName: reg2.representanteName,
        representanteCpf: reg2.representanteCpf.replace(/\D/g, ''),
        representantePhone: reg2.representantePhone.replace(/\D/g, ''),
        representanteBirthDate: reg2.representanteBirthDate,
        password: reg3.password,
      })
      setRegisterSuccess({ agencia: response.agencia, conta: response.conta })
      // Save company data for Pix key suggestions
      saveCompanyData({
        cnpj: reg1.cnpj.replace(/\D/g, ''),
        email: reg1.email,
        phone: reg2.representantePhone.replace(/\D/g, ''),
      })
    } catch {
      setGeneralError('Erro ao criar conta. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Render Steps ────────────────────────────────────────────────

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>Itaú</Text>
          <Text style={styles.logoSuffix}>Empresas</Text>
        </View>

        <View style={styles.caseBadgeRow}>
          <View style={styles.caseBadge}>
            <Text style={styles.caseBadgeText}>CASE TÉCNICO</Text>
          </View>
          <Text style={styles.caseDividerDot}>·</Text>
          <Text style={styles.caseTeam}>Time de Inteligência</Text>
        </View>

        <Text style={styles.heroTitle}>Engenheiro{'\n'}Sênior</Text>
        <Text style={styles.caseProduct}>BFA em Go + IA Generativa</Text>

        <View style={styles.caseSeparator} />
        <Text style={styles.caseDescription}>
          Assistente conversacional inteligente para clientes PJ — Backend Go com arquitetura hexagonal, Agente LLM com LangGraph e RAG.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.welcomeActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => { haptic(); animateTransition('login') }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-in-outline" size={20} color={colors.textInverse} />
          <Text style={styles.primaryButtonText}>Acessar minha conta</Text>
        </TouchableOpacity>

        <View>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => { haptic(); animateTransition('register-1') }}
            activeOpacity={0.7}
          >
            <Ionicons name="business-outline" size={20} color={colors.itauOrange} />
            <Text style={styles.secondaryButtonText}>Abrir conta PJ</Text>
          </TouchableOpacity>
          <AiBadge />
        </View>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => { haptic(); animateTransition('open-ai-chat') }}
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles" size={18} color="#FFD700" />
          <Text style={styles.aiButtonText}>Abrir conta com IA</Text>
        </TouchableOpacity>

        <View style={styles.welcomeFooter}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Banco Itaú Unibanco S.A.</Text>
          <Text style={styles.footerSmall}>CNPJ 60.701.190/0001-04</Text>
        </View>
      </View>
    </View>
  )

  const renderLogin = () => (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {/* Header */}
      <View style={styles.formHeader}>
        <TouchableOpacity
          onPress={() => { haptic(); animateTransition('welcome') }}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.formHeaderTitle}>Acessar conta</Text>
        <Text style={styles.formHeaderSubtitle}>
          Informe seu CPF e senha eletrônica
        </Text>
      </View>

      {/* Sheet */}
      <View style={styles.formSheet}>
        <View style={styles.sheetHandle} />

        <AuthInput
          label="CPF do representante"
          value={loginForm.cpf}
          onChangeText={(v) => setLoginForm({ ...loginForm, cpf: formatCPF(v) })}
          placeholder="000.000.000-00"
          keyboardType="number-pad"
          maxLength={14}
          error={errors.cpf}
        />

        <AuthInput
          label="Senha eletrônica"
          value={loginForm.password}
          onChangeText={(v) => setLoginForm({ ...loginForm, password: v.replace(/\D/g, '').slice(0, 6) })}
          placeholder="••••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          error={errors.password}
        />

        {generalError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorBannerText}>{generalError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.primaryButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  const renderRegister1 = () => (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContentCompact}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.formHeaderCompact}>
        <View style={styles.formHeaderRow}>
          <TouchableOpacity
            onPress={() => { haptic(); animateTransition('welcome') }}
            style={styles.backBtnSmall}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.formHeaderTitleCompact}>Abrir conta PJ</Text>
            <Text style={styles.formHeaderSubtitle}>Dados da empresa</Text>
          </View>
        </View>
        <StepIndicator current={1} total={3} />
      </View>

      <View style={styles.formSheetCompact}>
        <View style={styles.sheetHandle} />

        <AuthInput
          label="CNPJ"
          value={reg1.cnpj}
          onChangeText={(v) => setReg1({ ...reg1, cnpj: formatCNPJ(v) })}
          placeholder="00.000.000/0000-00"
          keyboardType="number-pad"
          maxLength={18}
          error={errors.cnpj}
        />

        <AuthInput
          label="Razão Social"
          value={reg1.razaoSocial}
          onChangeText={(v) => setReg1({ ...reg1, razaoSocial: v })}
          placeholder="Nome registrado na Receita Federal"
          autoCapitalize="words"
          error={errors.razaoSocial}
        />

        <AuthInput
          label="Nome Fantasia"
          value={reg1.nomeFantasia}
          onChangeText={(v) => setReg1({ ...reg1, nomeFantasia: v })}
          placeholder="Nome comercial da empresa"
          autoCapitalize="words"
          error={errors.nomeFantasia}
        />

        <AuthInput
          label="E-mail corporativo"
          value={reg1.email}
          onChangeText={(v) => setReg1({ ...reg1, email: v })}
          placeholder="empresa@dominio.com.br"
          keyboardType="email-address"
          error={errors.email}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            haptic()
            if (validateReg1()) animateTransition('register-2')
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
        </TouchableOpacity>

        {/* AI alternative banner */}
        <View style={styles.aiDividerRow}>
          <View style={styles.aiDividerLine} />
          <Text style={styles.aiDividerText}>ou</Text>
          <View style={styles.aiDividerLine} />
        </View>

        <TouchableOpacity
          style={styles.aiRegisterBanner}
          onPress={() => { haptic(); animateTransition('open-ai-chat') }}
          activeOpacity={0.7}
        >
          <View style={styles.aiRegisterIcon}>
            <Ionicons name="sparkles" size={18} color={colors.textInverse} />
          </View>
          <View style={styles.aiRegisterContent}>
            <Text style={styles.aiRegisterTitle}>Abra sua conta com IA</Text>
            <Text style={styles.aiRegisterSub}>
              Sem formulários — converse com nosso assistente
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.itauOrange} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  const renderRegister2 = () => (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.formHeader}>
        <TouchableOpacity
          onPress={() => { haptic(); animateTransition('register-1') }}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.formHeaderTitle}>Abrir conta PJ</Text>
        <Text style={styles.formHeaderSubtitle}>Representante legal</Text>
        <StepIndicator current={2} total={3} />
      </View>

      <View style={styles.formSheet}>
        <View style={styles.sheetHandle} />

        <AuthInput
          label="Nome completo"
          value={reg2.representanteName}
          onChangeText={(v) => setReg2({ ...reg2, representanteName: v })}
          placeholder="Nome do representante legal"
          autoCapitalize="words"
          error={errors.name}
        />

        <AuthInput
          label="CPF"
          value={reg2.representanteCpf}
          onChangeText={(v) => setReg2({ ...reg2, representanteCpf: formatCPF(v) })}
          placeholder="000.000.000-00"
          keyboardType="number-pad"
          maxLength={14}
          error={errors.cpf}
        />

        <AuthInput
          label="Celular"
          value={reg2.representantePhone}
          onChangeText={(v) => setReg2({ ...reg2, representantePhone: formatPhone(v) })}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
          maxLength={15}
          error={errors.phone}
        />

        <AuthInput
          label="Data de nascimento"
          value={reg2.representanteBirthDate}
          onChangeText={(v) => setReg2({ ...reg2, representanteBirthDate: formatDate(v) })}
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          maxLength={10}
          error={errors.birth}
        />

        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => { haptic(); animateTransition('register-1') }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={colors.itauOrange} />
            <Text style={styles.outlineButtonText}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { flex: 1 }]}
            onPress={() => {
              haptic()
              if (validateReg2()) animateTransition('register-3')
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )

  const renderRegister3 = () => (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.formHeader}>
        <TouchableOpacity
          onPress={() => { haptic(); animateTransition('register-2') }}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.formHeaderTitle}>Abrir conta PJ</Text>
        <Text style={styles.formHeaderSubtitle}>{registerSuccess ? 'Conta criada' : 'Senha e confirmação'}</Text>
        <StepIndicator current={registerSuccess ? 4 : 3} total={3} />
      </View>

      <View style={styles.formSheet}>
        <View style={styles.sheetHandle} />

        {registerSuccess ? (
          /* Success state */
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={36} color={colors.textInverse} />
            </View>
            <Text style={styles.successTitle}>Conta criada com sucesso!</Text>
            <Text style={styles.successSubtitle}>
              Seus dados de acesso foram gerados
            </Text>

            <View style={styles.accountInfoCard}>
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Agência</Text>
                <Text style={styles.accountInfoValue} adjustsFontSizeToFit numberOfLines={1}>{registerSuccess.agencia}</Text>
              </View>
              <View style={styles.accountInfoDivider} />
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountInfoLabel}>Conta</Text>
                <Text style={styles.accountInfoValue} adjustsFontSizeToFit numberOfLines={1}>{registerSuccess.conta}</Text>
              </View>
            </View>

            <Text style={styles.successHint}>
              Anote seus dados. Use o CPF do representante e a senha que você acabou de criar para fazer login.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                haptic()
                setRegisterSuccess(null)
                animateTransition('login')
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-in-outline" size={20} color={colors.textInverse} />
              <Text style={styles.primaryButtonText}>Ir para o login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Form state */
          <>
            <AuthInput
              label="Senha eletrônica (6 dígitos)"
              value={reg3.password}
              onChangeText={(v) => setReg3({ ...reg3, password: v.replace(/\D/g, '').slice(0, 6) })}
              placeholder="••••••"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              error={errors.password}
            />

            <AuthInput
              label="Confirme a senha"
              value={reg3.passwordConfirm}
              onChangeText={(v) => setReg3({ ...reg3, passwordConfirm: v.replace(/\D/g, '').slice(0, 6) })}
              placeholder="••••••"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              error={errors.confirm}
            />

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => {
                haptic()
                setReg3({ ...reg3, acceptTerms: !reg3.acceptTerms })
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                reg3.acceptTerms && styles.checkboxChecked,
              ]}>
                {reg3.acceptTerms && (
                  <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                )}
              </View>
              <Text style={styles.termsText}>
                Li e aceito os{' '}
                <Text style={styles.termsLink}>Termos de Uso</Text>
                {' '}e a{' '}
                <Text style={styles.termsLink}>Política de Privacidade</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={inputStyles.error}>{errors.terms}</Text>}

            {/* Security info */}
            <View style={styles.securityInfo}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
              <Text style={styles.securityText}>
                Seus dados são protegidos com criptografia de ponta a ponta
              </Text>
            </View>

            {generalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            ) : null}

            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => { haptic(); animateTransition('register-2') }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={colors.itauOrange} />
                <Text style={styles.outlineButtonText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />
                    <Text style={styles.primaryButtonText}>Criar conta</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  )

  // ─── AI Chat ─────────────────────────────────────────────────────

  const aiChatFlatListRef = useRef<FlatList<ChatMessage>>(null)
  const aiMessages = useOnboardingChatStore((s) => s.messages)
  const aiIsLoading = useOnboardingChatStore((s) => s.isLoading)
  const aiSendMessage = useOnboardingChatStore((s) => s.sendMessage)
  const aiClearChat = useOnboardingChatStore((s) => s.clearChat)
  const aiStep = useOnboardingChatStore((s) => s.step)
  const aiAccountData = useOnboardingChatStore((s) => s.accountData)
  const aiIsPassword = useOnboardingChatStore((s) => s.isPasswordField)

  // Reset chat state every time user enters the AI chat screen
  useEffect(() => {
    if (currentStep === 'open-ai-chat') {
      resetTempSessionId()  // new temp ID FIRST so the next chat call uses it
      aiClearChat()
    }
  }, [currentStep])

  // DevTool: reset onboarding chat
  const handleResetDevSession = useCallback(() => {
    resetTempSessionId()  // new temp ID → backend sees a fresh session
    aiClearChat()
  }, [aiClearChat])

  const aiProgress = getOnboardingProgress(aiStep)
  const aiCompleted = aiStep === 'completed' && aiAccountData !== null

  // Success screen animations
  const successFade = useRef(new Animated.Value(0)).current
  const successScale = useRef(new Animated.Value(0.8)).current
  const cardSlide = useRef(new Animated.Value(30)).current
  const cardFade = useRef(new Animated.Value(0)).current
  const btnSlide = useRef(new Animated.Value(20)).current
  const btnFade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (aiCompleted) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(successFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(successScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(cardFade, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(cardSlide, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(btnFade, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(btnSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start()
    } else {
      successFade.setValue(0)
      successScale.setValue(0.8)
      cardSlide.setValue(30)
      cardFade.setValue(0)
      btnSlide.setValue(20)
      btnFade.setValue(0)
    }
  }, [aiCompleted])

  const handleAISend = useCallback(
    async (text: string) => {
      await aiSendMessage(text)
      setTimeout(() => {
        aiChatFlatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    },
    [aiSendMessage],
  )

  const renderAIChat = () => (
    <View style={aiStyles.container}>
      {/* Header */}
      <View style={aiStyles.header}>
        <TouchableOpacity
          onPress={() => {
            haptic()
            resetTempSessionId()
            aiClearChat()
            animateTransition('welcome')
          }}
          style={aiStyles.headerBackBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
        </TouchableOpacity>

        <View style={aiStyles.headerCenter}>
          <View style={aiStyles.headerDot}>
            <Ionicons name="sparkles" size={12} color={colors.textInverse} />
          </View>
          <View>
            <Text style={aiStyles.headerTitle}>Abertura de Conta com IA</Text>
            <Text style={aiStyles.headerSub}>Assistente Itaú Empresas</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => { haptic(); handleResetDevSession() }}
          style={aiStyles.resetBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="refresh" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {aiProgress > 0 && !aiCompleted && (
        <View style={aiStyles.progressContainer}>
          <View style={aiStyles.progressTrack}>
            <View style={[aiStyles.progressFill, { width: `${aiProgress}%` }]} />
          </View>
          <Text style={aiStyles.progressText}>{aiProgress}%</Text>
        </View>
      )}

      {/* Chat area */}
      <View style={aiStyles.chatArea}>
        {aiCompleted && aiAccountData ? (
          /* ── Premium Success Screen ── */
          <ScrollView
            contentContainerStyle={aiSuccessStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Animated icon + title */}
            <Animated.View style={[
              aiSuccessStyles.heroBlock,
              { opacity: successFade, transform: [{ scale: successScale }] },
            ]}>
              <View style={aiSuccessStyles.successIcon}>
                <View style={aiSuccessStyles.successIconInner}>
                  <Ionicons name="checkmark-done" size={40} color={colors.textInverse} />
                </View>
                <View style={aiSuccessStyles.iconRing} />
              </View>
              <Text style={aiSuccessStyles.title}>Conta criada{'\n'}com sucesso!</Text>
              <Text style={aiSuccessStyles.subtitle}>
                Tudo pronto para você começar a usar{'\n'}sua conta PJ Itaú Empresas
              </Text>
            </Animated.View>

            {/* Account card */}
            <Animated.View style={[
              aiSuccessStyles.accountCard,
              { opacity: cardFade, transform: [{ translateY: cardSlide }] },
            ]}>
              <View style={aiSuccessStyles.cardHeader}>
                <Ionicons name="business" size={18} color={colors.itauOrange} />
                <Text style={aiSuccessStyles.cardHeaderText}>Dados da sua conta</Text>
              </View>
              <View style={aiSuccessStyles.cardBody}>
                <View style={aiSuccessStyles.cardDataRow}>
                  <View style={aiSuccessStyles.cardDataItemSmall}>
                    <Text style={aiSuccessStyles.cardDataLabel}>Agência</Text>
                    <Text style={aiSuccessStyles.cardDataValue} numberOfLines={1}>{aiAccountData.agencia}</Text>
                  </View>
                  <View style={aiSuccessStyles.cardDivider} />
                  <View style={aiSuccessStyles.cardDataItemLarge}>
                    <Text style={aiSuccessStyles.cardDataLabel}>Conta</Text>
                    <Text style={aiSuccessStyles.cardDataValue} numberOfLines={1}>{aiAccountData.conta}</Text>
                  </View>
                </View>
              </View>
              <View style={aiSuccessStyles.cardFooter}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <Text style={aiSuccessStyles.cardFooterText}>
                  Conta protegida com criptografia de ponta a ponta
                </Text>
              </View>
            </Animated.View>

            {/* Hint */}
            <Animated.View style={[
              aiSuccessStyles.hintBlock,
              { opacity: cardFade, transform: [{ translateY: cardSlide }] },
            ]}>
              <View style={aiSuccessStyles.hintIcon}>
                <Ionicons name="information-circle" size={20} color={colors.itauOrange} />
              </View>
              <Text style={aiSuccessStyles.hintText}>
                Anote seus dados. Use o CPF do representante e a senha que você informou para fazer login.
              </Text>
            </Animated.View>

            {/* CTA Button */}
            <Animated.View style={[
              aiSuccessStyles.ctaBlock,
              { opacity: btnFade, transform: [{ translateY: btnSlide }] },
            ]}>
              <TouchableOpacity
                style={aiSuccessStyles.ctaButton}
                onPress={() => {
                  haptic()
                  resetTempSessionId()
                  aiClearChat()
                  animateTransition('login')
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="log-in-outline" size={22} color={colors.textInverse} />
                <Text style={aiSuccessStyles.ctaText}>Acessar minha conta</Text>
              </TouchableOpacity>
              <Text style={aiSuccessStyles.ctaSub}>
                Você será redirecionado para a tela de login
              </Text>
            </Animated.View>
          </ScrollView>
        ) : (
          /* ── Chat messages ── */
          <>
            <FlatList
              ref={aiChatFlatListRef}
              data={aiMessages}
              renderItem={({ item }: { item: ChatMessage }) => <ChatBubble message={item} />}
              keyExtractor={(item: ChatMessage) => item.id}
              contentContainerStyle={[
                aiStyles.chatList,
                aiMessages.length === 0 && aiStyles.chatListEmpty,
              ]}
              ListEmptyComponent={
                <View style={aiStyles.emptyContainer}>
                  <View style={aiStyles.emptyCircle}>
                    <Ionicons name="sparkles" size={28} color={colors.itauOrange} />
                  </View>
                  <Text style={aiStyles.emptyTitle}>Olá! 👋</Text>
                  <Text style={aiStyles.emptySubtitle}>
                    Sou o assistente inteligente do Itaú.{"\n"}
                    Pergunte qualquer coisa sobre abertura{"\n"}
                    de conta PJ ou outros assuntos.
                  </Text>
                  {[
                    { icon: 'business-outline' as const, text: 'Quero abrir uma conta PJ' },
                    { icon: 'help-circle-outline' as const, text: 'Quais documentos preciso?' },
                    { icon: 'card-outline' as const, text: 'Quais são as taxas e tarifas?' },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.text}
                      style={aiStyles.suggestionChip}
                      onPress={() => handleAISend(s.text)}
                      activeOpacity={0.6}
                    >
                      <Ionicons name={s.icon} size={16} color={colors.itauOrange} />
                      <Text style={aiStyles.suggestionText}>{s.text}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              }
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (aiMessages.length > 0) {
                  aiChatFlatListRef.current?.scrollToEnd({ animated: false })
                }
              }}
            />

            {aiIsLoading && (
              <View style={aiStyles.typingWrap}>
                <TypingIndicator />
              </View>
            )}

            <ChatInput
              onSend={handleAISend}
              isLoading={aiIsLoading}
              secureTextEntry={aiIsPassword}
            />
          </>
        )}
      </View>
    </View>
  )

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={currentStep === 'open-ai-chat' ? aiStyles.rootWhite : styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Animated.View style={[styles.animatedWrap, { opacity: fadeAnim }]}>
        {currentStep === 'welcome' && renderWelcome()}
        {currentStep === 'login' && renderLogin()}
        {currentStep === 'register-1' && renderRegister1()}
        {currentStep === 'register-2' && renderRegister2()}
        {currentStep === 'register-3' && renderRegister3()}
        {currentStep === 'open-ai-chat' && renderAIChat()}
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

// ─── Step Indicator ────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const done = current > total
  return (
    <View style={stepStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            stepStyles.dot,
            !done && i + 1 === current && stepStyles.dotActive,
            (done || i + 1 < current) && stepStyles.dotDone,
          ]}
        >
          {(done || i + 1 < current) && (
            <Ionicons name="checkmark" size={10} color={colors.textInverse} />
          )}
        </View>
      ))}
      {done
        ? <Text style={[stepStyles.label, { color: colors.success }]}>Concluído ✓</Text>
        : <Text style={stepStyles.label}>Etapa {current} de {total}</Text>
      }
    </View>
  )
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: colors.textInverse,
    borderWidth: 2,
    borderColor: colors.textInverse,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  label: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    marginLeft: spacing.xs,
  },
})

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.itauOrange,
  },
  animatedWrap: {
    flex: 1,
  },

  // ─── Welcome ─────────────────────────────────────────
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroSection: {
    paddingTop: spacing['6xl'] + spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  logoDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textInverse,
    opacity: 0.9,
  },
  logoText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  logoSuffix: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.regular,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.black,
    color: colors.textInverse,
    lineHeight: 44,
    marginBottom: spacing.lg,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },

  // Case info (integrated into hero)
  caseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  caseBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  caseBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: '#1a1a2e',
    letterSpacing: 1.2,
  },
  caseDividerDot: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.4)',
  },
  caseTeam: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: fontWeight.semibold,
  },
  caseProduct: {
    fontSize: fontSize.md,
    color: '#FFD700',
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  caseSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: spacing.md,
  },
  caseDescription: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },

  welcomeActions: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  welcomeFooter: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerDivider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  footerSmall: {
    fontSize: fontSize['2xs'],
    color: 'rgba(255,255,255,0.35)',
  },

  // ─── Buttons ─────────────────────────────────────────
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.itauNavy,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    minHeight: 56,
  },
  primaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textInverse,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    minHeight: 56,
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.itauOrange,
    letterSpacing: 0.3,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.itauOrange,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
    minHeight: 56,
  },
  outlineButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.itauOrange,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: fontSize.sm,
    color: colors.itauBlue,
    fontWeight: fontWeight.medium,
  },

  // ─── Form ────────────────────────────────────────────
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingBottom: spacing['6xl'] + spacing['4xl'],
  },
  formContentCompact: {
    paddingBottom: spacing['2xl'],
  },
  formHeader: {
    paddingTop: spacing['6xl'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  formHeaderCompact: {
    paddingTop: spacing['3xl'] + spacing.md,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.md,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  formHeaderTitleCompact: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    marginBottom: 2,
  },
  backBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  formHeaderTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  formHeaderSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.75)',
  },

  // ─── Sheet ───────────────────────────────────────────
  formSheet: {
    backgroundColor: colors.bgSheet,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
    flex: 1,
    minHeight: 500,
  },
  formSheetCompact: {
    backgroundColor: colors.bgSheet,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    flex: 1,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },

  // ─── Row ─────────────────────────────────────────────
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  // ─── Error Banner ────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },

  // ─── Terms ───────────────────────────────────────────
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.itauOrange,
    borderColor: colors.itauOrange,
  },
  termsText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.itauBlue,
    fontWeight: fontWeight.medium,
  },

  // ─── Security ────────────────────────────────────────
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  securityText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },

  // ─── Success ─────────────────────────────────────────
  successContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  accountInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.itauOrangeSoft,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
  },
  accountInfoRow: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  accountInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.itauOrange,
    opacity: 0.2,
  },
  accountInfoLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  accountInfoValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.itauOrange,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  successHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },

  // ─── AI Button (welcome) ─────────────────────────────
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    minHeight: 56,
  },
  aiButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },

  // ─── AI Register Banner (inside register-1) ──────────
  aiDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  aiDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  aiDividerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    textTransform: 'lowercase',
  },
  aiRegisterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.itauOrangeSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.itauOrange + '25',
    padding: spacing.lg,
  },
  aiRegisterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.itauOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiRegisterContent: {
    flex: 1,
  },
  aiRegisterTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.itauOrangeDark,
    marginBottom: 2,
  },
  aiRegisterSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
})

// ─── AI Chat Styles ─────────────────────────────────────────────────────

const aiStyles = StyleSheet.create({
  rootWhite: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.itauOrange,
    paddingTop: spacing['6xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  headerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: fontSize['2xs'],
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as const,
    borderRadius: 3,
    backgroundColor: colors.itauOrange,
  },
  progressText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.itauOrange,
    minWidth: 32,
    textAlign: 'right' as const,
  },
  chatList: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  chatListEmpty: {
    flex: 1,
  },
  typingWrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xs,
  },

  // ─── Empty State ──────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.itauOrangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
    marginBottom: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
})

// ─── AI Success Screen Styles ──────────────────────────────────────────

const aiSuccessStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  successIcon: {
    position: 'relative',
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.success,
    opacity: 0.2,
  },
  title: {
    fontSize: 26,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ─── Account Card ──────────────────────
  accountCard: {
    width: '100%',
    backgroundColor: colors.textInverse,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,

    // Shadow
    shadowColor: colors.itauOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  cardHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  cardDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.itauOrangeSoft,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  cardDataItemSmall: {
    flex: 2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardDataItemLarge: {
    flex: 3,
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.itauOrange,
    opacity: 0.15,
    marginHorizontal: spacing.sm,
  },
  cardDataLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDataValue: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: colors.itauOrange,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cardFooterText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flex: 1,
  },

  // ─── Hint ──────────────────────────────
  hintBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.itauOrangeSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing['2xl'],
  },
  hintIcon: {
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ─── CTA ──────────────────────────────
  ctaBlock: {
    width: '100%',
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.itauOrange,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    width: '100%',
    minHeight: 56,

    shadowColor: colors.itauOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  ctaSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
})
