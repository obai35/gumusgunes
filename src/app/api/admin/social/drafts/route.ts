import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const drafts = await sdb.socialDraft.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(drafts)
}, 'social')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const { title, mediaUrls, caption, hashtags, productIds, discountId, platforms } = body
  if (!platforms || !mediaUrls) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const draft = await sdb.socialDraft.create({
    data: {
      title: title || null,
      mediaUrls: JSON.stringify(mediaUrls),
      caption: caption || null,
      hashtags: hashtags ? JSON.stringify(hashtags) : null,
      productIds: productIds ? JSON.stringify(productIds) : null,
      discountId: discountId || null,
      platforms: JSON.stringify(platforms),
    },
  })
  return NextResponse.json(draft)
}, 'social')
