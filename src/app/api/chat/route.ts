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

const FALLBACK_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['ring', 'size', 'measure'],
    response: 'For ring sizing, I recommend visiting a local jeweler to measure your finger, or ordering our free ring sizer. We use US sizes 5–10 (half sizes included). A 17mm diameter finger corresponds to approximately US size 7.5. Would you like me to help you find a ring from our collection?'
  },
  {
    keywords: ['care', 'clean', 'tarnish', 'maintenance'],
    response: 'To keep your Gümüş Güneş jewelry radiant: store pieces separately in a soft pouch, avoid contact with perfumes and lotions, and gently polish with a silver cloth. All our pieces are 925 sterling silver with anti-tarnish treatment for lasting shine. Do you have a specific piece you need care advice for?'
  },
  {
    keywords: ['shipping', 'delivery', 'ship', 'deliver'],
    response: 'We offer free worldwide shipping on orders over $250. Standard shipping takes 3–7 business days; express is available for an additional fee. Each piece arrives in our signature gift box with a certificate of authenticity. All orders are fully insured and tracked.'
  },
  {
    keywords: ['return', 'refund', 'exchange', 'money back'],
    response: 'We offer a 30-day return policy on all pieces in their original condition. Simply contact our concierge team at concierge@gumusgunes.com and we will send you a prepaid return label. Refunds are processed within 5–7 business days of receipt.'
  },
  {
    keywords: ['warranty', 'guarantee', 'lifetime'],
    response: 'Every Gümüş Güneş piece comes with our lifetime warranty covering manufacturing defects. We also offer free polishing and inspection for life — just visit us or mail your piece to our Istanbul atelier. Our warranty is our promise of enduring quality.'
  },
  {
    keywords: ['material', 'silver', 'sterling', '925'],
    response: 'All Gümüş Güneş jewelry is crafted from 925 sterling silver — 92.5% pure silver alloyed with 7.5% copper for strength and durability. Our diamonds are conflict-free (SI clarity, H color or better), and all gemstones are ethically sourced. Every piece is hand-finished in our Istanbul atelier.'
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening'],
    response: 'Welcome to Gümüş Güneş! I am your personal concierge. How may I assist you today? You can ask me about our silver jewelry, ring sizing, care tips, or browse our latest collection. What brings you to our atelier?'
  },
  {
    keywords: ['price', 'cost', 'how much', 'pricing', 'expensive', 'cheap'],
    response: 'Our collection ranges from $89 for sterling silver stud earrings to $425 for sapphire and diamond rings. Most pieces fall between $120 and $315. We believe in accessible luxury — exceptional quality at honest prices. Is there a particular piece or category you are interested in?'
  },
  {
    keywords: ['gift', 'present', 'birthday', 'anniversary'],
    response: 'A Gümüş Güneş piece makes a wonderful gift! Our bestsellers include the Sunburst Pendant ($199), Celestial Charm Bracelet ($158), and the Matching Sun Design Jewelry Set ($410). Every order arrives in a beautiful gift box. We also offer complimentary gift messages. What occasion are you celebrating?'
  },
]

function getFallbackResponse(message: string, productContext?: { name: string; price: number; material: string } | null): string {
  const lower = message.toLowerCase()
  for (const entry of FALLBACK_RESPONSES) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      let reply = entry.response
      if (productContext) {
        reply = `Regarding the ${productContext.name} (${productContext.material}) — ` + reply.charAt(0).toLowerCase() + reply.slice(1)
      }
      return reply
    }
  }
  if (productContext) {
    return `The ${productContext.name} is one of our signature pieces — crafted from ${productContext.material} and priced at $${productContext.price.toFixed(2)}. It is hand-finished in our Istanbul atelier. Is there anything specific you would like to know about it?`
  }
  return 'Thank you for reaching out to Gümüş Güneş! I would be happy to help you with product recommendations, sizing advice, or any questions about our collection. Could you please tell me a bit more about what you are looking for?'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, history = [], productContext }: { message: string; history?: ChatMessage[]; productContext?: { name: string; price: number; material: string } | null } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message is required' }, { status: 400 })
    }

    let reply: string | null = null

    try {
      const zai = await ZAI.create()
      let systemContent = SYSTEM_PROMPT
      if (productContext) {
        systemContent += `\n\nThe customer is currently viewing: "${productContext.name}" — ${productContext.material}, priced at $${productContext.price.toFixed(2)}. Tailor advice to this piece when relevant.`
      }
      const messages: ChatMessage[] = [
        { role: 'assistant', content: systemContent },
        ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ]
      const completion = await zai.chat.completions.create({ messages, thinking: { type: 'disabled' } })
      reply = completion.choices[0]?.message?.content
    } catch {
      reply = getFallbackResponse(message, productContext)
    }

    if (!reply) {
      reply = getFallbackResponse(message, productContext)
    }

    return NextResponse.json({ ok: true, reply })
  } catch (err) {
    console.error('POST /api/chat error:', err)
    return NextResponse.json(
      { ok: false, error: 'Chat failed' },
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
