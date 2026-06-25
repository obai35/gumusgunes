import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') || ''
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: search ? [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ] : undefined,
    },
    select: { id: true, name: true, price: true, stock: true, imageUrl: true, sku: true },
    take: 50,
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products)
}
