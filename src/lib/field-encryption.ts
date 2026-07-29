import { encrypt, decrypt } from './encryption'

const SENSITIVE_PREFIX = 'enc:'

export function encryptField(value: string): string {
  return SENSITIVE_PREFIX + encrypt(value)
}

export function decryptField(value: string): string {
  if (!value.startsWith(SENSITIVE_PREFIX)) return value
  return decrypt(value.slice(SENSITIVE_PREFIX.length))
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(SENSITIVE_PREFIX)
}

export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const copy = { ...obj }
  for (const field of fields) {
    const val = copy[field]
    if (typeof val === 'string' && val && !isEncrypted(val)) {
      copy[field] = encryptField(val) as any
    }
  }
  return copy
}

export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const copy = { ...obj }
  for (const field of fields) {
    const val = copy[field]
    if (typeof val === 'string' && val && isEncrypted(val)) {
      copy[field] = decryptField(val) as any
    }
  }
  return copy
}
