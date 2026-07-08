import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const drafts = await db.socialDraft.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(drafts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, mediaUrls, caption, hashtags, productIds, discountId, platforms } = body
  if (!platforms || !mediaUrls) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const draft = await db.socialDraft.create({
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
}
