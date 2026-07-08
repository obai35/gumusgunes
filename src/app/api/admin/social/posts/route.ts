import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const accountId = searchParams.get('accountId')
  const where: any = {}
  if (status) where.status = status
  if (accountId) where.accountId = accountId

  const posts = await db.socialPost.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { account: { select: { accountName: true, platform: true } } },
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { accountId, platform, postType, status, mediaUrls, caption, hashtags, productIds, discountId, scheduledAt } = body
  if (!platform || !postType || !mediaUrls) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const post = await db.socialPost.create({
    data: {
      accountId: accountId || null,
      platform,
      postType,
      status: status || 'draft',
      mediaUrls: JSON.stringify(mediaUrls),
      caption: caption || null,
      hashtags: hashtags ? JSON.stringify(hashtags) : null,
      productIds: productIds ? JSON.stringify(productIds) : null,
      discountId: discountId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  })
  return NextResponse.json(post)
}
