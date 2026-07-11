import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

type IncomingMessage = {
  from: string
  text: string
  name: string
}

function getFallbackResponse(message: string): string | null {
  const lower = message.toLowerCase()
  const responses: { keywords: string[]; response: string }[] = [
    { keywords: ['hello', 'hi', 'hey'], response: 'Welcome to Gümüş Güneş! How can I help you today?' },
    { keywords: ['shipping', 'delivery'], response: 'We offer free shipping on orders over E£250. Delivery takes 3–7 business days.' },
  ]
  for (const entry of responses) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.response
  }
  return null
}

function needsEscalation(aiReply: string | null): boolean {
  if (!aiReply) return true
  const lower = aiReply.toLowerCase()
  return lower.includes('/escalate') || lower.includes('i cannot answer') || lower.includes('i am not sure')
}

async function queryAiChatbot(message: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: `You are the Gümüş Güneş Concierge. Answer customer questions about jewelry, shipping, returns, etc. If you CANNOT answer a question, respond with "I am not sure about this. /escalate" so a human agent can help. Keep replies under 200 words.` },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

export async function handleIncomingMessage({ from, text, name }: IncomingMessage) {
  // Find or create conversation
  let conversation = await db.conversation.findFirst({
    where: { customerPhone: from, status: { not: 'CLOSED' } },
    orderBy: { createdAt: 'desc' },
  })

  if (!conversation) {
    conversation = await db.conversation.create({
      data: { customerName: name, customerPhone: from, status: 'ACTIVE' },
    })
  }

  // Save customer message
  await db.message.create({
    data: { conversationId: conversation.id, content: text, role: 'CUSTOMER' },
  })

  // Try AI chatbot first
  let aiReply = await queryAiChatbot(text)
  if (!aiReply) aiReply = getFallbackResponse(text)

  if (aiReply && !needsEscalation(aiReply)) {
    // Chatbot can answer
    await sendWhatsAppMessage(from, aiReply)
    await db.message.create({
      data: { conversationId: conversation.id, content: aiReply, role: 'BOT' },
    })
    return
  }

  // Escalate to human
  await db.conversation.update({
    where: { id: conversation.id },
    data: { status: 'WAITING' },
  })

  // Send waiting message to customer
  const waitingMsg = 'Thank you for your message. A member of our team will be with you shortly. We appreciate your patience.'
  await sendWhatsAppMessage(from, waitingMsg)
  await db.message.create({
    data: { conversationId: conversation.id, content: waitingMsg, role: 'BOT' },
  })

  // Notify admins via Socket.IO
  fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/emit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'conversation:waiting',
      data: { conversationId: conversation.id, customerName: name, customerPhone: from },
    }),
  }).catch(() => {})
}
