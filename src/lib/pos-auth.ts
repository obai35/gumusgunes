import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET or NEXTAUTH_SECRET environment variable')
  return secret
}

export type PosUser = {
  id: string
  name: string
  email: string
  branchId: string
  tokenVersion?: number
}

export function signPosToken(user: PosUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '24h' })
}

export function verifyPosToken(token: string): PosUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as PosUser
  } catch {
    return null
  }
}