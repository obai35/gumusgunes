import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    const shift = await prisma.shift.findFirst({ where: { branchId, isOpen: true } })
    return NextResponse.json({ ok: true, shift: shift || null })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch active shift' }, { status: 500 })
  }
}
