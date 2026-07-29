import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const lowStock = searchParams.get('lowStock') === 'true'
  const limitParam = searchParams.get('limit')

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const take = limitParam ? Math.min(parseInt(limitParam), 200) : 50
  const skip = (page - 1) * take

  const where: any = {}
  if (search) where.name = { contains: search }
  if (categoryId) where.categoryId = categoryId
  if (lowStock) { where.stock = { lt: 5 }; where.isActive = true }
  const orderBy = lowStock ? { stock: 'asc' as const } : { createdAt: 'desc' as const }

  const [products, total] = await Promise.all([
    sdb.product.findMany({ where, orderBy, take, skip, include: { category: { select: { id: true, name: true } } } }),
    sdb.product.count({ where }),
  ])
  return NextResponse.json({ ok: true, products, total, page, totalPages: Math.ceil(total / take) })
}, 'products')
