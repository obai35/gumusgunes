import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { z } from 'zod'

const ProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
}).strict()

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await db.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, name: true, phone: true },
  })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(profile)
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = ProfileSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { name, phone } = parsed.data
  const updated = await db.user.update({
    where: { id: user.userId },
    data: { name, phone },
    select: { id: true, email: true, name: true, phone: true },
  })
  return NextResponse.json(updated)
}
