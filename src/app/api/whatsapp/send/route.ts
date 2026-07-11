import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { z } from 'zod'

const SendSchema = z.object({
  conversationId: z.string(),
  message: z.string().min(1).max(2000),
}).strict()

const handler = withAdmin(async (req, { admin }) => {
  const parsed = SendSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { conversationId, message } = parsed.data

  const conversation = await db.conversation.findUnique({ where: { id: conversationId } })
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  if (!conversation.customerPhone) return NextResponse.json({ error: 'No customer phone' }, { status: 400 })

  if (!conversation.assignedTo) {
    await db.conversation.update({ where: { id: conversationId }, data: { assignedTo: admin.id, status: 'ACTIVE' } })
  }

  await sendWhatsAppMessage(conversation.customerPhone, message)

  const msg = await db.message.create({
    data: { conversationId, content: message, role: 'ADMIN', adminId: admin.id },
  })

  fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/emit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'message:new',
      data: { ...msg, adminName: admin.name },
    }),
  }).catch(() => {})

  return NextResponse.json({ ok: true, message: msg })
})

export const POST = handler
