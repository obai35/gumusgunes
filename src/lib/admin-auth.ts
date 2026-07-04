import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'

export { hashPassword, verifyPassword }

function getAdminJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) throw new Error('ADMIN_JWT_SECRET environment variable is required')
  return secret
}

export function signAdminToken(payload: { adminId: string; email: string }): string {
  return jwt.sign(payload, getAdminJwtSecret(), { expiresIn: '24h' })
}

export function verifyAdminToken(token: string): { adminId: string; email: string } | null {
  try {
    return jwt.verify(token, getAdminJwtSecret()) as { adminId: string; email: string }
  } catch {
    return null
  }
}
