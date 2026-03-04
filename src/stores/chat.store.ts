import { create } from 'zustand'
import type { ChatMessage } from '@/types'
import { assistantService } from '@/services'
import { useAuthStore } from '@/stores/auth.store'
import { generateId, sanitizeInput, AppError, ErrorCode } from '@/lib'

interface ChatState {
  messages: ChatMessage[]
  conversationId: string | null
  isLoading: boolean
  error: AppError | null

  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
  dismissError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: null,
  isLoading: false,
  error: null,

  sendMessage: async (content: string) => {
    const sanitized = sanitizeInput(content)
    if (!sanitized) return

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: sanitized,
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }))

    try {
      const response = await assistantService.chat(
        sanitized,
        get().conversationId ?? undefined,
        undefined,
        useAuthStore.getState().isAuthenticated,
      )

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
      }

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        conversationId: response.conversationId ?? state.conversationId,
        isLoading: false,
      }))
    } catch (err) {
      const appError =
        err instanceof AppError
          ? err
          : new AppError(ErrorCode.UNKNOWN, 'Erro inesperado.', err)

      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Poxa! Acho que perdi a conexão. Pode digitar novamente? 🔄',
        timestamp: new Date().toISOString(),
      }

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
        error: appError,
      }))
    }
  },

  clearChat: () =>
    set({ messages: [], conversationId: null, isLoading: false, error: null }),

  dismissError: () => set({ error: null }),
}))
