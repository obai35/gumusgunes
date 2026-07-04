import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password hashing', () => {
  it('hashes a password successfully', async () => {
    const hash = await hashPassword('test-password')
    expect(hash).toBeTruthy()
    expect(hash.startsWith('$2')).toBe(true)
  })

  it('produces different hashes for same input', async () => {
    const hash1 = await hashPassword('same-password')
    const hash2 = await hashPassword('same-password')
    expect(hash1).not.toBe(hash2)
  })

  it('verifies correct password', async () => {
    const hash = await hashPassword('my-password')
    expect(await verifyPassword('my-password', hash)).toBe(true)
  })

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('correct-password')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})
