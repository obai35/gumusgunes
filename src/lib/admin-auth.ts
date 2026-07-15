import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'

export { hashPassword, verifyPassword }

interface AdminTokenPayload {
  sub: string
  email: string
  tokenVersion: number
  iat?: number
  exp?: number
}

function getAdminJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) throw new Error('ADMIN_JWT_SECRET environment variable is required')
  return secret
}

export function signAdminToken(adminId: string, email: string, tokenVersion: number): string {
  return jwt.sign(
    { sub: adminId, email, tokenVersion } as AdminTokenPayload,
    getAdminJwtSecret(),
    { expiresIn: '24h' }
  )
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, getAdminJwtSecret()) as AdminTokenPayload
  } catch {
    return null
  }
}
