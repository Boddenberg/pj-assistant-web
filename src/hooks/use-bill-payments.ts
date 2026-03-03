// ─── Bill Payment Hooks ──────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { billPaymentService } from '@/services'

export const billPaymentKeys = {
  all: ['bill-payments'] as const,
  history: (customerId: string) => [...billPaymentKeys.all, 'history', customerId] as const,
}

export function useBillPaymentHistory(customerId: string | null) {
  return useQuery({
    queryKey: billPaymentKeys.history(customerId!),
    queryFn: () => billPaymentService.history(customerId!),
    enabled: !!customerId,
  })
}
