import { randomUUID } from 'crypto'

type PendingAction = {
  index: number
  tool: string
  description: string
  args: Record<string, any>
}

type Session = {
  id: string
  history: any[]
  pendingActions: PendingAction[]
  createdAt: number
  lastActivity: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL = 30 * 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TTL) sessions.delete(id)
  }
}, 60_000)

export function getOrCreateSession(sessionId?: string): Session {
  if (sessionId && sessions.has(sessionId)) {
    const s = sessions.get(sessionId)!
    s.lastActivity = Date.now()
    return s
  }
  const session: Session = {
    id: randomUUID(),
    history: [],
    pendingActions: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
  }
  sessions.set(session.id, session)
  return session
}

export function clearPendingActions(sessionId: string) {
  const s = sessions.get(sessionId)
  if (s) s.pendingActions = []
}

export type { PendingAction, Session }
