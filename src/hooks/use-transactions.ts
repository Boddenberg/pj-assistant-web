import { useQuery } from '@tanstack/react-query'
import { transactionService } from '@/services'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (id: string) => [...transactionKeys.all, 'list', id] as const,
  summary: (id: string) => [...transactionKeys.all, 'summary', id] as const,
}

export function useTransactions(customerId: string | null, limit = 20) {
  return useQuery({
    queryKey: transactionKeys.list(customerId!),
    queryFn: () => transactionService.list(customerId!, limit),
    enabled: !!customerId,
  })
}

export function useTransactionSummary(customerId: string | null) {
  return useQuery({
    queryKey: transactionKeys.summary(customerId!),
    queryFn: () => transactionService.summary(customerId!),
    enabled: !!customerId,
  })
}
