import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await db.socialCampaign.findUnique({
    where: { id },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        include: { account: { select: { accountName: true, platform: true } } },
      },
    },
  })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(campaign)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const campaign = await db.socialCampaign.update({ where: { id }, data: body })
  return NextResponse.json(campaign)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.socialCampaign.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
