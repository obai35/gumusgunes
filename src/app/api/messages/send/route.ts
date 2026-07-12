import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { publish } from '@/lib/chat-sse'

export const POST = withAdmin(async (req: NextRequest, admin: any) => {
  try {
    const { conversationId, message } = await req.json()
    if (!conversationId || !message) {
      return NextResponse.json({ error: 'conversationId and message required' }, { status: 400 })
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { assignedAdmin: true },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Auto-assign if unassigned
    if (!conversation.assignedTo) {
      await db.conversation.update({
        where: { id: conversationId },
        data: { assignedTo: admin.id, status: 'ACTIVE' },
      })
    } else if (conversation.status === 'WAITING') {
      await db.conversation.update({
        where: { id: conversationId },
        data: { status: 'ACTIVE' },
      })
    }

    // Save message to DB
    const saved = await db.message.create({
      data: {
        conversationId,
        content: message,
        role: 'ADMIN',
        adminId: admin.id,
      },
    })

    // Route to correct platform
    switch (conversation.source) {
      case 'website':
        publish(conversationId, { type: 'message:new', message: saved, conversationId })
        break

      case 'whatsapp': {
        const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
        await sendWhatsAppMessage(conversation.customerPhone!, message)
        break
      }

      case 'messenger': {
        const { MetaClient } = await import('@/lib/social/meta')
        const token = process.env.META_PAGE_ACCESS_TOKEN
        if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured')
        const client = new MetaClient(token)
        await client.sendMessengerMessage(conversation.customerPhone!, message)
        break
      }

      case 'instagram': {
        const { MetaClient } = await import('@/lib/social/meta')
        const token = process.env.META_PAGE_ACCESS_TOKEN
        if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured')
        const client = new MetaClient(token)
        await client.sendInstagramMessage(conversation.customerPhone!, message)
        break
      }

      default:
        return NextResponse.json({ error: `Unknown source: ${conversation.source}` }, { status: 400 })
    }

    // Emit socket event
    const socketUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:3001'
    fetch(`${socketUrl}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'message:new',
        data: { ...saved, conversationId },
      }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, message: saved })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 })
  }
})
