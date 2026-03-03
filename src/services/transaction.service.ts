import { httpClient } from '@/lib'
import type { Transaction, TransactionSummary } from '@/types'

export const transactionService = {
  async list(customerId: string, limit = 20): Promise<Transaction[]> {
    const { data } = await httpClient.get<{ transactions: Transaction[] } | Transaction[]>(
      `/v1/customers/${encodeURIComponent(customerId)}/transactions`,
      { params: { limit } },
    )
    // Backend returns { transactions: [...] } wrapper — unwrap it
    const raw = (data && !Array.isArray(data) && 'transactions' in data) ? data.transactions : (Array.isArray(data) ? data : [])
    return raw
  },

  async summary(customerId: string): Promise<TransactionSummary> {
    const { data } = await httpClient.get<TransactionSummary>(
      `/v1/customers/${encodeURIComponent(customerId)}/transactions/summary`,
    )
    return data
  },
} as const
