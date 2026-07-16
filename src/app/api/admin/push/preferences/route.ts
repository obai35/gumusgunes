import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req, { admin }) => {
  let prefs = await db.pushPreference.findUnique({ where: { adminId: admin.id } })
  if (!prefs) {
    prefs = await db.pushPreference.create({
      data: { adminId: admin.id },
    })
  }
  return NextResponse.json(prefs)
})

export const PUT = withAdmin(async (req, { admin }) => {
  const body = await req.json()
  const allowedFields = [
    'newConversation', 'newMessage', 'assignmentChanged',
    'sound', 'quietHoursEnabled', 'quietHoursFrom', 'quietHoursTo',
  ]
  const data: Record<string, any> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key]
  }

  const prefs = await db.pushPreference.upsert({
    where: { adminId: admin.id },
    create: { adminId: admin.id, ...data },
    update: data,
  })

  return NextResponse.json(prefs)
})
