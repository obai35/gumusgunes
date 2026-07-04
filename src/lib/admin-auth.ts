import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET
if (!ADMIN_JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET environment variable is required')
}

export { hashPassword, verifyPassword }

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
