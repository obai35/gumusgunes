import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const accounts = await sdb.socialAccount.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, platform: true, accountName: true, accountId: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(accounts)
}, 'social')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const { platform, accountId, accountName, accessToken, tokenExpires } = body
  if (!platform || !accountId || !accountName || !accessToken) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const account = await sdb.socialAccount.create({
    data: { platform, accountId, accountName, accessToken, tokenExpires: tokenExpires ? new Date(tokenExpires) : null } as any,
  })
  return NextResponse.json(account)
}, 'social')
