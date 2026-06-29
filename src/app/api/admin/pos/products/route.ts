import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(search ? {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
          ],
        } : {}),
      },
      select: { id: true, name: true, price: true, stock: true, imageUrl: true, sku: true },
      take: 20,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(products)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
