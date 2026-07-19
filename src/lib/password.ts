import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

function getPepper(): string {
  const pepper = process.env.PASSWORD_PEPPER
  if (pepper) return pepper
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
  if (isTest) return 'test-pepper-do-not-use-in-prod'
  throw new Error('PASSWORD_PEPPER environment variable must be set')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(getPepper() + password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(getPepper() + password, hash)
}
