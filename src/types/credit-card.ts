// ─── Credit Card Types ───────────────────────────────────────────────

export interface CreditCard {
  readonly id: string
  readonly lastFourDigits: string
  readonly brand: string
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

// ─── Product Catalog (available cards to contract) ───────────────────

export type CardProductId = 'itau-pj-basic' | 'itau-pj-gold' | 'itau-pj-platinum' | 'itau-pj-virtual'

/** Raw shape returned by GET /v1/customers/{id}/cards/available */
export interface AvailableCardProduct {
  readonly id: CardProductId
  readonly name: string
  readonly brand: string
  readonly cardType: string
  readonly minLimit: number
  readonly maxLimit: number
  readonly annualFee: number
  readonly description: string
  readonly benefits: string
  readonly customerMaxLimit: number
}

export interface AvailableCardsResponse {
  readonly availableCreditLimit: number
  readonly products: AvailableCardProduct[]
}

/** Enriched product used by the UI (API data + local visual config) */
export interface CardProduct {
  readonly productId: CardProductId
  readonly name: string
  readonly brand: CreditCardBrand
  readonly description: string
  readonly minLimit: number
  readonly maxLimit: number
  readonly annualFee: number
  readonly isVirtual: boolean
  readonly benefits: string[]
  readonly customerMaxLimit: number
  readonly gradient: readonly [string, string, string]
  readonly accent: string
  readonly textColor: string
  readonly textSecondary: string
  readonly logoText: string
}

// ─── Card Request ────────────────────────────────────────────────────

export interface CreditCardRequest {
  readonly customerId: string
  readonly productId: CardProductId
  readonly requestedLimit: number
  readonly dueDay: number
}

export interface CreditCardResponse {
  readonly card?: CreditCard
  readonly message?: string
  readonly error?: string
}

// ─── Invoice ─────────────────────────────────────────────────────────

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

export type CreditCardRequestStatus = 'approved' | 'denied' | 'under_review'
