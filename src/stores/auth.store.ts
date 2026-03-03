// ─── Auth Store ──────────────────────────────────────────────────────
// Manages authentication state with Zustand + AsyncStorage persistence.

import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuthStep } from '@/types'

const AUTH_STORAGE_KEY = '@itau_pj_auth'
const CREDENTIALS_KEY = '@itau_pj_credentials'
const COMPANY_DATA_KEY = '@itau_pj_company_data'

interface CompanyData {
  cnpj?: string
  email?: string
  phone?: string
}

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  customerName: string | null
  companyName: string | null
  currentStep: AuthStep
  isHydrated: boolean

  // Saved credentials (last login CPF)
  savedCpf: string | null

  // Company data for Pix key suggestions
  companyData: CompanyData | null

  setAuthenticated: (data: {
    accessToken: string
    refreshToken: string
    customerId: string
    customerName: string
    companyName: string
  }) => void

  setStep: (step: AuthStep) => void
  logout: () => void
  hydrate: () => Promise<void>
  saveCpf: (cpf: string) => void
  loadSavedCpf: () => Promise<string | null>
  saveCompanyData: (data: CompanyData) => void
  loadCompanyData: () => Promise<CompanyData | null>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  customerName: null,
  companyName: null,
  currentStep: 'welcome',
  isHydrated: false,
  savedCpf: null,
  companyData: null,

  setAuthenticated: ({ accessToken, refreshToken, customerName, companyName, customerId }) => {
    set((prev) => ({
      ...prev,
      isAuthenticated: true,
      accessToken,
      refreshToken,
      customerName,
      companyName,
    }))
    // Persist session
    AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      accessToken,
      refreshToken,
      customerName,
      companyName,
      customerId,
    })).catch(() => {})
  },

  setStep: (step) => set({ currentStep: step }),

  logout: () => {
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      customerName: null,
      companyName: null,
      currentStep: 'welcome',
    })
    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {})
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.accessToken && parsed.customerId) {
          // Also load company data
          let companyData: CompanyData | null = null
          try {
            const cd = await AsyncStorage.getItem(COMPANY_DATA_KEY)
            if (cd) companyData = JSON.parse(cd)
          } catch {}
          set({
            isAuthenticated: true,
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken,
            customerName: parsed.customerName,
            companyName: parsed.companyName,
            companyData,
            isHydrated: true,
          })
          return
        }
      }
    } catch {}
    set({ isHydrated: true })
  },

  saveCpf: (cpf: string) => {
    set({ savedCpf: cpf })
    AsyncStorage.setItem(CREDENTIALS_KEY, cpf).catch(() => {})
  },

  loadSavedCpf: async () => {
    try {
      const cpf = await AsyncStorage.getItem(CREDENTIALS_KEY)
      if (cpf) set({ savedCpf: cpf })
      return cpf
    } catch {
      return null
    }
  },

  saveCompanyData: (data: CompanyData) => {
    set({ companyData: data })
    AsyncStorage.setItem(COMPANY_DATA_KEY, JSON.stringify(data)).catch(() => {})
  },

  loadCompanyData: async () => {
    try {
      const raw = await AsyncStorage.getItem(COMPANY_DATA_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        set({ companyData: parsed })
        return parsed
      }
      return null
    } catch {
      return null
    }
  },
}))
