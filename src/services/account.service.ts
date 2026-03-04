// ─── Account Service ─────────────────────────────────────────────────

import { httpClient } from '@/lib'

export interface AccountData {
  readonly customerId: string
  readonly balance: number
  readonly availableBalance: number
  readonly creditLimit: number
  readonly availableCreditLimit: number
  readonly currency: string
  readonly status: string
}

// Backend returns snake_case fields
interface AccountDataRaw {
  customer_id: string
  balance: number
  available_balance: number
  credit_limit: number
  available_credit_limit: number
  currency: string
  status: string
}

function mapAccount(raw: AccountDataRaw): AccountData {
  return {
    customerId: raw.customer_id,
    balance: raw.balance,
    availableBalance: raw.available_balance,
    creditLimit: raw.credit_limit,
    availableCreditLimit: raw.available_credit_limit,
    currency: raw.currency,
    status: raw.status,
  }
}

export const accountService = {
  /** Get customer accounts (balance + credit limit) */
  async get(customerId: string): Promise<AccountData> {
    const { data } = await httpClient.get<AccountDataRaw | AccountDataRaw[]>(
      `/v1/customers/${encodeURIComponent(customerId)}/accounts`,
    )
    // Backend may return array or single object
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { customerId, balance: 0, availableBalance: 0, creditLimit: 0, availableCreditLimit: 0, currency: 'BRL', status: 'active' }
      }
      return mapAccount(data[0])
    }
    return mapAccount(data)
  },
} as const
