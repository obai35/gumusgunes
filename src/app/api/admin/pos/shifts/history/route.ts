import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const branchId = req.nextUrl.searchParams.get('branchId')
    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 })

    const shifts = await prisma.shift.findMany({
      where: { branchId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(shifts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shift history' }, { status: 500 })
  }
}
