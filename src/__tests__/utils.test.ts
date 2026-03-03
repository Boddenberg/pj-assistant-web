import {
  formatCurrency,
  formatDate,
  formatTime,
  truncate,
  sanitizeInput,
  generateId,
} from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats positive values in BRL', () => {
    const result = formatCurrency(1234.56)
    // Intl may use non-breaking space — normalize
    const normalized = result.replace(/\s/g, ' ')
    expect(normalized).toContain('1.234,56')
    expect(normalized).toContain('R$')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
  })

  it('formats negative values', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500,00')
  })
})

describe('formatDate', () => {
  it('formats ISO string into dd/mm/yyyy', () => {
    const result = formatDate('2024-06-15T10:00:00Z')
    expect(result).toMatch(/15\/06\/2024/)
  })

  it('accepts Date object', () => {
    const result = formatDate(new Date(2024, 0, 1))
    expect(result).toMatch(/01\/01\/2024/)
  })
})

describe('formatTime', () => {
  it('returns HH:mm format', () => {
    const result = formatTime('2024-06-15T14:30:00Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('truncate', () => {
  it('returns original string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates long strings with ellipsis', () => {
    const result = truncate('hello world this is long', 10)
    expect(result.length).toBeLessThanOrEqual(11) // 10 + ellipsis char
    expect(result).toContain('…')
  })
})

describe('sanitizeInput', () => {
  it('escapes HTML entities', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<')
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('>')
  })

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(sanitizeInput('   ')).toBe('')
  })
})

describe('generateId', () => {
  it('returns a UUID-v4-like string', () => {
    const id = generateId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('generates unique IDs', () => {
    const ids = Array.from({ length: 100 }, () => generateId())
    const unique = new Set(ids)
    expect(unique.size).toBe(100)
  })
})
