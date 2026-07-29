import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }
  const account = await sdb.socialAccount.findFirst({ where: { isActive: true } })
  if (!account) {
    return NextResponse.json({ error: 'No active account found' }, { status: 404 })
  }
  const { MetaClient } = await import('@/lib/social/meta')
  const client = new MetaClient(account.accessToken)
  const comments = await client.getComments(postId)
  return NextResponse.json(comments)
}, 'social')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const { commentId, message } = body
  if (!commentId || !message) {
    return NextResponse.json({ error: 'commentId and message are required' }, { status: 400 })
  }
  const account = await sdb.socialAccount.findFirst({ where: { isActive: true } })
  if (!account) {
    return NextResponse.json({ error: 'No active account found' }, { status: 404 })
  }
  const { MetaClient } = await import('@/lib/social/meta')
  const client = new MetaClient(account.accessToken)
  await client.replyToComment(commentId, message)
  return NextResponse.json({ success: true })
}, 'social')
