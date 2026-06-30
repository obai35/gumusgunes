import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminToken } from '@/lib/admin-auth'

async function getAdmin(req: NextRequest) {
  const auth = req.headers.get('Authorization')?.slice(7)
  if (!auth) return null
  return verifyAdminToken(auth)
}

export async function GET(req: NextRequest) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true, icon: true, imageUrl: true } },
    },
  })

  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, slug, description, imageUrl, icon, parentId, isVisible } = await req.json()
    if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })

    const existing = await db.category.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const category = await db.category.create({
      data: { name, slug, description, imageUrl, icon, parentId: parentId || null, isVisible: isVisible ?? true },
    })

    return NextResponse.json(category)
  } catch (err) {
    console.error('Create category error:', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
