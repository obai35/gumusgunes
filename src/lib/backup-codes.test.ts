import { describe, it, expect } from 'vitest'
import {
  generateBackupCodes,
  hashBackupCode,
  parseBackupCode,
  verifyBackupCode,
  formatBackupCode,
  BACKUP_CODE_PATTERN,
} from './backup-codes'

describe('generateBackupCodes', () => {
  it('generates 10 unique codes with hashes', () => {
    const codes = generateBackupCodes()
    expect(codes).toHaveLength(10)
    const uniques = new Set(codes.map((c) => c.code))
    expect(uniques.size).toBe(10)
    expect(new Set(codes.map((c) => c.index))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
  })

  it('hashes each code and never stores plaintext', () => {
    const codes = generateBackupCodes()
    for (const c of codes) {
      expect(c.hash).not.toBe(c.code)
      expect(c.hash.length).toBeGreaterThan(50)
      expect(c.hash).not.toContain(c.code)
    }
  })

  it('emits codes matching the addressable format', () => {
    const codes = generateBackupCodes()
    for (const c of codes) {
      expect(BACKUP_CODE_PATTERN.test(c.code)).toBe(true)
      expect(c.code.startsWith(`${String(c.index).padStart(2, '0')}-`)).toBe(true)
    }
  })

  it('respects a custom count', () => {
    expect(generateBackupCodes(3)).toHaveLength(3)
  })
})

describe('parseBackupCode', () => {
  it('parses a valid code with its index', () => {
    const parsed = parseBackupCode('07-ABCDE-FGHJK')
    expect(parsed).toEqual({ index: 7, code: 'ABCDE-FGHJK' })
  })

  it('handles lowercase input', () => {
    const parsed = parseBackupCode('03-abcde-fghjk')
    expect(parsed).toEqual({ index: 3, code: 'ABCDE-FGHJK' })
  })

  it('rejects malformed codes', () => {
    expect(parseBackupCode('')).toBeNull()
    expect(parseBackupCode('07-ABCDE-FGHJ')).toBeNull()
    expect(parseBackupCode('7-ABCDE-FGHJK')).toBeNull()
    expect(parseBackupCode('99-ABCDE-FGHJK')).toBeNull()
    expect(parseBackupCode('07-ABCDE-FGHO0')).toBeNull()
    expect(parseBackupCode('07ABCDEFGHJK')).toBeNull()
    expect(parseBackupCode('07-ABCDE-FGHJK-EXTRA')).toBeNull()
  })
})

describe('verifyBackupCode', () => {
  it('verifies a code against its own addressable hash', () => {
    const codes = generateBackupCodes(3)
    for (const c of codes) {
      expect(verifyBackupCode(c.code, c.hash)).toBe(true)
    }
  })

  it('rejects a wrong code for the same slot', () => {
    const codes = generateBackupCodes(2)
    expect(verifyBackupCode('07-ABCDE-FGHJK', codes[0].hash)).toBe(false)
  })

  it('rejects a code whose index does not match the slot being checked', () => {
    const codes = generateBackupCodes(2)
    const otherSlotCode = formatBackupCode(1, 'XXXXX-YYYYY'.replace('-', ''))
    expect(verifyBackupCode(otherSlotCode, codes[0].hash)).toBe(false)
  })

  it('rejects garbage input', () => {
    expect(verifyBackupCode('not-a-code', hashBackupCode(formatBackupCode(0, 'ABCDEFGHJK')))).toBe(false)
  })
})

describe('hashBackupCode', () => {
  it('produces a bcrypt hash that round-trips', () => {
    const code = formatBackupCode(5, 'ABCDEFGHJK')
    const a = hashBackupCode(code)
    expect(a).toMatch(/^\$2[aby]\$10\$/)
    expect(bcryptCompare(code, a)).toBe(true)
  })
})

function bcryptCompare(code: string, hash: string): boolean {
  const bcrypt = require('bcryptjs')
  return bcrypt.compareSync(code, hash)
}