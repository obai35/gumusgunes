import { PrismaClient } from '@prisma/client'
import { pipeline } from '@huggingface/transformers'

const prisma = new PrismaClient()

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

  const relations: { fromId: string; toId: string; type: string; weight: number; metadata?: any }[] = []

  // Rule-based relations
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i]
      const b = products[j]

      const aTags: string[] = typeof a.tags === 'string' ? JSON.parse(a.tags) : a.tags
      const bTags: string[] = typeof b.tags === 'string' ? JSON.parse(b.tags) : b.tags

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
      const sharedTags = aTags.filter(t => bTags.includes(t))
      if (sharedTags.length > 0 && a.categoryId !== b.categoryId) {
        relations.push({ fromId: a.id, toId: b.id, type: 'SIMILAR_TO', weight: 0.7 })
        relations.push({ fromId: b.id, toId: a.id, type: 'SIMILAR_TO', weight: 0.7 })
      }

      // Occasion tags → OCCASION
      const occasions = ['bridal', 'wedding', 'anniversary', 'everyday', 'casual', 'formal', 'party', 'gift']
      const aOccasion = aTags.filter(t => occasions.includes(t.toLowerCase()))
      const bOccasion = bTags.filter(t => occasions.includes(t.toLowerCase()))
      const sharedOccasions = aOccasion.filter(o => bOccasion.includes(o))
      if (sharedOccasions.length > 0) {
        relations.push({ fromId: a.id, toId: b.id, type: 'OCCASION', weight: 0.8, metadata: { occasions: sharedOccasions } })
        relations.push({ fromId: b.id, toId: a.id, type: 'OCCASION', weight: 0.8, metadata: { occasions: sharedOccasions } })
      }

      // Collection tags → COLLECTION
      const aCollections = aTags.filter(t => !occasions.includes(t.toLowerCase()) && t !== a.material.toLowerCase())
      const bCollections = bTags.filter(t => !occasions.includes(t.toLowerCase()) && t !== b.material.toLowerCase())
      if (aCollections.some((t: string) => bCollections.includes(t))) {
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
      INSERT INTO "ProductEmbedding" ("id", "productId", "vector", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${p.id}, ${vectorStr}::vector, NOW(), NOW())
      ON CONFLICT ("productId")
      DO UPDATE SET "vector" = ${vectorStr}::vector, "updatedAt" = NOW()
    `

    if ((i + 1) % 10 === 0) console.log(`  Embedded ${i + 1}/${products.length}`)
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
