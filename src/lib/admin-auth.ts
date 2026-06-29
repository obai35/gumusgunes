import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'admin-secret-change-in-production'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signAdminToken(payload: { adminId: string; email: string }): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '24h' })
}

export function verifyAdminToken(token: string): { adminId: string; email: string } | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: string; email: string }
  } catch {
    return null
  }
}
