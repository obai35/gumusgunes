import { describe, it, expect, beforeAll } from 'vitest'
import { encrypt, decrypt } from './encryption'

beforeAll(() => {
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  }
})

describe('encryption', () => {
  it('encrypts and decrypts a string', () => {
    const original = 'sensitive-data-123'
    const encrypted = encrypt(original)
    expect(encrypted).not.toBe(original)
    expect(encrypted.split(':').length).toBe(3)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it('produces different ciphertext for same input', () => {
    const plain = 'same-input'
    const enc1 = encrypt(plain)
    const enc2 = encrypt(plain)
    expect(enc1).not.toBe(enc2)
  })

  it('throws on invalid format', () => {
    expect(() => decrypt('invalid')).toThrow()
    expect(() => decrypt('a:b')).toThrow()
  })

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('test')
    const parts = encrypted.split(':')
    const tampered = `${parts[0]}:${parts[1]}:ffff${parts[2].slice(4)}`
    expect(() => decrypt(tampered)).toThrow()
  })
})
