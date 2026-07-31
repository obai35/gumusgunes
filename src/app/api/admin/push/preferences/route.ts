import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  let prefs = await sdb.pushPreference.findUnique({ where: { adminId: admin.id } })
  if (!prefs) {
    prefs = await sdb.pushPreference.create({
      data: { adminId: admin.id } as any,
    })
  }
  return NextResponse.json(prefs)
})

export const PUT = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const allowedFields = [
    'newConversation', 'newMessage', 'assignmentChanged',
    'sound', 'quietHoursEnabled', 'quietHoursFrom', 'quietHoursTo',
  ]
  const data: Record<string, any> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key]
  }

  const prefs = await sdb.pushPreference.upsert({
    where: { adminId: admin.id },
    create: { adminId: admin.id, ...data } as any,
    update: data as any,
  })

  return NextResponse.json(prefs)
})
