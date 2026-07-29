import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async ({ admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const currencies = await sdb.currency.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, currencies })
  } catch (err) {
    console.error('GET /api/admin/currencies error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const { code, name, symbol, exchangeRate, isDefault, isActive } = await req.json()
    if (!code || !name || !symbol || exchangeRate == null) {
      return NextResponse.json({ error: 'code, name, symbol, exchangeRate required' }, { status: 400 })
    }
    if (isDefault) {
      await sdb.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }
    const currency = await sdb.currency.create({ data: { code, name, symbol, exchangeRate, isDefault: isDefault || false, isActive: isActive ?? true } })
    return NextResponse.json({ ok: true, currency })
  } catch (err) {
    console.error('POST /api/admin/currencies error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const PUT = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const { id, code, name, symbol, exchangeRate, isDefault, isActive } = await req.json()
    const data: any = {}
    if (code !== undefined) data.code = code
    if (name !== undefined) data.name = name
    if (symbol !== undefined) data.symbol = symbol
    if (exchangeRate !== undefined) data.exchangeRate = exchangeRate
    if (isActive !== undefined) data.isActive = isActive
    if (isDefault) {
      await sdb.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
      data.isDefault = true
    }
    const currency = await sdb.currency.update({ where: { id }, data })
    return NextResponse.json({ ok: true, currency })
  } catch (err) {
    console.error('PUT /api/admin/currencies error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')

export const DELETE = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const { id } = await req.json()
    const currency = await sdb.currency.findUnique({ where: { id } })
    if (!currency) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (currency.isDefault) return NextResponse.json({ error: 'Cannot delete default currency' }, { status: 400 })
    await sdb.currency.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/currencies error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'settings')
