import { db } from './db'
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
  const results = await db.$queryRaw<any[]>`
    SELECT p.*, r.weight as "relationWeight"
    FROM "ProductRelation" r
    JOIN "Product" p ON p.id = r."toId"
    WHERE r."fromId" = ${productId}
      AND (${types?.length ?? 0} = 0 OR r.type = ANY(${types ?? []}::"RelationType"[]))
      AND r.weight >= ${minWeight}
      AND p."isActive" = true
    ORDER BY r.weight DESC
    LIMIT ${limit}
  `
  return results.map(normalizeProductWithWeight)
}

export async function getSemanticSimilar(productId: string, limit = 6): Promise<Product[]> {
  const source = await db.productEmbedding.findUnique({ where: { productId } })
  if (!source) return []

  const results = await db.$queryRaw<any[]>`
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
  const result = await db.$queryRaw<GraphRelation[]>`
    INSERT INTO "ProductRelation" ("id", "fromId", "toId", "type", "weight", "metadata", "createdAt")
    VALUES (gen_random_uuid(), ${fromId}, ${toId}, ${type}::"RelationType", ${weight}, ${metadata ? JSON.stringify(metadata) : null}::jsonb, NOW())
    ON CONFLICT ("fromId", "toId", "type")
    DO UPDATE SET "weight" = ${weight}, "metadata" = ${metadata ? JSON.stringify(metadata) : null}::jsonb
    RETURNING "id", "fromId", "toId", "type", "weight", "metadata"
  `
  return result[0]
}

export async function removeRelation(id: string): Promise<void> {
  await db.productRelation.delete({ where: { id } })
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
    const existing = await db.$queryRaw<{ cnt: number }[]>`
      SELECT COUNT(*)::int as cnt FROM "ProductRelation"
      WHERE "fromId" = ${pair.fromId} AND "toId" = ${pair.toId} AND "type" = 'ALSO_BOUGHT'::"RelationType"
    `
    if (existing[0].cnt > 0) {
      await db.$executeRaw`
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
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    sku: row.sku,
    categoryId: row.categoryId,
    imageUrl: row.imageUrl,
    images: typeof row.images === 'string' ? row.images : JSON.stringify(row.images),
    material: row.material,
    weight: row.weight,
    rating: Number(row.rating),
    reviewCount: row.reviewCount,
    stock: row.stock,
    tags: typeof row.tags === 'string' ? row.tags : JSON.stringify(row.tags),
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    isNew: row.isNew,
    isBestseller: row.isBestseller,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  }
}

function normalizeProductWithWeight(row: any): Product & { relationWeight: number } {
  return {
    ...normalizeProduct(row),
    relationWeight: Number(row.relationWeight),
  }
}
