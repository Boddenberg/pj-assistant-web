import { useQuery } from '@tanstack/react-query'
import { metricsService } from '@/services'

export const metricsKeys = {
  health: ['health'] as const,
  chat: ['metrics', 'chat'] as const,
}

export function useHealthStatus() {
  return useQuery({
    queryKey: metricsKeys.health,
    queryFn: () => metricsService.health(),
    refetchInterval: 30_000,
  })
}

export function useChatMetrics() {
  return useQuery({
    queryKey: metricsKeys.chat,
    queryFn: () => metricsService.chatMetrics(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}
