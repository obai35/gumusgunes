import { NextRequest, NextResponse } from 'next/server'
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
    const body = await req.json()
    console.log('WhatsApp webhook received:', JSON.stringify(body).slice(0, 500))
    const parsed = parseWebhookBody(body)
    if (!parsed) return NextResponse.json({ ok: true })

    await handleIncomingMessage({
      from: parsed.from,
      text: parsed.text,
      name: parsed.name,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
