// ─── Bill Payment Service ────────────────────────────────────────────

import { httpClient } from '@/lib'
import type {
  BillPaymentRequest, BillPaymentResponse,
  BarcodeValidationResponse,
} from '@/types'

export const billPaymentService = {
  /** Validate and decode a barcode / digitable line */
  async validateBarcode(barcode: string): Promise<BarcodeValidationResponse> {
    const { data } = await httpClient.post<BarcodeValidationResponse>(
      '/v1/bills/validate',
      { barcode },
    )
    return data
  },

  /** Execute a bill payment */
  async pay(request: BillPaymentRequest): Promise<BillPaymentResponse> {
    const { data } = await httpClient.post<BillPaymentResponse>(
      '/v1/bills/pay',
      request,
    )
    return data
  },

  /** List bill payment history */
  async history(customerId: string): Promise<BillPaymentResponse[]> {
    const { data } = await httpClient.get<BillPaymentResponse[]>(
      `/v1/customers/${encodeURIComponent(customerId)}/bills/history`,
    )
    return data
  },
} as const
