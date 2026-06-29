import { NextRequest } from 'next/server'
import { verifyToken } from './customer-auth'

export function getUserFromRequest(req: NextRequest): { userId: string; email: string } | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyToken(auth.slice(7))
}
