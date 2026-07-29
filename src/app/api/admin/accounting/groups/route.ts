import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const groups = await storeDb(storeId).group.findMany({
    include: {
      entities: { include: { entityStore: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { interCompanyTxns: true, consolidationRuns: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ groups })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const body = await req.json()
  if (!body.name || !body.slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })

  const existing = await db.group.findUnique({ where: { slug: body.slug } })
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })

  const group = await (storeDb(storeId).group as any).create({
    data: {
      name: body.name,
      slug: body.slug,
      currency: body.currency || 'EGP',
    },
  })
  return NextResponse.json({ group })
}
