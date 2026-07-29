import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const DELETE = withAdmin(async (_req: NextRequest, { admin, params }: { admin: any; params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  await sdb.socialAccount.delete({ where: { id } })
  return NextResponse.json({ success: true })
}, 'social')

export const PATCH = withAdmin(async (req: NextRequest, { admin, params }: { admin: any; params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const body = await req.json()
  const account = await sdb.socialAccount.update({ where: { id }, data: body })
  return NextResponse.json(account)
}, 'social')
