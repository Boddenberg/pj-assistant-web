// ─── Credit Card Service ─────────────────────────────────────────────

import { httpClient } from '@/lib'
import type {
  CreditCard, CreditCardRequest, CreditCardResponse,
  CreditCardInvoice, CreditCardTransaction,
} from '@/types'

export const creditCardService = {
  /** List customer's credit cards */
  async list(customerId: string): Promise<CreditCard[]> {
    const { data } = await httpClient.get<{ cards: CreditCard[] } | CreditCard[]>(
      `/v1/customers/${encodeURIComponent(customerId)}/cards`,
    )
    // Backend returns { cards: [...] } wrapper — unwrap it
    const raw = (data && !Array.isArray(data) && 'cards' in data) ? data.cards : (Array.isArray(data) ? data : [])
    return raw
  },

  /** Request a new credit card */
  async request(request: CreditCardRequest): Promise<CreditCardResponse> {
    const { data } = await httpClient.post<CreditCardResponse>(
      '/v1/cards/request',
      {
        customerId: request.customerId,
        preferred_brand: request.preferredBrand,
        requested_limit: request.requestedLimit,
        virtual_card: request.virtualCard,
      },
    )
    return data
  },

  /** Get card invoice for a specific month */
  async getInvoice(cardId: string, month: string): Promise<CreditCardInvoice> {
    const { data } = await httpClient.get<CreditCardInvoice>(
      `/v1/cards/${encodeURIComponent(cardId)}/invoices/${encodeURIComponent(month)}`,
    )
    return data
  },

  /** Cancel a card */
  async cancel(cardId: string): Promise<void> {
    await httpClient.post(`/v1/cards/${encodeURIComponent(cardId)}/cancel`)
  },

  /** Block a card */
  async block(cardId: string): Promise<void> {
    await httpClient.post(`/v1/cards/${encodeURIComponent(cardId)}/block`)
  },

  /** Unblock a card */
  async unblock(cardId: string): Promise<void> {
    await httpClient.post(`/v1/cards/${encodeURIComponent(cardId)}/unblock`)
  },
} as const
