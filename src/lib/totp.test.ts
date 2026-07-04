import { describe, it, expect } from 'vitest'
import { verifyTotpCode } from './totp'

describe('TOTP', () => {
  it('rejects invalid code', () => {
    expect(verifyTotpCode('000000', 'JBSWY3DPEHPK3PXP')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(verifyTotpCode('', 'JBSWY3DPEHPK3PXP')).toBe(false)
  })
})
