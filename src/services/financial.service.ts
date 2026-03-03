// ─── Financial Service ───────────────────────────────────────────────

import { httpClient } from '@/lib'
import type {
  FinancialSummary,
  DebitPurchaseRequest, DebitPurchaseResponse,
} from '@/types'

export const financialService = {
  /** Get financial summary / spending analysis */
  async getSummary(customerId: string, period?: string): Promise<FinancialSummary> {
    const { data } = await httpClient.get<FinancialSummary>(
      `/v1/customers/${encodeURIComponent(customerId)}/financial/summary`,
      { params: period ? { period } : undefined },
    )
    return data
  },

  /** Execute a debit purchase */
  async debitPurchase(request: DebitPurchaseRequest): Promise<DebitPurchaseResponse> {
    const { data } = await httpClient.post<DebitPurchaseResponse>(
      '/v1/debit/purchase',
      request,
    )
    return data
  },
} as const
