import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'

function getJwtSecret(): string {
  const secret = process.env.CUSTOMER_JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('CUSTOMER_JWT_SECRET, JWT_SECRET, or NEXTAUTH_SECRET environment variable is required')
  }
  return secret
}

export { hashPassword, verifyPassword }

export interface CustomerTokenPayload {
  sub?: string
  userId: string
  email: string
  tokenVersion: number
  iat?: number
  exp?: number
}

export function signToken(payload: { userId: string; email: string; tokenVersion: number }): string {
  const tokenPayload: CustomerTokenPayload = {
    sub: payload.userId,
    userId: payload.userId,
    email: payload.email,
    tokenVersion: payload.tokenVersion,
  }
  return jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; email: string; tokenVersion: number } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string; email: string; tokenVersion: number }
  } catch {
    return null
  }
}

function getTempTokenSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET or JWT_SECRET environment variable is required for 2FA temp tokens')
  }
  return secret
}

export const TEMP_TOKEN_COOKIE = '__totp_temp'

export interface TotpTempTokenPayload {
  userId: string
  email: string
  totp: true
  tokenVersion: number
}

/** 5-minute single-purpose token exchanged for a session after the TOTP step. */
export function signTotpTempToken(payload: { userId: string; email: string; tokenVersion: number }): string {
  return jwt.sign({ ...payload, totp: true }, getTempTokenSecret(), { expiresIn: '5m' })
}

export function verifyTotpTempToken(token: string): TotpTempTokenPayload | null {
  try {
    return jwt.verify(token, getTempTokenSecret()) as TotpTempTokenPayload
  } catch {
    return null
  }
}
