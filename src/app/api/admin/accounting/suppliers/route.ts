import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ suppliers })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
