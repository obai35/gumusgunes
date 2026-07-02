import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/encryption'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.nameAr !== undefined) data.nameAr = body.nameAr
  if (body.description !== undefined) data.description = body.description
  if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr
  if (body.isActive !== undefined) data.isActive = body.isActive
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
  if (body.config !== undefined) data.config = encrypt(JSON.stringify(body.config))

  const method = await db.paymentMethod.update({ where: { id }, data })
  return NextResponse.json({ method: { ...method, config: body.config || {} } })
}, 'payments')
