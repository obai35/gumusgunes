import { db } from './db'

type PushMessage = {
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushToAdmins(message: PushMessage, excludeAdminId?: string) {
  const tokens = await db.pushToken.findMany({
    where: excludeAdminId ? { adminId: { not: excludeAdminId } } : {},
    select: { token: true, platform: true },
  })

  if (tokens.length === 0) return

  const chunks: string[][] = []
  for (let i = 0; i < tokens.length; i += 100) {
    chunks.push(tokens.slice(i, i + 100).map(t => t.token))
  }

  const results = await Promise.allSettled(
    chunks.map(chunk =>
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map(token => ({
          to: token,
          title: message.title,
          body: message.body,
          data: message.data || {},
          sound: 'default',
          priority: 'high',
        }))),
      })
    )
  )

  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn('[Push] Failed to send chunk:', result.reason)
    }
  }
}
