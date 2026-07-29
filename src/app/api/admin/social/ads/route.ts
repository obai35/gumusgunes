import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { MetaClient } from '@/lib/social/meta'

export const GET = withAdmin(async (_req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const accounts = await sdb.socialAccount.findMany({
      where: { isActive: true },
      select: { id: true, platform: true, accountName: true, accountId: true },
    })
    return NextResponse.json({ ok: true, accounts })
  } catch (err) {
    console.error('GET /api/admin/social/ads error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to get accounts' }, { status: 500 })
  }
}, 'social')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const { postId, pageId, budget, days, targeting } = await req.json()

    if (!postId || !pageId || !budget || !days) {
      return NextResponse.json({ ok: false, error: 'postId, pageId, budget, and days are required' }, { status: 400 })
    }

    const account = await sdb.socialAccount.findFirst({
      where: { isActive: true, platform: 'facebook' },
    })

    if (!account) {
      return NextResponse.json({ ok: false, error: 'No active Facebook account found' }, { status: 400 })
    }

    const meta = new MetaClient(account.accessToken)
    const result = await meta.boostPost(postId, pageId, budget, days)

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('POST /api/admin/social/ads error:', err)
    const message = err instanceof Error ? err.message : 'Failed to boost post'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}, 'social')
