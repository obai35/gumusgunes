import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const PUT = withAdmin(async (req: Request, { params, admin }: { params: { id: string }; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const existing = await sdb.apiKey.findFirst({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }
  const { name, permissions, isActive } = await req.json()
  const data: any = {}
  if (name !== undefined) data.name = name
  if (permissions !== undefined) data.permissions = JSON.stringify(permissions)
  if (isActive !== undefined) data.isActive = isActive
  const apiKey = await sdb.apiKey.update({ where: { id: params.id }, data })
  return NextResponse.json({ apiKey: { ...apiKey, key: apiKey.key.slice(0, 12) + '...' } })
}, 'system')

export const DELETE = withAdmin(async (_req: Request, { params, admin }: { params: { id: string }; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const existing = await sdb.apiKey.findFirst({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }
  await sdb.apiKey.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'system')
