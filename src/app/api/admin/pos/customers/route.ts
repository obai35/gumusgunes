import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const customers = await prisma.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      } : {},
      select: { id: true, name: true, email: true, phone: true },
      take: 20,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ customers })
  } catch {
    return NextResponse.json({ customers: [] })
  }
}
