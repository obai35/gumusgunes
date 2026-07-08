# Product Knowledge Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a PostgreSQL-native product knowledge graph with typed relationships (`MATCHES`, `COMPLEMENTS`, `SIMILAR_TO`, `ALSO_BOUGHT`, `OCCASION`, `COLLECTION`) and vector similarity to power recommendations, "complete the look," and smarter search.

**Architecture:** Two new Prisma models (`ProductRelation`, `ProductEmbedding`) store directed typed edges and pgvector strings. A `lib/product-graph.ts` service handles queries and mutations. An ONNX-based seed script generates relationships via rules + AI similarity. API endpoints serve results to the frontend.

**Tech Stack:** Prisma + PostgreSQL + pgvector + `@huggingface/transformers` (ONNX) + Next.js API routes

---

### Task 1: Add Prisma Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add RelationType enum and ProductRelation + ProductEmbedding models**

Add after the `Product` model block (before `Category` model):

```prisma
enum RelationType {
  MATCHES
  COMPLEMENTS
  SIMILAR_TO
  ALSO_BOUGHT
  OCCASION
  COLLECTION
}

model ProductRelation {
  id        String       @id @default(cuid())
  fromId    String
  from      Product      @relation("FromProduct", fields: [fromId], references: [id], onDelete: Cascade)
  toId      String
  to        Product      @relation("ToProduct", fields: [toId], references: [id], onDelete: Cascade)
  type      RelationType
  weight    Float        @default(1.0)
  metadata  Json?
  createdAt DateTime     @default(now())

  @@unique([fromId, toId, type])
  @@index([fromId, type, weight])
  @@index([toId, type])
}

model ProductEmbedding {
  id        String   @id @default(cuid())
  productId String   @unique
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  vector    String
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Enable pgvector extension**

Run this SQL against the database to enable the pgvector extension (required for vector similarity queries):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run via:
```bash
npx prisma db execute --stdin <<< "CREATE EXTENSION IF NOT EXISTS vector;"
```

Or connect directly: `psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"`

- [ ] **Step 3: Run Prisma migration**

```bash
npx prisma migrate dev --name add-product-graph
```

Expected: Migration `add-product-graph` created and applied. `prisma generate` runs automatically.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ProductRelation and ProductEmbedding models"
```

---

### Task 2: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install ONNX transformer library**

```bash
npm install @huggingface/transformers
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @huggingface/transformers for ONNX embeddings"
```

---

### Task 3: Build Product Graph Service

**Files:**
- Create: `src/lib/product-graph.ts`

- [ ] **Step 1: Create the product graph service**

```typescript
import { prisma } from './db'
import type { Product } from './types'

export type RelationType = 'MATCHES' | 'COMPLEMENTS' | 'SIMILAR_TO' | 'ALSO_BOUGHT' | 'OCCASION' | 'COLLECTION'

export type RelatedQuery = {
  productId: string
  types?: RelationType[]
  limit?: number
  minWeight?: number
}

export type GraphRelation = {
  id: string
  fromId: string
  toId: string
  type: RelationType
  weight: number
  metadata: Record<string, any> | null
}

export async function getRelated(query: RelatedQuery): Promise<(Product & { relationWeight: number })[]> {
  const { productId, types, limit = 8, minWeight = 0.5 } = query
  const results = await prisma.$queryRaw<any[]>`
    SELECT p.*, r.weight as "relationWeight"
    FROM "ProductRelation" r
    JOIN "Product" p ON p.id = r."toId"
    WHERE r."fromId" = ${productId}
      AND (${types?.length} = 0 OR r.type = ANY(${types}::text[]))
      AND r.weight >= ${minWeight}
      AND p."isActive" = true
    ORDER BY r.weight DESC
    LIMIT ${limit}
  `
  return results.map(normalizeProductWithWeight)
}

export async function getSemanticSimilar(productId: string, limit = 6): Promise<Product[]> {
  const source = await prisma.productEmbedding.findUnique({ where: { productId } })
  if (!source) return []

  const results = await prisma.$queryRaw<any[]>`
    SELECT p.*
    FROM "ProductEmbedding" e
    JOIN "Product" p ON p.id = e."productId"
    WHERE e."productId" != ${productId}
      AND p."isActive" = true
    ORDER BY e.vector <=> ${source.vector}::vector
    LIMIT ${limit}
  `
  return results.map(normalizeProduct)
}

export async function getCompleteLook(productId: string, limit = 4): Promise<(Product & { relationWeight: number })[]> {
  return getRelated({ productId, types: ['COMPLEMENTS'], limit, minWeight: 0.5 })
}

export async function getMatches(productId: string, limit = 4): Promise<(Product & { relationWeight: number })[]> {
  return getRelated({ productId, types: ['MATCHES'], limit, minWeight: 0.5 })
}

export async function addRelation(
  fromId: string,
  toId: string,
  type: RelationType,
  weight = 1.0,
  metadata?: Record<string, any>
): Promise<GraphRelation> {
  const result = await prisma.$executeRaw`
    INSERT INTO "ProductRelation" ("id", "fromId", "toId", "type", "weight", "metadata", "createdAt")
    VALUES (gen_random_uuid(), ${fromId}, ${toId}, ${type}::"RelationType", ${weight}, ${metadata ? JSON.stringify(metadata) : null}::jsonb, NOW())
    ON CONFLICT ("fromId", "toId", "type")
    DO UPDATE SET "weight" = ${weight}, "metadata" = ${metadata ? JSON.stringify(metadata) : null}::jsonb
    RETURNING *
  `
  return result[0]
}

export async function removeRelation(id: string): Promise<void> {
  await prisma.productRelation.delete({ where: { id } })
}

export async function addAlsoBought(productIds: string[]): Promise<void> {
  const pairs: { fromId: string; toId: string }[] = []
  for (let i = 0; i < productIds.length; i++) {
    for (let j = 0; j < productIds.length; j++) {
      if (i !== j) pairs.push({ fromId: productIds[i], toId: productIds[j] })
    }
  }
  if (pairs.length === 0) return

  const now = new Date()
  for (const pair of pairs) {
    const existing = await prisma.$queryRaw<{ cnt: number }[]>`
      SELECT COUNT(*)::int as cnt FROM "ProductRelation"
      WHERE "fromId" = ${pair.fromId} AND "toId" = ${pair.toId} AND "type" = 'ALSO_BOUGHT'::"RelationType"
    `
    if (existing[0].cnt > 0) {
      await prisma.$executeRaw`
        UPDATE "ProductRelation"
        SET weight = weight + 0.1, "metadata" = jsonb_set(COALESCE("metadata", '{}'::jsonb), '{lastOrder}', ${JSON.stringify(now.toISOString())}::jsonb)
        WHERE "fromId" = ${pair.fromId} AND "toId" = ${pair.toId} AND "type" = 'ALSO_BOUGHT'::"RelationType"
      `
    } else {
      await addRelation(pair.fromId, pair.toId, 'ALSO_BOUGHT', 0.5, { lastOrder: now.toISOString() })
    }
  }
}

function normalizeProduct(row: any): Product {
  const { relationWeight, ...rest } = row
  return {
    id: rest.id,
    name: rest.name,
    slug: rest.slug,
    description: rest.description,
    price: Number(rest.price),
    compareAtPrice: rest.compareAtPrice ? Number(rest.compareAtPrice) : null,
    sku: rest.sku,
    categoryId: rest.categoryId,
    imageUrl: rest.imageUrl,
    images: typeof rest.images === 'string' ? JSON.parse(rest.images) : rest.images,
    material: rest.material,
    weight: rest.weight,
    rating: Number(rest.rating),
    reviewCount: rest.reviewCount,
    stock: rest.stock,
    tags: typeof rest.tags === 'string' ? JSON.parse(rest.tags) : rest.tags,
    isActive: rest.isActive,
    isFeatured: rest.isFeatured,
    isNew: rest.isNew,
    isBestseller: rest.isBestseller,
    createdAt: rest.createdAt,
    updatedAt: rest.updatedAt,
  }
}

function normalizeProductWithWeight(row: any): Product & { relationWeight: number } {
  return {
    ...normalizeProduct(row),
    relationWeight: Number(row.relationWeight),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/product-graph.ts
git commit -m "feat: add product graph service with typed relations and vector similarity"
```

---

### Task 4: Create Seed Script

**Files:**
- Create: `prisma/seed-graph.ts`
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Create the graph seed script**

```typescript
import { PrismaClient } from '@prisma/client'
import { pipeline } from '@huggingface/transformers'

const prisma = new PrismaClient()

type RelationType = 'MATCHES' | 'COMPLEMENTS' | 'SIMILAR_TO' | 'ALSO_BOUGHT' | 'OCCASION' | 'COLLECTION'
type RelationInput = { fromId: string; toId: string; type: RelationType; weight: number; metadata?: any }

async function main() {
  const rebuild = process.argv.includes('--rebuild')
  if (rebuild) {
    console.log('Clearing existing relations and embeddings...')
    await prisma.productRelation.deleteMany()
    await prisma.productEmbedding.deleteMany()
  }

  const products = await prisma.product.findMany({
    include: { category: true },
    where: { isActive: true },
  })

  console.log(`Processing ${products.length} products...`)

  const relations: RelationInput[] = []
  const productMap = new Map(products.map(p => [p.id, p]))

  // Rule-based relations
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i]
      const b = products[j]

      // Same material → MATCHES
      if (a.material === b.material) {
        relations.push({ fromId: a.id, toId: b.id, type: 'MATCHES', weight: 1.0 })
        relations.push({ fromId: b.id, toId: a.id, type: 'MATCHES', weight: 1.0 })
      }

      // Same category → SIMILAR_TO
      if (a.categoryId === b.categoryId) {
        relations.push({ fromId: a.id, toId: b.id, type: 'SIMILAR_TO', weight: 0.8 })
        relations.push({ fromId: b.id, toId: a.id, type: 'SIMILAR_TO', weight: 0.8 })
      }

      // Different category, same material → COMPLEMENTS
      if (a.categoryId !== b.categoryId && a.material === b.material) {
        relations.push({ fromId: a.id, toId: b.id, type: 'COMPLEMENTS', weight: 0.9 })
        relations.push({ fromId: b.id, toId: a.id, type: 'COMPLEMENTS', weight: 0.9 })
      }

      // Shared tags → SIMILAR_TO
      const aTags: string[] = typeof a.tags === 'string' ? JSON.parse(a.tags) : a.tags
      const bTags: string[] = typeof b.tags === 'string' ? JSON.parse(b.tags) : b.tags
      const sharedTags = aTags.filter(t => bTags.includes(t))
      if (sharedTags.length > 0 && a.categoryId !== b.categoryId) {
        relations.push({ fromId: a.id, toId: b.id, type: 'SIMILAR_TO', weight: 0.7 })
        relations.push({ fromId: b.id, toId: a.id, type: 'SIMILAR_TO', weight: 0.7 })
      }

      // Occasion tags → OCCASION
      const occasions = ['bridal', 'wedding', 'anniversary', 'everyday', 'casual', 'formal', 'party', 'gift']
      const aOccasion = aTags.filter(t => occasions.includes(t.toLowerCase()))
      const bOccasion = bTags.filter(t => occasions.includes(t.toLowerCase()))
      if (aOccasion.length > 0 && bOccasion.length > 0 && aOccasion.some(o => bOccasion.includes(o))) {
        relations.push({ fromId: a.id, toId: b.id, type: 'OCCASION', weight: 0.8, metadata: { occasions: aOccasion.filter(o => bOccasion.includes(o)) } })
        relations.push({ fromId: b.id, toId: a.id, type: 'OCCASION', weight: 0.8, metadata: { occasions: aOccasion.filter(o => bOccasion.includes(o)) } })
      }

      // Collection name in tags → COLLECTION
      const collectionTags = aTags.filter(t => !occasions.includes(t.toLowerCase()) && t !== a.material.toLowerCase())
      const bCollectionTags = bTags.filter(t => !occasions.includes(t.toLowerCase()) && t !== b.material.toLowerCase())
      if (collectionTags.some(t => bCollectionTags.includes(t))) {
        relations.push({ fromId: a.id, toId: b.id, type: 'COLLECTION', weight: 1.0 })
        relations.push({ fromId: b.id, toId: a.id, type: 'COLLECTION', weight: 1.0 })
      }
    }
  }

  // AI embedding similarity
  console.log('Generating embeddings with ONNX...')
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const tags: string[] = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags
    const text = `${p.name} ${p.material} ${p.category?.name || ''} ${tags.join(' ')}`
    const output = await extractor(text, { pooling: 'mean', normalize: true })
    const embedding = Array.from(output.data)
    const vectorStr = `[${embedding.join(',')}]`

    await prisma.$executeRaw`
      INSERT INTO "ProductEmbedding" ("id", "productId", "vector", "updatedAt")
      VALUES (gen_random_uuid(), ${p.id}, ${vectorStr}::vector, NOW())
      ON CONFLICT ("productId")
      DO UPDATE SET "vector" = ${vectorStr}::vector, "updatedAt" = NOW()
    `
  }

  // Compute top-5 similarity edges per product
  console.log('Computing similarity edges...')
  for (const p of products) {
    const source = await prisma.productEmbedding.findUnique({ where: { productId: p.id } })
    if (!source) continue

    const similar = await prisma.$queryRaw<{ id: string; similarity: number }[]>`
      SELECT e."productId" as id, 1 - (e.vector <=> ${source.vector}::vector) as similarity
      FROM "ProductEmbedding" e
      WHERE e."productId" != ${p.id}
      ORDER BY similarity DESC
      LIMIT 5
    `

    for (const s of similar) {
      if (s.similarity >= 0.5) {
        relations.push({ fromId: p.id, toId: s.id, type: 'SIMILAR_TO', weight: Math.round(s.similarity * 100) / 100 })
      }
    }
  }

  // Batch insert all relations (deduplicated)
  console.log(`Inserting ${relations.length} relations...`)
  const seen = new Set<string>()
  let inserted = 0
  for (const r of relations) {
    const key = `${r.fromId}:${r.toId}:${r.type}`
    if (seen.has(key)) continue
    seen.add(key)

    try {
      await prisma.$executeRaw`
        INSERT INTO "ProductRelation" ("id", "fromId", "toId", "type", "weight", "metadata", "createdAt")
        VALUES (gen_random_uuid(), ${r.fromId}, ${r.toId}, ${r.type}::"RelationType", ${r.weight}, ${r.metadata ? JSON.stringify(r.metadata) : null}::jsonb, NOW())
        ON CONFLICT ("fromId", "toId", "type") DO NOTHING
      `
      inserted++
    } catch (err) {
      console.warn(`Failed to insert relation ${key}:`, err)
    }
  }

  console.log(`Done. Inserted ${inserted} relations for ${products.length} products.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Append graph seed to existing seed.ts**

Edit `prisma/seed.ts` — add at the end, before the final `catch`:

```typescript
import('./seed-graph').catch(() => {
  console.log('Graph seed skipped (no product graph yet)')
})
```

- [ ] **Step 3: Commit**

```bash
git add prisma/seed-graph.ts prisma/seed.ts
git commit -m "feat: add graph seed script with rules + ONNX embeddings"
```

---

### Task 5: Create Related Products API

**Files:**
- Create: `src/app/api/products/[id]/related/route.ts`

- [ ] **Step 1: Create the related products endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getRelated } from '@/lib/product-graph'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '8', 10)

  const products = await getRelated({
    productId: id,
    types: type ? [type as any] : undefined,
    limit,
  })

  return NextResponse.json(products)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/products/[id]/related/route.ts
git commit -m "feat: add GET /api/products/:id/related endpoint"
```

---

### Task 6: Create Similar Products API

**Files:**
- Create: `src/app/api/products/[id]/similar/route.ts`

- [ ] **Step 1: Create the semantic similarity endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSemanticSimilar } from '@/lib/product-graph'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const limit = parseInt(new URL(req.url).searchParams.get('limit') || '6', 10)

  const products = await getSemanticSimilar(id, limit)
  return NextResponse.json(products)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/products/[id]/similar/route.ts
git commit -m "feat: add GET /api/products/:id/similar endpoint"
```

---

### Task 7: Create Complete-the-Look API

**Files:**
- Create: `src/app/api/products/[id]/complete-look/route.ts`

- [ ] **Step 1: Create the complete-look endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCompleteLook } from '@/lib/product-graph'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const limit = parseInt(new URL(req.url).searchParams.get('limit') || '4', 10)

  const products = await getCompleteLook(id, limit)
  return NextResponse.json(products)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/products/[id]/complete-look/route.ts
git commit -m "feat: add GET /api/products/:id/complete-look endpoint"
```

---

### Task 8: Create Admin Graph Relation API

**Files:**
- Create: `src/app/api/graph/relation/route.ts`

- [ ] **Step 1: Create the admin graph relation CRUD endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { addRelation, removeRelation } from '@/lib/product-graph'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fromId, toId, type, weight, metadata } = body

  if (!fromId || !toId || !type) {
    return NextResponse.json({ error: 'fromId, toId, and type are required' }, { status: 400 })
  }

  const relation = await addRelation(fromId, toId, type, weight, metadata)
  return NextResponse.json(relation)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  await removeRelation(id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/graph/relation/route.ts
git commit -m "feat: add admin graph relation CRUD endpoints"
```

---

### Task 9: Integrate with Product Detail Page

**Files:**
- Modify: `src/app/products/[id]/ProductDetailClient.tsx`

- [ ] **Step 1: Replace static related prop with live graph data + complete look**

Replace the current `related` usage with live fetches. At the top of the component, add graph data fetching:

```typescript
import { useEffect, useState } from 'react'
```

Add state after the existing state declarations (after line 29 `const [zoomPos, setZoomPos]`):

```typescript
const [graphMatches, setGraphMatches] = useState<Product[]>([])
const [graphCompleteLook, setGraphCompleteLook] = useState<Product[]>([])
const [graphLoading, setGraphLoading] = useState(true)

useEffect(() => {
  async function loadGraph() {
    try {
      const [matchesRes, lookRes] = await Promise.all([
        fetch(`/api/products/${product.id}/related?type=MATCHES&limit=4`),
        fetch(`/api/products/${product.id}/complete-look?limit=4`),
      ])
      if (matchesRes.ok) setGraphMatches(await matchesRes.json())
      if (lookRes.ok) setGraphCompleteLook(await lookRes.json())
    } catch {
      // fall back to static related prop
    } finally {
      setGraphLoading(false)
    }
  }
  loadGraph()
}, [product.id])
```

- [ ] **Step 2: Replace the related products section**

Replace the current related products section (lines 222-238):

```typescript
{graphCompleteLook.length > 0 && (
  <div>
    <h3 className="font-display text-lg font-semibold text-navy mb-3">{t('products.completeTheLook')}</h3>
    <div className="grid grid-cols-4 gap-2">
      {graphCompleteLook.map((rp) => (
        <Link
          key={rp.id}
          href={`/products/${rp.id}`}
          className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
        >
          <Image src={rp.imageUrl} alt={rp.name} fill sizes="120px" className="object-cover group-hover:scale-105 transition-transform" />
          <div className="absolute inset-0 bg-navy-deep/0 group-hover:bg-navy-deep/30 transition-colors" />
        </Link>
      ))}
    </div>
  </div>
)}
{graphMatches.length > 0 && (
  <div>
    <h3 className="font-display text-lg font-semibold text-navy mb-3">{t('products.youMayAlsoLove')}</h3>
    <div className="grid grid-cols-4 gap-2">
      {graphMatches.map((rp) => (
        <Link
          key={rp.id}
          href={`/products/${rp.id}`}
          className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
        >
          <Image src={rp.imageUrl} alt={rp.name} fill sizes="120px" className="object-cover group-hover:scale-105 transition-transform" />
          <div className="absolute inset-0 bg-navy-deep/0 group-hover:bg-navy-deep/30 transition-colors" />
        </Link>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: Add translation key for "completeTheLook"**

Edit `src/lib/i18n/translations.ts` — add after line 122 (`youMayAlsoLove`):

```typescript
      completeTheLook: 'Complete the look',
```

And after line 713 (`youMayAlsoLove` Arabic):

```typescript
      completeTheLook: 'أكملي الإطلالة',
```

- [ ] **Step 4: Commit**

```bash
git add src/app/products/[id]/ProductDetailClient.tsx
git commit -m "feat: integrate product graph with detail page"
```

---

### Task 10: Add ALSO_BOUGHT on Checkout Completion

**Files:**
- Modify: `src/app/api/checkout/complete/route.ts` (or the appropriate checkout completion handler)

- [ ] **Step 1: After order completion, fire addAlsoBought**

Find the existing checkout completion route and add after successful order creation:

```typescript
import { addAlsoBought } from '@/lib/product-graph'

// After order is confirmed and items are saved
const productIds = order.items.map((item: any) => item.productId)
if (productIds.length >= 2) {
  addAlsoBought(productIds).catch(console.error)
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add ALSO_BOUGHT edges on order completion"
```

---

### Task 11: Run Seed Script

- [ ] **Step 1: Run the graph seed script**

```bash
npx tsx prisma/seed-graph.ts
```

Expected output:
```
Processing N products...
Generating embeddings with ONNX...
Computing similarity edges...
Inserting M relations...
Done. Inserted M relations for N products.
```

- [ ] **Step 2: Verify the data**

```bash
npx prisma studio
```

Check that `ProductRelation` and `ProductEmbedding` tables have data.

---

### Task 12: Verify the Build

- [ ] **Step 1: Build the project**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript or ESLint errors.

- [ ] **Step 2: Push and deploy to Vercel**

```bash
git add -A
git commit -m "feat: add product knowledge graph with typed relationships and vector similarity"
git push origin main
```

(If Vercel is connected to GitHub, it auto-deploys.)
