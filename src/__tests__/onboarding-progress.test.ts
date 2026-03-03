import { getOnboardingProgress } from '@/types'

describe('getOnboardingProgress', () => {
  it('returns 0 for null', () => {
    expect(getOnboardingProgress(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(getOnboardingProgress(undefined)).toBe(0)
  })

  it('returns 100 for completed', () => {
    expect(getOnboardingProgress('completed')).toBe(100)
  })

  it('returns 0 for error', () => {
    expect(getOnboardingProgress('error')).toBe(0)
  })

  it('returns 10 for cnpj (first step)', () => {
    expect(getOnboardingProgress('cnpj')).toBe(10)
  })

  it('returns 40 for email', () => {
    expect(getOnboardingProgress('email')).toBe(40)
  })

  it('returns 90 for password', () => {
    expect(getOnboardingProgress('password')).toBe(90)
  })

  it('returns 100 for passwordConfirmation (last step)', () => {
    expect(getOnboardingProgress('passwordConfirmation')).toBe(100)
  })
})
