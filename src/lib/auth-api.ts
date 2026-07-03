import { NextRequest } from 'next/server'
import { verifyToken } from './customer-auth'

export function getUserFromRequest(req: NextRequest): { userId: string; email: string } | null {
  const cookieToken = req.cookies.get('__session')?.value
  const authHeader = req.headers.get('authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
  if (!token) return null
  return verifyToken(token)
}
