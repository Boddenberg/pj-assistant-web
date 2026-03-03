import { httpClient } from '@/lib'
import type { HealthStatus, ChatMetrics } from '@/types'

export const metricsService = {
  async health(): Promise<HealthStatus> {
    const { data } = await httpClient.get<HealthStatus>('/healthz')
    return data
  },

  async chatMetrics(): Promise<ChatMetrics> {
    const { data } = await httpClient.get<ChatMetrics>('/v1/chat/metrics')
    return data
  },
} as const
