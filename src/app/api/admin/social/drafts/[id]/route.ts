import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await db.socialDraft.findUnique({ where: { id } })
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(draft)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: any = { ...body }
  if (data.mediaUrls) data.mediaUrls = JSON.stringify(data.mediaUrls)
  if (data.hashtags) data.hashtags = JSON.stringify(data.hashtags)
  if (data.productIds) data.productIds = JSON.stringify(data.productIds)
  if (data.platforms) data.platforms = JSON.stringify(data.platforms)
  const draft = await db.socialDraft.update({ where: { id }, data })
  return NextResponse.json(draft)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.socialDraft.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
