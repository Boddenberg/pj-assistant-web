// ─── Pix Types ───────────────────────────────────────────────────────

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'

export interface PixKey {
  readonly type: PixKeyType
  readonly value: string
}

export interface PixRecipient {
  readonly name: string
  readonly document: string
  readonly bank: string
  readonly branch: string
  readonly account: string
  readonly pixKey?: PixKey
}

export interface PixTransferRequest {
  readonly customerId: string
  readonly recipientKey: string
  readonly recipientKeyType: PixKeyType
  readonly amount: number
  readonly description?: string
}

export interface PixTransferResponse {
  readonly transactionId: string
  readonly status: PixTransferStatus
  readonly amount: number
  readonly recipient: PixRecipient
  readonly timestamp: string
  readonly e2eId: string
}

export type PixTransferStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface PixScheduleRequest {
  readonly customerId: string
  readonly recipientKey: string
  readonly recipientKeyType: PixKeyType
  readonly amount: number
  readonly scheduledDate: string
  readonly description?: string
  readonly recurrence?: PixRecurrence
}

export interface PixRecurrence {
  readonly type: 'weekly' | 'monthly'
  readonly endDate?: string
}

export interface PixScheduleResponse {
  readonly scheduleId: string
  readonly status: 'scheduled' | 'cancelled'
  readonly amount: number
  readonly scheduledDate: string
  readonly recipient: PixRecipient
  readonly recurrence?: PixRecurrence
}

export interface PixKeyLookupResponse {
  readonly recipient: PixRecipient
  readonly keyType: PixKeyType
}

export interface PixCreditCardRequest {
  readonly customerId: string
  readonly creditCardId: string
  readonly recipientKey: string
  readonly recipientKeyType: PixKeyType
  readonly amount: number
  readonly installments: number
  readonly description?: string
}

export interface PixCreditCardResponse {
  readonly transactionId: string
  readonly status: PixTransferStatus
  readonly amount: number
  readonly recipient: PixRecipient
  readonly timestamp: string
}
