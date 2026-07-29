import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const items = await sdb.workCenter.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(items)
})

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const item = await sdb.workCenter.create({
    data: { name: body.name, code: body.code, description: body.description, hourlyRate: body.hourlyRate || 0 },
  })
  return NextResponse.json(item, { status: 201 })
})
