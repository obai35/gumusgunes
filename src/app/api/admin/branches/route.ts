import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const branches = await sdb.branch.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, branches })
  } catch (err) {
    console.error('GET /api/admin/branches error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'branches')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { name, email, password, phone, address } = await req.json()
    if (!name || !email || !password) return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 })
    const existing = await sdb.branch.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    const branch = await sdb.branch.create({
      data: { name, email, password: await hashPassword(password), phone, address } as any,
    })
    return NextResponse.json({ ok: true, branch })
  } catch (err) {
    console.error('POST /api/admin/branches error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'branches')

export const PUT = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { id, name, email, password, phone, address, isActive } = await req.json()
    const data: any = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (password) data.password = await hashPassword(password)
    if (phone !== undefined) data.phone = phone
    if (address !== undefined) data.address = address
    if (isActive !== undefined) data.isActive = isActive
    const branch = await sdb.branch.update({ where: { id }, data })
    return NextResponse.json({ ok: true, branch })
  } catch (err) {
    console.error('PUT /api/admin/branches error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'branches')
