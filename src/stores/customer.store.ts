import { create } from 'zustand'

interface CustomerState {
  customerId: string | null
  setCustomerId: (id: string) => void
  clear: () => void
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customerId: null,
  setCustomerId: (id: string) => set({ customerId: id }),
  clear: () => set({ customerId: null }),
}))
