# Social Media Manager — Design

**Date:** 2026-07-08
**Status:** Draft

## Overview

An AI-powered social media management panel integrated into the Gümüş Güneş admin. Connects Instagram and Facebook, manages posts, schedules content with an in-process queue, AI-generates captions/hashtags/campaigns, monitors trends, and runs automated marketing campaigns — all from a standalone admin section.

## Architecture

```
Admin UI (src/app/admin/social/)
  ↓
API routes (src/app/api/admin/social/)
  ↓
Service layer (src/lib/social/)
  ├── meta.ts        ← Facebook Graph API wrapper
  ├── ai.ts          ← Groq-powered content generator
  ├── queue.ts       ← In-process scheduler
  ├── trends.ts      ← Trend detection + analysis
  └── campaign.ts    ← Campaign execution engine
  ↓
Prisma + PostgreSQL  ← SocialAccount, SocialPost, SocialCampaign, SocialDraft
  ↓
External APIs
  ├── Meta Graph API (graph.facebook.com/v22.0) — Instagram + Facebook
  ├── Groq (llama-3.3-70b-versatile) — AI generation
  └── Meta Ads API — post boosting/promotion
```

## Data Model

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
  mediaUrls      String         // JSON array of image URLs
  caption        String?
  hashtags       String?        // JSON array
  productIds     String?        // JSON array — linked products
  discountId     String?
  discount       Discount?      @relation(fields: [discountId], references: [id])
  scheduledAt    DateTime?
  publishedAt    DateTime?
  platformPostId String?        // ID returned by Meta API
  permalink      String?        // URL to published post
  performance    Json?          // { likes, comments, shares, saves, reach, impressions }
  errorLog       String?        // error messages from failed publish attempts
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([status, scheduledAt])
  @@index([accountId, status])
}

model SocialDraft {
  id         String   @id @default(cuid())
  title      String?  // internal note
  mediaUrls  String   // JSON array
  caption    String?
  hashtags   String?
  productIds String?  // JSON array
  discountId String?
  platforms  String   // JSON array: ["instagram", "facebook"]
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
  triggerType   String?  // manual | trend | stock | discount | time
  triggerConfig Json?    // { minDailySales, trendKeyword, stockBelow }
  posts         SocialPost[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Service Layer

### `lib/social/meta.ts` — Meta API Wrapper

```typescript
// Core client
class MetaClient {
  constructor(accessToken: string)
  
  // Posts
  async createFeedPost(accountId: string, mediaUrl: string, caption: string): Promise<{ id, permalink }>
  async createCarouselPost(accountId: string, mediaUrls: string[], caption: string): Promise<{ id, permalink }>
  async createReel(accountId: string, videoUrl: string, caption: string): Promise<{ id, permalink }>
  
  // Comments
  async getComments(postId: string): Promise<Comment[]>
  async replyToComment(commentId: string, message: string): Promise<void>
  
  // Insights
  async getPostInsights(postId: string): Promise<PostInsights>
  async getAccountInsights(accountId: string, period: 'day' | 'week' | 'month'): Promise<AccountInsights>
  async getReachTrend(accountId: string, days: number): Promise<TrendPoint[]>
  
  // Ads
  async boostPost(postId: string, budget: number, days: number): Promise<{ adId }>
  
  // Hashtag research
  async searchHashtags(query: string): Promise<HashtagSuggestion[]>
}

type PostInsights = {
  likes: number; comments: number; shares: number; saves: number;
  reach: number; impressions: number; engagement: number;
}

type AccountInsights = {
  followerCount: number; followerGrowth: number;
  profileViews: number; reach: number; impressions: number;
}
```

### `lib/social/ai.ts` — AI Content Generator

Uses Groq (llama-3.3-70b-versatile) with a system prompt that includes:

- Current store context (best sellers, low stock, new arrivals, active discounts)
- Past post performance data (what's working)
- Meta algorithm best practices
- Brand voice and tone guidelines
- Trending topics in jewelry/fashion
- Platform-specific formats (carousels, reels, single image)

**Tools the AI can call:**

| Tool | Description |
|------|-------------|
| `getBestSellers(limit?)` | Top products by sales volume |
| `getLowStock(threshold?)` | Products running low |
| `getNewArrivals(days?)` | Recently added products |
| `getActiveDiscounts()` | Current promotions with codes |
| `getPastPostPerformance(limit?)` | Best-performing past posts |
| `getTrendingProducts()` | Most viewed/searched this week |
| `getInventoryStatus(categoryId?)` | Stock levels by category |
| `getTrendingHashtags(keyword?)` | Trending hashtag suggestions |
| `getSeasonalEvents()` | Upcoming occasions (Eid, Valentine's, etc.) |
| `suggestPost(style, products[], goal)` | Generate full post: caption + hashtags + media suggestion |
| `suggestReel(productId, trend)` | Suggest reel concept with audio trend |

**Example AI call:**
```
User clicks "Suggest a post" in the panel
→ AI receives: ["getBestSellers(5)", "getActiveDiscounts()", "getTrendingHashtags('gold')"]
→ AI generates:
  {
    postType: 'carousel',
    products: ['product-a', 'product-b', 'product-c'], // 3 best sellers
    discount: 'discount-id',
    caption: 'Our most-loved gold pieces are back... ✨',
    hashtags: ['#GoldJewelry', '#JewelryLover', '#BridalCollection', '#GümüşGüneş'],
    bestTime: '7:00 PM',
    reasoning: 'Carousel posts with 3+ products get 40% more saves. Bridal season starts next week.'
  }
```

### `lib/social/queue.ts` — In-Process Scheduler

```
setInterval check every 60 seconds:
  → SELECT * FROM SocialPost WHERE status = 'scheduled' AND scheduledAt <= NOW()
  → For each post:
      → Upload media to Meta
      → Create post via Meta API
      → Update status to 'published'
      → Store platformPostId + permalink
      → Log errors to errorLog
```

### `lib/social/trends.ts` — Trend Detection

- Tracks product view/search spikes (from site analytics)
- Monitors trending hashtags via Meta API
- Compares current engagement baselines against historical averages
- Fires trigger events when thresholds are crossed

### `lib/social/campaign.ts` — Campaign Engine

- Reads `SocialCampaign.triggerConfig`
- Polls conditions (stock levels, trend signals, dates)
- When conditions met: creates `SocialPost` entries, AI generates content, adds to queue
- Tracks campaign ROAS (return on ad spend) via promoted post performance

## Admin UI Pages

Standalone pages under `src/app/admin/social/`:

| Route | Page | Description |
|-------|------|-------------|
| `/admin/social` | Dashboard | Overview: connected accounts, scheduled posts, pending comments, quick stats |
| `/admin/social/posts` | Posts | List all posts (drafts, scheduled, published). Filter by status, platform |
| `/admin/social/posts/new` | Create Post | Manual post creation + AI suggestion. Select products, discount, write/edit caption |
| `/admin/social/posts/schedule` | Calendar | Visual calendar of scheduled posts |
| `/admin/social/comments` | Comments | Unified inbox across Instagram + Facebook. Reply inline |
| `/admin/social/analytics` | Analytics | Graphs: reach, engagement, follower growth, top posts. Filter by date range |
| `/admin/social/campaigns` | Campaigns | List + create campaigns. View performance |
| `/admin/social/trends` | Trends | Trending products, hashtags, seasonal events |
| `/admin/social/settings` | Settings | Connect/disconnect accounts, configure AI voice, set default hashtags |

## API Endpoints

All under `/api/admin/social/`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/social/accounts` | List connected accounts |
| POST | `/api/admin/social/accounts` | Add account (token) |
| DELETE | `/api/admin/social/accounts/:id` | Disconnect account |
| GET | `/api/admin/social/posts` | List posts (paginated, filtered) |
| POST | `/api/admin/social/posts` | Create post (draft, scheduled, or immediate) |
| PUT | `/api/admin/social/posts/:id` | Update post |
| DELETE | `/api/admin/social/posts/:id` | Delete post |
| POST | `/api/admin/social/posts/:id/publish` | Publish now |
| POST | `/api/admin/social/posts/:id/boost` | Boost post with budget |
| GET | `/api/admin/social/posts/:id/comments` | Get post comments |
| POST | `/api/admin/social/comments/:id/reply` | Reply to comment |
| GET | `/api/admin/social/analytics/overview` | Dashboard stats |
| GET | `/api/admin/social/analytics/reach` | Reach trend data |
| GET | `/api/admin/social/analytics/engagement` | Engagement data |
| GET | `/api/admin/social/trends/products` | Trending products |
| GET | `/api/admin/social/trends/hashtags` | Trending hashtags |
| POST | `/api/admin/social/ai/suggest` | AI suggest a post |
| POST | `/api/admin/social/ai/rewrite-caption` | AI improve a caption |
| POST | `/api/admin/social/ai/generate-hashtags` | AI generate hashtags |
| GET | `/api/admin/social/campaigns` | List campaigns |
| POST | `/api/admin/social/campaigns` | Create campaign |
| PUT | `/api/admin/social/campaigns/:id` | Update campaign |
| POST | `/api/admin/social/campaigns/:id/activate` | Activate auto-trigger |

## Frontend Tech

- **Charts:** `recharts` (already installed) — line charts for reach/engagement, bar charts for top posts, pie charts for platform breakdown
- **Calendar:** Custom grid view for scheduling
- **Media preview:** `next/image` for product image selection
- **AI suggestion UI:** Side panel or modal showing AI-generated content with accept/edit/reject buttons
- **Comment inbox:** Threaded view, real-time (poll every 30s)

## Files to Create/Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add SocialAccount, SocialPost, SocialDraft, SocialCampaign models |
| `src/lib/social/meta.ts` | Create — Meta Graph API client |
| `src/lib/social/ai.ts` | Create — Groq-powered AI content generator with tools |
| `src/lib/social/queue.ts` | Create — In-process scheduler |
| `src/lib/social/trends.ts` | Create — Trend detection |
| `src/lib/social/campaign.ts` | Create — Campaign engine |
| `src/lib/social/types.ts` | Create — Shared types |
| `src/app/admin/social/layout.tsx` | Create — Social panel layout |
| `src/app/admin/social/page.tsx` | Create — Dashboard |
| `src/app/admin/social/posts/page.tsx` | Create — Posts list |
| `src/app/admin/social/posts/new/page.tsx` | Create — Create post with AI |
| `src/app/admin/social/comments/page.tsx` | Create — Comment inbox |
| `src/app/admin/social/analytics/page.tsx` | Create — Analytics |
| `src/app/admin/social/campaigns/page.tsx` | Create — Campaigns |
| `src/app/admin/social/trends/page.tsx` | Create — Trends |
| `src/app/admin/social/settings/page.tsx` | Create — Settings |
| `src/app/api/admin/social/...` | Create — All API routes |
| `src/components/admin/AdminShell.tsx` | Add "Social" link to sidebar |

## Future Considerations (out of scope)

- TikTok integration (different API, different auth)
- Multi-user collaboration on posts
- A/B testing for captions
- Automatic post-generation on product launch
- Integration with the product knowledge graph for smarter recommendations
- Redis-backed queue for production scheduling at scale
