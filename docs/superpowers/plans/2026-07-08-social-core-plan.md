# Social Core Implementation Plan — Sub-Project 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Foundation for the social media manager — Prisma models + Meta Graph API client + account management + settings page.

**Architecture:** Prisma models for accounts/posts/campaigns/drafts, a MetaClient class wrapping Facebook Graph API v22.0, and settings UI for connecting accounts.

**Tech Stack:** Prisma + PostgreSQL + Next.js App Router + recharts

---

### Task 1: Add Social Media Prisma Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add SocialAccount, SocialPost, SocialDraft, SocialCampaign models**

Add after the `PaymentMethod` model (before `ActivityLog`):

```prisma
model SocialAccount {
  id           String       @id @default(cuid())
  platform     String       // instagram | facebook
  accountId    String       // platform user ID
  accountName  String       // display name
  accessToken  String       // encrypted
  tokenExpires DateTime?
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())
  posts        SocialPost[]
}

model SocialPost {
  id             String         @id @default(cuid())
  accountId      String?
  account        SocialAccount? @relation(fields: [accountId], references: [id])
  campaignId     String?
  campaign       SocialCampaign? @relation(fields: [campaignId], references: [id])
  platform       String         // instagram | facebook | both
  postType       String         // feed | reel | story | carousel
  status         String         // draft | scheduled | publishing | published | failed
  mediaUrls      String         // JSON array
  caption        String?
  hashtags       String?        // JSON array
  productIds     String?        // JSON array
  discountId     String?
  discount       Discount?      @relation(fields: [discountId], references: [id])
  scheduledAt    DateTime?
  publishedAt    DateTime?
  platformPostId String?
  permalink      String?
  performance    Json?
  errorLog       String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([status, scheduledAt])
  @@index([accountId, status])
}

model SocialDraft {
  id         String   @id @default(cuid())
  title      String?
  mediaUrls  String   // JSON array
  caption    String?
  hashtags   String?
  productIds String?
  discountId String?
  platforms  String   // JSON array
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model SocialCampaign {
  id            String   @id @default(cuid())
  name          String
  goal          String   // awareness | engagement | sales | followers
  budget        Float?
  status        String   // draft | active | paused | completed
  startDate     DateTime?
  endDate       DateTime?
  triggerType   String?
  triggerConfig Json?
  posts         SocialPost[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

- [ ] **Step 2: Run Prisma migration**

```bash
npx prisma migrate dev --name add-social-media-models
```

Expected: Migration created and applied.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add social media models (account, post, draft, campaign)"
```

---

### Task 2: Create Meta API Client

**Files:**
- Create: `src/lib/social/meta.ts`
- Create: `src/lib/social/types.ts`

- [ ] **Step 1: Create shared social types**

```typescript
export type Platform = 'instagram' | 'facebook'
export type PostType = 'feed' | 'reel' | 'story' | 'carousel'
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'

export type PostInsights = {
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  engagement: number
}

export type AccountInsights = {
  followerCount: number
  followerGrowth: number
  profileViews: number
  reach: number
  impressions: number
}

export type TrendPoint = {
  date: string
  value: number
}

export type Comment = {
  id: string
  from: { id: string; username: string }
  message: string
  timestamp: string
  replyCount: number
}

export type HashtagSuggestion = {
  name: string
  count: number
  mediaCount: number
}
```

- [ ] **Step 2: Create Meta API client**

```typescript
import type { PostInsights, AccountInsights, TrendPoint, Comment, HashtagSuggestion, Platform } from './types'

const META_GRAPH_URL = 'https://graph.facebook.com/v22.0'

export class MetaClient {
  private token: string

  constructor(accessToken: string) {
    this.token = accessToken
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${META_GRAPH_URL}${path}${path.includes('?') ? '&' : '?'}access_token=${this.token}`
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(`Meta API error: ${err.error?.message || res.statusText}`)
    }
    return res.json()
  }

  // ——— Pages ———

  async getPages(): Promise<{ id: string; name: string; category: string }[]> {
    const data = await this.fetch<{ data: any[] }>('/me/accounts?fields=id,name,category')
    return data.data
  }

  async getInstagramAccounts(pageId: string): Promise<{ id: string; username: string }[]> {
    const data = await this.fetch<{ data: any[] }>(`/${pageId}/instagram_accounts?fields=id,username`)
    return data.data
  }

  // ——— Posts ———

  async createFeedPost(pageId: string, mediaUrl: string, caption: string): Promise<{ id: string; permalink?: string }> {
    const data = await this.fetch<{ id: string }>(`/${pageId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ url: mediaUrl, caption }),
    })
    return data
  }

  async createCarouselPost(pageId: string, mediaUrls: string[], caption: string): Promise<{ id: string }> {
    // Step 1: Create children
    const children: string[] = []
    for (const url of mediaUrls) {
      const child = await this.fetch<{ id: string }>(`/${pageId}/photos`, {
        method: 'POST',
        body: JSON.stringify({ url, published: false }),
      })
      children.push(child.id)
    }
    // Step 2: Create carousel
    const data = await this.fetch<{ id: string }>(`/${pageId}/feed`, {
      method: 'POST',
      body: JSON.stringify({
        message: caption,
        attached_media: children.map(id => ({ media_fbid: id })),
      }),
    })
    return data
  }

  async createReel(pageId: string, videoUrl: string, caption: string): Promise<{ id: string }> {
    const data = await this.fetch<{ id: string }>(`/${pageId}/video_reels`, {
      method: 'POST',
      body: JSON.stringify({ video_url: videoUrl, description: caption }),
    })
    return data
  }

  async publishToInstagram(igAccountId: string, mediaUrl: string, caption: string): Promise<{ id: string }> {
    // Step 1: Create media container
    const container = await this.fetch<{ id: string }>(`/${igAccountId}/media`, {
      method: 'POST',
      body: JSON.stringify({ image_url: mediaUrl, caption }),
    })
    // Step 2: Publish
    const published = await this.fetch<{ id: string }>(`/${igAccountId}/media_publish`, {
      method: 'POST',
      body: JSON.stringify({ creation_id: container.id }),
    })
    return published
  }

  async publishCarouselToInstagram(igAccountId: string, mediaUrls: string[], caption: string): Promise<{ id: string }> {
    const children: string[] = []
    for (const url of mediaUrls) {
      const child = await this.fetch<{ id: string }>(`/${igAccountId}/media`, {
        method: 'POST',
        body: JSON.stringify({ image_url: url, is_carousel_item: true }),
      })
      children.push(child.id)
    }
    const container = await this.fetch<{ id: string }>(`/${igAccountId}/media`, {
      method: 'POST',
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: children.join(','),
        caption,
      }),
    })
    const published = await this.fetch<{ id: string }>(`/${igAccountId}/media_publish`, {
      method: 'POST',
      body: JSON.stringify({ creation_id: container.id }),
    })
    return published
  }

  // ——— Comments ———

  async getComments(postId: string): Promise<Comment[]> {
    const data = await this.fetch<{ data: any[] }>(`/${postId}/comments?fields=id,from{id,username},message,created_time,comment_count`)
    return data.data.map(c => ({
      id: c.id,
      from: c.from,
      message: c.message,
      timestamp: c.created_time,
      replyCount: c.comment_count || 0,
    }))
  }

  async replyToComment(commentId: string, message: string): Promise<void> {
    await this.fetch(`/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }

  // ——— Insights ———

  async getPostInsights(postId: string): Promise<PostInsights> {
    const data = await this.fetch<{ data: any[] }>(
      `/${postId}/insights?metric=likes,comments,shares,saved,reach,impressions`
    )
    const result: any = { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0 }
    for (const m of data.data) {
      if (m.values?.[0]?.value != null) {
        const key = m.name === 'saved' ? 'saves' : m.name
        result[key] = m.values[0].value
      }
    }
    result.engagement = result.likes + result.comments + result.shares + result.saves
    return result as PostInsights
  }

  async getAccountInsights(accountId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<AccountInsights> {
    const metrics = 'follower_count,profile_views,reach,impressions'
    const data = await this.fetch<{ data: any[] }>(
      `/${accountId}/insights?metric=${metrics}&period=${period}`
    )
    const result: any = { followerCount: 0, followerGrowth: 0, profileViews: 0, reach: 0, impressions: 0 }
    for (const m of data.data) {
      if (m.values?.[0]?.value != null) {
        const key = m.name === 'follower_count' ? 'followerCount'
          : m.name === 'profile_views' ? 'profileViews' : m.name
        result[key] = m.values[0].value
      }
    }
    return result as AccountInsights
  }

  async getReachTrend(accountId: string, days = 30): Promise<TrendPoint[]> {
    const since = Math.floor(Date.now() / 1000) - days * 86400
    const data = await this.fetch<{ data: any[] }>(
      `/${accountId}/insights?metric=reach&period=day&since=${since}`
    )
    return (data.data[0]?.values || []).map((v: any) => ({
      date: v.end_time?.split('T')[0] || '',
      value: v.value || 0,
    }))
  }

  // ——— Hashtag Search ———

  async searchHashtags(query: string): Promise<HashtagSuggestion[]> {
    const data = await this.fetch<{ data: any[] }>(
      `/ig_hashtag_search?user_id=me&q=${encodeURIComponent(query)}`
    )
    return data.data.map(h => ({
      name: h.name,
      count: h.media_count || 0,
      mediaCount: h.media_count || 0,
    }))
  }

  // ——— Boost/Ads ———

  async boostPost(postId: string, pageId: string, budget: number, days: number): Promise<{ adId: string }> {
    const data = await this.fetch<{ id: string }>(`/act_${pageId}/ads`, {
      method: 'POST',
      body: JSON.stringify({
        name: `Boosted Post ${postId}`,
        object_id: postId,
        lifecycle_events: ['ACTIVE'],
        status: 'ACTIVE',
        creative: { object_id: postId },
        targeting: {},
        bid_amount: Math.round(budget * 100),
        daily_budget: Math.round((budget / days) * 100),
      }),
    })
    return { adId: data.id }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/social/meta.ts src/lib/social/types.ts
git commit -m "feat: add Meta Graph API client and social types"
```

---

### Task 3: Create Social Settings API + Admin Routes

**Files:**
- Create: `src/app/api/admin/social/accounts/route.ts`
- Create: `src/app/api/admin/social/accounts/[id]/route.ts`

- [ ] **Step 1: Create accounts list + add endpoint**

```typescript
// src/app/api/admin/social/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const accounts = await db.socialAccount.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, platform: true, accountName: true, accountId: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { platform, accountId, accountName, accessToken, tokenExpires } = body
  if (!platform || !accountId || !accountName || !accessToken) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const account = await db.socialAccount.create({
    data: { platform, accountId, accountName, accessToken, tokenExpires: tokenExpires ? new Date(tokenExpires) : null },
  })
  return NextResponse.json(account)
}
```

```typescript
// src/app/api/admin/social/accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.socialAccount.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const account = await db.socialAccount.update({ where: { id }, data: body })
  return NextResponse.json(account)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/social/
git commit -m "feat: add social accounts CRUD API"
```

---

### Task 4: Create Social Settings Admin Page

**Files:**
- Create: `src/app/admin/social/layout.tsx`
- Create: `src/app/admin/social/page.tsx`
- Create: `src/app/admin/social/settings/page.tsx`
- Modify: `src/components/admin/AdminShell.tsx`

- [ ] **Step 1: Create social layout**

```typescript
// src/app/admin/social/layout.tsx
export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>
}
```

- [ ] **Step 2: Create social dashboard page**

```typescript
// src/app/admin/social/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SocialDashboard() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/social/accounts')
      .then(r => r.json())
      .then(setAccounts)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold">Social Media</h1>
        <Link href="/admin/social/settings" className="px-4 py-2 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors">
          Settings
        </Link>
      </div>

      {/* Connected accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50">
          <h2 className="font-semibold mb-2">Instagram</h2>
          {accounts.filter(a => a.platform === 'instagram').length > 0 ? (
            accounts.filter(a => a.platform === 'instagram').map(a => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.accountName}</p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Not connected</p>
          )}
        </div>
        <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50">
          <h2 className="font-semibold mb-2">Facebook</h2>
          {accounts.filter(a => a.platform === 'facebook').length > 0 ? (
            accounts.filter(a => a.platform === 'facebook').map(a => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.accountName}</p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Not connected</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/social/posts', label: 'Posts', desc: 'Create & schedule' },
          { href: '/admin/social/comments', label: 'Comments', desc: 'Moderate replies' },
          { href: '/admin/social/analytics', label: 'Analytics', desc: 'Performance data' },
          { href: '/admin/social/campaigns', label: 'Campaigns', desc: 'Automated marketing' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/60 transition-colors">
            <h3 className="font-medium text-navy">{item.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create settings page**

```typescript
// src/app/admin/social/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function SocialSettings() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [form, setForm] = useState({ platform: 'instagram', accountId: '', accountName: '', accessToken: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/social/accounts').then(r => r.json()).then(setAccounts).finally(() => setLoading(false))
  }, [])

  async function addAccount() {
    if (!form.accountId || !form.accountName || !form.accessToken) {
      toast.error('All fields required')
      return
    }
    const res = await fetch('/api/admin/social/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Account connected')
      setForm({ platform: 'instagram', accountId: '', accountName: '', accessToken: '' })
      const updated = await fetch('/api/admin/social/accounts').then(r => r.json())
      setAccounts(updated)
    } else {
      toast.error('Failed to connect')
    }
  }

  async function removeAccount(id: string) {
    const res = await fetch(`/api/admin/social/accounts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Account removed')
      setAccounts(accounts.filter(a => a.id !== id))
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-8 p-6 max-w-2xl">
      <h1 className="text-2xl font-display font-semibold">Social Media Settings</h1>

      {/* Connected accounts list */}
      <div className="space-y-3">
        <h2 className="font-semibold">Connected Accounts</h2>
        {accounts.length === 0 && <p className="text-sm text-muted-foreground">No accounts connected yet.</p>}
        {accounts.map(a => (
          <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border/40">
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gold/10 text-gold uppercase mr-2">{a.platform}</span>
              <span className="font-medium">{a.accountName}</span>
            </div>
            <button onClick={() => removeAccount(a.id)} className="text-sm text-destructive hover:underline">Remove</button>
          </div>
        ))}
      </div>

      {/* Add account form */}
      <div className="p-6 rounded-2xl bg-secondary/30 border border-border/30 space-y-4">
        <h2 className="font-semibold">Add Account</h2>
        <select
          value={form.platform}
          onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
          className="w-full p-3 rounded-xl bg-background border border-border text-sm"
        >
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
        </select>
        <input placeholder="Account ID" value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} className="w-full p-3 rounded-xl bg-background border border-border text-sm" />
        <input placeholder="Account Name" value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} className="w-full p-3 rounded-xl bg-background border border-border text-sm" />
        <input placeholder="Access Token" value={form.accessToken} onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))} className="w-full p-3 rounded-xl bg-background border border-border text-sm font-mono" />
        <button onClick={addAccount} className="px-6 py-3 bg-navy text-silver rounded-full text-sm font-medium hover:bg-gold hover:text-navy-deep transition-colors">
          Connect Account
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add "Social" link to AdminShell sidebar**

Find the sidebar navigation in `src/components/admin/AdminShell.tsx` and add a Social link:

```typescript
// Add somewhere in the nav links array:
{ href: '/admin/social', label: 'Social', icon: 'Instagram' }
```

(Adjust based on how the existing sidebar renders links. Follow the same pattern as existing entries.)

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/social/ src/components/admin/AdminShell.tsx
git commit -m "feat: add social media admin panel with settings and dashboard"
```
