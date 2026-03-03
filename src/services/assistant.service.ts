import { httpClient, getDeviceId } from '@/lib'
import type { ChatApiResponse, HistoryEntry } from '@/types'

export const assistantService = {
  async chat(
    query: string,
    conversationId?: string,
    history?: HistoryEntry[],
  ): Promise<ChatApiResponse> {
    const deviceId = await getDeviceId()
    const base = `/v1/chat/${encodeURIComponent(deviceId)}`
    const path = conversationId
      ? `${base}/${encodeURIComponent(conversationId)}`
      : base
    const body: Record<string, unknown> = { query }
    if (history?.length) {
      body.history = history
    }
    const { data } = await httpClient.post<ChatApiResponse>(path, body)
    return data
  },
} as const
