import { useQuery } from '@tanstack/react-query'
import { customerService } from '@/services'

export const customerKeys = {
  all: ['customers'] as const,
  profile: (id: string) => [...customerKeys.all, 'profile', id] as const,
}

export function useCustomerProfile(customerId: string | null) {
  return useQuery({
    queryKey: customerKeys.profile(customerId!),
    queryFn: () => customerService.getProfile(customerId!),
    enabled: !!customerId,
    staleTime: 60_000,
  })
}
