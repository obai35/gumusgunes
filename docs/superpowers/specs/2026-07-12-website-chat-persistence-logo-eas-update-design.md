# Design: Website Chat Persistence, App Logo, EAS Update, Admin Management

## 1. Overview

Four features for the Gümüş Güneş admin ecosystem:
1. **Website chat → persistent conversations** — make the customer-facing chat widget create database records so admins can see and reply to website chats in the mobile app
2. **App logo** — replace placeholder 1×1 icon with real store logo
3. **EAS Update** — over-the-air JS/asset updates with a manual "Check for Updates" button
4. **Admin management** — the web admin panel already has full CRUD for admins (point user to it)

## 2. Feature: Website Chat Persistence

### Problem

The website chat widget (`ConciergeChat.tsx`) calls `POST /api/chat` which is stateless — it talks to Groq AI and returns a reply without creating any `Conversation` or `Message` database records. Admins never see these chats. When the AI fails, the customer gets an apology with an email fallback.

### Solution

Add persistence to the website chat flow and a real-time SSE (Server-Sent Events) stream for live delivery of admin replies.

### Flow

```
Customer types message in widget
  → POST /api/chat { message, conversationId?, customerName? }
  → Backend:
      1. Look up conversation by conversationId OR find existing by customer IP/session
      2. If no conversation exists, create Conversation { source: "website", status: "ACTIVE" }
      3. Save Message { role: CUSTOMER, content, conversationId }
      4. Run existing Groq AI chatbot logic (unchanged)
      5. If AI responds:
           Save Message { role: BOT, content }
           Return { reply, conversationId }
      6. If AI escalates (apology / /escalate):
           Update conversation status → "WAITING"
           Emit conversation:waiting socket event → admin app sees it
           Save waiting message as Message { role: BOT }
           Return { reply, conversationId, escalated: true }
      7. Always check: if conversation has an assigned admin, also emit message:new
         socket event for any admin replies (for future use)

Admin replies from mobile app:
  → POST /api/whatsapp/send { conversationId, message }
  → Backend detects conversation.source === "website":
      1. Save Message { role: ADMIN, adminId }
      2. Push to SSE stream for this conversationId
      3. Emit message:new socket event (for other admins)

Admin replies from web admin panel:
  → Same POST /api/whatsapp/send endpoint — handles both WhatsApp and website

Customer receives admin reply in widget:
  → Widget subscribed to GET /api/chat/stream?conversationId=xxx
  → SSE event received → append to chat UI
```

### API Surface

#### Modified `POST /api/chat` (existing route)

**Request:**
```json
{
  "message": "string",
  "conversationId": "string?",  // null on first message
  "locale": "string?"
}
```

**Response (AI answers):**
```json
{
  "ok": true,
  "reply": "string",
  "products": [],
  "conversationId": "string"
}
```

**Response (escalation):**
```json
{
  "ok": true,
  "reply": "string",
  "conversationId": "string",
  "escalated": true
}
```

**Response (error):**
```json
{
  "ok": false,
  "reply": "Sorry, something went wrong."
}
```

**Implementation notes:**
- Create conversation with `source: "website"`, `status: "ACTIVE"`, `customerName` from first message
- Customer identification: use `conversationId` if provided; widget stores it in localStorage for persistence across page reloads
- AI chatbot logic (Groq + fallback) stays exactly as-is — only add persistence around it
- On escalation: emit `conversation:waiting` socket event to Socket.IO server's `/emit` endpoint

#### New `POST /api/chat/admin/send` (admin-only)

Reuses the same logic as `POST /api/whatsapp/send` but skips the WhatsApp API call for `source: "website"` conversations.

**Request:**
```json
{
  "conversationId": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "ok": true,
  "message": { "id": "string", "content": "string", "role": "ADMIN", "createdAt": "string" }
}
```

#### New `GET /api/chat/stream?conversationId=xxx` (no auth — public SSE)

- Standard text/event-stream endpoint
- Server holds connection open
- On admin reply: `res.write(\`data: ${JSON.stringify({ type: 'message', message })}\n\n\`)`
- On connection close: browser EventSource reconnects automatically
- Heartbeat every 30s: `data: {"type":"heartbeat"}\n\n`

### Mobile App Changes

- `POST /api/whatsapp/send` already works for all conversations — the `/api/chat/admin/send` routes to the same handler
- No mobile app code changes needed for website chat persistence; existing socket listeners (`conversation:waiting`, `message:new`) handle website-originated conversations automatically
- The admin doesn't need to know whether they're replying to WhatsApp or website

### Widget Changes (`ConciergeChat.tsx`)

- After first successful POST to `/api/chat`, store the returned `conversationId`
- On mount (or after getting conversationId), open SSE connection to `/api/chat/stream?conversationId=xxx`
- On SSE `message` event: if type is `'message'`, append to chat history
- On SSE `error` / close: EventSource retries automatically
- If response includes `escalated: true`, show "You've been transferred to our team" message

### SSE Server Implementation

No extra package — Node.js native `res.write()` works. Key considerations:
- Store active SSE connections in a Map<string, Set<Response>> keyed by conversationId
- On admin reply, iterate the Set and `res.write()` to each
- Clean up on `close` event
- Connection limit: standard Node.js HTTP server limits apply (~2000 concurrent connections per GB RAM)

```
// In-memory store
const sseClients = new Map<string, Set<Response>>()

// Subscribe (GET /api/chat/stream)
function subscribe(conversationId: string, res: Response) {
  if (!sseClients.has(conversationId)) sseClients.set(conversationId, new Set())
  sseClients.get(conversationId)!.add(res)
  res.on('close', () => {
    sseClients.get(conversationId)?.delete(res)
  })
}

// Publish (called from admin send endpoint)
function publish(conversationId: string, data: object) {
  const clients = sseClients.get(conversationId)
  if (!clients) return
  for (const res of clients) {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }
}
```

## 3. Feature: App Logo

### Current State

`apps/admin-mobile/assets/icon.png` is a 1×1 pixel placeholder (70 bytes). No splash image, no adaptive icon foreground.

### Assets

Source: `public/gumusgunes-logo.jpeg` (JPEG store logo)

### Generated Files

| File | Size | Purpose |
|------|------|---------|
| `apps/admin-mobile/assets/icon.png` | 1024×1024 | App icon (Expo resizes automatically) |
| `apps/admin-mobile/assets/adaptive-icon.png` | 1024×1024 | Android adaptive icon foreground |
| `apps/admin-mobile/assets/splash.png` | 1242×2436 | Splash screen image |

### app.json Changes

```json
{
  "icon": "./assets/icon.png",
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
```

### Generation

Use Sharp or ImageMagick to resize the source logo JPEG to the required dimensions with padding for adaptive icon (safe zone: center 80%).

## 4. Feature: EAS Update + Manual Update Button

### Install

```bash
cd apps/admin-mobile
npx expo install expo-updates
```

### app.json

```json
{
  "updates": {
    "url": "https://u.expo.dev/66601809-ac07-42bd-8685-5e54a1dc3000",
    "enabled": true,
    "checkAutomatically": "ON_ERROR_RECOVERY",
    "fallbackToCacheTimeout": 0
  }
}
```

No `checkAutomatically: ON_LOAD` — the user wants manual update checks. `ON_ERROR_RECOVERY` ensures the app can recover from a broken bundle without auto-updating.

### eas.json

```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": { ... existing ... },
  "submit": { ... existing ... }
}
```

EAS Update does not require `eas.json` changes — `eas update` uses the project ID from `app.json` extra.

### Mobile App: Settings Screen

- Add a gear icon button in the ConversationsScreen header
- New `SettingsScreen` with:
  - "Check for Updates" button
  - Shows current version (from `expo-constants`)
  - If update found: shows "Update Available" with a download button
  - Download progress indicator
  - "Restart to apply" button after download

### Update Flow

```typescript
import * as Updates from 'expo-updates'

async function checkForUpdates() {
  const update = await Updates.checkForUpdateAsync()
  if (update.isAvailable) {
    // Show "Update Available" UI
    await Updates.fetchUpdateAsync()
    // Show "Restart to apply" button
    await Updates.reloadAsync()
  } else {
    // Show "You're up to date"
  }
}
```

### Cloud Publishing

```bash
cd apps/admin-mobile
eas update --branch production --message 'v1.1 - description'
```

This pushes JS/assets to Expo's CDN. App instances see the update when the user presses "Check for Updates."

## 5. Feature: Admin Management (Existing)

The web admin panel already has full admin management at `/admin/admins` with:
- **Admins tab** — table with search, create modal (name, email, password, phone, role), edit, delete
- **Roles tab** — create/edit roles with granular permission checkboxes
- **Activity Log tab** — filterable audit log of all admin actions
- **API routes** — `GET/POST /api/admin/admins`, `PUT/DELETE /api/admin/admins/[id]`

No implementation needed — the user may not have noticed this page.

## 6. File Changes Summary

### New Files
- `apps/admin-mobile/src/screens/SettingsScreen.tsx` — update check + version info
- `src/app/api/chat/stream/route.ts` — SSE endpoint
- `src/lib/chat-sse.ts` — SSE client management module

### Modified Files
- `src/app/api/chat/route.ts` — add persistence + conversationId flow
- `src/app/api/whatsapp/send/route.ts` — detect `source: "website"` and handle appropriately
- `src/components/store/ConciergeChat.tsx` — add SSE client, conversationId tracking
- `src/app/api/admin/conversations/route.ts` — no changes needed (already returns all sources)
- `apps/admin-mobile/app.json` — icon, splash, updates config
- `apps/admin-mobile/eas.json` — no changes needed for updates
- `apps/admin-mobile/App.tsx` — add Settings screen route + header gear icon
- `apps/admin-mobile/assets/icon.png` — replaced with real logo
- `apps/admin-mobile/assets/adaptive-icon.png` — new
- `apps/admin-mobile/assets/splash.png` — new
- `apps/admin-mobile/package.json` — add expo-updates dependency

## 7. Edge Cases & Error Handling

### Website Chat Persistence
- **No customer identity**: website chat has no login; use `conversationId` returned from first message to continue the same conversation. Store in widget state or localStorage.
- **Conversation overflow**: limit to 50 active conversations per customer IP/session to prevent spam
- **AI still works offline**: if Groq API fails, fallback to keyword responses (existing behavior) — still save the messages

### SSE
- **Disconnect**: EventSource auto-reconnects; no data loss since admin replies are persisted in DB
- **Multiple tabs**: each tab opens its own SSE connection; all receive replies
- **Server restart**: existing SSE connections drop; EventSource retries; missed messages are loaded on next widget message fetch
- **Heartbeat**: 30s keepalive prevents proxy timeouts

### EAS Update
- **Update fails during download**: catch error, show "Update failed" toast, user can retry
- **App in use during update**: update downloads in background; user controls when to reload
- **No network**: `checkForUpdateAsync` throws; show "No connection" message
