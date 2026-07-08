import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const accounts = await db.socialAccount.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, platform: true, accountName: true, accountId: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { platform, accountId, accountName, accessToken, tokenExpires } = body
  if (!platform || !accountId || !accountName || !accessToken) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const account = await db.socialAccount.create({
    data: { platform, accountId, accountName, accessToken, tokenExpires: tokenExpires ? new Date(tokenExpires) : null },
  })
  return NextResponse.json(account)
}
