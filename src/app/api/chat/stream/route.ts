import { NextRequest } from 'next/server'
import { subscribe, unsubscribe } from '@/lib/chat-sse'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId')
  if (!conversationId) {
    return new Response('conversationId required', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      if (req.signal.aborted) {
        controller.close()
        return
      }

      const clientId = subscribe(conversationId, (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (e) {
          console.debug('SSE enqueue error:', e)
        }
      })

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'))
        } catch (e) {
          console.debug('SSE heartbeat error:', e)
          clearInterval(heartbeat)
        }
      }, 30000)

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe(conversationId, clientId)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
