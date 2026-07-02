import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/pos-auth'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  try {
    const branches = await db.branch.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, branches })
  } catch (err) {
    console.error('GET /api/admin/branches error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'branches')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { name, email, password, phone, address } = await req.json()
    if (!name || !email || !password) return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 })
    const existing = await db.branch.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    const branch = await db.branch.create({
      data: { name, email, password: hashPassword(password), phone, address },
    })
    return NextResponse.json({ ok: true, branch })
  } catch (err) {
    console.error('POST /api/admin/branches error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'branches')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { id, name, email, password, phone, address, isActive } = await req.json()
    const data: any = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (password) data.password = hashPassword(password)
    if (phone !== undefined) data.phone = phone
    if (address !== undefined) data.address = address
    if (isActive !== undefined) data.isActive = isActive
    const branch = await db.branch.update({ where: { id }, data })
    return NextResponse.json({ ok: true, branch })
  } catch (err) {
    console.error('PUT /api/admin/branches error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'branches')
