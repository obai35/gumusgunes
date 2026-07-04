import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY || ''
  if (!keyHex) throw new Error('ENCRYPTION_KEY env var is required')
  return Buffer.from(keyHex, 'hex')
}

function getPreviousKey(): Buffer | null {
  const prevKeyHex = process.env.ENCRYPTION_KEY_PREVIOUS || ''
  if (!prevKeyHex) return null
  return Buffer.from(prevKeyHex, 'hex')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted text format')
  const [ivHex, authTagHex, encrypted] = parts

  try {
    return decryptWithKey(encryptedText, getKey())
  } catch {
    const prevKey = getPreviousKey()
    if (!prevKey) throw new Error('Decryption failed and no previous key available')
    return decryptWithKey(encryptedText, prevKey)
  }
}

function decryptWithKey(encryptedText: string, key: Buffer): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted text format')
  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
