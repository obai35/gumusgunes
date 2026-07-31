import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const groups = await storeDb(admin.storeId).group.findMany({
    include: {
      entities: { include: { entityStore: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { interCompanyTxns: true, consolidationRuns: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ groups })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const body = await req.json()
  if (!body.name || !body.slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })

  const existing = await db.group.findUnique({ where: { slug: body.slug } })
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })

  const group = await (storeDb(admin.storeId).group as any).create({
    data: {
      name: body.name,
      slug: body.slug,
      currency: body.currency || 'EGP',
    },
  })
  return NextResponse.json({ group })
}, 'accounting')
