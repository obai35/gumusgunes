import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }
  const account = await db.socialAccount.findFirst({ where: { isActive: true } })
  if (!account) {
    return NextResponse.json({ error: 'No active account found' }, { status: 404 })
  }
  const { MetaClient } = await import('@/lib/social/meta')
  const client = new MetaClient(account.accessToken)
  const comments = await client.getComments(postId)
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { commentId, message } = body
  if (!commentId || !message) {
    return NextResponse.json({ error: 'commentId and message are required' }, { status: 400 })
  }
  const account = await db.socialAccount.findFirst({ where: { isActive: true } })
  if (!account) {
    return NextResponse.json({ error: 'No active account found' }, { status: 404 })
  }
  const { MetaClient } = await import('@/lib/social/meta')
  const client = new MetaClient(account.accessToken)
  await client.replyToComment(commentId, message)
  return NextResponse.json({ success: true })
}
