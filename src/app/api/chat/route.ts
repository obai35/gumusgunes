import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

const SYSTEM_PROMPT = `You are the Gümüş Güneş Concierge — an elegant, knowledgeable assistant for a luxury Turkish sterling silver jewelry brand (Gümüş Güneş means "Silver Sun").

Your role:
- Help customers choose the perfect piece (rings, necklaces, earrings, bracelets, pendants, sets).
- Advise on ring sizing (we use US sizes 5–10), silver care, and gemstone meanings.
- Share the brand story: handcrafted in Istanbul, 925 sterling silver, sun/moon/star motifs, lifetime warranty.
- Be warm, refined, and concise. Use a tone that feels personal — like a trusted advisor in a fine jewelry atelier.
- Keep replies under 120 words unless the customer asks for detail.
- If asked about order status, returns, or specific account info, gently direct them to concierge@gumusgunes.com or +90 212 000 00 00.
- Never invent prices. If unsure of a price, suggest the customer browse the collection or ask about a specific piece by name.

Brand facts you can share:
- Founded 2019, atelier overlooking the Bosphorus, Istanbul.
- All pieces are 925 sterling silver, hand-finished.
- Diamonds are conflict-free; gemstones ethically sourced.
- Free worldwide shipping over $250; 30-day returns; lifetime warranty.
- Signature motif: a sun with radiating rays, often paired with a diamond.

When recommending products, mention the piece name and what makes it special. End with a thoughtful question when natural.`

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, history = [], productContext }: { message: string; history?: ChatMessage[]; productContext?: { name: string; price: number; material: string } | null } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    // Build context-aware system message
    let systemContent = SYSTEM_PROMPT
    if (productContext) {
      systemContent += `\n\nThe customer is currently viewing: "${productContext.name}" — ${productContext.material}, priced at $${productContext.price.toFixed(2)}. Tailor advice to this piece when relevant.`
    }

    const messages: ChatMessage[] = [
      { role: 'assistant', content: systemContent },
      ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const reply = completion.choices[0]?.message?.content

    if (!reply) {
      return NextResponse.json({ ok: false, error: 'No response generated' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, reply })
  } catch (err) {
    console.error('POST /api/chat error:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Chat failed' },
      { status: 500 }
    )
  }
}

// Optional: quick product-aware suggestions endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || 'jewelry'
    const products = await db.product.findMany({
      where: { isActive: true, OR: [
        { name: { contains: q } },
        { tags: { contains: q } },
      ] },
      take: 3,
      select: { name: true, price: true, slug: true },
    })
    return NextResponse.json({ ok: true, products })
  } catch {
    return NextResponse.json({ ok: true, products: [] })
  }
}
