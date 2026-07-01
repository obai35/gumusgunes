import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const BRAND_PROMPT = `You are the Gümüş Güneş Concierge — warm, elegant, and deeply knowledgeable about our luxury stainless steel accessories (Gümüş Güneş means "Silver Sun").

Your personality:
- You speak like a trusted friend who happens to know everything about fine jewelry
- Be warm, natural, and conversational — like chatting with a close friend who works at an Istanbul atelier
- Use emojis naturally to add warmth ✨💍🌙 (don't overdo it, just sprinkle them in)
- Be excited about the products! Share genuine enthusiasm
- Keep replies concise but never robotic — vary your sentence length and rhythm
- Ask thoughtful follow-up questions naturally

Your role:
- Help customers choose the perfect piece (rings, necklaces, earrings, bracelets, pendants, sets)
- Advise on ring sizing (US sizes 5–10), care instructions, and gemstone meanings
- Share the brand story: handcrafted in Istanbul since 2019, premium stainless steel, sun/moon/star motifs
- If asked about order status, returns, or account info, gently direct them to concierge@gumusgunes.com or +90 212 000 00 00
- Never invent prices — if unsure, suggest browsing the collection

Brand facts:
- Founded 2019, atelier overlooking the Bosphorus, Istanbul
- All pieces are premium stainless steel (surgical-grade 316L), hand-finished
- Diamonds are conflict-free (SI clarity, H color); gemstones ethically sourced
- Free worldwide shipping over 250 EGP; 30-day returns
- Signature motif: a sun with radiating rays, often paired with a diamond

When recommending products, mention the piece name, what makes it special, AND add a personal touch ("This one is a personal favorite" or "Our clients absolutely love this piece"). End with a thoughtful question.

Language rules:
- The website language is {language}. You MUST respond in {language} — even if the customer writes in a different language, reply in {language}.
- If {language} is Arabic, use a warm, friendly tone in Arabic with natural expressions (إن شاء الله، الله وبركاته، etc.)
- If {language} is English, use natural, conversational English
- Never mix languages in a single response

Product navigation:
- Products are clickable: use format [Product Name](#product:product-slug). Always include this link when mentioning a product.
- If a customer asks to see a product, encourage them to click the link to view it
- For categories, use format [Category Name](#category:category-slug)`

type ChatMessage = { role: 'user' | 'assistant'; content: string }

interface ProductResult {
  name: string
  price: number
  slug: string
  material: string | null
  imageUrl: string
}

const FALLBACK_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['ring', 'size', 'measure', 'sizing'],
    response: 'For ring sizing, I recommend visiting a local jeweler to measure your finger, or ordering our free ring sizer. We use US sizes 5–10 (half sizes included). A 17mm diameter finger corresponds to approximately US size 7.5. Would you like me to help you find a ring from our collection?'
  },
  {
    keywords: ['care', 'clean', 'tarnish', 'maintenance', 'polish'],
    response: 'To keep your Gümüş Güneş jewelry radiant: store pieces separately in a soft pouch, avoid contact with perfumes and lotions, and gently polish with a soft cloth. All our pieces are premium stainless steel with anti-fingerprint coating for lasting shine. Do you have a specific piece you need care advice for?'
  },
  {
    keywords: ['shipping', 'delivery', 'ship', 'deliver', 'dispatch'],
    response: 'We offer free worldwide shipping on orders over 250 EGP. Standard shipping takes 3–7 business days; express is available for an additional fee. Each piece arrives in our signature gift box with a certificate of authenticity. All orders are fully insured and tracked.'
  },
  {
    keywords: ['return', 'refund', 'exchange', 'money back', 'cancel'],
    response: 'We offer a 30-day return policy on all pieces in their original condition. Simply contact our concierge team at concierge@gumusgunes.com and we will send you a prepaid return label. Refunds are processed within 5–7 business days of receipt.'
  },
  {
    keywords: ['warranty', 'guarantee', 'repair'],
    response: 'Every Gümüş Güneş piece is crafted with premium stainless steel for lasting durability. If you have any questions about your piece, please contact our concierge team at concierge@gumusgunes.com.'
  },
  {
    keywords: ['material', 'silver', 'sterling', '925', 'gold', 'platinum'],
    response: 'All Gümüş Güneş accessories are crafted from premium stainless steel — surgical-grade 316L alloy for strength and durability. Our diamonds are conflict-free (SI clarity, H color or better), and all gemstones are ethically sourced. Every piece is hand-finished in our Istanbul atelier.'
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening', 'good day'],
    response: 'Welcome to Gümüş Güneş! I am your personal concierge. How may I assist you today? You can ask me about our stainless steel accessories, ring sizing, care tips, or browse our latest collection. What brings you to our atelier?'
  },
  {
    keywords: ['price', 'cost', 'how much', 'pricing', 'expensive', 'cheap', 'budget', 'afford'],
    response: 'Our collection ranges from $89 for stainless steel stud earrings to $425 for sapphire and diamond rings. Most pieces fall between $120 and $315. We believe in accessible luxury — exceptional quality at honest prices. Is there a particular piece or category you are interested in?'
  },
  {
    keywords: ['gift', 'present', 'birthday', 'anniversary', 'surprise', 'occasion'],
    response: 'A Gümüş Güneş piece makes a wonderful gift! Our bestsellers include the Sunburst Pendant ($199), Celestial Charm Bracelet ($158), and the Matching Sun Design Jewelry Set ($410). Every order arrives in a beautiful gift box. We also offer complimentary gift messages. What occasion are you celebrating?'
  },
  {
    keywords: ['order status', 'where is my order', 'track order', 'order tracking', 'order update'],
    response: 'I would be happy to help you track your order! Please provide your order number and the email you used at checkout, and I will look it up for you right away.'
  },
  {
    keywords: ['necklace', 'pendant', 'chain'],
    response: 'Our necklace collection features pendants inspired by celestial motifs — sunbursts, crescent moons, and stars. Prices range from $89 to $350. Popular choices include the Sunburst Pendant ($199) and the Celestial Charm Necklace ($158). Are you looking for something daily-wear or a statement piece?'
  },
  {
    keywords: ['earring', 'stud', 'hoop', 'dangle'],
    response: 'Our earring collection includes studs, hoops, and dangle designs featuring stainless steel, diamonds, and gemstones. Prices range from $89 to $285. The Diamond Star Studs ($199) and Celestial Hoops ($158) are client favorites. Are you shopping for yourself or as a gift?'
  },
  {
    keywords: ['bracelet', 'bangle', 'charm'],
    response: 'Our bracelet collection ranges from delicate chain designs to bold cuffs. Prices start at $89 and go up to $315. The Celestial Charm Bracelet ($158) is a bestseller — it combines a steel chain with a sun charm. What style are you drawn to?'
  },
  {
    keywords: ['diamond', 'gemstone', 'sapphire', 'emerald', 'ruby'],
    response: 'We use conflict-free diamonds (SI clarity, H color or better) and ethically sourced gemstones including sapphires and emeralds. All stones are hand-selected by our gemologists in Istanbul. Would you like to explore our diamond or gemstone pieces?'
  },
  {
    keywords: ['contact', 'phone', 'email', 'call', 'reach', 'store', 'atelier'],
    response: 'You can reach our concierge team at concierge@gumusgunes.com or call +90 212 000 00 00. Our atelier is based in Istanbul, overlooking the Bosphorus. We would be delighted to hear from you. How else can I assist?'
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
    return `The ${productContext.name} is one of our signature pieces — crafted from ${productContext.material} and priced at E£${productContext.price.toFixed(2)}. It is hand-finished in our Istanbul atelier. Is there anything specific you would like to know about it?`
  }
  return 'Thank you for reaching out to Gümüş Güneş! I would be happy to help you with product recommendations, sizing advice, or any questions about our collection. Could you please tell me a bit more about what you are looking for?'
}

async function getProductCatalogue(): Promise<{ text: string; products: { name: string; slug: string; price: number; imageUrl: string; id: string }[] }> {
  try {
    const products = await db.product.findMany({ where: { isActive: true }, take: 8, select: { name: true, price: true, compareAtPrice: true, material: true, slug: true, imageUrl: true, id: true } })
    if (!products.length) return { text: '', products: [] }

    let s = 'Our catalogue:\n'
    for (const p of products) {
      s += `- [${p.name}](#product:${p.slug}) | ${p.material} | $${p.price.toFixed(2)}`
      if (p.compareAtPrice) s += ` (was $${p.compareAtPrice.toFixed(2)})`
      s += '\n'
    }
    return { text: s, products }
  } catch { return { text: '', products: [] } }
}

async function findMatchingProducts(query: string): Promise<{ name: string; slug: string; price: number; imageUrl: string; id: string }[]> {
  try {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    if (!words.length) return []
    const products = await db.product.findMany({
      where: { isActive: true, OR: words.map(w => ({ name: { contains: w } })) },
      take: 4,
      select: { name: true, slug: true, price: true, imageUrl: true, id: true },
    })
    return products
  } catch { return [] }
}

async function getSiteOverview(): Promise<string> {
  try {
    const cats = await db.category.findMany({ select: { name: true } })
    const low = await db.product.findFirst({ where: { isActive: true }, orderBy: { price: 'asc' }, select: { price: true } })
    const high = await db.product.findFirst({ where: { isActive: true }, orderBy: { price: 'desc' }, select: { price: true } })
    let s = `Categories: ${cats.map(c => c.name).join(', ')}\n`
    if (low && high) s += `Prices: $${low.price.toFixed(2)} – $${high.price.toFixed(2)}\n`
    return s
  } catch { return '' }
}

async function lookupOrder(orderNumber: string, email: string) {
  try {
    const order = await db.order.findFirst({
      where: { orderNumber, email: email.toLowerCase() },
      include: { items: { include: { product: { select: { name: true } } } } },
    })
    if (!order) return null
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(i => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.price,
      })),
    }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, history = [], productContext, locale = 'en' }: { message: string; history?: ChatMessage[]; productContext?: { name: string; price: number; material: string } | null; locale?: string } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message is required' }, { status: 400 })
    }

    const langName = locale === 'ar' ? 'Arabic' : 'English'
    const lower = message.toLowerCase()

    const orderMatch = lower.match(/(?:order|track)\s*(?:number\s*)?[:\s]*([a-z0-9]+[-\s][a-z0-9]+[-\s][a-z0-9]+)/i)
    const emailMatch = lower.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)

    let reply: string | null = null
    let matchedProducts: { name: string; slug: string; price: number; imageUrl: string; id: string }[] = []

    if (orderMatch && emailMatch) {
      const orderNumber = orderMatch[1].replace(/\s+/g, '')
      const email = emailMatch[0]
      const orderResult = await lookupOrder(orderNumber, email)
      if (orderResult) {
        reply = `I found your order **${orderResult.orderNumber}**! Here are the details:\n\n📦 **Status:** ${orderResult.status}\n💳 **Payment:** ${orderResult.paymentStatus}\n💰 **Total:** $${orderResult.totalAmount.toFixed(2)}\n📅 **Placed:** ${new Date(orderResult.createdAt).toLocaleDateString()}\n\n**Items:**\n${orderResult.items.map(i => `- ${i.name} × ${i.quantity} ($${(i.price * i.quantity).toFixed(2)})`).join('\n')}\n\nIs there anything else I can help you with?`
      } else {
        reply = 'I could not find an order matching that number and email. Please double-check your order number and email, or contact our concierge team at concierge@gumusgunes.com for assistance.'
      }
    }

    if (!reply) {
      try {
        const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY
        if (apiKey) {
          const baseURL = 'https://api.groq.com/openai/v1'
          const model = 'llama-3.3-70b-versatile'

          let systemContent = BRAND_PROMPT.replace(/\{language\}/g, langName)

          const siteOverview = await getSiteOverview()
          if (siteOverview) systemContent += `\n\n## Store Info\n${siteOverview}`

          const { text: catalogueText, products: catalogueProducts } = await getProductCatalogue()
          if (catalogueText) {
            systemContent += `\n\n## Products\n${catalogueText}`
            systemContent += `\nUse the product data above. Never make up prices. Products are clickable links — use the markdown format [Product Name](/products/slug) whenever you mention a product.`
          }

          matchedProducts = await findMatchingProducts(message)
          if (matchedProducts.length > 0) {
            systemContent += `\n\nRelevant products for "${message}":\n`
            for (const p of matchedProducts) {
              systemContent += `- [${p.name}](#product:${p.slug})\n`
            }
            systemContent += `If the customer wants to see any of these, encourage them to click the link.`
          }

          if (productContext) {
            systemContent += `\n\nThe customer is currently viewing: "${productContext.name}" — ${productContext.material}, priced at E£${productContext.price.toFixed(2)}. Tailor advice to this piece when relevant.`
          }
          const messages = [
            { role: 'system', content: systemContent },
            ...history.slice(-8),
            { role: 'user', content: message },
          ]
          const aiRes = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, messages, max_tokens: 350, temperature: 0.85 }),
          })
          if (aiRes.ok) {
            const data = await aiRes.json()
            reply = data.choices?.[0]?.message?.content || null
          } else {
            const errText = await aiRes.text()
            console.error(`AI API error (${aiRes.status}): ${errText}`)
            reply = null
          }
        } else {
          reply = null
        }
      } catch (e) {
        console.error('AI API error, falling back:', e)
        reply = null
      }
    }

    if (!reply) {
      reply = getFallbackResponse(message, productContext)
    }

    return NextResponse.json({ ok: true, reply, products: matchedProducts })
  } catch (err) {
    console.error('POST /api/chat error:', err)
    return NextResponse.json(
      { ok: false, error: 'Chat failed' },
      { status: 500 }
    )
  }
}

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
      select: { name: true, price: true, slug: true, material: true, imageUrl: true },
    })
    return NextResponse.json({ ok: true, products })
  } catch {
    return NextResponse.json({ ok: true, products: [] })
  }
}
