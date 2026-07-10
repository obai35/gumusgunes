import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12
const PEPPER = process.env.PASSWORD_PEPPER || ''

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(PEPPER + password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (await bcrypt.compare(PEPPER + password, hash)) return true
  return bcrypt.compare(password, hash)
}
