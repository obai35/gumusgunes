import { NextRequest, NextResponse } from 'next/server'
import { verifyPosToken } from '@/lib/pos-auth'
import { withRateLimit } from '@/lib/rate-limit'

const handler = async (req: NextRequest) => {
  const token = req.cookies.get('__session_pos')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = verifyPosToken(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, user })
}

export const GET = withRateLimit(handler, { limit: 30, window: '60s', failClosed: true })