import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const categories = [
  {
    name: 'Rings',
    slug: 'rings',
    description: 'Sterling silver rings crafted with precision — from solitaire diamonds to engraved celestial bands.',
    imageUrl: '/products/cat-rings.jpg',
    icon: 'ring',
  },
  {
    name: 'Necklaces',
    slug: 'necklaces',
    description: 'Silver chains and pendants inspired by the sun, moon, and stars — designed to be worn every day.',
    imageUrl: '/products/cat-necklaces.jpg',
    icon: 'necklace',
  },
  {
    name: 'Earrings',
    slug: 'earrings',
    description: 'Silver hoops, drops, and studs — each pair finished by hand for a flawless shine.',
    imageUrl: '/products/cat-earrings.jpg',
    icon: 'earring',
  },
  {
    name: 'Bracelets',
    slug: 'bracelets',
    description: 'Charm bracelets and bangles in 925 sterling silver — light on the wrist, rich in detail.',
    imageUrl: '/products/cat-bracelets.jpg',
    icon: 'bracelet',
  },
  {
    name: 'Pendants',
    slug: 'pendants',
    description: 'Statement pendants featuring our signature sun motif and ethically sourced diamonds.',
    imageUrl: '/products/cat-pendants.jpg',
    icon: 'pendant',
  },
  {
    name: 'Sets',
    slug: 'sets',
    description: 'Coordinated jewelry sets — necklaces and earrings designed to be worn together.',
    imageUrl: '/products/cat-sets.jpg',
    icon: 'set',
  },
]

type SeedProduct = {
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  sku: string
  categorySlug: string
  imageUrl: string
  material: string
  weight: string
  tags: string[]
  isFeatured?: boolean
  isNew?: boolean
  isBestseller?: boolean
  stock: number
}

const products: SeedProduct[] = [
  // Rings
  {
    name: 'Silver Solitaire Diamond Ring',
    slug: 'silver-solitaire-diamond-ring',
    description:
      'A timeless solitaire featuring a brilliant-cut diamond set in 925 sterling silver. The four-prong setting lifts the stone toward the light, while the polished band catches every reflection. An everyday icon of the Gümüş Güneş collection.',
    price: 289.0,
    compareAtPrice: 340.0,
    sku: 'GG-R-001',
    categorySlug: 'rings',
    imageUrl: '/products/prod-ring-1.jpg',
    material: '925 Sterling Silver · 0.10ct Diamond (SI2, H)',
    weight: '3.2 g',
    tags: ['diamond', 'solitaire', 'bridal', 'minimal'],
    isFeatured: true,
    isBestseller: true,
    stock: 24,
  },
  {
    name: 'Sun-Ray Engraved Silver Band',
    slug: 'sun-ray-engraved-silver-band',
    description:
      'Inspired by the rays of the güneş (sun), this hand-engraved band wraps the finger in a continuous pattern of light. A subtle nod to our brand motif, designed to be stacked or worn alone.',
    price: 145.0,
    sku: 'GG-R-002',
    categorySlug: 'rings',
    imageUrl: '/products/prod-ring-2.jpg',
    material: '925 Sterling Silver · Oxidized engraving',
    weight: '4.1 g',
    tags: ['engraved', 'band', 'celestial', 'stackable'],
    isNew: true,
    stock: 41,
  },
  {
    name: 'Sapphire & Diamond Silver Ring',
    slug: 'sapphire-diamond-silver-ring',
    description:
      'A deep blue sapphire sits at the heart of this ring, framed by a halo of accent diamonds. The contrast of cool silver and ocean blue evokes the night sky over the Aegean.',
    price: 425.0,
    compareAtPrice: 495.0,
    sku: 'GG-R-003',
    categorySlug: 'rings',
    imageUrl: '/products/prod-ring-3.jpg',
    material: '925 Sterling Silver · 0.30ct Sapphire · 0.06ct Diamonds',
    weight: '3.8 g',
    tags: ['sapphire', 'halo', 'statement', 'blue'],
    isFeatured: true,
    stock: 12,
  },
  // Necklaces
  {
    name: 'Sunburst Silver Pendant Necklace',
    slug: 'sunburst-silver-pendant-necklace',
    description:
      'Our signature sunburst pendant hangs from a delicate silver chain. The radiating lines are polished by hand to catch every glint of light — a quiet declaration of warmth and brilliance.',
    price: 199.0,
    compareAtPrice: 240.0,
    sku: 'GG-N-001',
    categorySlug: 'necklaces',
    imageUrl: '/products/prod-necklace-1.jpg',
    material: '925 Sterling Silver · 45cm cable chain',
    weight: '5.6 g',
    tags: ['sunburst', 'pendant', 'signature', 'everyday'],
    isFeatured: true,
    isBestseller: true,
    stock: 38,
  },
  {
    name: 'Crescent Moon & Star Necklace',
    slug: 'crescent-moon-star-necklace',
    description:
      'A slender crescent cradles a single star — an homage to the Turkish night sky. Adjustable chain length lets you layer it with other favorites.',
    price: 165.0,
    sku: 'GG-N-002',
    categorySlug: 'necklaces',
    imageUrl: '/products/prod-necklace-2.jpg',
    material: '925 Sterling Silver · 40–45cm adjustable chain',
    weight: '4.8 g',
    tags: ['moon', 'star', 'celestial', 'layering'],
    isNew: true,
    stock: 52,
  },
  // Earrings
  {
    name: 'Silver Sun Hoop Earrings',
    slug: 'silver-sun-hoop-earrings',
    description:
      'Slim silver hoops with a textured sun-ray finish along the outer edge. Lightweight enough for all-day wear, distinctive enough to be noticed.',
    price: 128.0,
    sku: 'GG-E-001',
    categorySlug: 'earrings',
    imageUrl: '/products/prod-earring-1.jpg',
    material: '925 Sterling Silver · Hinged hoop closure',
    weight: '2.9 g (pair)',
    tags: ['hoop', 'sun', 'everyday', 'textured'],
    isBestseller: true,
    stock: 47,
  },
  {
    name: 'Pearl Drop Silver Earrings',
    slug: 'pearl-drop-silver-earrings',
    description:
      'A single freshwater pearl drops from a silver cap accented with a tiny diamond. Refined, romantic, and quietly luminous.',
    price: 175.0,
    compareAtPrice: 210.0,
    sku: 'GG-E-002',
    categorySlug: 'earrings',
    imageUrl: '/products/prod-earring-2.jpg',
    material: '925 Sterling Silver · Freshwater Pearl · 0.02ct Diamond',
    weight: '3.4 g (pair)',
    tags: ['pearl', 'drop', 'romantic', 'diamond'],
    isFeatured: true,
    stock: 29,
  },
  // Bracelets
  {
    name: 'Celestial Charm Bracelet',
    slug: 'celestial-charm-bracelet',
    description:
      'A delicate silver chain carrying sun, moon, and star charms — each one a small reminder of the sky above. The lobster clasp keeps it secure on the wrist.',
    price: 158.0,
    sku: 'GG-B-001',
    categorySlug: 'bracelets',
    imageUrl: '/products/prod-bracelet-1.jpg',
    material: '925 Sterling Silver · 18cm chain · 3 charms',
    weight: '6.2 g',
    tags: ['charm', 'celestial', 'layering', 'gift'],
    isNew: true,
    isBestseller: true,
    stock: 33,
  },
  {
    name: 'Diamond Accent Silver Bangle',
    slug: 'diamond-accent-silver-bangle',
    description:
      'A sleek silver bangle with a single diamond accent at its focal point. Hinged for ease, polished to a mirror finish — effortless elegance for day or night.',
    price: 245.0,
    compareAtPrice: 290.0,
    sku: 'GG-B-002',
    categorySlug: 'bracelets',
    imageUrl: '/products/prod-bracelet-2.jpg',
    material: '925 Sterling Silver · 0.05ct Diamond',
    weight: '11.4 g',
    tags: ['bangle', 'diamond', 'minimal', 'hinged'],
    isFeatured: true,
    stock: 18,
  },
  // Pendants
  {
    name: 'Silver Sun Diamond Pendant',
    slug: 'silver-sun-diamond-pendant',
    description:
      'The Gümüş Güneş sun, reimagined as a standalone pendant. A central diamond is surrounded by radiating silver rays, each one polished to a fine shine. Suspended from a 50cm chain.',
    price: 315.0,
    compareAtPrice: 375.0,
    sku: 'GG-P-001',
    categorySlug: 'pendants',
    imageUrl: '/products/prod-pendant-1.jpg',
    material: '925 Sterling Silver · 0.08ct Diamond · 50cm chain',
    weight: '6.9 g',
    tags: ['sun', 'diamond', 'statement', 'signature'],
    isFeatured: true,
    isBestseller: true,
    stock: 22,
  },
  // Sets
  {
    name: 'Matching Sun Design Jewelry Set',
    slug: 'matching-sun-design-jewelry-set',
    description:
      'A coordinated necklace and earring set featuring our sun motif in sterling silver. The matching silhouette makes it a complete look — ready to wear from the box.',
    price: 410.0,
    compareAtPrice: 495.0,
    sku: 'GG-S-001',
    categorySlug: 'sets',
    imageUrl: '/products/prod-set-1.jpg',
    material: '925 Sterling Silver · Necklace + Earrings',
    weight: '12.3 g (set)',
    tags: ['set', 'sun', 'gift', 'coordinated'],
    isFeatured: true,
    isNew: true,
    stock: 14,
  },
  // Additional products using category images for variety
  {
    name: 'Classic Silver Signet Ring',
    slug: 'classic-silver-signet-ring',
    description:
      'A polished silver signet with a flat face ready to be engraved with your initials. Substantial weight, refined silhouette — a piece that grows more personal with time.',
    price: 135.0,
    sku: 'GG-R-004',
    categorySlug: 'rings',
    imageUrl: '/products/cat-rings.jpg',
    material: '925 Sterling Silver · Engravable face',
    weight: '5.8 g',
    tags: ['signet', 'engravable', 'classic', 'unisex'],
    stock: 36,
  },
  {
    name: 'Everyday Silver Chain Necklace',
    slug: 'everyday-silver-chain-necklace',
    description:
      'A simple, finely crafted silver chain that goes with everything. Available in a 45cm length that sits perfectly at the collarbone.',
    price: 95.0,
    compareAtPrice: 115.0,
    sku: 'GG-N-003',
    categorySlug: 'necklaces',
    imageUrl: '/products/cat-necklaces.jpg',
    material: '925 Sterling Silver · 45cm cable chain',
    weight: '4.2 g',
    tags: ['chain', 'everyday', 'minimal', 'layering'],
    isBestseller: true,
    stock: 64,
  },
  {
    name: 'Silver Stud Earrings Trio',
    slug: 'silver-stud-earrings-trio',
    description:
      'Three pairs of silver studs in one set — a classic ball, a tiny star, and a sun motif. Mix, match, or share with someone you love.',
    price: 89.0,
    sku: 'GG-E-003',
    categorySlug: 'earrings',
    imageUrl: '/products/cat-earrings.jpg',
    material: '925 Sterling Silver · 3 pairs',
    weight: '2.1 g (total)',
    tags: ['stud', 'set', 'everyday', 'gift'],
    isNew: true,
    stock: 58,
  },
  {
    name: 'Silver Link Chain Bracelet',
    slug: 'silver-link-chain-bracelet',
    description:
      'A classic curb-link chain bracelet in polished silver. Comfortable, durable, and quietly luxurious — designed to be worn daily and never taken off.',
    price: 119.0,
    compareAtPrice: 145.0,
    sku: 'GG-B-003',
    categorySlug: 'bracelets',
    imageUrl: '/products/cat-bracelets.jpg',
    material: '925 Sterling Silver · 19cm curb chain',
    weight: '8.7 g',
    tags: ['chain', 'curb', 'everyday', 'classic'],
    stock: 42,
  },
  {
    name: 'Silver Locket Pendant',
    slug: 'silver-locket-pendant',
    description:
      'A heart-shaped silver locket that opens to hold a small photo or keepsake. Suspended from a 50cm chain — a piece that carries what matters most.',
    price: 189.0,
    sku: 'GG-P-002',
    categorySlug: 'pendants',
    imageUrl: '/products/cat-pendants.jpg',
    material: '925 Sterling Silver · 50cm chain',
    weight: '7.1 g',
    tags: ['locket', 'heart', 'keepsake', 'gift'],
    isFeatured: true,
    stock: 26,
  },
  {
    name: 'Silver Gift Set — Necklace & Bracelet',
    slug: 'silver-gift-set-necklace-bracelet',
    description:
      'A coordinated necklace and bracelet in matching silver links. Presented in a Gümüş Güneş gift box — the perfect present, ready to give.',
    price: 295.0,
    compareAtPrice: 360.0,
    sku: 'GG-S-002',
    categorySlug: 'sets',
    imageUrl: '/products/cat-sets.jpg',
    material: '925 Sterling Silver · Necklace + Bracelet · Gift box',
    weight: '14.8 g (set)',
    tags: ['set', 'gift', 'coordinated', 'boxed'],
    isBestseller: true,
    stock: 19,
  },
]

const sampleReviews = [
  { rating: 5, title: 'Absolutely stunning', comment: 'Even more beautiful in person. The silver has a gorgeous shine and the packaging felt truly luxurious.', authorName: 'Elif K.' },
  { rating: 5, title: 'Perfect gift', comment: 'Bought this for my mother and she cried. The craftsmanship is exceptional — you can feel the weight and quality.', authorName: 'Mehmet A.' },
  { rating: 4, title: 'Lovely, sizing runs small', comment: 'Beautiful piece, but I would size up if you are between ring sizes. The diamond sparkle is incredible for the price.', authorName: 'Sofia R.' },
  { rating: 5, title: 'My new everyday piece', comment: 'I have not taken this off since it arrived. Tarnish-free so far after 3 months of daily wear. Highly recommend.', authorName: 'Aylin D.' },
  { rating: 5, title: 'Worth every lira', comment: 'The attention to detail is remarkable. Feels like a much more expensive piece. Will be buying from Gümüş Güneş again.', authorName: 'Can Ö.' },
]

export async function POST() {
  try {
    // Wipe existing data (idempotent seed)
    await db.orderItem.deleteMany()
    await db.order.deleteMany()
    await db.review.deleteMany()
    await db.wishlistItem.deleteMany()
    await db.product.deleteMany()
    await db.category.deleteMany()
    await db.newsletter.deleteMany()

    // Insert categories
    const categoryMap: Record<string, string> = {}
    for (const cat of categories) {
      const created = await db.category.create({ data: cat })
      categoryMap[cat.slug] = created.id
    }

    // Insert products with reviews
    let reviewIdx = 0
    for (const p of products) {
      const categoryId = categoryMap[p.categorySlug]
      if (!categoryId) continue
      const { categorySlug, tags, ...rest } = p
      const created = await db.product.create({
        data: {
          ...rest,
          categoryId,
          tags: JSON.stringify(tags),
          images: JSON.stringify([p.imageUrl]),
          rating: 4 + Math.round(Math.random() * 10) / 10,
          reviewCount: 3 + Math.floor(Math.random() * 18),
        },
      })

      // Attach 2–3 sample reviews per product, cycling through the pool
      const numReviews = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < numReviews; i++) {
        const r = sampleReviews[(reviewIdx + i) % sampleReviews.length]
        await db.review.create({
          data: {
            productId: created.id,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            isVerified: true,
          },
        })
      }
      reviewIdx += numReviews
    }

    const counts = {
      categories: await db.category.count(),
      products: await db.product.count(),
      reviews: await db.review.count(),
    }

    return NextResponse.json({ ok: true, seeded: counts })
  } catch (err) {
    console.error('Seed error:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const counts = {
    categories: await db.category.count(),
    products: await db.product.count(),
    reviews: await db.review.count(),
    orders: await db.order.count(),
    newsletter: await db.newsletter.count(),
  }
  return NextResponse.json({ ok: true, counts })
}
