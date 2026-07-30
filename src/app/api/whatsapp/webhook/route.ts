import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { verifyWebhook, parseWebhookBody } from '@/lib/whatsapp'
import { handleIncomingMessage } from '@/lib/chat-escalation'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const { status, body } = verifyWebhook(
    searchParams.get('hub.mode'),
    searchParams.get('hub.verify_token'),
    searchParams.get('hub.challenge')
  )
  return new NextResponse(body, { status })
}

export async function POST(req: NextRequest) {
  try {
    const appSecret = process.env.WHATSAPP_APP_SECRET
    if (appSecret) {
      const signature = req.headers.get('x-hub-signature-256')
      if (!signature) {
        console.warn('[WhatsApp] Missing signature header')
        return NextResponse.json({ ok: true })
      }
      const rawBody = await req.text()
      const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
      const actual = signature
      try {
        const expectedBuf = Buffer.from(expected)
        const actualBuf = Buffer.from(actual)
        if (!timingSafeEqual(expectedBuf, actualBuf)) {
          console.warn('[WhatsApp] Invalid webhook signature')
          return NextResponse.json({ ok: true })
        }
      } catch {
        console.warn('[WhatsApp] Signature comparison failed')
        return NextResponse.json({ ok: true })
      }
      const body = JSON.parse(rawBody)
      const parsed = parseWebhookBody(body)
      if (!parsed) return NextResponse.json({ ok: true })

      const storeId = req.nextUrl.searchParams.get('storeId') || process.env.STORE_ID || ''
      await handleIncomingMessage({
        from: parsed.from,
        text: parsed.text,
        name: parsed.name,
        storeId,
      })
    } else {
      const body = await req.json()
      console.log('WhatsApp webhook received:', JSON.stringify(body).slice(0, 500))
      const parsed = parseWebhookBody(body)
      if (!parsed) return NextResponse.json({ ok: true })

      const storeId = req.nextUrl.searchParams.get('storeId') || process.env.STORE_ID || ''
      await handleIncomingMessage({
        from: parsed.from,
        text: parsed.text,
        name: parsed.name,
        storeId,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
