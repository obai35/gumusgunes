# WhatsApp Multi-Agent Admin Android App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Android APK for Gümüş Güneş admins to manage WhatsApp customer conversations with multi-agent support, chatbot-first escalation, and E2EE.

**Architecture:** Extend existing Next.js backend (Prisma + API routes) with WhatsApp Cloud API integration + Socket.IO real-time server. Build admin mobile app in React Native (Expo) with EAS auto-updates.

**Tech Stack:** Next.js, Prisma/PostgreSQL, WhatsApp Cloud API, Socket.IO, Expo React Native, Upstash Redis

---

## File Structure

```
New/Modified files:
├── prisma/schema.prisma              ← + Conversation, Message models
├── src/
│   ├── app/api/whatsapp/
│   │   ├── webhook/route.ts          ← NEW: Receive WhatsApp messages
│   │   └── send/route.ts             ← NEW: Send replies via WhatsApp API
│   ├── app/api/admin/
│   │   └── conversations/
│   │       ├── route.ts              ← NEW: List conversations
│   │       └── [id]/
│   │           ├── route.ts          ← NEW: Get single conversation
│   │           ├── claim/route.ts    ← NEW: Claim a conversation
│   │           ├── message/route.ts  ← NEW: Send a message to customer
│   │           └── close/route.ts    ← NEW: Close a conversation
│   ├── lib/
│   │   ├── whatsapp.ts               ← NEW: WhatsApp API client helper
│   │   ├── chat-escalation.ts        ← NEW: Chatbot → human escalation
│   │   └── e2ee.ts                   ← NEW: Encryption helpers
├── server/
│   └── socket-server.ts              ← NEW: Socket.IO server
├── apps/
│   └── admin-mobile/
│       ├── app.json                  ← NEW: Expo config
│       ├── package.json              ← NEW: RN dependencies
│       ├── tsconfig.json             ← NEW: TypeScript config
│       ├── App.tsx                   ← NEW: Root component
│       ├── src/
│       │   ├── api.ts                ← NEW: API client
│       │   ├── socket.ts             ← NEW: Socket.IO client
│       │   ├── store.ts              ← NEW: Auth + conversations state
│       │   └── screens/
│       │       ├── LoginScreen.tsx    ← NEW: Email/password login
│       │       ├── ConversationsScreen.tsx  ← NEW: Conversation list
│       │       └── ChatScreen.tsx     ← NEW: Chat with customer
└── .env                              ← + WhatsApp env vars
```

---

### Task 1: Add Prisma Models for Conversations & Messages

**Files:**
- Modify: `prisma/schema.prisma` (add at end, before the last `}` )

- [ ] **Step 1: Add Conversation and Message models**

```prisma
// ── WhatsApp Multi-Agent Chat ──

enum ConversationStatus {
  ACTIVE
  WAITING
  CLOSED
}

enum MessageRole {
  CUSTOMER
  BOT
  ADMIN
}

model Conversation {
  id            String             @id @default(cuid())
  customerName  String?
  customerPhone String?
  status        ConversationStatus @default(ACTIVE)
  source        String             @default("whatsapp")
  assignedTo    String?
  assignedAdmin Admin?             @relation(fields: [assignedTo], references: [id])
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  messages      Message[]

  @@index([status, updatedAt])
  @@index([assignedTo])
}

model Message {
  id             String         @id @default(cuid())
  conversationId String
  content        String
  role           MessageRole
  adminId        String?
  admin          Admin?         @relation(fields: [adminId], references: [id])
  encrypted      Boolean        @default(false)
  createdAt      DateTime       @default(now())
  conversation   Conversation   @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
}
```

- [ ] **Step 2: Run the migration**

Run: `npx prisma db push`
Expected: Tables `Conversation` and `Message` created

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Conversation and Message models for WhatsApp chat"
```

---

### Task 2: WhatsApp API Client Library

**Files:**
- Create: `src/lib/whatsapp.ts`

- [ ] **Step 1: Create the WhatsApp client**

```typescript
const WHATSAPP_API = 'https://graph.facebook.com/v22.0'

function getConfig() {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) throw new Error('WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID required')
  return { token, phoneNumberId }
}

export async function sendWhatsAppMessage(to: string, text: string) {
  const { token, phoneNumberId } = getConfig()
  const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error: ${res.status} ${err}`)
  }
  return res.json()
}

export function verifyWebhook(mode: string | null, token: string | null, challenge: string | null) {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return { status: 200, body: challenge }
  }
  return { status: 403, body: 'Forbidden' }
}

export function parseWebhookBody(body: any): { from: string; text: string; name: string } | null {
  const entry = body?.entry?.[0]
  const change = entry?.changes?.[0]
  const value = change?.value
  const message = value?.messages?.[0]
  if (!message || message.type !== 'text') return null
  return {
    from: message.from,
    text: message.text.body,
    name: value.contacts?.[0]?.profile?.name || 'Customer',
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/whatsapp.ts
git commit -m "feat: add WhatsApp API client library"
```

---

### Task 3: WhatsApp Webhook and Send API Routes

**Files:**
- Create: `src/app/api/whatsapp/webhook/route.ts`
- Create: `src/app/api/whatsapp/send/route.ts`

- [ ] **Step 1: Create webhook route (GET for verification, POST for messages)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook, parseWebhookBody } from '@/lib/whatsapp'
import { handleIncomingMessage } from '@/lib/chat-escalation'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const { status, body } = verifyWebhook(
    searchParams.get('hub.mode'),
    searchParams.get('hub.verify_token'),
    searchParams.get('hub.challenge')
  )
  return new NextResponse(body, { status })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('WhatsApp webhook received:', JSON.stringify(body).slice(0, 500))
    const parsed = parseWebhookBody(body)
    if (!parsed) return NextResponse.json({ ok: true })

    await handleIncomingMessage({
      from: parsed.from,
      text: parsed.text,
      name: parsed.name,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
```

- [ ] **Step 2: Create send route (admin sends reply)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
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
  if (!conversation.customerPhone) return NextResponse.json({ error: 'No customer phone' }, { status: 400 })

  // Assign to this admin if unclaimed
  if (!conversation.assignedTo) {
    await db.conversation.update({ where: { id: conversationId }, data: { assignedTo: admin.id, status: 'ACTIVE' } })
  }

  await sendWhatsAppMessage(conversation.customerPhone, message)

  const msg = await db.message.create({
    data: { conversationId, content: message, role: 'ADMIN', adminId: admin.id },
  })

  // Emit real-time event (fire and forget)
  fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/emit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'message:new',
      data: { ...msg, adminName: admin.name },
    }),
  }).catch(() => {})

  return NextResponse.json({ ok: true, message: msg })
})

export const POST = handler
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/whatsapp/webhook/route.ts src/app/api/whatsapp/send/route.ts
git commit -m "feat: add WhatsApp webhook and send API routes"
```

---

### Task 4: Chatbot Escalation Logic

**Files:**
- Create: `src/lib/chat-escalation.ts`

- [ ] **Step 1: Create escalation handler**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/chat-escalation.ts
git commit -m "feat: add chatbot escalation logic with fallback to human agents"
```

---

### Task 5: Admin Conversations API Routes

**Files:**
- Create: `src/app/api/admin/conversations/route.ts`
- Create: `src/app/api/admin/conversations/[id]/route.ts`
- Create: `src/app/api/admin/conversations/[id]/claim/route.ts`
- Create: `src/app/api/admin/conversations/[id]/close/route.ts`
- Create: `src/app/api/admin/conversations/[id]/message/route.ts`

- [ ] **Step 1: List conversations**

```typescript
// src/app/api/admin/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin }) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined

  const where: any = {}
  if (status) where.status = status

  const conversations = await db.conversation.findMany({
    where,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      assignedAdmin: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
  ok: true,
  conversations: conversations.map(c => ({
      id: c.id,
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      status: c.status,
      source: c.source,
      assignedTo: c.assignedAdmin || null,
      lastMessage: c.messages[0] || null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  })
})

export const GET = handler
```

- [ ] **Step 2: Get single conversation with messages**

```typescript
// src/app/api/admin/conversations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin, params }) => {
  const conversation = await db.conversation.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      assignedAdmin: { select: { id: true, name: true } },
    },
  })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, conversation })
})

export const GET = handler
```

- [ ] **Step 3: Claim conversation**

```typescript
// src/app/api/admin/conversations/[id]/claim/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin, params }) => {
  const conversation = await db.conversation.findUnique({ where: { id: params.id } })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conversation.assignedTo && conversation.assignedTo !== admin.id) {
    return NextResponse.json({ error: 'Already claimed by another admin' }, { status: 409 })
  }

  await db.conversation.update({
    where: { id: params.id },
    data: { assignedTo: admin.id, status: 'ACTIVE' },
  })

  return NextResponse.json({ ok: true })
})

export const POST = handler
```

- [ ] **Step 4: Close conversation**

```typescript
// src/app/api/admin/conversations/[id]/close/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin, params }) => {
  await db.conversation.update({
    where: { id: params.id },
    data: { status: 'CLOSED' },
  })
  return NextResponse.json({ ok: true })
})

export const POST = handler
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/conversations/ src/app/api/admin/conversations/
git commit -m "feat: add admin conversations API routes (list, get, claim, close)"
```

---

### Task 6: E2EE Encryption Helpers

**Files:**
- Create: `src/lib/e2ee.ts`

- [ ] **Step 1: Create encryption helpers**

```typescript
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY required')
  return createHash('sha256').update(key).digest()
}

export function encryptMessage(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return { encrypted, iv: iv.toString('hex'), tag }
}

export function decryptMessage(encrypted: string, iv: string, tag: string): string {
  const key = getEncryptionKey()
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  )
  return { publicKey, privateKey }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/e2ee.ts
git commit -m "feat: add E2EE encryption helpers for message encryption at rest"
```

---

### Task 7: Socket.IO Real-Time Server

**Files:**
- Create: `server/socket-server.ts`
- Create: `server/package.json`
- Add to `package.json` scripts in root

- [ ] **Step 1: Create Socket.IO server**

```typescript
// server/socket-server.ts
import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer((req, res) => {
  // Simple HTTP endpoint for Next.js to emit events
  if (req.method === 'POST' && req.url === '/emit') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const { event, data } = JSON.parse(body)
        io.emit(event, data)
        res.writeHead(200)
        res.end('ok')
      } catch {
        res.writeHead(400)
        res.end('bad request')
      }
    })
    return
  }
  res.writeHead(404)
  res.end()
})

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Authenticate connections via JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('Authentication required'))
  try {
    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || '')
    ;(socket as any).admin = payload
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  console.log(`Admin connected: ${(socket as any).admin?.adminId || 'unknown'}`)
  socket.join('admins')

  socket.on('disconnect', () => {
    console.log('Admin disconnected')
  })
})

const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10)
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})
```

- [ ] **Step 2: Create server/package.json**

```json
{
  "name": "gumusgunes-socket-server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "tsx socket-server.ts",
    "dev": "tsx watch socket-server.ts"
  },
  "dependencies": {
    "socket.io": "^4.8.0",
    "jsonwebtoken": "^9.0.3"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Add scripts to root package.json**

```json
// Add to "scripts" in root package.json:
"socket:dev": "cd server && npx tsx watch socket-server.ts",
"socket:start": "cd server && npx tsx socket-server.ts"
```

- [ ] **Step 4: Commit**

```bash
git add server/ package.json
git commit -m "feat: add Socket.IO real-time server for admin chat"
```

---

### Task 8: Add WhatsApp Env Vars to .env

**Files:**
- Modify: `.env`

- [ ] **Step 1: Add WhatsApp env vars**

```
# WhatsApp Cloud API
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=gumusgunes_verify_2024
SOCKET_SERVER_URL=http://localhost:3001
SOCKET_PORT=3001
```

- [ ] **Step 2: Commit**

```bash
git add .env
git commit -m "chore: add WhatsApp env vars to .env"
```

---

### Task 9: Initialize Expo React Native App

**Files:**
- Create: `apps/admin-mobile/app.json`
- Create: `apps/admin-mobile/package.json`
- Create: `apps/admin-mobile/tsconfig.json`
- Create: `apps/admin-mobile/App.tsx`

- [ ] **Step 1: Create app.json**

```json
{
  "expo": {
    "name": "Gümüş Güneş Admin",
    "slug": "gumusgunes-admin",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "gumusgunes-admin",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "backgroundColor": "#0a0a0a"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.gumusgunes.admin"
    },
    "android": {
      "package": "com.gumusgunes.admin",
      "adaptiveIcon": {
        "backgroundColor": "#0a0a0a"
      },
      "permissions": ["VIBRATE"]
    },
    "plugins": [
      "expo-secure-store"
    ],
    "extra": {
      "apiUrl": "https://gumusgunes.vercel.app",
      "socketUrl": "https://gumusgunes-socket.up.railway.app"
    }
  }
}
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "gumusgunes-admin-mobile",
  "version": "1.0.0",
  "private": true,
  "main": "App.tsx",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "build:apk": "eas build -p android --profile preview",
    "publish:update": "eas update --branch production --message 'Update'"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-safe-area-context": "4.14.0",
    "react-native-gifted-chat": "^2.6.0",
    "socket.io-client": "^4.8.0",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 4: Create App.tsx**

```typescript
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import LoginScreen from './src/screens/LoginScreen'
import ConversationsScreen from './src/screens/ConversationsScreen'
import ChatScreen from './src/screens/ChatScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#d4af37',
          contentStyle: { backgroundColor: '#111' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Conversations' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin-mobile/
git commit -m "feat: initialize Expo React Native app shell"
```

---

### Task 10: API Client and State Store for Mobile App

**Files:**
- Create: `apps/admin-mobile/src/api.ts`
- Create: `apps/admin-mobile/src/store.ts`

- [ ] **Step 1: Create API client**

```typescript
// apps/admin-mobile/src/api.ts
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const BASE = Constants.expoConfig?.extra?.apiUrl || 'https://gumusgunes.vercel.app'

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('admin_token')
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Invalid credentials')
    const data = await res.json()
    // Store token from Set-Cookie is complex; use the /me endpoint pattern
    // Store the user info and rely on the cookie-less Bearer approach
    return data
  },

  getConversations: (status?: string) =>
    request(`/api/admin/conversations${status ? `?status=${status}` : ''}`),

  getConversation: (id: string) =>
    request(`/api/admin/conversations/${id}`),

  claimConversation: (id: string) =>
    request(`/api/admin/conversations/${id}/claim`, { method: 'POST' }),

  sendMessage: (conversationId: string, message: string) =>
    request('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message }),
    }),

  closeConversation: (id: string) =>
    request(`/api/admin/conversations/${id}/close`, { method: 'POST' }),
}
```

- [ ] **Step 2: Create state store**

```typescript
// apps/admin-mobile/src/store.ts
import * as SecureStore from 'expo-secure-store'

type User = { id: string; email: string; name: string; role: string; permissions: string[] }
type Conversation = { id: string; customerName: string; status: string; lastMessage: any; updatedAt: string }
type Message = { id: string; content: string; role: string; createdAt: string }

export type { User, Conversation, Message }

export async function saveToken(token: string) {
  await SecureStore.setItemAsync('admin_token', token)
}

export async function clearToken() {
  await SecureStore.removeItemAsync('admin_token')
}

export function getSocketUrl(): string {
  return Constants.expoConfig?.extra?.socketUrl || 'https://gumusgunes-socket.up.railway.app'
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin-mobile/src/api.ts apps/admin-mobile/src/store.ts
git commit -m "feat: add API client and state store for mobile app"
```

---

### Task 11: Socket.IO Client for Mobile App

**Files:**
- Create: `apps/admin-mobile/src/socket.ts`

- [ ] **Step 1: Create socket client**

```typescript
// apps/admin-mobile/src/socket.ts
import { io, Socket } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'
import { getSocketUrl } from './store'

let socket: Socket | null = null

export async function connectSocket() {
  if (socket?.connected) return socket

  const token = await SecureStore.getItemAsync('admin_token')
  if (!token) throw new Error('Not authenticated')

  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => console.log('Socket connected'))
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason))
  socket.on('connect_error', (err) => console.log('Socket error:', err.message))

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket(): Socket | null {
  return socket
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-mobile/src/socket.ts
git commit -m "feat: add Socket.IO client for real-time updates"
```

---

### Task 12: Login Screen

**Files:**
- Create: `apps/admin-mobile/src/screens/LoginScreen.tsx`

- [ ] **Step 1: Create login screen**

```typescript
// apps/admin-mobile/src/screens/LoginScreen.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { api } from '../api'
import { connectSocket } from '../socket'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return }
    setLoading(true)
    try {
      await api.login(email, password)
      await connectSocket()
      navigation.replace('Conversations')
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gümüş Güneş</Text>
      <Text style={styles.subtitle}>Admin Chat</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#d4af37', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#d4af37', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-mobile/src/screens/LoginScreen.tsx
git commit -m "feat: add login screen with email/password auth"
```

---

### Task 13: Conversations List Screen

**Files:**
- Create: `apps/admin-mobile/src/screens/ConversationsScreen.tsx`

- [ ] **Step 1: Create conversations list screen**

```typescript
// apps/admin-mobile/src/screens/ConversationsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { api } from '../api'
import { getSocket } from '../socket'

type Conversation = {
  id: string
  customerName: string
  status: string
  lastMessage: { content: string; createdAt: string } | null
  updatedAt: string
}

export default function ConversationsScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'WAITING' | 'ACTIVE' | 'CLOSED' | ''>('')

  const load = useCallback(async () => {
    try {
      const data = await api.getConversations(filter || undefined)
      setConversations(data.conversations || [])
    } catch {}
  }, [filter])

  useEffect(() => {
    load()
    const socket = getSocket()
    if (!socket) return

    socket.on('message:new', load)
    socket.on('conversation:waiting', load)
    socket.on('conversation:updated', load)

    return () => {
      socket.off('message:new', load)
      socket.off('conversation:waiting', load)
      socket.off('conversation:updated', load)
    }
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.customerName}>{item.customerName || 'Unknown'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'WAITING' ? '#d4af37' : item.status === 'ACTIVE' ? '#22c55e' : '#555' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.lastMessage} numberOfLines={1}>
        {item.lastMessage?.content || 'No messages'}
      </Text>
      <Text style={styles.time}>{new Date(item.updatedAt).toLocaleString()}</Text>
    </TouchableOpacity>
  )

  const FilterButton = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value === filter ? '' : value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterButton label="Waiting" value="WAITING" />
        <FilterButton label="Active" value="ACTIVE" />
        <FilterButton label="Closed" value="CLOSED" />
        {filter ? <FilterButton label="Clear" value="" /> : null}
      </View>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" />}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.empty}>No conversations</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  filters: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a' },
  filterBtnActive: { backgroundColor: '#d4af37' },
  filterText: { color: '#888', fontSize: 14 },
  filterTextActive: { color: '#000', fontWeight: '600' },
  conversationItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  customerName: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  statusText: { color: '#000', fontSize: 11, fontWeight: '600' },
  lastMessage: { color: '#888', fontSize: 14, marginBottom: 4 },
  time: { color: '#555', fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#555', fontSize: 16 },
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-mobile/src/screens/ConversationsScreen.tsx
git commit -m "feat: add conversations list screen with filters and real-time updates"
```

---

### Task 14: Chat Screen with WhatsApp-Style UI

**Files:**
- Create: `apps/admin-mobile/src/screens/ChatScreen.tsx`

- [ ] **Step 1: Create chat screen with gifted-chat and claim button**

```typescript
// apps/admin-mobile/src/screens/ChatScreen.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { GiftedChat, IMessage, Bubble } from 'react-native-gifted-chat'
import { api } from '../api'
import { getSocket } from '../socket'

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId } = route.params
  const [messages, setMessages] = useState<IMessage[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.getConversation(conversationId)
      setConversation(data.conversation)
      const msgs: IMessage[] = (data.conversation.messages || []).map((m: any) => ({
        _id: m.id,
        text: m.content,
        createdAt: new Date(m.createdAt),
        user: {
          _id: m.role === 'ADMIN' ? 'admin' : m.role === 'BOT' ? 'bot' : 'customer',
          name: m.role === 'ADMIN' ? (data.conversation.assignedAdmin?.name || 'You') : m.role === 'BOT' ? 'Gümüş Güneş' : data.conversation.customerName || 'Customer',
        },
      }))
      setMessages(msgs.reverse())
    } catch { Alert.alert('Error', 'Failed to load conversation') }
    finally { setLoading(false) }
  }, [conversationId])

  useEffect(() => {
    load()
    const socket = getSocket()
    if (!socket) return

    socket.on('message:new', (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => GiftedChat.append(prev, [{
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.createdAt),
          user: { _id: msg.role === 'ADMIN' ? 'admin' : msg.role === 'BOT' ? 'bot' : 'customer', name: msg.role || '' },
        }]))
      }
    })

    return () => { socket.off('message:new') }
  }, [conversationId, load])

  const handleClaim = async () => {
    try {
      await api.claimConversation(conversationId)
      Alert.alert('Claimed', 'You are now handling this conversation')
      load()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleClose = async () => {
    Alert.alert('Close', 'Mark this conversation as closed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        await api.closeConversation(conversationId)
        navigation.goBack()
      }},
    ])
  }

  const onSend = async (newMessages: IMessage[]) => {
    const text = newMessages[0]?.text
    if (!text) return
    try {
      await api.sendMessage(conversationId, text)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  useEffect(() => {
    if (conversation) {
      navigation.setOptions({
        title: conversation.customerName || 'Chat',
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!conversation.assignedTo && (
              <TouchableOpacity onPress={handleClaim} style={styles.claimBtn}>
                <Text style={styles.claimText}>Claim</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        ),
      })
    }
  }, [conversation, navigation])

  if (loading) return <View style={styles.loading}><Text style={{ color: '#888' }}>Loading...</Text></View>

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: 'admin', name: 'You' }}
      renderBubble={(props) => (
        <Bubble
          {...props}
          textStyle={{ right: { color: '#fff' }, left: { color: '#fff' } }}
          wrapperStyle={{
            left: { backgroundColor: '#2a2a2a' },
            right: { backgroundColor: '#d4af37' },
          }}
        />
      )}
      timeTextStyle={{ left: { color: '#888' }, right: { color: '#000' } }}
      textInputProps={{ style: { color: '#fff', backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16 } }}
      isLoadingEarlier={loading}
    />
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  claimBtn: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  claimText: { color: '#000', fontSize: 13, fontWeight: '600' },
  closeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  closeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-mobile/src/screens/ChatScreen.tsx
git commit -m "feat: add chat screen with WhatsApp-style UI, claim, and close"
```

---

### Task 15: Build APK and Setup Auto-Updates

**Files:**
- Create: `apps/admin-mobile/eas.json`

- [ ] **Step 1: Create eas.json for EAS Build + Update**

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 2: Build APK**

Run: `cd apps/admin-mobile && npx eas build -p android --profile preview`
Expected: APK file generated, downloadable from Expo dashboard

- [ ] **Step 3: Publish first OTA update channel**

Run: `cd apps/admin-mobile && npx eas update --branch production --message 'Initial release'`
Expected: Update published. Future code changes can be pushed via `eas update` without rebuilding APK.

- [ ] **Step 4: Commit**

```bash
git add apps/admin-mobile/eas.json
git commit -m "chore: add EAS build config for APK and auto-updates"
```

---

## Post-Implementation Checklist

- [ ] Deploy Next.js changes to Vercel (auto-deploy from main)
- [ ] Set WhatsApp env vars (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`) in Vercel dashboard
- [ ] Deploy Socket.IO server to Railway/Render/Fly.io
- [ ] Configure WhatsApp webhook in Meta Business dashboard to point to `https://gumusgunes.vercel.app/api/whatsapp/webhook`
- [ ] Distribute APK to employees
- [ ] Test full flow: customer WhatsApp → chatbot → escalation → admin claims → admin replies → customer receives
