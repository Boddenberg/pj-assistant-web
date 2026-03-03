import { create } from 'zustand'
import type { ChatMessage, HistoryEntry, OnboardingStep, AccountData } from '@/types'
import { assistantService } from '@/services'
import { generateId, sanitizeInput, AppError, ErrorCode } from '@/lib'

const MAX_HISTORY = 5

interface OnboardingChatState {
  messages: ChatMessage[]
  history: HistoryEntry[]
  conversationId: string | null
  isLoading: boolean
  error: AppError | null
  step: OnboardingStep | null
  nextStep: OnboardingStep | null
  accountData: AccountData | null
  isPasswordField: boolean

  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
  dismissError: () => void
}

export const useOnboardingChatStore = create<OnboardingChatState>(
  (set, get) => ({
    messages: [],
    history: [],
    conversationId: null,
    isLoading: false,
    error: null,
    step: null,
    nextStep: null,
    accountData: null,
    isPasswordField: false,

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
        const { history, conversationId } = get()

        const response = await assistantService.chat(
          sanitized,
          conversationId ?? undefined,
          history.length > 0 ? history : undefined,
        )

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toISOString(),
        }

        const newEntry: HistoryEntry = {
          query: sanitized,
          answer: response.answer,
          step: response.step ?? null,
          validated: null,
        }
        const updatedHistory = [...history, newEntry].slice(-MAX_HISTORY)

        const currentStep = response.step ?? null
        const nextStepValue = response.next_step ?? null
        const isPassword =
          currentStep === 'password' || currentStep === 'passwordConfirmation'

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          history: updatedHistory,
          conversationId: response.conversationId ?? state.conversationId,
          isLoading: false,
          step: nextStepValue === 'completed' ? 'completed' : currentStep,
          nextStep: nextStepValue,
          accountData: response.account_data ?? state.accountData,
          isPasswordField: nextStepValue === 'completed' ? false : isPassword,
        }))
      } catch (err) {
        const appError =
          err instanceof AppError
            ? err
            : new AppError(ErrorCode.UNKNOWN, 'Erro inesperado.', err)

        set({ isLoading: false, error: appError })
      }
    },

    clearChat: () =>
      set({
        messages: [],
        history: [],
        conversationId: null,
        isLoading: false,
        error: null,
        step: null,
        nextStep: null,
        accountData: null,
        isPasswordField: false,
      }),

    dismissError: () => set({ error: null }),
  }),
)
