import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || ''
const META_APP_SECRET = process.env.META_APP_SECRET || ''

async function verifyMetaSignature(req: NextRequest, rawBody: string): Promise<boolean> {
  if (!META_APP_SECRET) return true
  const signature = req.headers.get('x-hub-signature-256')
  if (!signature) return false
  const expected = 'sha256=' + createHash('sha256').update(META_APP_SECRET + rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

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
    const rawBody = await req.text()
    if (!(await verifyMetaSignature(req, rawBody))) {
      console.warn('[Meta Webhook] Invalid signature')
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
    }
    const body = JSON.parse(rawBody)
    const { storefrontDb } = await import('@/lib/storefront-db')
    const { storeId } = await storefrontDb(req)

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
              storeId,
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
            storeId,
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
              storeId,
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
            storeId,
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
