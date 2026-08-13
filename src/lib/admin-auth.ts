import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'

export { hashPassword, verifyPassword }

interface AdminTokenPayload {
  sub: string
  email: string
  storeId: string
  tokenVersion: number
  iat?: number
  exp?: number
}

function getAdminJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) throw new Error('ADMIN_JWT_SECRET environment variable is required')
  return secret
}

export function signAdminToken(adminId: string, email: string, storeId: string, tokenVersion: number): string {
  return jwt.sign(
    { sub: adminId, email, storeId, tokenVersion } as AdminTokenPayload,
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

export function signAdminSetupToken(adminId: string, secret: string): string {
  return jwt.sign(
    { sub: adminId, purpose: 'totp-setup', secret },
    getAdminJwtSecret(),
    { expiresIn: '5m' }
  )
}

export function verifyAdminSetupToken(token: string): { sub: string; secret: string } | null {
  try {
    const payload = jwt.verify(token, getAdminJwtSecret()) as { sub?: string; purpose?: string; secret?: string }
    if (payload.purpose !== 'totp-setup' || !payload.sub || typeof payload.secret !== 'string') return null
    return { sub: payload.sub, secret: payload.secret }
  } catch {
    return null
  }
}
