// ─── Credit Card Hooks ───────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { creditCardService } from '@/services'
import type { CreditCardRequest } from '@/types'

export const creditCardKeys = {
  all: ['credit-cards'] as const,
  list: (customerId: string) => [...creditCardKeys.all, 'list', customerId] as const,
  available: (customerId: string) => [...creditCardKeys.all, 'available', customerId] as const,
  invoice: (cardId: string, month?: string) => [...creditCardKeys.all, 'invoice', cardId, month] as const,
  creditLimit: (customerId: string) => [...creditCardKeys.all, 'credit-limit', customerId] as const,
}

export function useCreditCards(customerId: string | null) {
  return useQuery({
    queryKey: creditCardKeys.list(customerId!),
    queryFn: () => creditCardService.list(customerId!),
    enabled: !!customerId,
  })
}

export function useCreditCardInvoice(customerId: string | null, cardId: string | null, month?: string) {
  return useQuery({
    queryKey: creditCardKeys.invoice(cardId!, month),
    queryFn: () => creditCardService.getInvoice(customerId!, cardId!, month),
    enabled: !!customerId && !!cardId,
  })
}

export function useRequestCreditCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreditCardRequest) => creditCardService.request(request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: creditCardKeys.list(variables.customerId) })
    },
  })
}

export function useCancelCreditCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, customerId }: { cardId: string; customerId: string }) => creditCardService.cancel(customerId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditCardKeys.all })
    },
  })
}

export function useCreditLimit(customerId: string | null) {
  return useQuery({
    queryKey: creditCardKeys.creditLimit(customerId!),
    queryFn: () => creditCardService.getCreditLimit(customerId!),
    enabled: !!customerId,
  })
}

export function useAvailableCards(customerId: string | null) {
  return useQuery({
    queryKey: creditCardKeys.available(customerId!),
    queryFn: () => creditCardService.listAvailable(customerId!),
    enabled: !!customerId,
  })
}
