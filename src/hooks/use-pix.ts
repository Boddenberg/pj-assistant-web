// ─── Pix Hooks ───────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { pixService } from '@/services'

export const pixKeys = {
  all: ['pix'] as const,
  scheduled: (customerId: string) => [...pixKeys.all, 'scheduled', customerId] as const,
}

export function useScheduledPix(customerId: string | null) {
  return useQuery({
    queryKey: pixKeys.scheduled(customerId!),
    queryFn: () => pixService.listScheduled(customerId!),
    enabled: !!customerId,
  })
}
