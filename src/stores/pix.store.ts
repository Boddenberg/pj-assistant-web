// ─── Pix Store ───────────────────────────────────────────────────────

import { create } from 'zustand'
import { pixService } from '@/services'
import { AppError, ErrorCode } from '@/lib'
import type {
  PixRecipient, PixKeyType,
  PixTransferResponse, PixScheduleResponse,
  PixCreditCardResponse,
} from '@/types'

interface PixState {
  // Recipient lookup
  recipient: PixRecipient | null
  isLookingUp: boolean

  // Transfer
  lastTransfer: PixTransferResponse | null
  isTransferring: boolean

  // Schedule
  lastSchedule: PixScheduleResponse | null
  isScheduling: boolean

  // Pix with credit card
  lastCreditCardPix: PixCreditCardResponse | null

  error: AppError | null

  lookupKey: (key: string, keyType: PixKeyType) => Promise<void>
  transfer: (customerId: string, recipientKey: string, keyType: PixKeyType, amount: number, description?: string) => Promise<void>
  schedule: (customerId: string, recipientKey: string, keyType: PixKeyType, amount: number, scheduledDate: string, description?: string) => Promise<void>
  transferWithCreditCard: (customerId: string, cardId: string, recipientKey: string, keyType: PixKeyType, amount: number, installments: number, description?: string) => Promise<void>
  reset: () => void
  dismissError: () => void
}

export const usePixStore = create<PixState>((set) => ({
  recipient: null,
  isLookingUp: false,
  lastTransfer: null,
  isTransferring: false,
  lastSchedule: null,
  isScheduling: false,
  lastCreditCardPix: null,
  error: null,

  lookupKey: async (key, keyType) => {
    set({ isLookingUp: true, error: null, recipient: null })
    try {
      const result = await pixService.lookupKey(key, keyType)
      set({ recipient: result.recipient, isLookingUp: false })
    } catch (err) {
      set({
        isLookingUp: false,
        error: err instanceof AppError ? err : new AppError(ErrorCode.UNKNOWN, 'Erro ao buscar chave Pix.', err),
      })
    }
  },

  transfer: async (customerId, recipientKey, keyType, amount, description) => {
    set({ isTransferring: true, error: null })
    try {
      const result = await pixService.transfer({ customerId, recipientKey, recipientKeyType: keyType, amount, description })
      set({ lastTransfer: result, isTransferring: false })
    } catch (err) {
      set({
        isTransferring: false,
        error: err instanceof AppError ? err : new AppError(ErrorCode.UNKNOWN, 'Erro na transferência Pix.', err),
      })
    }
  },

  schedule: async (customerId, recipientKey, keyType, amount, scheduledDate, description) => {
    set({ isScheduling: true, error: null })
    try {
      const result = await pixService.schedule({ customerId, recipientKey, recipientKeyType: keyType, amount, scheduledDate, description })
      set({ lastSchedule: result, isScheduling: false })
    } catch (err) {
      set({
        isScheduling: false,
        error: err instanceof AppError ? err : new AppError(ErrorCode.UNKNOWN, 'Erro ao agendar Pix.', err),
      })
    }
  },

  transferWithCreditCard: async (customerId, cardId, recipientKey, keyType, amount, installments, description) => {
    set({ isTransferring: true, error: null })
    try {
      const result = await pixService.transferWithCreditCard({
        customerId, creditCardId: cardId, recipientKey, recipientKeyType: keyType, amount, installments, description,
      })
      set({ lastCreditCardPix: result, isTransferring: false })
    } catch (err) {
      set({
        isTransferring: false,
        error: err instanceof AppError ? err : new AppError(ErrorCode.UNKNOWN, 'Erro no Pix com cartão.', err),
      })
    }
  },

  reset: () => set({
    recipient: null, lastTransfer: null, lastSchedule: null,
    lastCreditCardPix: null, error: null,
    isLookingUp: false, isTransferring: false, isScheduling: false,
  }),

  dismissError: () => set({ error: null }),
}))
