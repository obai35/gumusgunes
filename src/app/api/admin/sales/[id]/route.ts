import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const sale = await sdb.saleCampaign.findFirst({ where: { id: params.id } })
  if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ sale })
}, 'marketing')

export const PUT = withAdmin(async (req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.appliesTo !== undefined) data.appliesTo = body.appliesTo
    if (body.discountType !== undefined) data.discountType = body.discountType
    if (body.discountValue !== undefined) data.discountValue = parseFloat(body.discountValue)
    if (body.minOrder !== undefined) data.minOrder = body.minOrder ? parseFloat(body.minOrder) : null
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) data.endDate = new Date(body.endDate)
    if (body.targetValue !== undefined) data.targetValue = body.targetValue
    if (body.isActive !== undefined) data.isActive = body.isActive
    const sale = await sdb.saleCampaign.update({ where: { id: params.id }, data })
    return NextResponse.json({ sale })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')

export const DELETE = withAdmin(async (_req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  await sdb.saleCampaign.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'marketing')
