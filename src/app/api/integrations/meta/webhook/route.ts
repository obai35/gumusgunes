import { NextRequest, NextResponse } from 'next/server'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || ''

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge)
  }
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    for (const entry of body.entry || []) {
      // Messenger messages
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id
        const messageText = event.message?.text
        if (!senderId || !messageText) continue

        const { db } = await import('@/lib/db')
        const { publish } = await import('@/lib/chat-sse')

        let conversation = await db.conversation.findFirst({
          where: { customerPhone: senderId, source: 'messenger' },
        })

        const isNew = !conversation || conversation.status === 'CLOSED'

        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              customerName: `Messenger ${senderId.slice(-4)}`,
              customerPhone: senderId,
              source: 'messenger',
              status: 'WAITING',
            },
          })
        } else if (conversation.status === 'CLOSED') {
          conversation = await db.conversation.update({
            where: { id: conversation.id },
            data: { status: 'WAITING' },
          })
        }

        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            content: messageText,
            role: 'CUSTOMER',
          },
        })

        publish(conversation.id, { type: 'message:new', message, conversationId: conversation.id })

        if (isNew) {
          const { sendPushToAdmins } = await import('@/lib/push-notifications')
          sendPushToAdmins({
            title: 'New Messenger Message',
            body: `Messenger ${senderId.slice(-4)} sent a message`,
            data: { conversationId: conversation.id },
          })
        }
      }

      // Instagram DM messages
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue
        const value = change.value
        const senderId = value.from?.id
        const messageText = value.message?.text
        if (!senderId || !messageText) continue

        const { db } = await import('@/lib/db')
        const { publish } = await import('@/lib/chat-sse')

        let conversation = await db.conversation.findFirst({
          where: { customerPhone: senderId, source: 'instagram' },
        })

        const isNew = !conversation || conversation.status === 'CLOSED'

        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              customerName: `Instagram ${senderId.slice(-4)}`,
              customerPhone: senderId,
              source: 'instagram',
              status: 'WAITING',
            },
          })
        } else if (conversation.status === 'CLOSED') {
          conversation = await db.conversation.update({
            where: { id: conversation.id },
            data: { status: 'WAITING' },
          })
        }

        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            content: messageText,
            role: 'CUSTOMER',
          },
        })

        publish(conversation.id, { type: 'message:new', message, conversationId: conversation.id })

        if (isNew) {
          const { sendPushToAdmins } = await import('@/lib/push-notifications')
          sendPushToAdmins({
            title: 'New Instagram DM',
            body: `Instagram ${senderId.slice(-4)} sent a message`,
            data: { conversationId: conversation.id },
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Meta webhook error:', e)
    return NextResponse.json({ ok: true }) // Always return 200 to Meta
  }
}
