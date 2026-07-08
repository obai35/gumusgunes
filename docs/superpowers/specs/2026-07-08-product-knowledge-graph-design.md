# Product Knowledge Graph — Design

**Date:** 2026-07-08
**Status:** Draft

## Overview

A PostgreSQL-native product knowledge graph for Gümüş Güneş (Silver Sun Jewelry). Adds typed product-to-product relationships and vector similarity to power recommendations, "complete the look," and smarter search — all within the existing Prisma + PostgreSQL stack.

## Architecture

```
Next.js API routes
  ↓
lib/product-graph.ts  ← Graph service layer
  ↓
Prisma + PostgreSQL   ← ProductRelation + ProductEmbedding tables
  + pgvector           ← vector similarity queries
```

No new services. No new daemons. Everything lives in the existing PostgreSQL database.

## Data Model

### New Prisma Models

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

### Design Decisions

- `String` for pgvector — Prisma has no native vector type. All vector queries use raw SQL.
- `@@unique([fromId, toId, type])` — prevents duplicate relation entries.
- `@@index([fromId, type, weight])` — covers the primary query: "get top N related products by type, ordered by weight."
- `metadata Json?` — extensible per-relation metadata (source, occasion, season, admin note).
- Cascade deletes — if a product is removed, all its relations and embedding are cleaned up automatically.

## Seeding: Rules + AI

### Rule-Based Relationships

Run on initial seed and incrementally on product create/update:

| Condition | Type | Weight | Description |
|-----------|------|--------|-------------|
| `productA.material == productB.material` | MATCHES | 1.0 | Same metal/gemstone |
| `productA.categoryId == productB.categoryId` | SIMILAR_TO | 0.8 | Same category |
| Overlapping tags | SIMILAR_TO | 0.7 | Shared keywords (bridal, gold) |
| Different category, same material | COMPLEMENTS | 0.9 | Necklace + earrings, both gold |
| Collection keyword in name/tags | COLLECTION | 1.0 | Same collection/season |
| Tag contains occasion keyword | OCCASION | 0.8 | Bridal, anniversary, everyday |

### AI Embedding Similarity

1. Build a normalized text per product: `"${name} ${material} ${categoryName} ${tagsJoined}"`
2. Generate embedding via ONNX runtime using `sentence-transformers/all-MiniLM-L6-v2`
3. Store in `ProductEmbedding.vector`
4. Compute pairwise cosine similarity → insert `SIMILAR_TO` edges for top-5 highest-similarity products per product
5. AI edges get `weight` set to the similarity score (0.0 – 1.0)

### Weighting

- Direct manual/admin edges: `1.0`
- Rule-based edges: `0.7 – 1.0` (depending on rule confidence)
- AI-similarity edges: `0.5 – 0.95` (set to cosine similarity score)
- ALSO_BOUGHT edges: `frequency / maxFrequency`
- Min threshold for queries: `0.5` by default (configurable)

## Query Patterns

### Core Service (`src/lib/product-graph.ts`)

```typescript
type RelatedQuery = {
  productId: string
  types?: RelationType[]
  limit?: number
  minWeight?: number
}

// Directed query: "what relates TO this product?"
async function getRelated(query: RelatedQuery): Promise<Product[]>

// Undirected vector similarity (ignores relation types)
async function getSemanticSimilar(productId: string, limit?: number): Promise<Product[]>

// Mutation helpers
async function addRelation(fromId: string, toId: string, type: RelationType, weight?: number, metadata?: any)
async function removeRelation(id: string)
async function addAlsoBought(productIds: string[])
```

### Example Queries

```sql
-- Get top MATCHES for a product
SELECT p.*, r.weight
FROM "ProductRelation" r
JOIN "Product" p ON p.id = r."toId"
WHERE r."fromId" = $1 AND r.type = 'MATCHES' AND r.weight >= 0.5
ORDER BY r.weight DESC
LIMIT $2;
```

```sql
-- Vector similarity (pgvector)
SELECT p.*, 1 - (e.vector <=> $1) AS similarity
FROM "ProductEmbedding" e
JOIN "Product" p ON p.id = e."productId"
WHERE e."productId" != $2
ORDER BY e.vector <=> $1
LIMIT $3;
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/:id/related?type=MATCHES&limit=4` | Get related products by type |
| GET | `/api/products/:id/similar?limit=6` | Vector similarity results |
| GET | `/api/products/:id/complete-look` | Curated COMPLEMENTS recommendations |
| POST | `/api/graph/relation` | Admin: add custom relation |
| DELETE | `/api/graph/relation/:id` | Admin: remove relation |

### Frontend Integration

`ProductDetailClient.tsx` — replace the current static `related` prop with a fetch to `/api/products/:id/related` and `/api/products/:id/complete-look`. Falls back to existing prop if API unavailable.

## Incremental Updates

| Trigger | Action |
|---------|--------|
| Product created/updated | Re-run rules for this product, recompute embedding, upsert relations |
| Product deleted | Cascade deletes all relations and embedding |
| Order completed | `addAlsoBought(order.items.map(i => i.productId))` |
| Admin adds relation | `POST /api/graph/relation` — inserts directed edge |
| Full resync | `npx tsx prisma/seed-graph.ts --rebuild` — drops and re-seeds everything |

No cron jobs. Everything is event-driven from existing flows.

## Files to Create/Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `ProductRelation` + `ProductEmbedding` models, `RelationType` enum |
| `src/lib/product-graph.ts` | **Create** — Graph service (queries + mutations) |
| `prisma/seed-graph.ts` | **Create** — Initial seed script (rules + embeddings) |
| `prisma/seed.ts` | Append `seed-graph.ts` call |
| `src/app/api/products/[id]/related/route.ts` | **Create** — GET related products |
| `src/app/api/products/[id]/similar/route.ts` | **Create** — GET vector similarity |
| `src/app/api/products/[id]/complete-look/route.ts` | **Create** — GET complete-look |
| `src/app/api/graph/relation/route.ts` | **Create** — POST/DELETE admin relations |
| `src/app/api/checkout/complete/route.ts` | Fire `addAlsoBought` after order |

## Future Considerations (out of scope)

- FalkorDB/Neo4j migration path (add alongside PostgreSQL when needed)
- Customer behavior graph (User → Product nodes/edges)
- Concierge agent with graph-aware memory
- Real-time trending using edge weight decay over time
