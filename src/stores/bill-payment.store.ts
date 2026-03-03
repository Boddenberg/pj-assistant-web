// ─── Bill Payment Store ──────────────────────────────────────────────

import { create } from 'zustand'
import { billPaymentService } from '@/services'
import { AppError, ErrorCode } from '@/lib'
import type {
  BarcodeData, BarcodeInputMethod,
  BillPaymentResponse,
} from '@/types'

interface BillPaymentState {
  // Barcode validation
  barcodeData: BarcodeData | null
  isValidating: boolean

  // Payment
  lastPayment: BillPaymentResponse | null
  isPaying: boolean

  error: AppError | null

  validateBarcode: (barcode: string) => Promise<void>
  pay: (customerId: string, barcode: string, inputMethod: BarcodeInputMethod, paymentDate?: string) => Promise<void>
  reset: () => void
  dismissError: () => void
}

export const useBillPaymentStore = create<BillPaymentState>((set) => ({
  barcodeData: null,
  isValidating: false,
  lastPayment: null,
  isPaying: false,
  error: null,

  validateBarcode: async (barcode) => {
    set({ isValidating: true, error: null, barcodeData: null })
    try {
      const result = await billPaymentService.validateBarcode(barcode)
      if (result.valid && result.data) {
        set({ barcodeData: result.data, isValidating: false })
      } else {
        set({
          isValidating: false,
          error: new AppError(ErrorCode.VALIDATION, result.errorMessage ?? 'Código de barras inválido.'),
        })
      }
    } catch (err) {
      set({
        isValidating: false,
        error: err instanceof AppError ? err : new AppError(ErrorCode.UNKNOWN, 'Erro ao validar código.', err),
      })
    }
  },

  pay: async (customerId, barcode, inputMethod, paymentDate) => {
    set({ isPaying: true, error: null })
    try {
      const result = await billPaymentService.pay({ customerId, barcode, inputMethod, paymentDate })
      set({ lastPayment: result, isPaying: false })
    } catch (err) {
      set({
        isPaying: false,
        error: err instanceof AppError ? err : new AppError(ErrorCode.UNKNOWN, 'Erro no pagamento.', err),
      })
    }
  },

  reset: () => set({
    barcodeData: null, lastPayment: null, error: null,
    isValidating: false, isPaying: false,
  }),

  dismissError: () => set({ error: null }),
}))
