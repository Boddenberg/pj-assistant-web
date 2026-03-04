import { httpClient } from '@/lib'
import { getDeviceId } from '@/lib/device-id'
import type { ChatApiResponse, HistoryEntry } from '@/types'
import { useCustomerStore } from '@/stores/customer.store'
import { useAuthStore } from '@/stores/auth.store'

export const assistantService = {
  async chat(
    query: string,
    conversationId?: string,
    history?: HistoryEntry[],
    isAuthenticated = false,
  ): Promise<ChatApiResponse> {
    const customerId = useCustomerStore.getState().customerId
    const accessToken = useAuthStore.getState().accessToken
    const deviceId = await getDeviceId()

    // Authenticated users: POST /v1/chat/:customerId
    // Anonymous / onboarding: POST /v1/chat  (ignore customerId)
    const base =
      isAuthenticated && customerId
        ? `/v1/chat/${encodeURIComponent(customerId)}`
        : '/v1/chat'
    const path = conversationId
      ? `${base}/${encodeURIComponent(conversationId)}`
      : base

    const body: Record<string, unknown> = {
      query,
      is_authenticated: isAuthenticated,
    }
    if (history?.length) {
      body.history = history
    }
    const { data } = await httpClient.post<ChatApiResponse>(path, body)
    return data
  },
} as const
