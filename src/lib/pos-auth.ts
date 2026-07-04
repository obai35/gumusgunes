import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'
import { db } from './db'

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
}

export async function verifyPosCredentials(email: string, password: string): Promise<PosUser | null> {
  const branch = await db.branch.findUnique({ where: { email } })
  if (!branch || !branch.isActive) return null
  const valid = await verifyPassword(password, branch.password)
  if (!valid) return null
  return { id: branch.id, name: branch.name, email: branch.email, branchId: branch.id }
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

export { hashPassword, verifyPassword }
