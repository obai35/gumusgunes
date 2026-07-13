# Multi-Platform Inbox — Messenger & Instagram DM Integration

## Objective
Add Messenger and Instagram DM conversations alongside existing WhatsApp and Website chat in the admin mobile app, with platform filter tabs and per-platform reply routing.

## Architecture

```
WhatsApp Cloud API ─┐
                    ├──▶ Webhook endpoints ──▶ Conversation DB ──▶ SSE ──▶ Mobile App
Messenger API ──────┤                          (source field)          
Instagram DM API ───┘                                                        
Website Chat ───────┘                               ▲                        
                                                    │                        
Mobile App ──▶ Unified Send API ──▶ Routes to correct platform API
```

The `source` field on `Conversation` (`"whatsapp"`, `"messenger"`, `"instagram"`, `"website"`) drives routing for both incoming messages (webhook) and outgoing replies (send).

---

## 1. Backend — Meta Webhook

### File: `src/app/api/integrations/meta/webhook/route.ts`

**GET** — Meta verification handshake:
- Accept `hub.mode`, `hub.verify_token`, `hub.challenge`
- If `verify_token` matches env var `META_WEBHOOK_VERIFY_TOKEN`, return `challenge` as plain text
- Otherwise 403

**POST** — Receive events:
- Inspect each `entry`:
  - If `entry.messaging[]` exists → **Messenger** message
  - If `entry.changes[]` with `field === 'messages'` → **Instagram DM**
- Extract: sender ID, message text, timestamp, platform
- Find or create Conversation with `source: 'messenger' | 'instagram'`
- Save Message with `role: 'CUSTOMER'`
- Publish via SSE (`publish(conversationId, message)`)
- Emit socket event for real-time delivery

### Meta Client additions (`src/lib/social/meta.ts`):

```ts
async sendMessengerMessage(psid: string, text: string): Promise<void>
async sendInstagramMessage(igId: string, text: string): Promise<void>
```

---

## 2. Backend — Unified Send Routing

### File: `src/app/api/messages/send/route.ts`

New unified endpoint that replaces the WhatsApp-only send route:

| Source | Action |
|--------|--------|
| `whatsapp` | Call `sendWhatsAppMessage()` (existing) |
| `website` | Save + SSE push (existing) |
| `messenger` | Call `metaClient.sendMessengerMessage()` |
| `instagram` | Call `metaClient.sendInstagramMessage()` |

Also keep the existing `POST /api/whatsapp/send` for backwards compatibility (delegate to unified send).

### File: `src/app/api/admin/conversations/route.ts`

Add `source` query param filter:
```ts
const source = searchParams.get('source')
if (source) where.source = source
```

Also accept `source=all` to return all platforms (default behavior when no source param).

---

## 3. Mobile — Conversation Screen Tabs

### ConversationsScreen.tsx

Add a second row of filter pills above the status filters:

```
Row 1 (platform): [All] [WhatsApp] [Messenger] [Instagram] [Website]
Row 2 (status):   [Waiting] [Active] [Closed]
```

- Platform filter state: `'all' | 'whatsapp' | 'messenger' | 'instagram' | 'website'`
- When a platform is selected, pass `?source=<value>` to the API
- `all` sends no source param (returns all)
- Small platform icon rendered left of the avatar in each card:
  - WhatsApp → green circle with phone icon "📱"
  - Messenger → blue circle with "💬"
  - Instagram → pink circle with "📷"
  - Website → gold circle with "🌐"

### ChatScreen.tsx

- Info bar shows platform icon next to customer name
- Send endpoint: use the unified `/api/messages/send` which auto-detects source
- No manual platform switching needed

### api.ts

Update `getConversations` to accept optional `source` param:
```ts
getConversations: (status?: string, source?: string) =>
  request(`/api/admin/conversations${status ? `?status=${status}` : ''}${source ? `${status ? '&' : '?'}source=${source}` : ''}`)
```

Add unified send method:
```ts
sendMessage: (conversationId: string, message: string) =>
  request('/api/messages/send', {
    method: 'POST',
    body: JSON.stringify({ conversationId, message }),
  }),
```

---

## 4. Environment Variables

Add to `.env.local`:
```
META_WEBHOOK_VERIFY_TOKEN=<random-string>
META_PAGE_ACCESS_TOKEN=<page-token-with-messaging-permissions>
META_APP_SECRET=<app-secret-for-webhook-signature>
```

---

## 5. Meta App Configuration

Required setup (user does this):
1. Create or use existing Facebook App
2. Add Messenger product → generate Page Access Token
3. Add Instagram Basic Display + Instagram Graph API
4. Configure Webhook → point to `https://gumusgunes.vercel.app/api/integrations/meta/webhook`
5. Subscribe to `messages` and `messaging_postbacks` events
6. Set verify token matching `META_WEBHOOK_VERIFY_TOKEN`

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/integrations/meta/webhook/route.ts` | New — Meta webhook for Messenger + Instagram DM |
| `src/lib/social/meta.ts` | Add `sendMessengerMessage()`, `sendInstagramMessage()` |
| `src/app/api/messages/send/route.ts` | New — unified message send with per-platform routing |
| `src/app/api/admin/conversations/route.ts` | Add `source` query param filter |
| `apps/admin-mobile/src/api.ts` | Add `source` param to getConversations, add unified send |
| `apps/admin-mobile/src/screens/ConversationsScreen.tsx` | Add platform filter tabs + source icons |
| `apps/admin-mobile/src/screens/ChatScreen.tsx` | Show platform icon in info bar, use unified send |
| `.env.local` | Add Meta webhook/env vars |

## Out of Scope

- Instagram DM media messages (images, video) — text-only for now
- Typing indicators across platforms
- Message delivery receipts (sent/delivered/read)
- Historical message import
- Social account connection UI (assumes token configured in env vars)
