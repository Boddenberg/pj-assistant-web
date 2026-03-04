import { httpClient } from '@/lib'
import type { CustomerProfile } from '@/types'

export const customerService = {
  async getProfile(customerId: string): Promise<CustomerProfile> {
    const { data } = await httpClient.get<CustomerProfile>(
      `/v1/customers/${encodeURIComponent(customerId)}`,
    )
    return data
  },
} as const
