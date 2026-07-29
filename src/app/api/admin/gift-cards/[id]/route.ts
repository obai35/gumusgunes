import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const giftCard = await sdb.giftCard.findFirst({ where: { id: params.id } })
  if (!giftCard) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ giftCard })
}, 'marketing')

export const PUT = withAdmin(async (req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    const data: any = {}
    if (body.initialBalance !== undefined) data.initialBalance = parseFloat(body.initialBalance)
    if (body.balance !== undefined) data.balance = parseFloat(body.balance)
    if (body.recipientEmail !== undefined) data.recipientEmail = body.recipientEmail
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
    const giftCard = await sdb.giftCard.update({ where: { id: params.id }, data })
    return NextResponse.json({ giftCard })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')

export const DELETE = withAdmin(async (_req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  await sdb.giftCard.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'marketing')
