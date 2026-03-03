// ─── Account Hook ────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { accountService } from '@/services/account.service'

export const accountKeys = {
  all: ['accounts'] as const,
  detail: (customerId: string) => [...accountKeys.all, customerId] as const,
}

export function useAccount(customerId: string | null) {
  return useQuery({
    queryKey: accountKeys.detail(customerId!),
    queryFn: () => accountService.get(customerId!),
    enabled: !!customerId,
    staleTime: 15_000,
  })
}
