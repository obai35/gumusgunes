import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const BCRYPT_ROUNDS = 10
const BODY_LENGTH = 10
export const BACKUP_CODE_PATTERN = /^(0[0-9]|1[0-9])-[A-Z2-9]{5}-[A-Z2-9]{5}$/

export type GeneratedBackupCode = { index: number; code: string; hash: string }

function randomChars(length: number): string {
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}

export function formatBackupCode(index: number, body: string): string {
  return `${String(index).padStart(2, '0')}-${body.slice(0, 5)}-${body.slice(5)}`
}

export function generateBackupCodes(count = 10): GeneratedBackupCode[] {
  const codes: GeneratedBackupCode[] = []
  const seen = new Set<string>()
  while (codes.length < count) {
    const body = randomChars(BODY_LENGTH)
    if (seen.has(body)) continue
    seen.add(body)
    const code = formatBackupCode(codes.length, body)
    codes.push({ index: codes.length, code, hash: hashBackupCode(code) })
  }
  return codes
}

export function hashBackupCode(code: string): string {
  return bcrypt.hashSync(code, BCRYPT_ROUNDS)
}

export function parseBackupCode(input: string): { index: number; code: string } | null {
  const trimmed = input.trim().toUpperCase()
  if (!BACKUP_CODE_PATTERN.test(trimmed)) return null
  const [indexPart, group1, group2] = trimmed.split('-')
  return { index: parseInt(indexPart, 10), code: `${group1}-${group2}` }
}

export function verifyBackupCode(input: string, hash: string): boolean {
  const parsed = parseBackupCode(input)
  if (!parsed) return false
  const fullCode = formatBackupCode(parsed.index, parsed.code.replace('-', ''))
  return bcrypt.compareSync(fullCode, hash)
}