// ─── Application Error Hierarchy ─────────────────────────────────────

export const ErrorCode = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  AGENT_ERROR: 'AGENT_ERROR',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  RAG_NO_RESULTS: 'RAG_NO_RESULTS',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export class AppError extends Error {
  readonly code: ErrorCode
  readonly originalError?: unknown

  constructor(code: ErrorCode, message: string, originalError?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.originalError = originalError
  }

  get isRetryable(): boolean {
    const retryable: readonly ErrorCode[] = [
      ErrorCode.NETWORK,
      ErrorCode.TIMEOUT,
      ErrorCode.RATE_LIMITED,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.AGENT_TIMEOUT,
    ]
    return retryable.includes(this.code)
  }

  get requiresAuth(): boolean {
    return this.code === ErrorCode.UNAUTHORIZED
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      retryable: this.isRetryable,
    }
  }
}
