import { httpClient } from '@/lib'
import { getTempSessionId } from '@/lib/device-id'
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

    // Authenticated users: POST /v1/chat/:customerId
    // Onboarding / anonymous: POST /v1/chat/:tempSessionId
    //   → the temp ID goes in the URL so the backend sees it as customer_id
    //     instead of falling back to "anonymous"
    let idForUrl: string
    if (isAuthenticated && customerId) {
      idForUrl = customerId
    } else {
      idForUrl = getTempSessionId()
    }

    const base = `/v1/chat/${encodeURIComponent(idForUrl)}`
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
