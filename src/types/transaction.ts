export interface Transaction {
  readonly id: string
  readonly date: string
  readonly description: string
  readonly amount: number
  readonly type: TransactionType
  readonly category: string
  readonly counterparty?: string
}

export type TransactionType =
  | 'credit'
  | 'debit'
  | 'pix_sent'
  | 'pix_received'
  | 'debit_purchase'
  | 'credit_purchase'
  | 'transfer_in'
  | 'transfer_out'
  | 'bill_payment'

export interface TransactionSummary {
  readonly totalCredits: number
  readonly totalDebits: number
  readonly balance: number
  readonly count: number
  readonly period: { readonly from: string; readonly to: string }
}
