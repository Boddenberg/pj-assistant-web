export interface ChatMessage {
  readonly id: string
  readonly role: MessageRole
  readonly content: string
  readonly timestamp: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatApiResponse {
  readonly answer: string
  readonly conversationId?: string
  readonly context?: string | null
  readonly intent?: string | null
  readonly confidence?: number
  readonly step?: OnboardingStep | null
  readonly field_value?: string | null
  readonly next_step?: OnboardingStep | null
  readonly account_data?: AccountData | null
  readonly suggested_actions?: string[]
}

/** Account data returned when onboarding is completed */
export interface AccountData {
  readonly customerId: string
  readonly agencia: string
  readonly conta: string
}

/** A single query/answer pair for conversation history (v9 — enriched) */
export interface HistoryEntry {
  readonly query: string
  readonly answer: string
  readonly step: string | null
  readonly validated: boolean | null
}

/** Possible onboarding step values from the API */
export type OnboardingStep =
  | 'cnpj'
  | 'razaoSocial'
  | 'nomeFantasia'
  | 'email'
  | 'representanteName'
  | 'representanteCpf'
  | 'representantePhone'
  | 'representanteBirthDate'
  | 'password'
  | 'passwordConfirmation'
  | 'completed'
  | 'error'

/** Ordered list of onboarding steps for progress calculation */
const ONBOARDING_STEPS: OnboardingStep[] = [
  'cnpj', 'razaoSocial', 'nomeFantasia', 'email',
  'representanteName', 'representanteCpf', 'representantePhone',
  'representanteBirthDate', 'password', 'passwordConfirmation',
]

/** Returns onboarding progress as 0–100 */
export function getOnboardingProgress(step: OnboardingStep | null | undefined): number {
  if (!step) return 0
  if (step === 'completed') return 100
  if (step === 'error') return 0
  const idx = ONBOARDING_STEPS.indexOf(step)
  return idx >= 0 ? Math.round(((idx + 1) / ONBOARDING_STEPS.length) * 100) : 0
}
