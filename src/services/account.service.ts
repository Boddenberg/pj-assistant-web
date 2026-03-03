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

export const accountService = {
  /** Get customer accounts (balance + credit limit) */
  async get(customerId: string): Promise<AccountData> {
    const { data } = await httpClient.get<AccountData | AccountData[]>(
      `/v1/customers/${encodeURIComponent(customerId)}/accounts`,
    )
    // Backend may return array or single object
    if (Array.isArray(data)) {
      return data[0] ?? { customerId, balance: 0, availableBalance: 0, creditLimit: 0, availableCreditLimit: 0, currency: 'BRL', status: 'active' }
    }
    return data
  },
} as const
