// ─── Financial Hooks ─────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { financialService } from '@/services'

export const financialKeys = {
  all: ['financial'] as const,
  summary: (customerId: string, period?: string) =>
    [...financialKeys.all, 'summary', customerId, period ?? 'current'] as const,
}

export function useFinancialSummary(customerId: string | null, period?: string) {
  return useQuery({
    queryKey: financialKeys.summary(customerId!, period),
    queryFn: () => financialService.getSummary(customerId!, period),
    enabled: !!customerId,
    staleTime: 60_000,
  })
}
