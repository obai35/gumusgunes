import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const discount = await prisma.discount.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        maxUses: data.maxUses || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })
    return NextResponse.json(discount)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 })
  }
}
