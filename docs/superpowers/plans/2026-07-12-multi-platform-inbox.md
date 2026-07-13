# Multi-Platform Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Messenger and Instagram DM to the admin mobile app alongside WhatsApp and Website chat, with platform filter tabs and per-platform reply routing.

**Architecture:** Meta webhook receives Messenger + Instagram DM messages, creates Conversations with `source` field. Unified send endpoint routes replies to correct platform API. Mobile app adds platform filter pills and source icons.

**Tech Stack:** Meta Graph API v22.0, Next.js API routes, react-native (mobile)

---

### Task 1: Add Messenger & Instagram Send Methods to MetaClient

**Files:**
- Modify: `src/lib/social/meta.ts`

- [ ] **Step 1: Add sendMessengerMessage and sendInstagramMessage to MetaClient**

Read the existing `src/lib/social/meta.ts` file first, then add these two methods inside the class (before the closing brace):

```ts
  async sendMessengerMessage(psid: string, text: string): Promise<void> {
    await this.fetch(`/me/messages`, {
      method: 'POST',
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text },
      }),
    })
  }

  async sendInstagramMessage(igUserId: string, text: string): Promise<void> {
    await this.fetch(`/${igUserId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        recipient: { id: igUserId },
        message: { text },
      }),
    })
  }
```

The existing `fetch` method in MetaClient already prepends the base URL `https://graph.facebook.com/v22.0` and appends the access token, so these calls will work with just the path.

---

### Task 2: Create Meta Webhook Endpoint

**Files:**
- Create: `src/app/api/integrations/meta/webhook/route.ts`

- [ ] **Step 1: Create the webhook route**

```ts
import { NextRequest, NextResponse } from 'next/server'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || ''

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge)
  }
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    for (const entry of body.entry || []) {
      // Messenger messages
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id
        const messageText = event.message?.text
        if (!senderId || !messageText) continue

        const { db } = await import('@/lib/prisma')
        const { publish } = await import('@/lib/chat-sse')

        let conversation = await db.conversation.findFirst({
          where: { customerPhone: senderId, source: 'messenger' },
        })

        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              customerName: `Messenger ${senderId.slice(-4)}`,
              customerPhone: senderId,
              source: 'messenger',
              status: 'WAITING',
            },
          })
        } else if (conversation.status === 'CLOSED') {
          conversation = await db.conversation.update({
            where: { id: conversation.id },
            data: { status: 'WAITING' },
          })
        }

        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            content: messageText,
            role: 'CUSTOMER',
          },
        })

        publish(conversation.id, { type: 'message:new', message, conversationId: conversation.id })
      }

      // Instagram DM messages
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue
        const value = change.value
        const senderId = value.from?.id
        const messageText = value.message?.text
        if (!senderId || !messageText) continue

        const { db } = await import('@/lib/prisma')
        const { publish } = await import('@/lib/chat-sse')

        let conversation = await db.conversation.findFirst({
          where: { customerPhone: senderId, source: 'instagram' },
        })

        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              customerName: `Instagram ${senderId.slice(-4)}`,
              customerPhone: senderId,
              source: 'instagram',
              status: 'WAITING',
            },
          })
        } else if (conversation.status === 'CLOSED') {
          conversation = await db.conversation.update({
            where: { id: conversation.id },
            data: { status: 'WAITING' },
          })
        }

        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            content: messageText,
            role: 'CUSTOMER',
          },
        })

        publish(conversation.id, { type: 'message:new', message, conversationId: conversation.id })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Meta webhook error:', e)
    return NextResponse.json({ ok: true }) // Always return 200 to Meta
  }
}
```

Note: The webhook always returns 200 to Meta even on error, otherwise Meta retries and floods the endpoint.

---

### Task 3: Create Unified Send Endpoint

**Files:**
- Create: `src/app/api/messages/send/route.ts`

- [ ] **Step 1: Create the unified send route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/prisma'
import { publish } from '@/lib/chat-sse'

export const POST = withAdmin(async (req: NextRequest, admin: any) => {
  try {
    const { conversationId, message } = await req.json()
    if (!conversationId || !message) {
      return NextResponse.json({ error: 'conversationId and message required' }, { status: 400 })
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { assignedAdmin: true },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Auto-assign if unassigned
    if (!conversation.assignedTo) {
      await db.conversation.update({
        where: { id: conversationId },
        data: { assignedTo: admin.id, status: 'ACTIVE' },
      })
    } else if (conversation.status === 'WAITING') {
      await db.conversation.update({
        where: { id: conversationId },
        data: { status: 'ACTIVE' },
      })
    }

    // Save message to DB
    const saved = await db.message.create({
      data: {
        conversationId,
        content: message,
        role: 'ADMIN',
        adminId: admin.id,
      },
    })

    // Route to correct platform
    switch (conversation.source) {
      case 'website':
        publish(conversationId, { type: 'message:new', message: saved, conversationId })
        break

      case 'whatsapp': {
        const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
        await sendWhatsAppMessage(conversation.customerPhone!, message)
        break
      }

      case 'messenger': {
        const { MetaClient } = await import('@/lib/social/meta')
        const token = process.env.META_PAGE_ACCESS_TOKEN
        if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured')
        const client = new MetaClient(token)
        await client.sendMessengerMessage(conversation.customerPhone!, message)
        break
      }

      case 'instagram': {
        const { MetaClient } = await import('@/lib/social/meta')
        const token = process.env.META_PAGE_ACCESS_TOKEN
        if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured')
        const client = new MetaClient(token)
        await client.sendInstagramMessage(conversation.customerPhone!, message)
        break
      }

      default:
        return NextResponse.json({ error: `Unknown source: ${conversation.source}` }, { status: 400 })
    }

    // Emit socket event
    const socketRes = await fetch('http://localhost:3001/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'message:new',
        data: { ...saved, conversationId },
      }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, message: saved })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 })
  }
})
```

- [ ] **Step 2: Create src/lib/whatsapp.ts barrel export if it doesn't exist**

Read `src/lib/whatsapp.ts` to check if `sendWhatsAppMessage` is already exported. If the file doesn't exist or the function isn't exported, create/add the export. The existing WhatsApp send endpoint has the send logic — we just need the function to be importable.

---

### Task 4: Add Source Filter to Conversations API

**Files:**
- Modify: `src/app/api/admin/conversations/route.ts`

- [ ] **Step 1: Add source query param support**

Read the existing file, then add `source` to the query params:

```ts
const source = searchParams.get('source')
if (source && source !== 'all') where.source = source
```

Add it right after the existing `status` filter:
```ts
const { searchParams } = new URL(req.url)
const status = searchParams.get('status') || undefined
const source = searchParams.get('source') || undefined

const where: any = {}
if (status) where.status = status
if (source && source !== 'all') where.source = source
```

---

### Task 5: Update Mobile api.ts

**Files:**
- Modify: `apps/admin-mobile/src/api.ts`

- [ ] **Step 1: Update getConversations to accept source param**

Read the existing file, then change the `getConversations` method:

```ts
  getConversations: (status?: string, source?: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (source && source !== 'all') params.set('source', source)
    const qs = params.toString()
    return request(`/api/admin/conversations${qs ? `?${qs}` : ''}`)
  },
```

- [ ] **Step 2: Update sendMessage to use unified endpoint**

Change the `sendMessage` method:
```ts
  sendMessage: (conversationId: string, message: string) =>
    request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message }),
    }),
```

---

### Task 6: Add Platform Tabs & Source Icons to Mobile ConversationsScreen

**Files:**
- Modify: `apps/admin-mobile/src/screens/ConversationsScreen.tsx`

- [ ] **Step 1: Add platform state and icons**

Read the existing file first, then make these changes:

Add a `source` state (default `'all'`):
```ts
const [source, setSource] = useState<'all' | 'whatsapp' | 'messenger' | 'instagram' | 'website'>('all')
```

Update the `load` function to pass `source`:
```ts
const data = await api.getConversations(filter || undefined, source)
```

Add `source` to the `useCallback` dependency:
```ts
const load = useCallback(async () => {
  ...
}, [filter, source])
```

Add source filter pills above the status filters:
```tsx
<View style={styles.filters}>
  <SourceButton label="All" value="all" />
  <SourceButton label="📱 WhatsApp" value="whatsapp" />
  <SourceButton label="💬 Messenger" value="messenger" />
  <SourceButton label="📷 Instagram" value="instagram" />
  <SourceButton label="🌐 Website" value="website" />
</View>
```

Add the SourceButton component inside the component (uses closure over source/setSource):
```tsx
const SourceButton = ({ label, value }: { label: string; value: typeof source }) => {
  const active = source === value
  const activeBg = value === 'whatsapp' ? '#25D366' : value === 'messenger' ? '#0084FF' : value === 'instagram' ? '#E4405F' : value === 'website' ? colors.gold : colors.gold
  return (
    <TouchableOpacity
      style={[styles.filterBtn, active && { backgroundColor: activeBg }]}
      onPress={() => setSource(value === source ? 'all' : value)}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}
```

Add source emoji to each conversation card. In the renderItem, add a small source label before the Avatar:

```tsx
const sourceEmoji: Record<string, string> = {
  whatsapp: '📱',
  messenger: '💬',
  instagram: '📷',
  website: '🌐',
}

// In renderItem, before Avatar:
<Text style={styles.sourceIcon}>{sourceEmoji[item.source] || '💬'}</Text>
<Avatar name={item.customerName || '?'} size={44} />
```

Add the sourceIcon style:
```ts
sourceIcon: { fontSize: 18, marginRight: 8 },
```

- [ ] **Step 2: Update load to include source in deps**

Make sure the `useEffect` dependencies include the updated `load` (it will, since `source` is now a dep of `load`).

---

### Task 7: Add Platform Info to ChatScreen

**Files:**
- Modify: `apps/admin-mobile/src/screens/ChatScreen.tsx`

- [ ] **Step 1: Show platform icon in the info bar**

Read the existing file. In the info bar, add a platform icon before the Avatar:

```tsx
const sourceEmoji: Record<string, string> = {
  whatsapp: '📱',
  messenger: '💬',
  instagram: '📷',
  website: '🌐',
}

// In the infoBar, before Avatar:
<Text style={{ fontSize: 22, marginRight: 8 }}>{sourceEmoji[conversation.source] || '💬'}</Text>
<Avatar name={conversation.customerName || '?'} size={36} />
```

Add this near the top of the component (before the return statement):
```tsx
const sourceEmoji: Record<string, string> = {
  whatsapp: '📱',
  messenger: '💬',
  instagram: '📷',
  website: '🌐',
}
```

---

## Self-Review

**Spec coverage check:**
- ✅ MetaClient: sendMessengerMessage + sendInstagramMessage → Task 1
- ✅ Meta webhook endpoint (GET verify + POST events) → Task 2
- ✅ Unified send endpoint with per-platform routing → Task 3
- ✅ Conversations API source filter → Task 4
- ✅ Mobile api.ts updates (source param, unified send) → Task 5
- ✅ Platform filter tabs in ConversationsScreen → Task 6
- ✅ Source icons in conversation cards → Task 6
- ✅ Platform info in ChatScreen info bar → Task 7

**No placeholders** — all steps have complete code.

**Type consistency** — method signatures, API params, and component props match across all tasks.
