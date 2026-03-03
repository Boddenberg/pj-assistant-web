// ─── Barcode Utility Tests ────────────────────────────────────────────
import { isValidDigitableLine, formatDigitableLine, maskDocument, formatPixKey } from '@/lib'

describe('isValidDigitableLine', () => {
  it('accepts 47-digit boleto bancário', () => {
    const line = '23793.38128 60000.000003 00000.000400 1 84340000023500'
    expect(isValidDigitableLine(line)).toBe(true)
  })

  it('accepts 48-digit concessionária', () => {
    const digits = '836600000015 078100481000 160823114001 308900003190'
    expect(isValidDigitableLine(digits)).toBe(true)
  })

  it('rejects short strings', () => {
    expect(isValidDigitableLine('12345')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidDigitableLine('')).toBe(false)
  })
})

describe('formatDigitableLine', () => {
  it('formats 47-digit boleto correctly', () => {
    const raw = '23793381286000000000300000004001843400002350'
    // Not exactly 47 digits, but let's test with 47
    const digits47 = '23793381286000000000300000004001843400002350000'
    const formatted = formatDigitableLine(digits47)
    expect(formatted).toContain('.')
    expect(formatted).toContain(' ')
  })

  it('returns input unchanged for invalid length', () => {
    expect(formatDigitableLine('123')).toBe('123')
  })
})

describe('maskDocument', () => {
  it('masks CPF correctly', () => {
    const masked = maskDocument('12345678901')
    expect(masked).toBe('***.***.789-**')
  })

  it('masks CNPJ correctly', () => {
    const masked = maskDocument('12345678000195')
    expect(masked).toContain('***')
    expect(masked).toContain('95')
  })

  it('returns original for unknown format', () => {
    expect(maskDocument('123')).toBe('123')
  })
})

describe('formatPixKey', () => {
  it('masks email', () => {
    const result = formatPixKey('joao@empresa.com.br', 'email')
    expect(result).toBe('jo***@empresa.com.br')
  })

  it('masks phone', () => {
    const result = formatPixKey('+5511999887766', 'phone')
    expect(result).toContain('****')
  })

  it('truncates random key', () => {
    const result = formatPixKey('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'random')
    expect(result).toContain('...')
  })
})
