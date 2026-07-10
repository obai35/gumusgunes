# Analytics + Campaigns Implementation Plan — SP3

**Dependency:** SP1 (Social Core) must be committed first. Uses SocialAccount, SocialPost, SocialCampaign models and MetaClient.

**Goal:** Analytics dashboard with charts, trend detection, and automated campaign engine.

---

### Task 1: Analytics API Endpoints

**Files:**
- Create: `src/app/api/admin/social/analytics/route.ts`
- Create: `src/app/api/admin/social/analytics/account/[id]/route.ts`
- Create: `src/app/api/admin/social/analytics/trends/route.ts`

- [ ] **Overall analytics endpoint** — Aggregates performance data across all accounts

```typescript
// src/app/api/admin/social/analytics/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [totalPosts, publishedPosts, scheduledPosts, failedPosts, totalAccounts] = await Promise.all([
    db.socialPost.count(),
    db.socialPost.count({ where: { status: 'published' } }),
    db.socialPost.count({ where: { status: 'scheduled' } }),
    db.socialPost.count({ where: { status: 'failed' } }),
    db.socialAccount.count({ where: { isActive: true } }),
  ])

  // Aggregate performance from published posts
  const posts = await db.socialPost.findMany({
    where: { status: 'published', performance: { not: null } },
    select: { performance: true },
  })

  let totalLikes = 0, totalComments = 0, totalShares = 0, totalReach = 0
  for (const p of posts) {
    const perf = p.performance as any
    if (perf) {
      totalLikes += perf.likes || 0
      totalComments += perf.comments || 0
      totalShares += perf.shares || 0
      totalReach += perf.reach || 0
    }
  }

  return NextResponse.json({
    totalPosts,
    publishedPosts,
    scheduledPosts,
    failedPosts,
    totalAccounts,
    totalLikes,
    totalComments,
    totalShares,
    totalReach,
    engagementRate: totalReach > 0 ? ((totalLikes + totalComments + totalShares) / totalReach * 100).toFixed(2) : '0',
  })
}
```

- [ ] **Account-level analytics** — Per-account metrics and post history

```typescript
// src/app/api/admin/social/analytics/account/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = await db.socialAccount.findUnique({ where: { id } })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const posts = await db.socialPost.findMany({
    where: { accountId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, postType: true, status: true, caption: true, publishedAt: true, performance: true, likes: false },
  })

  return NextResponse.json({ account, posts })
}
```

- [ ] **Trends endpoint** — Returns time-series data for reach, engagement, followers

```typescript
// src/app/api/admin/social/analytics/trends/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  const days = parseInt(searchParams.get('days') || '30')

  const posts = await db.socialPost.findMany({
    where: { ...(accountId ? { accountId } : {}), status: 'published' },
    select: { publishedAt: true, performance: true },
    orderBy: { publishedAt: 'asc' },
  })

  // Group by date
  const trendMap = new Map<string, { reach: number; engagement: number; count: number }>()
  for (const p of posts) {
    if (!p.publishedAt || !p.performance) continue
    const date = p.publishedAt.toISOString().split('T')[0]
    const perf = p.performance as any
    const existing = trendMap.get(date) || { reach: 0, engagement: 0, count: 0 }
    existing.reach += perf.reach || 0
    existing.engagement += (perf.likes || 0) + (perf.comments || 0) + (perf.shares || 0)
    existing.count++
    trendMap.set(date, existing)
  }

  const trends = Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      reach: data.reach,
      engagement: data.engagement,
      posts: data.count,
    }))
    .slice(-days)

  return NextResponse.json({ trends })
}
```

- [ ] Commit: `git add src/app/api/admin/social/analytics/ && git commit -m "feat: add social analytics API endpoints"`

---

### Task 2: Analytics Dashboard UI

**File:**
- Create: `src/app/admin/social/analytics/page.tsx`

- [ ] **Analytics dashboard page** with:
  - Summary cards: total posts, published, scheduled, engagement rate
  - Reach trend chart (use recharts LineChart)
  - Engagement breakdown (bar chart)
  - Per-account selector dropdown
  - Post performance table (recent published posts with like/comment/share counts)
- [ ] Commit

---

### Task 3: Campaign Engine

**Files:**
- Create: `src/app/api/admin/social/campaigns/route.ts`
- Create: `src/app/api/admin/social/campaigns/[id]/route.ts`
- Create: `src/lib/social/campaign-engine.ts`

- [ ] **Campaigns CRUD API**

```typescript
// src/app/api/admin/social/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const campaigns = await db.socialCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { posts: true } } },
  })
  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, goal, budget, status, startDate, endDate, triggerType, triggerConfig } = body
  if (!name || !goal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const campaign = await db.socialCampaign.create({
    data: {
      name,
      goal,
      budget: budget || null,
      status: status || 'draft',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      triggerType: triggerType || null,
      triggerConfig: triggerConfig || null,
    },
  })
  return NextResponse.json(campaign)
}
```

```typescript
// src/app/api/admin/social/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await db.socialCampaign.findUnique({
    where: { id },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        include: { account: { select: { accountName: true, platform: true } } },
      },
    },
  })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(campaign)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const campaign = await db.socialCampaign.update({ where: { id }, data: body })
  return NextResponse.json(campaign)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.socialCampaign.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Campaign engine** — Auto-creates posts based on campaign triggers

```typescript
// src/lib/social/campaign-engine.ts
import { db } from '@/lib/db'
import { GroqContentGenerator } from './groq-content'
import { startScheduler } from './scheduler'

const generator = new GroqContentGenerator()

export async function activateCampaign(campaignId: string) {
  const campaign = await db.socialCampaign.findUnique({
    where: { id: campaignId },
    include: { posts: true },
  })
  if (!campaign || campaign.status !== 'active') return

  if (campaign.triggerType === 'scheduled' && campaign.triggerConfig) {
    const config = campaign.triggerConfig as any
    const interval = config.intervalDays || 7
    scheduleRecurringPosts(campaign, interval)
  }

  startScheduler()
}

async function scheduleRecurringPosts(campaign: { id: string; name: string; goal: string }, intervalDays: number) {
  // Find products to feature via product graph
  const products = await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 5,
  })

  const accounts = await db.socialAccount.findMany({ where: { isActive: true } })
  if (accounts.length === 0 || products.length === 0) return

  for (let i = 0; i < 4; i++) {
    const product = products[i % products.length]
    const account = accounts[i % accounts.length]
    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + (i + 1) * intervalDays)

    // Generate AI content
    const content = await generator.generatePost(
      {
        name: product.name,
        description: product.description,
        material: product.material,
        price: product.price,
        tags: JSON.parse(product.tags || '[]'),
      },
      'feed',
      'promotional'
    )

    await db.socialPost.create({
      data: {
        accountId: account.id,
        campaignId: campaign.id,
        platform: account.platform,
        postType: 'feed',
        status: 'scheduled',
        mediaUrls: JSON.stringify([product.imageUrl]),
        caption: content.caption,
        hashtags: JSON.stringify(content.hashtags),
        productIds: JSON.stringify([product.id]),
        scheduledAt,
      },
    })
  }
}
```

- [ ] Commit

---

### Task 4: Campaigns Admin UI

**File:**
- Create: `src/app/admin/social/campaigns/page.tsx`
- Create: `src/app/admin/social/campaigns/new/page.tsx`
- Create: `src/app/admin/social/campaigns/[id]/page.tsx`

- [ ] **Campaigns list page** — Cards/table showing campaigns with status badges, goal, post count
- [ ] **New campaign page** — Form with name, goal, budget, dates, trigger type/config
- [ ] **Campaign detail page** — Show campaign info, list of associated posts, ability to add posts, activate/pause/complete controls
- [ ] Commit
