import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY required')
  return createHash('sha256').update(key).digest()
}

export function encryptMessage(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return { encrypted, iv: iv.toString('hex'), tag }
}

export function decryptMessage(encrypted: string, iv: string, tag: string): string {
  const key = getEncryptionKey()
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
