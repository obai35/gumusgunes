import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12
const PEPPER = process.env.PASSWORD_PEPPER
const PEPPER_FALLBACK = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
  ? 'test-pepper-do-not-use-in-prod'
  : null
if (!PEPPER && !PEPPER_FALLBACK) {
  throw new Error('PASSWORD_PEPPER environment variable must be set')
}
const SECRET = PEPPER || PEPPER_FALLBACK!

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(SECRET + password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(SECRET + password, hash)
}
