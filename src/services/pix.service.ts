// ─── Pix Service ─────────────────────────────────────────────────────

import { httpClient } from '@/lib'
import type {
  PixTransferRequest, PixTransferResponse,
  PixScheduleRequest, PixScheduleResponse,
  PixKeyLookupResponse, PixKeyType,
  PixCreditCardRequest, PixCreditCardResponse,
} from '@/types'

export const pixService = {
  /** Lookup recipient by Pix key from the database */
  async lookupKey(key: string, keyType: PixKeyType): Promise<PixKeyLookupResponse> {
    const { data } = await httpClient.get<PixKeyLookupResponse>(
      '/v1/pix/keys/lookup',
      { params: { key, type: keyType } },
    )
    return data
  },

  /** Execute immediate Pix transfer */
  async transfer(request: PixTransferRequest): Promise<PixTransferResponse> {
    const { data } = await httpClient.post<PixTransferResponse>(
      '/v1/pix/transfer',
      request,
    )
    return data
  },

  /** Schedule a future Pix transfer */
  async schedule(request: PixScheduleRequest): Promise<PixScheduleResponse> {
    const { data } = await httpClient.post<PixScheduleResponse>(
      '/v1/pix/schedule',
      request,
    )
    return data
  },

  /** Cancel a scheduled Pix transfer */
  async cancelSchedule(scheduleId: string): Promise<void> {
    await httpClient.delete(`/v1/pix/schedule/${encodeURIComponent(scheduleId)}`)
  },

  /** List scheduled Pix transfers */
  async listScheduled(customerId: string): Promise<PixScheduleResponse[]> {
    const { data } = await httpClient.get<{ schedules: PixScheduleResponse[] } | PixScheduleResponse[]>(
      `/v1/pix/scheduled/${encodeURIComponent(customerId)}`,
    )
    // Backend may return { schedules: [...] } wrapper
    if (data && !Array.isArray(data) && 'schedules' in data) return data.schedules
    return Array.isArray(data) ? data : []
  },

  /** Execute Pix via credit card */
  async transferWithCreditCard(request: PixCreditCardRequest): Promise<PixCreditCardResponse> {
    const { data } = await httpClient.post<PixCreditCardResponse>(
      '/v1/pix/credit',
      request,
    )
    return data
  },
} as const
