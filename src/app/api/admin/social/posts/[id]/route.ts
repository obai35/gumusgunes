import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const post = await sdb.socialPost.findUnique({
    where: { id },
    include: { account: true, campaign: true },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}, 'social')

export const PATCH = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const body = await req.json()
  const data: any = { ...body }
  if (data.mediaUrls) data.mediaUrls = JSON.stringify(data.mediaUrls)
  if (data.hashtags) data.hashtags = JSON.stringify(data.hashtags)
  if (data.productIds) data.productIds = JSON.stringify(data.productIds)
  if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt)
  const post = await sdb.socialPost.update({ where: { id }, data })
  return NextResponse.json(post)
}, 'social')

export const DELETE = withAdmin(async (_req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  await sdb.socialPost.delete({ where: { id } })
  return NextResponse.json({ success: true })
}, 'social')
