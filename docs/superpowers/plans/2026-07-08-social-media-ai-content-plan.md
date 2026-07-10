# AI Content + Posts Implementation Plan — SP2

**Dependency:** SP1 (Social Core) must be committed first. This plan uses SocialAccount, SocialPost, SocialDraft models from schema.prisma and MetaClient from `src/lib/social/meta.ts`.

**Goal:** AI-powered content generation using Groq, post CRUD, scheduling queue with in-process timers.

---

### Task 1: Groq AI Content Generator

**Files:**
- Create: `src/lib/social/groq-content.ts`

- [ ] Create a content generator class that:
  - Takes Groq API key from env `GROQ_API_KEY`
  - Uses `@ai-sdk/groq` or direct fetch to `https://api.groq.com/openai/v1/chat/completions`
  - Generates post captions, hashtags, and content ideas
  - Supports tone: luxury, casual, promotional, educational
  - Can generate based on product data (name, description, material, price, tags)

```typescript
// src/lib/social/groq-content.ts
import type { PostType } from './types'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const MODEL = 'llama-3.3-70b-versatile'

export type ContentTone = 'luxury' | 'casual' | 'promotional' | 'educational'
export type GeneratedContent = {
  caption: string
  hashtags: string[]
  ideas?: string[]
}

export class GroqContentGenerator {
  private async generate(prompt: string): Promise<string> {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq API error: ${err}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  async generatePost(
    product: { name: string; description: string; material: string; price: number; tags: string[] },
    postType: PostType,
    tone: ContentTone = 'luxury',
  ): Promise<GeneratedContent> {
    const toneGuide = {
      luxury: 'Elegant, sophisticated, use refined language. Mention exclusivity and craftsmanship.',
      casual: 'Friendly, relatable, use everyday language. Feel like a friend sharing a discovery.',
      promotional: 'Create urgency and excitement. Highlight discounts, limited stock, or special offers.',
      educational: 'Informative and helpful. Explain the product features, materials, or styling tips.',
    }

    const prompt = `You are a social media content creator for "${product.name}", a jewelry product.

Product details:
- Name: ${product.name}
- Description: ${product.description}
- Material: ${product.material}
- Price: $${product.price}
- Tags: ${product.tags.join(', ')}

Generate a social media post (${postType}) with ${toneGuide[tone]}.

Return JSON with:
{
  "caption": "The post caption text. For feed posts, use 2-3 short paragraphs. For reels, use a hook + 1 paragraph.",
  "hashtags": ["5-8 relevant hashtags"],
  "ideas": ["2-3 additional caption variations or content ideas"]
}`

    const raw = await this.generate(prompt)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return { caption: raw, hashtags: ['#jewelry', '#luxury'], ideas: [] }
    }
  }

  async generateCaption(productName: string, tone: ContentTone = 'luxury'): Promise<string> {
    const prompt = `Write a captivating ${tone} social media caption for "${productName}" jewelry. Keep it under 150 characters. Just return the caption text.`
    return (await this.generate(prompt)).trim()
  }

  async generateHashtags(product: { name: string; material: string; tags: string[] }, count = 8): Promise<string[]> {
    const prompt = `Generate ${count} hashtags for a jewelry product named "${product.name}" made of ${product.material}. Tags: ${product.tags.join(', ')}. Return as a JSON array of strings.`
    const raw = await this.generate(prompt)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return ['#jewelry', '#luxury', '#fashion']
    }
  }
}
```

- [ ] Commit: `git add src/lib/social/groq-content.ts && git commit -m "feat: add Groq AI content generator for social posts"`

---

### Task 2: Social Posts CRUD API

**Files:**
- Create: `src/app/api/admin/social/posts/route.ts`
- Create: `src/app/api/admin/social/posts/[id]/route.ts`

- [ ] **Posts list + create endpoint**

```typescript
// src/app/api/admin/social/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const accountId = searchParams.get('accountId')
  const where: any = {}
  if (status) where.status = status
  if (accountId) where.accountId = accountId

  const posts = await db.socialPost.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { account: { select: { accountName: true, platform: true } } },
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { accountId, platform, postType, status, mediaUrls, caption, hashtags, productIds, discountId, scheduledAt } = body
  if (!platform || !postType || !mediaUrls) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const post = await db.socialPost.create({
    data: {
      accountId: accountId || null,
      platform,
      postType,
      status: status || 'draft',
      mediaUrls: JSON.stringify(mediaUrls),
      caption: caption || null,
      hashtags: hashtags ? JSON.stringify(hashtags) : null,
      productIds: productIds ? JSON.stringify(productIds) : null,
      discountId: discountId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  })
  return NextResponse.json(post)
}
```

```typescript
// src/app/api/admin/social/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await db.socialPost.findUnique({
    where: { id },
    include: { account: true, campaign: true },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const post = await db.socialPost.update({ where: { id }, data: body })
  return NextResponse.json(post)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.socialPost.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] Commit: `git add src/app/api/admin/social/posts/ && git commit -m "feat: add social posts CRUD API"`

---

### Task 3: Social Drafts API

**Files:**
- Create: `src/app/api/admin/social/drafts/route.ts`
- Create: `src/app/api/admin/social/drafts/[id]/route.ts`

Similar pattern to Posts but for the SocialDraft model — CRUD for draft content that hasn't been associated with a specific account yet. Follow the same RESTful pattern as Posts API.

- [ ] Create drafts list + create endpoint (GET, POST)
- [ ] Create drafts detail + update + delete endpoint (GET, PATCH, DELETE)
- [ ] Commit

---

### Task 4: Post Scheduler (In-Process Queue)

**File:**
- Create: `src/lib/social/scheduler.ts`

- [ ] Schedule function using in-process timer (setTimeout/setInterval)
- [ ] Scans for posts where `status = 'scheduled'` and `scheduledAt <= now()`
- [ ] Uses MetaClient to publish, updates status to 'published' or 'failed'

```typescript
// src/lib/social/scheduler.ts
import { db } from '@/lib/db'
import { MetaClient } from './meta'

const POLL_INTERVAL = 60_000 // 1 minute
let intervalHandle: ReturnType<typeof setInterval> | null = null

export function startScheduler() {
  if (intervalHandle) return
  intervalHandle = setInterval(processQueue, POLL_INTERVAL)
  processQueue().catch(console.error) // immediate first run
}

export function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}

async function processQueue() {
  const now = new Date()
  const due = await db.socialPost.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
    },
    include: { account: true },
  })

  for (const post of due) {
    if (!post.account || !post.account.isActive) {
      await db.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed', errorLog: 'Account inactive or missing' },
      })
      continue
    }

    await db.socialPost.update({
      where: { id: post.id },
      data: { status: 'publishing' },
    })

    try {
      const client = new MetaClient(post.account.accessToken)
      const mediaUrls = JSON.parse(post.mediaUrls || '[]') as string[]
      let result: { id: string }

      if (post.platform === 'instagram') {
        if (post.postType === 'carousel' && mediaUrls.length > 1) {
          result = await client.publishCarouselToInstagram(post.account.accountId, mediaUrls, post.caption || '')
        } else if (post.postType === 'reel') {
          result = await client.publishToInstagram(post.account.accountId, mediaUrls[0], post.caption || '')
        } else {
          result = await client.publishToInstagram(post.account.accountId, mediaUrls[0], post.caption || '')
        }
      } else {
        if (post.postType === 'carousel' && mediaUrls.length > 1) {
          result = await client.createCarouselPost(post.account.accountId, mediaUrls, post.caption || '')
        } else {
          result = await client.createFeedPost(post.account.accountId, mediaUrls[0], post.caption || '')
        }
      }

      await db.socialPost.update({
        where: { id: post.id },
        data: {
          status: 'published',
          platformPostId: result.id,
          publishedAt: new Date(),
        },
      })
    } catch (err: any) {
      await db.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed', errorLog: err.message },
      })
    }
  }
}
```

Call `startScheduler()` on app initialization (e.g., in a layout or the social page).

- [ ] Commit: `git add src/lib/social/scheduler.ts && git commit -m "feat: add in-process post scheduler queue"`

---

### Task 5: Posts Admin UI

**Files:**
- Create: `src/app/admin/social/posts/page.tsx`
- Create: `src/app/admin/social/posts/new/page.tsx`
- Create: `src/app/admin/social/posts/[id]/page.tsx`

- [ ] **Posts list page** — Table/cards showing posts with status badges, filters for status and platform, links to edit/view
- [ ] **New post page** — Form with platform selector, post type, media URL input, caption textarea, hashtags, scheduling, account selector. Integration with GroqContentGenerator for AI-assisted caption and hashtags
- [ ] **Edit post page** — Same form, pre-filled, with status management and publish button
- [ ] Commit

---

### Task 6: Comments Management UI

**File:**
- Create: `src/app/admin/social/comments/page.tsx`

- [ ] Comments inbox page that:
  - Lets you select an account and post
  - Fetches comments via MetaClient
  - Shows threaded replies
  - Has reply input to respond inline
- [ ] Commit
