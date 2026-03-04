// ─── Credit Card Service ─────────────────────────────────────────────

import { httpClient } from '@/lib'
import type {
  CreditCard, CreditCardRequest, CreditCardResponse,
  CreditCardInvoice, AvailableCardsResponse,
} from '@/types'

export const creditCardService = {
  /** List customer's credit cards — GET /v1/customers/{id}/cards */
  async list(customerId: string): Promise<CreditCard[]> {
    const { data } = await httpClient.get<{ cards: CreditCard[] } | CreditCard[]>(
      `/v1/customers/${encodeURIComponent(customerId)}/cards`,
    )
    const raw = (data && !Array.isArray(data) && 'cards' in data) ? data.cards : (Array.isArray(data) ? data : [])
    return raw
  },

  /** Request / contract a new credit card — POST /v1/cards/request */
  async request(request: CreditCardRequest): Promise<CreditCardResponse> {
    const { data } = await httpClient.post<CreditCardResponse>(
      '/v1/cards/request',
      {
        customerId: request.customerId,
        productId: request.productId,
        requestedLimit: request.requestedLimit,
        dueDay: request.dueDay,
      },
    )
    return data
  },

  /** Get card invoice for a specific month */
  async getInvoice(customerId: string, cardId: string, month?: string): Promise<CreditCardInvoice> {
    const { data } = await httpClient.get<CreditCardInvoice>(
      `/v1/customers/${encodeURIComponent(customerId)}/cards/${encodeURIComponent(cardId)}/invoice`,
      { params: month ? { month } : undefined },
    )
    return data
  },

  /** Cancel a card */
  async cancel(customerId: string, cardId: string): Promise<void> {
    await httpClient.post(`/v1/customers/${encodeURIComponent(customerId)}/cards/${encodeURIComponent(cardId)}/cancel`)
  },

  /** Block a card */
  async block(customerId: string, cardId: string): Promise<void> {
    await httpClient.post(`/v1/customers/${encodeURIComponent(customerId)}/cards/${encodeURIComponent(cardId)}/block`)
  },

  /** Unblock a card */
  async unblock(customerId: string, cardId: string): Promise<void> {
    await httpClient.post(`/v1/customers/${encodeURIComponent(customerId)}/cards/${encodeURIComponent(cardId)}/unblock`)
  },

  /** Pay invoice */
  async payInvoice(customerId: string, cardId: string, amount: number): Promise<void> {
    await httpClient.post(
      `/v1/customers/${encodeURIComponent(customerId)}/cards/${encodeURIComponent(cardId)}/invoice/pay`,
      { amount, paymentType: 'total' },
    )
  },

  /** Get customer's total pre-approved credit limit */
  async getCreditLimit(customerId: string): Promise<number> {
    const { data } = await httpClient.get<{ creditLimit: number }>(
      `/v1/customers/${encodeURIComponent(customerId)}/credit-limit`,
    )
    return data?.creditLimit ?? 0
  },

  /** List available card products for contracting — GET /v1/customers/{id}/cards/available */
  async listAvailable(customerId: string): Promise<AvailableCardsResponse> {
    const { data } = await httpClient.get<AvailableCardsResponse>(
      `/v1/customers/${encodeURIComponent(customerId)}/cards/available`,
    )
    return data
  },
} as const
