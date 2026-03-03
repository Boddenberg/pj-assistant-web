// ─── Barcode Utility ─────────────────────────────────────────────────
// Validates and formats Brazilian boleto barcode / digitable lines.

/**
 * Determines if a string looks like a valid boleto digitable line.
 * Boleto bancário: 47 digits. Concessionária: 48 digits.
 */
export function isValidDigitableLine(input: string): boolean {
  const digits = input.replace(/\D/g, '')
  return digits.length === 47 || digits.length === 48
}

/**
 * Formats a raw digit string into a human-readable digitable line.
 * For 47 digits (boleto bancário):
 *   XXXXX.XXXXX XXXXX.XXXXXX XXXXX.XXXXXX X XXXXXXXXXXXXXX
 */
export function formatDigitableLine(input: string): string {
  const digits = input.replace(/\D/g, '')

  if (digits.length === 47) {
    return [
      digits.slice(0, 5) + '.' + digits.slice(5, 10),
      digits.slice(10, 15) + '.' + digits.slice(15, 21),
      digits.slice(21, 26) + '.' + digits.slice(26, 32),
      digits.slice(32, 33),
      digits.slice(33, 47),
    ].join(' ')
  }

  if (digits.length === 48) {
    return [
      digits.slice(0, 11) + '-' + digits.slice(11, 12),
      digits.slice(12, 23) + '-' + digits.slice(23, 24),
      digits.slice(24, 35) + '-' + digits.slice(35, 36),
      digits.slice(36, 47) + '-' + digits.slice(47, 48),
    ].join(' ')
  }

  return input
}

/** Masks a CPF/CNPJ for display */
export function maskDocument(doc: string): string {
  const digits = doc.replace(/\D/g, '')
  if (digits.length === 11) {
    return `***.***.${digits.slice(6, 9)}-**`
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.***.***/****-${digits.slice(12, 14)}`
  }
  return doc
}

/** Formats a Pix key for display (masks sensitive parts) */
export function formatPixKey(key: string, type: string): string {
  switch (type) {
    case 'cpf':
    case 'cnpj':
      return maskDocument(key)
    case 'email': {
      const [user, domain] = key.split('@')
      return `${user.slice(0, 2)}***@${domain}`
    }
    case 'phone':
      return `${key.slice(0, 4)}****${key.slice(-2)}`
    default:
      return key.slice(0, 8) + '...'
  }
}
