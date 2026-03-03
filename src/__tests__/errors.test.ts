import { AppError, ErrorCode } from '@/lib/errors'

describe('AppError', () => {
  it('creates an error with code and message', () => {
    const err = new AppError(ErrorCode.NETWORK, 'Connection lost')
    expect(err.code).toBe('NETWORK')
    expect(err.message).toBe('Connection lost')
    expect(err.name).toBe('AppError')
  })

  it('preserves original error', () => {
    const original = new Error('boom')
    const err = new AppError(ErrorCode.UNKNOWN, 'Wrapped', original)
    expect(err.originalError).toBe(original)
  })

  describe('isRetryable', () => {
    it('returns true for retryable codes', () => {
      const retryable = [
        ErrorCode.NETWORK,
        ErrorCode.TIMEOUT,
        ErrorCode.RATE_LIMITED,
        ErrorCode.SERVICE_UNAVAILABLE,
        ErrorCode.AGENT_TIMEOUT,
      ]
      retryable.forEach((code) => {
        expect(new AppError(code, 'x').isRetryable).toBe(true)
      })
    })

    it('returns false for non-retryable codes', () => {
      const nonRetryable = [
        ErrorCode.UNAUTHORIZED,
        ErrorCode.FORBIDDEN,
        ErrorCode.NOT_FOUND,
        ErrorCode.VALIDATION,
        ErrorCode.UNKNOWN,
      ]
      nonRetryable.forEach((code) => {
        expect(new AppError(code, 'x').isRetryable).toBe(false)
      })
    })
  })

  describe('requiresAuth', () => {
    it('returns true for UNAUTHORIZED', () => {
      expect(new AppError(ErrorCode.UNAUTHORIZED, 'x').requiresAuth).toBe(true)
    })

    it('returns false for other codes', () => {
      expect(new AppError(ErrorCode.NETWORK, 'x').requiresAuth).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('serializes to plain object', () => {
      const err = new AppError(ErrorCode.SERVER, 'Internal error')
      const json = err.toJSON()
      expect(json).toEqual({
        code: 'SERVER',
        message: 'Internal error',
        retryable: false,
      })
    })
  })
})
