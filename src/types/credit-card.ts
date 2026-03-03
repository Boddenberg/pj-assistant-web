// ─── Credit Card Types ───────────────────────────────────────────────

export interface CreditCard {
  readonly id: string
  readonly lastFourDigits: string
  readonly brand: CreditCardBrand
  readonly status: CreditCardStatus
  readonly cardType: string
  readonly holderName: string
  readonly limit: number
  readonly availableLimit: number
  readonly usedLimit: number
  readonly dueDay: number
  readonly closingDay: number
  readonly annualFee: number
  readonly isVirtual: boolean
  readonly createdAt: string
}

export type CreditCardBrand = 'visa' | 'mastercard' | 'elo' | 'amex'
export type CreditCardStatus = 'active' | 'blocked' | 'cancelled' | 'pending_activation'

export interface CreditCardRequest {
  readonly customerId: string
  readonly preferredBrand?: CreditCardBrand
  readonly requestedLimit?: number
  readonly virtualCard?: boolean
}

export interface CreditCardResponse {
  readonly requestId: string
  readonly status: CreditCardRequestStatus
  readonly card?: CreditCard
  readonly message: string
  readonly approvedLimit?: number
  readonly estimatedDeliveryDays?: number
}

export type CreditCardRequestStatus = 'approved' | 'denied' | 'under_review'

export interface CreditCardInvoice {
  readonly id: string
  readonly cardId: string
  readonly referenceMonth: string
  readonly totalAmount: number
  readonly minimumPayment: number
  readonly dueDate: string
  readonly status: InvoiceStatus
  readonly transactions: CreditCardTransaction[]
}

export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue'

export interface CreditCardTransaction {
  readonly id: string
  readonly date: string
  readonly description: string
  readonly amount: number
  readonly installment?: string
  readonly category: string
}
