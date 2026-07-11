# WhatsApp Multi-Agent Admin Android App — Design Spec

## Overview

An Android APK (React Native Expo) for Gümüş Güneş admins to manage customer conversations from WhatsApp. Chatbot answers first via Groq AI; when stuck, conversation escalates to human agents who respond via the app. Customer sees replies in their normal WhatsApp.

## Architecture

```
Customer (WhatsApp) ◄──► WhatsApp Cloud API (Meta) ◄──► Next.js (webhooks + chatbot)
                                                              │
                                                              ▼
Admin Android App ◄──► Socket.IO Server ◄──► PostgreSQL + Prisma
  (Expo RN)                (real-time)         + Upstash Redis
```

- Next.js handles website + WhatsApp webhooks + chatbot + REST API
- Socket.IO server (separate process) handles real-time messaging
- Expo React Native app connects to both for admins
- Upstash Redis used for pub/sub between Next.js and Socket.IO server

## Database Models (Prisma)

```prisma
model Conversation {
  id            String    @id @default(cuid())
  customerName  String?
  customerPhone String?
  status        Status    @default(ACTIVE)   // ACTIVE | WAITING | CLOSED
  source        String    @default("whatsapp") // "whatsapp" | "website"
  assignedTo    String?   // admin ID (null = unclaimed)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  messages      Message[]
}

model Message {
  id             String      @id @default(cuid())
  conversationId String
  content        String
  role           Role        // CUSTOMER | BOT | ADMIN
  adminId        String?
  encrypted      Boolean     @default(false)
  createdAt      DateTime    @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

enum Status { ACTIVE WAITING CLOSED }
enum Role  { CUSTOMER BOT ADMIN }
```

## Escalation Flow

1. Customer sends WhatsApp message → Meta sends webhook to Next.js
2. Backend creates Conversation + Message, calls Groq chatbot
3. If chatbot answers confidently → WhatsApp API reply sent
4. If chatbot stuck (Groq returns a response containing an escalation marker like `/escalate` or explicit "I can't answer this") → status = WAITING
5. Socket.IO pushes `conversation:waiting` event to all connected admins
6. First admin to open conversation gets assigned (open pickup)
7. Admin replies → stored in DB → sent via WhatsApp API to customer

## WhatsApp Integration

- **WhatsApp Cloud API** (Meta, free tier — up to 50 conversations/day initial)
- Webhook endpoint: `POST /api/whatsapp/webhook`
- Send endpoint: `POST /api/whatsapp/send`
- Rate: $0.005/message after 1000 free conversations/month

## Real-time (Socket.IO)

- Separate process: `server/socket-server.ts`
- Auth via JWT on connect
- Events:
  - `message:new` — new message in conversation
  - `conversation:updated` — status change (claimed, closed)
  - `conversation:waiting` — escalation notification (triggers sound)
  - `admin:typing` — typing indicator
- Upstash Redis for pub/sub between Next.js and Socket.IO server

## Android App (React Native Expo)

### Screens
- **Login** — email + password, JWT stored in expo-secure-store
- **Conversations List** — open conversations, last message preview, status badge, unread count
- **Chat Screen** — WhatsApp-style (react-native-gifted-chat), "Take conversation" button for unclaimed, quick replies
- **Profile** — logout

### Auto-updates
- EAS Update (Expo's OTA update system)
- Checks for JS bundle updates on app launch
- Downloads and applies silently

### Navigation
- Simple React Navigation (stack navigator)

## E2EE (practical)

- Messages encrypted at rest with AES-256-GCM
- In transit to admin: server encrypts with admin's public key, decrypted on-device with private key in expo-secure-store
- Server must see plaintext for chatbot + storage (necessary limitation)

## Project Structure

```
gumusgunes/
├── prisma/
│   └── schema.prisma              ← + Conversation, Message models
├── src/
│   └── app/api/whatsapp/
│       ├── webhook/route.ts       ← Receive WhatsApp messages
│       └── send/route.ts          ← Send replies via WhatsApp API
├── src/lib/
│   ├── whatsapp.ts                ← WhatsApp API client
│   ├── chat-escalation.ts         ← Chatbot → human logic
│   └── e2ee.ts                    ← Encryption helpers
├── server/
│   └── socket-server.ts           ← Socket.IO server
└── apps/
    └── admin-mobile/              ← Expo React Native app
        ├── App.tsx
        ├── screens/
        │   ├── LoginScreen.tsx
        │   ├── ConversationsScreen.tsx
        │   └── ChatScreen.tsx
        └── package.json
```

## Implementation Order

1. Prisma models + migration
2. WhatsApp webhook + send API routes
3. Chatbot escalation logic
4. Socket.IO server
5. Expo app: Login + Conversations list
6. Expo app: Chat screen + real-time
7. E2EE
8. APK build + auto-update setup

## Deployment

- **Next.js** — already on Vercel; add WhatsApp env vars (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`) to Vercel env
- **Socket.IO server** — deploy to Railway, Render, or Fly.io (small Node.js process)
- **Expo app** — build APK via `eas build -p android --profile preview`, distribute APK manually; future updates via `eas update`
