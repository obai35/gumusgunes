import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { branchId, startingCash } = await req.json()
    if (!branchId || startingCash === undefined) {
      return NextResponse.json({ error: 'branchId and startingCash are required' }, { status: 400 })
    }

    const existing = await prisma.shift.findFirst({ where: { branchId, isOpen: true } })
    if (existing) {
      return NextResponse.json({ error: 'An open shift already exists for this branch' }, { status: 400 })
    }

    const shift = await prisma.shift.create({
      data: { branchId, startingCash, isOpen: true },
    })

    return NextResponse.json({ ok: true, shift })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to start shift' }, { status: 500 })
  }
}
