// ─── Credit Card Hooks ───────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { creditCardService } from '@/services'
import type { CreditCardRequest } from '@/types'

export const creditCardKeys = {
  all: ['credit-cards'] as const,
  list: (customerId: string) => [...creditCardKeys.all, 'list', customerId] as const,
  invoice: (cardId: string, month: string) => [...creditCardKeys.all, 'invoice', cardId, month] as const,
}

export function useCreditCards(customerId: string | null) {
  return useQuery({
    queryKey: creditCardKeys.list(customerId!),
    queryFn: () => creditCardService.list(customerId!),
    enabled: !!customerId,
  })
}

export function useCreditCardInvoice(cardId: string | null, month: string) {
  return useQuery({
    queryKey: creditCardKeys.invoice(cardId!, month),
    queryFn: () => creditCardService.getInvoice(cardId!, month),
    enabled: !!cardId,
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
    mutationFn: ({ cardId }: { cardId: string; customerId: string }) => creditCardService.cancel(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditCardKeys.all })
    },
  })
}
