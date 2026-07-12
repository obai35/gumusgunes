type SSECallback = (data: object) => void

const clients = new Map<string, Map<string, SSECallback>>()

export function subscribe(conversationId: string, callback: SSECallback): string {
  const clientId = crypto.randomUUID()
  if (!clients.has(conversationId)) clients.set(conversationId, new Map())
  clients.get(conversationId)!.set(clientId, callback)
  return clientId
}

export function unsubscribe(conversationId: string, clientId: string) {
  const clientMap = clients.get(conversationId)
  if (!clientMap) return
  clientMap.delete(clientId)
  if (clientMap.size === 0) clients.delete(conversationId)
}

export function publish(conversationId: string, data: object) {
  const clientMap = clients.get(conversationId)
  if (!clientMap) return
  for (const cb of clientMap.values()) {
    cb(data)
  }
}

export function getActiveConversations(): number {
  return clients.size
}
