import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  try {
    const rates = await db.taxRate.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, rates })
  } catch (err) {
    console.error('GET /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { name, rate, country, region, isActive } = await req.json()
    if (!name || rate == null) return NextResponse.json({ error: 'name and rate required' }, { status: 400 })
    const taxRate = await db.taxRate.create({
      data: { name, rate: parseFloat(rate), country: country || 'EG', region: region || null, isActive: isActive ?? true },
    })
    return NextResponse.json({ ok: true, taxRate })
  } catch (err) {
    console.error('POST /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { id, name, rate, country, region, isActive } = await req.json()
    const data: any = {}
    if (name !== undefined) data.name = name
    if (rate !== undefined) data.rate = parseFloat(rate)
    if (country !== undefined) data.country = country
    if (region !== undefined) data.region = region
    if (isActive !== undefined) data.isActive = isActive
    const taxRate = await db.taxRate.update({ where: { id }, data })
    return NextResponse.json({ ok: true, taxRate })
  } catch (err) {
    console.error('PUT /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { id } = await req.json()
    await db.taxRate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/tax-rates error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')
