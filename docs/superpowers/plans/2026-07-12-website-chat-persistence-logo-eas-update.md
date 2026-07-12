# Website Chat Persistence, Logo, EAS Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist website chat conversations to DB with real-time admin replies via SSE, add store logo to app, and set up EAS Update with manual update button.

**Architecture:** Add SSE client management module, streaming endpoint, and persistence layer around existing AI chat. Logo generated from existing `public/gumusgunes-logo.jpeg`. `expo-updates` installed with manual check button.

**Tech Stack:** Next.js App Router, Prisma, Server-Sent Events, Expo, `expo-updates`

---

### Task 1: Create SSE client management module

**Files:**
- Create: `src/lib/chat-sse.ts`

- [ ] **Step 1: Create `src/lib/chat-sse.ts`**

In-memory store mapping conversationId → Set of SSE controller callbacks. Each callback accepts a JSON object and writes it as an SSE event.

```typescript
type SSECallback = (data: object) => void

const clients = new Map<string, Map<string, SSECallback>>()

export function subscribe(conversationId: string): { clientId: string; sendEvent: SSECallback } {
  const clientId = crypto.randomUUID()
  if (!clients.has(conversationId)) clients.set(conversationId, new Map())

  const sendEvent: SSECallback = (data: object) => {
    const clientMap = clients.get(conversationId)
    if (!clientMap) return
    for (const cb of clientMap.values()) {
      cb(data)
    }
  }

  clients.get(conversationId)!.set(clientId, sendEvent)
  return { clientId, sendEvent }
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/chat-sse.ts
git commit -m "feat: add SSE client management module for website chat"
```

---

### Task 2: Create SSE streaming endpoint

**Files:**
- Create: `src/app/api/chat/stream/route.ts`

- [ ] **Step 1: Create `src/app/api/chat/stream/route.ts`**

Next.js App Router GET handler that returns a `text/event-stream` Response. Uses `subscribe` from the SSE module to register for a given conversationId. Sends heartbeat every 30s to keep connection alive.

```typescript
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
      const { clientId, sendEvent } = subscribe(conversationId)

      const eventCallback: typeof sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'))
        } catch {
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/stream/route.ts
git commit -m "feat: add SSE streaming endpoint for website chat live updates"
```

---

### Task 3: Persist website chat conversations

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Modify `POST /api/chat` to find/create Conversation and save Messages**

Changes to the existing handler:
1. After parsing the request, find an existing non-CLOSED conversation by `conversationId` (if provided), or create a new `Conversation` with `source: "website"`, `status: "ACTIVE"`, `customerName: "Website Visitor"`
2. Save the customer's message as `Message { role: CUSTOMER, conversationId }`
3. Run the existing AI chatbot logic (unchanged)
4. If AI responds, save as `Message { role: BOT, content: reply }`
5. If AI escalates (reply contains apology/escalation), update status to `WAITING` and emit `conversation:waiting` socket event
6. Return the reply with `conversationId`

Add at the top (after existing imports):

```typescript
import { publish } from '@/lib/chat-sse'
```

After `const { message, conversationId } = parsed.data` and the rest of the parsing block (around line 213), add persistence:

```typescript
let convId = conversationId || null
let newConversation = false

// Find or create conversation
if (!convId) {
  const conv = await db.conversation.create({
    data: { source: 'website', status: 'ACTIVE', customerName: 'Website Visitor' },
  })
  convId = conv.id
  newConversation = true
}

const conversation = await db.conversation.findUnique({ where: { id: convId } })
if (!conversation) {
  return NextResponse.json({ ok: false, error: 'Conversation not found' }, { status: 404 })
}

// Save customer message
await db.message.create({
  data: { conversationId: convId, content: message, role: 'CUSTOMER' },
})
```

After the AI reply is generated (after `reply` variable is set, before the return at line 298), add:

```typescript
// Save bot reply if present
if (reply) {
  await db.message.create({
    data: { conversationId: convId, content: reply, role: 'BOT' },
  })
}

// Check if escalation needed
const escalationKeywords = ['/escalate', 'i cannot answer', 'i am not sure',
  'i\'m having trouble responding', 'please email concierge']
const needsEscalation = reply && escalationKeywords.some(k => reply.toLowerCase().includes(k))

if (needsEscalation && conversation.status !== 'WAITING') {
  await db.conversation.update({
    where: { id: convId },
    data: { status: 'WAITING' },
  })

  // Emit socket event for admin app
  fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/emit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'conversation:waiting',
      data: { conversationId: convId, customerName: 'Website Visitor', customerPhone: null },
    }),
  }).catch(() => {})
}
```

Update the return to include `conversationId`:

```typescript
return NextResponse.json({
  ok: true,
  reply,
  products: matchedProducts,
  conversationId: convId,
  escalated: needsEscalation || undefined,
})
```

Wait, at this point in the code, `needsEscalation` is defined inside the if block. Let me restructure: declare `let needsEscalation = false` before the AI logic, then set it inside the block.

Actually, let me look at the code flow more carefully. The reply is determined through a series of conditions (order lookup, AI, fallback). I need to add the persistence and escalation check after ALL reply logic is done, right before the return.

Here's the exact change: after the line `if (!reply) { reply = getFallbackResponse(message, productContext) }` (around line 294-296) and before `return NextResponse.json(...)` (line 298):

Add persistence code:

```typescript
// === PERSISTENCE ===
let convId = conversationId || null
if (!convId) {
  const conv = await db.conversation.create({
    data: { source: 'website', status: 'ACTIVE', customerName: 'Website Visitor' },
  })
  convId = conv.id
}
const conversation = await db.conversation.findUnique({ where: { id: convId } })
if (conversation) {
  await db.message.create({
    data: { conversationId: convId, content: message, role: 'CUSTOMER' },
  })
  if (reply) {
    await db.message.create({
      data: { conversationId: convId, content: reply, role: 'BOT' },
    })
  }
  const escalationKeywords = ['/escalate', 'i cannot answer', 'i am not sure',
    "i'm having trouble responding", 'please email concierge']
  const needsEscalation = reply && escalationKeywords.some(k => reply.toLowerCase().includes(k))
  if (needsEscalation && conversation.status !== 'WAITING') {
    await db.conversation.update({
      where: { id: convId },
      data: { status: 'WAITING' },
    })
    fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'conversation:waiting',
        data: { conversationId: convId, customerName: 'Website Visitor', customerPhone: null },
      }),
    }).catch(() => {})
  }
}
```

Change the return to include `conversationId`:

```typescript
return NextResponse.json({
  ok: true,
  reply,
  products: matchedProducts,
  conversationId: convId,
})
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: persist website chat conversations and messages"
```

---

### Task 4: Admin reply to website conversations

**Files:**
- Modify: `src/app/api/whatsapp/send/route.ts`

- [ ] **Step 1: Modify POST handler to detect `source: "website"` and handle differently**

Currently the handler:
1. Validates input
2. Finds conversation (throws 400 if no `customerPhone`)
3. Auto-assigns admin
4. Sends via WhatsApp API
5. Saves message
6. Emits socket event

For website conversations (`source === 'website'`), skip the WhatsApp API call and instead publish via SSE.

Add import:

```typescript
import { publish } from '@/lib/chat-sse'
```

Replace the customerPhone check (lines 21) with a conditional branch:

```typescript
const conversation = await db.conversation.findUnique({ where: { id: conversationId } })
if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

if (conversation.source === 'website') {
  // Website chat — no WhatsApp API call, just save and push via SSE
  if (!conversation.assignedTo) {
    await db.conversation.update({ where: { id: conversationId }, data: { assignedTo: admin.id, status: 'ACTIVE' } })
  }

  const msg = await db.message.create({
    data: { conversationId, content: message, role: 'ADMIN', adminId: admin.id },
  })

  publish(conversationId, { type: 'message', message: msg })

  fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/emit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'message:new',
      data: { ...msg, adminName: admin.name },
    }),
  }).catch(() => {})

  return NextResponse.json({ ok: true, message: msg })
}

// Original WhatsApp flow
if (!conversation.customerPhone) return NextResponse.json({ error: 'No customer phone' }, { status: 400 })

if (!conversation.assignedTo) {
  await db.conversation.update({ where: { id: conversationId }, data: { assignedTo: admin.id, status: 'ACTIVE' } })
}

await sendWhatsAppMessage(conversation.customerPhone, message)

const msg = await db.message.create({
  data: { conversationId, content: message, role: 'ADMIN', adminId: admin.id },
})

fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/emit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'message:new',
    data: { ...msg, adminName: admin.name },
  }),
}).catch(() => {})

return NextResponse.json({ ok: true, message: msg })
```

Wait, there's duplicate code here. Let me clean it up properly. The final file should look like:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { publish } from '@/lib/chat-sse'
import { z } from 'zod'

const SendSchema = z.object({
  conversationId: z.string(),
  message: z.string().min(1).max(2000),
}).strict()

const handler = withAdmin(async (req, { admin }) => {
  const parsed = SendSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { conversationId, message } = parsed.data

  const conversation = await db.conversation.findUnique({ where: { id: conversationId } })
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  if (!conversation.assignedTo) {
    await db.conversation.update({ where: { id: conversationId }, data: { assignedTo: admin.id, status: 'ACTIVE' } })
  }

  if (conversation.source === 'website') {
    const msg = await db.message.create({
      data: { conversationId, content: message, role: 'ADMIN', adminId: admin.id },
    })
    publish(conversationId, { type: 'message', message: msg })
    emitSocketEvent({ event: 'message:new', data: { ...msg, adminName: admin.name } })
    return NextResponse.json({ ok: true, message: msg })
  }

  if (!conversation.customerPhone) return NextResponse.json({ error: 'No customer phone' }, { status: 400 })

  await sendWhatsAppMessage(conversation.customerPhone, message)

  const msg = await db.message.create({
    data: { conversationId, content: message, role: 'ADMIN', adminId: admin.id },
  })

  emitSocketEvent({ event: 'message:new', data: { ...msg, adminName: admin.name } })

  return NextResponse.json({ ok: true, message: msg })
})

function emitSocketEvent(payload: { event: string; data: any }) {
  fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/emit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

export const POST = handler
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/whatsapp/send/route.ts
git commit -m "feat: handle website chat replies via SSE instead of WhatsApp API"
```

---

### Task 5: Widget SSE integration

**Files:**
- Modify: `src/components/store/ConciergeChat.tsx`

- [ ] **Step 1: Add `conversationId` tracking and SSE subscription**

Changes to `ConciergeChat`:
1. Add `conversationId` state
2. On mount, load from `localStorage` key `'website-chat-conversation-id'`
3. After first POST, store the returned `conversationId`
4. When `conversationId` is set, open an `EventSource` connection to `/api/chat/stream?conversationId=xxx`
5. On receiving a `message` event with `type: 'message'`, append to messages array
6. Clean up EventSource on unmount

Add state:

```typescript
const [conversationId, setConversationIdState] = useState<string | null>(null)
```

Add useEffect:

```typescript
// Load conversationId from localStorage
useEffect(() => {
  const saved = localStorage.getItem('website-chat-conversation-id')
  if (saved) setConversationIdState(saved)
}, [])
```

Modify the `send` function — add `conversationId` to the POST body, and after success, save the returned ID:

In the `fetch('/api/chat', { ... })` call, add to body:

```typescript
body: JSON.stringify({
  message: trimmed,
  history: next.slice(1, -1).map((m) => ({ role: m.role, content: m.content })),
  productContext: conciergeProduct,
  locale,
  conversationId,
}),
```

After `setMessages` on success:

```typescript
if (data.conversationId) {
  setConversationIdState(data.conversationId)
  localStorage.setItem('website-chat-conversation-id', data.conversationId)
}
```

Add SSE useEffect:

```typescript
// SSE subscription for live admin replies
useEffect(() => {
  if (!conversationId) return

  const eventSource = new EventSource(`/api/chat/stream?conversationId=${conversationId}`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'message') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message.content,
          },
        ])
      }
    } catch {
      // ignore parse errors
    }
  }

  eventSource.onerror = () => {
    // EventSource will auto-reconnect
  }

  return () => {
    eventSource.close()
  }
}, [conversationId])
```

- [ ] **Step 2: Commit**

```bash
git add src/components/store/ConciergeChat.tsx
git commit -m "feat: add SSE subscription to website chat widget for live admin replies"
```

---

### Task 6: Generate app logo assets

**Files:**
- Create: `apps/admin-mobile/assets/icon.png` (1024×1024 from source)
- Create: `apps/admin-mobile/assets/adaptive-icon.png` (1024×1024)
- Create: `apps/admin-mobile/assets/splash.png` (1242×2436)
- Modify: `apps/admin-mobile/app.json`

- [ ] **Step 1: Generate icon assets from source logo**

Source: `public/gumusgunes-logo.jpeg`

Use Sharp to generate:
- `icon.png` — 1024×1024, entire logo centered with padding
- `adaptive-icon.png` — 1024×1024, logo in the safe zone (center 80%, ~820×820 area with padding)
- `splash.png` — 1242×2436, logo centered on dark background

```bash
cd apps/admin-mobile

# Generate icon (1024x1024)
npx sharp-cli --input ../../public/gumusgunes-logo.jpeg --resize 1024 1024 --output assets/icon.png

# Generate adaptive icon (1024x1024 with safe zone padding)
npx sharp-cli --input ../../public/gumusgunes-logo.jpeg --resize 820 820 --extend 1024 1024 --background "#0a0a0a" --output assets/adaptive-icon.png

# Generate splash (1242x2436 with logo centered)
npx sharp-cli --input ../../public/gumusgunes-logo.jpeg --resize 400 400 --extend 1242 2436 --background "#0a0a0a" --output assets/splash.png
```

If `sharp-cli` is not available, use a Node.js one-liner:

```bash
node -e "
const sharp = require('sharp');
sharp('../../public/gumusgunes-logo.jpeg').resize(1024, 1024, { fit: 'contain', background: '#0a0a0a' }).toFile('assets/icon.png');
sharp('../../public/gumusgunes-logo.jpeg').resize(820, 820, { fit: 'contain', background: '#0a0a0a' }).extend({ top: 102, bottom: 102, left: 102, right: 102, background: '#0a0a0a' }).toFile('assets/adaptive-icon.png');
sharp('../../public/gumusgunes-logo.jpeg').resize(400, 400, { fit: 'contain', background: '#0a0a0a' }).extend({ top: 1018, bottom: 1018, left: 421, right: 421, background: '#0a0a0a' }).toFile('assets/splash.png');
"
```

- [ ] **Step 2: Update `app.json`**

Add splash image and adaptive icon foreground:

```json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#0a0a0a",
      "resizeMode": "contain"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0a0a"
      }
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin-mobile/assets/icon.png apps/admin-mobile/assets/adaptive-icon.png apps/admin-mobile/assets/splash.png apps/admin-mobile/app.json
git commit -m "feat: add store logo as app icon and splash"
```

---

### Task 7: Install and configure EAS Update

**Files:**
- Modify: `apps/admin-mobile/package.json`
- Modify: `apps/admin-mobile/app.json`

- [ ] **Step 1: Install `expo-updates`**

```bash
cd apps/admin-mobile
npx expo install expo-updates
```

- [ ] **Step 2: Add `updates` config to `app.json`**

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/66601809-ac07-42bd-8685-5e54a1dc3000",
      "enabled": true,
      "checkAutomatically": "ON_ERROR_RECOVERY",
      "fallbackToCacheTimeout": 0
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin-mobile/package.json apps/admin-mobile/package-lock.json apps/admin-mobile/app.json
git commit -m "feat: install and configure expo-updates for OTA updates"
```

---

### Task 8: Create SettingsScreen with update button

**Files:**
- Create: `apps/admin-mobile/src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Create `SettingsScreen.tsx`**

A simple screen with "Check for Updates" button. Displays current app version. Shows update status messages (up to date, update available, downloading, restart to apply).

```typescript
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import * as Updates from 'expo-updates'

export default function SettingsScreen({ navigation }: any) {
  const [checking, setChecking] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleCheck() {
    setChecking(true)
    setUpdateInfo(null)
    setUpdateAvailable(false)
    try {
      const update = await Updates.checkForUpdateAsync()
      if (update.isAvailable) {
        setUpdateInfo('Update available')
        setUpdateAvailable(true)
      } else {
        setUpdateInfo('You\'re up to date')
      }
    } catch (err: any) {
      setUpdateInfo('Failed to check: ' + (err.message || 'Unknown error'))
    } finally {
      setChecking(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    setUpdateInfo('Downloading...')
    try {
      await Updates.fetchUpdateAsync()
      setUpdateInfo('Download complete. Restart to apply.')
      setUpdateAvailable(false)
    } catch (err: any) {
      setUpdateInfo('Download failed: ' + (err.message || 'Unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  async function handleRestart() {
    await Updates.reloadAsync()
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#111', padding: 24 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
        Settings
      </Text>
      <Text style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>
        Version {Updates.manifest?.version || '1.0.0'}
      </Text>

      <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <Text style={{ color: '#d4af37', fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
          App Updates
        </Text>

        <TouchableOpacity
          onPress={handleCheck}
          disabled={checking || downloading}
          style={{
            backgroundColor: '#d4af37',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            opacity: (checking || downloading) ? 0.5 : 1,
          }}
        >
          {checking ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: '#000', fontWeight: '600', fontSize: 15 }}>
              Check for Updates
            </Text>
          )}
        </TouchableOpacity>

        {updateInfo && (
          <Text style={{ color: '#888', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {updateInfo}
          </Text>
        )}

        {updateAvailable && !downloading && (
          <TouchableOpacity
            onPress={handleDownload}
            style={{
              backgroundColor: '#333',
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ color: '#d4af37', fontWeight: '600', fontSize: 14 }}>
              Download Update
            </Text>
          </TouchableOpacity>
        )}

        {downloading && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <ActivityIndicator color="#d4af37" size="small" />
            <Text style={{ color: '#888', fontSize: 12, marginTop: 8 }}>Downloading...</Text>
          </View>
        )}

        {updateInfo === 'Download complete. Restart to apply.' && (
          <TouchableOpacity
            onPress={handleRestart}
            style={{
              backgroundColor: '#d4af37',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '600', fontSize: 15 }}>
              Restart to Apply
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-mobile/src/screens/SettingsScreen.tsx
git commit -m "feat: add SettingsScreen with manual update check"
```

---

### Task 9: Add Settings to navigation

**Files:**
- Modify: `apps/admin-mobile/App.tsx`

- [ ] **Step 1: Add Settings stack screen and gear icon to Conversations header**

Changes:
1. Import SettingsScreen
2. Add Settings route to Stack.Navigator
3. Add a gear icon button to Conversations screen's headerRight

```typescript
import { Settings, Gear } from 'lucide-react-native'
```

Wait, expo doesn't have lucide-react-native by default. Let me use a simple text button instead or a TouchableOpacity with a Unicode gear character.

Actually, looking at the existing code, they use lucide-react in the web app but for React Native, `lucide-react-native` would need to be installed. Let me use a simpler approach — a header button with Text.

Import SettingsScreen:

```typescript
import SettingsScreen from './src/screens/SettingsScreen'
```

Add to Stack.Navigator, after the Chat screen:

```typescript
<Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
```

Modify the Conversations screen options to add a header right button. But since ConversationsScreen is set as a component directly, not with custom options, I need to change its options to include `headerRight`.

Change line 85 from:

```typescript
<Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Conversations' }} />
```

To:

```typescript
<Stack.Screen
  name="Conversations"
  component={ConversationsScreen}
  options={({ navigation }) => ({
    title: 'Conversations',
    headerRight: () => (
      <TouchableOpacity
        onPress={() => navigation.navigate('Settings')}
        style={{ marginRight: 16 }}
      >
        <Text style={{ color: '#d4af37', fontSize: 22 }}>⚙</Text>
      </TouchableOpacity>
    ),
  })}
/>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-mobile/App.tsx
git commit -m "feat: add Settings screen to navigation with gear icon"
```
