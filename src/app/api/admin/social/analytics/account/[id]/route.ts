import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = await db.socialAccount.findUnique({ where: { id } })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const posts = await db.socialPost.findMany({
    where: { accountId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, postType: true, status: true, caption: true, publishedAt: true, performance: true },
  })

  return NextResponse.json({ account, posts })
}
