import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req: NextRequest, { admin, params }: { admin: any; params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const campaign = await sdb.socialCampaign.findFirst({
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
}, 'social')

export const PATCH = withAdmin(async (req: NextRequest, { admin, params }: { admin: any; params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const body = await req.json()
  const campaign = await sdb.socialCampaign.update({ where: { id }, data: body })
  return NextResponse.json(campaign)
}, 'social')

export const DELETE = withAdmin(async (_req: NextRequest, { admin, params }: { admin: any; params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  await sdb.socialCampaign.delete({ where: { id } })
  return NextResponse.json({ success: true })
}, 'social')
