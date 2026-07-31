import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const rates = await sdb.taxRate.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, rates })
  } catch (err) {
    console.error('GET /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { name, rate, country, region, isActive } = await req.json()
    if (!name || rate == null) return NextResponse.json({ error: 'name and rate required' }, { status: 400 })
    const taxRate = await sdb.taxRate.create({
      data: { name, rate: parseFloat(rate), country: country || 'EG', region: region || null, isActive: isActive ?? true } as any,
    })
    return NextResponse.json({ ok: true, taxRate })
  } catch (err) {
    console.error('POST /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const PUT = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { id, name, rate, country, region, isActive } = await req.json()
    const data: any = {}
    if (name !== undefined) data.name = name
    if (rate !== undefined) data.rate = parseFloat(rate)
    if (country !== undefined) data.country = country
    if (region !== undefined) data.region = region
    if (isActive !== undefined) data.isActive = isActive
    const taxRate = await sdb.taxRate.update({ where: { id }, data })
    return NextResponse.json({ ok: true, taxRate })
  } catch (err) {
    console.error('PUT /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const DELETE = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { id } = await req.json()
    await sdb.taxRate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')
