import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'pos-secret-change-in-production'

export type PosUser = {
  id: string
  name: string
  email: string
  branchId: string
}

export async function verifyPosCredentials(email: string, password: string): Promise<PosUser | null> {
  const branch = await db.branch.findUnique({ where: { email } })
  if (!branch || !branch.isActive) return null
  const valid = await bcrypt.compare(password, branch.password)
  if (!valid) return null
  return { id: branch.id, name: branch.name, email: branch.email, branchId: branch.id }
}

export function signPosToken(user: PosUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyPosToken(token: string): PosUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as PosUser
  } catch {
    return null
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}
