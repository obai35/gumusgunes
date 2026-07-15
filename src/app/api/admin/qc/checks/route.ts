import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, getAdminFromToken } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const productId = req.nextUrl.searchParams.get('productId') || ''
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '20'))
  const skip = parseInt(req.nextUrl.searchParams.get('skip') || '0')

  const where = productId ? { productId } : {}
  const [checks, total] = await Promise.all([
    db.qC_Check.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.qC_Check.count({ where }),
  ])
  return NextResponse.json({ ok: true, checks, total })
}, 'products')

export const POST = withAdmin(async (req: NextRequest) => {
  const { productId, templateId, passed, notes } = await req.json()
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  const token = await getAdminFromToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const check = await db.qC_Check.create({
    data: { productId, templateId: templateId || null, passed, notes, checkedBy: token.name },
    include: {
      product: { select: { name: true, sku: true } },
      template: { select: { name: true } },
    },
  })
  return NextResponse.json({ ok: true, check })
}, 'products')
