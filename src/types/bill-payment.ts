// ─── Bill Payment Types ──────────────────────────────────────────────

export interface BarcodeData {
  readonly barcode: string
  readonly digitableLine: string
  readonly type: BarcodeType
  readonly amount: number
  readonly dueDate?: string
  readonly beneficiary?: string
  readonly bank?: string
  readonly discount?: number
  readonly interest?: number
  readonly fine?: number
  readonly totalAmount: number
}

export type BarcodeType = 'boleto' | 'concessionaria' | 'tributo'

export type BarcodeInputMethod = 'camera' | 'typed' | 'pasted'

export interface BillPaymentRequest {
  readonly customerId: string
  readonly barcode: string
  readonly inputMethod: BarcodeInputMethod
  readonly paymentDate?: string
}

export interface BillPaymentResponse {
  readonly transactionId: string
  readonly status: BillPaymentStatus
  readonly amount: number
  readonly beneficiary: string
  readonly dueDate?: string
  readonly paymentDate: string
  readonly authentication: string
}

export type BillPaymentStatus = 'pending' | 'completed' | 'failed' | 'scheduled'

export interface BarcodeValidationResponse {
  readonly valid: boolean
  readonly data?: BarcodeData
  readonly errorMessage?: string
}
