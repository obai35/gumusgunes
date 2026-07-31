import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { hashPassword } from '@/lib/admin-auth'

const categories = [
  {
    name: 'Women', slug: 'women', icon: 'female',
    description: 'Elegant stainless steel accessories for women',
    children: [
      { name: 'Rings', slug: 'women-rings', icon: 'ring', imageUrl: '/products/cat-rings.jpg', description: 'Stainless steel rings for women' },
      { name: 'Necklaces', slug: 'women-necklaces', icon: 'necklace', imageUrl: '/products/cat-necklaces.jpg', description: 'Steel chains and pendants for women' },
      { name: 'Earrings', slug: 'women-earrings', icon: 'earring', imageUrl: '/products/cat-earrings.jpg', description: 'Steel earrings for women' },
      { name: 'Bracelets', slug: 'women-bracelets', icon: 'bracelet', imageUrl: '/products/cat-bracelets.jpg', description: 'Steel bracelets for women' },
      { name: 'Pendants', slug: 'women-pendants', icon: 'pendant', imageUrl: '/products/cat-pendants.jpg', description: 'Statement pendants for women' },
      { name: 'Sets', slug: 'women-sets', icon: 'set', imageUrl: '/products/cat-sets.jpg', description: 'Coordinated jewelry sets for women' },
      { name: 'Watches', slug: 'women-watches', icon: 'watch', description: 'Elegant watches for women' },
      { name: 'Belts', slug: 'women-belts', icon: 'belt', description: 'Stylish belts for women' },
      { name: 'Bags', slug: 'women-bags', icon: 'bag', description: 'Handbags and clutches for women' },
    ],
  },
  {
    name: 'Men', slug: 'men', icon: 'male',
    description: 'Bold stainless steel accessories for men',
    children: [
      { name: 'Pendants', slug: 'men-pendants', icon: 'pendant', description: 'Stainless steel pendants for men' },
      { name: 'Watches', slug: 'men-watches', icon: 'watch', description: 'Bold watches for men' },
      { name: 'Belts', slug: 'men-belts', icon: 'belt', description: 'Leather and steel belts for men' },
      { name: 'Bags', slug: 'men-bags', icon: 'bag', description: 'Bags and wallets for men' },
    ],
  },
  {
    name: 'Children', slug: 'children', icon: 'child',
    description: 'Adorable stainless steel accessories for kids and girls',
    children: [
      { name: 'Rings', slug: 'children-rings', icon: 'ring', description: 'Stainless steel rings for children' },
      { name: 'Necklaces', slug: 'children-necklaces', icon: 'necklace', description: 'Stainless steel necklaces for children' },
      { name: 'Earrings', slug: 'children-earrings', icon: 'earring', description: 'Stainless steel earrings for children' },
      { name: 'Bracelets', slug: 'children-bracelets', icon: 'bracelet', description: 'Stainless steel bracelets for children' },
      { name: 'Pendants', slug: 'children-pendants', icon: 'pendant', description: 'Stainless steel pendants for children' },
      { name: 'Sets', slug: 'children-sets', icon: 'set', description: 'Jewelry sets for children' },
      { name: 'Watches', slug: 'children-watches', icon: 'watch', description: 'Fun watches for children' },
      { name: 'Belts', slug: 'children-belts', icon: 'belt', description: 'Belts for children' },
      { name: 'Bags', slug: 'children-bags', icon: 'bag', description: 'Bags for children' },
    ],
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
      'A timeless solitaire featuring a brilliant-cut diamond set in premium stainless steel. The four-prong setting lifts the stone toward the light, while the polished band catches every reflection. An everyday icon of the Gümüş Güneş collection.',
    price: 289.0,
    compareAtPrice: 340.0,
    sku: 'GG-R-001',
    categorySlug: 'women-rings',
    imageUrl: '/products/prod-ring-1.jpg',
    material: 'Premium Stainless Steel · 0.10ct Diamond (SI2, H)',
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
    categorySlug: 'women-rings',
    imageUrl: '/products/prod-ring-2.jpg',
    material: 'Premium Stainless Steel · Oxidized engraving',
    weight: '4.1 g',
    tags: ['engraved', 'band', 'celestial', 'stackable'],
    isNew: true,
    stock: 41,
  },
  {
    name: 'Sapphire & Diamond Silver Ring',
    slug: 'sapphire-diamond-silver-ring',
    description:
      'A deep blue sapphire sits at the heart of this ring, framed by a halo of accent diamonds. The contrast of cool steel and ocean blue evokes the night sky over the Aegean.',
    price: 425.0,
    compareAtPrice: 495.0,
    sku: 'GG-R-003',
    categorySlug: 'women-rings',
    imageUrl: '/products/prod-ring-3.jpg',
    material: 'Premium Stainless Steel · 0.30ct Sapphire · 0.06ct Diamonds',
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
      'Our signature sunburst pendant hangs from a delicate steel chain. The radiating lines are polished by hand to catch every glint of light — a quiet declaration of warmth and brilliance.',
    price: 199.0,
    compareAtPrice: 240.0,
    sku: 'GG-N-001',
    categorySlug: 'women-necklaces',
    imageUrl: '/products/prod-necklace-1.jpg',
    material: 'Premium Stainless Steel · 45cm cable chain',
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
    categorySlug: 'women-necklaces',
    imageUrl: '/products/prod-necklace-2.jpg',
    material: 'Premium Stainless Steel · 40–45cm adjustable chain',
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
      'Slim steel hoops with a textured sun-ray finish along the outer edge. Lightweight enough for all-day wear, distinctive enough to be noticed.',
    price: 128.0,
    sku: 'GG-E-001',
    categorySlug: 'women-earrings',
    imageUrl: '/products/prod-earring-1.jpg',
    material: 'Premium Stainless Steel · Hinged hoop closure',
    weight: '2.9 g (pair)',
    tags: ['hoop', 'sun', 'everyday', 'textured'],
    isBestseller: true,
    stock: 47,
  },
  {
    name: 'Pearl Drop Silver Earrings',
    slug: 'pearl-drop-silver-earrings',
    description:
      'A single freshwater pearl drops from a steel cap accented with a tiny diamond. Refined, romantic, and quietly luminous.',
    price: 175.0,
    compareAtPrice: 210.0,
    sku: 'GG-E-002',
    categorySlug: 'women-earrings',
    imageUrl: '/products/prod-earring-2.jpg',
    material: 'Premium Stainless Steel · Freshwater Pearl · 0.02ct Diamond',
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
      'A delicate steel chain carrying sun, moon, and star charms — each one a small reminder of the sky above. The lobster clasp keeps it secure on the wrist.',
    price: 158.0,
    sku: 'GG-B-001',
    categorySlug: 'women-bracelets',
    imageUrl: '/products/prod-bracelet-1.jpg',
    material: 'Premium Stainless Steel · 18cm chain · 3 charms',
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
      'A sleek steel bangle with a single diamond accent at its focal point. Hinged for ease, polished to a mirror finish — effortless elegance for day or night.',
    price: 245.0,
    compareAtPrice: 290.0,
    sku: 'GG-B-002',
    categorySlug: 'women-bracelets',
    imageUrl: '/products/prod-bracelet-2.jpg',
    material: 'Premium Stainless Steel · 0.05ct Diamond',
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
      'The Gümüş Güneş sun, reimagined as a standalone pendant. A central diamond is surrounded by radiating steel rays, each one polished to a fine shine. Suspended from a 50cm chain.',
    price: 315.0,
    compareAtPrice: 375.0,
    sku: 'GG-P-001',
    categorySlug: 'women-pendants',
    imageUrl: '/products/prod-pendant-1.jpg',
    material: 'Premium Stainless Steel · 0.08ct Diamond · 50cm chain',
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
      'A coordinated necklace and earring set featuring our sun motif in premium stainless steel. The matching silhouette makes it a complete look — ready to wear from the box.',
    price: 410.0,
    compareAtPrice: 495.0,
    sku: 'GG-S-001',
    categorySlug: 'women-sets',
    imageUrl: '/products/prod-set-1.jpg',
    material: 'Premium Stainless Steel · Necklace + Earrings',
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
      'A polished steel signet with a flat face ready to be engraved with your initials. Substantial weight, refined silhouette — a piece that grows more personal with time.',
    price: 135.0,
    sku: 'GG-R-004',
    categorySlug: 'women-rings',
    imageUrl: '/products/cat-rings.jpg',
    material: 'Premium Stainless Steel · Engravable face',
    weight: '5.8 g',
    tags: ['signet', 'engravable', 'classic', 'unisex'],
    stock: 36,
  },
  {
    name: 'Everyday Silver Chain Necklace',
    slug: 'everyday-silver-chain-necklace',
    description:
      'A simple, finely crafted steel chain that goes with everything. Available in a 45cm length that sits perfectly at the collarbone.',
    price: 95.0,
    compareAtPrice: 115.0,
    sku: 'GG-N-003',
    categorySlug: 'women-necklaces',
    imageUrl: '/products/cat-necklaces.jpg',
    material: 'Premium Stainless Steel · 45cm cable chain',
    weight: '4.2 g',
    tags: ['chain', 'everyday', 'minimal', 'layering'],
    isBestseller: true,
    stock: 64,
  },
  {
    name: 'Silver Stud Earrings Trio',
    slug: 'silver-stud-earrings-trio',
    description:
      'Three pairs of steel studs in one set — a classic ball, a tiny star, and a sun motif. Mix, match, or share with someone you love.',
    price: 89.0,
    sku: 'GG-E-003',
    categorySlug: 'women-earrings',
    imageUrl: '/products/cat-earrings.jpg',
    material: 'Premium Stainless Steel · 3 pairs',
    weight: '2.1 g (total)',
    tags: ['stud', 'set', 'everyday', 'gift'],
    isNew: true,
    stock: 58,
  },
  {
    name: 'Silver Link Chain Bracelet',
    slug: 'silver-link-chain-bracelet',
    description:
      'A classic curb-link chain bracelet in polished steel. Comfortable, durable, and quietly luxurious — designed to be worn daily and never taken off.',
    price: 119.0,
    compareAtPrice: 145.0,
    sku: 'GG-B-003',
    categorySlug: 'women-bracelets',
    imageUrl: '/products/cat-bracelets.jpg',
    material: 'Premium Stainless Steel · 19cm curb chain',
    weight: '8.7 g',
    tags: ['chain', 'curb', 'everyday', 'classic'],
    stock: 42,
  },
  {
    name: 'Silver Locket Pendant',
    slug: 'silver-locket-pendant',
    description:
      'A heart-shaped steel locket that opens to hold a small photo or keepsake. Suspended from a 50cm chain — a piece that carries what matters most.',
    price: 189.0,
    sku: 'GG-P-002',
    categorySlug: 'women-pendants',
    imageUrl: '/products/cat-pendants.jpg',
    material: 'Premium Stainless Steel · 50cm chain',
    weight: '7.1 g',
    tags: ['locket', 'heart', 'keepsake', 'gift'],
    isFeatured: true,
    stock: 26,
  },
  {
    name: 'Silver Gift Set — Necklace & Bracelet',
    slug: 'silver-gift-set-necklace-bracelet',
    description:
      'A coordinated necklace and bracelet in matching steel links. Presented in a Gümüş Güneş gift box — the perfect present, ready to give.',
    price: 295.0,
    compareAtPrice: 360.0,
    sku: 'GG-S-002',
    categorySlug: 'women-sets',
    imageUrl: '/products/cat-sets.jpg',
    material: 'Premium Stainless Steel · Necklace + Bracelet · Gift box',
    weight: '14.8 g (set)',
    tags: ['set', 'gift', 'coordinated', 'boxed'],
    isBestseller: true,
    stock: 19,
  },
  // ── Men ──
  { name: 'Men\'s Silver Pendant Chain', slug: 'mens-silver-pendant-chain', description: 'A bold steel pendant chain for men. Thick curb chain with a polished steel dog tag pendant.', price: 179, compareAtPrice: 215, sku: 'GG-MP-001', categorySlug: 'men-pendants', imageUrl: '/products/cat-men-pendants.jpg', material: 'Premium Stainless Steel · 55cm chain', weight: '12.5 g', tags: ['pendant', 'chain', 'bold', 'everyday'], isNew: true, stock: 25 },
  { name: 'Men\'s Silver Watch', slug: 'mens-silver-watch', description: 'A classic steel-tone watch with a minimalist white dial and genuine leather strap. Quartz movement.', price: 245, compareAtPrice: 295, sku: 'GG-MW-001', categorySlug: 'men-watches', imageUrl: '/products/cat-men-watches.jpg', material: 'Premium Stainless Steel case · Leather strap', weight: '65 g', tags: ['watch', 'classic', 'leather', 'everyday'], isBestseller: true, stock: 15 },
  { name: 'Men\'s Silver Belt Buckle', slug: 'mens-silver-belt-buckle', description: 'A handcrafted stainless steel belt buckle with a brushed matte finish. Fits belts up to 1.5 inches wide.', price: 129, sku: 'GG-MB-001', categorySlug: 'men-belts', imageUrl: '/products/cat-men-belts.jpg', material: 'Premium Stainless Steel buckle', weight: '35 g', tags: ['belt', 'buckle', 'classic', 'matte'], stock: 30 },
  { name: 'Men\'s Leather Crossbody Bag', slug: 'mens-leather-crossbody-bag', description: 'A premium genuine leather crossbody bag with a steel zip closure and adjustable strap.', price: 289, compareAtPrice: 350, sku: 'GG-MBA-001', categorySlug: 'men-bags', imageUrl: '/products/cat-men-bags.jpg', material: 'Genuine leather · Steel hardware', weight: '320 g', tags: ['bag', 'leather', 'crossbody', 'everyday'], isFeatured: true, stock: 12 },
  // ── Children ──
  { name: 'Kids Silver Butterfly Ring', slug: 'kids-silver-butterfly-ring', description: 'An adorable steel ring with a tiny butterfly charm. Adjustable band fits most children.', price: 49, sku: 'GG-CR-001', categorySlug: 'children-rings', imageUrl: '/products/cat-children-rings.jpg', material: 'Premium Stainless Steel · Adjustable', weight: '1.5 g', tags: ['ring', 'butterfly', 'kids', 'cute'], isNew: true, stock: 40 },
  { name: 'Kids Silver Heart Necklace', slug: 'kids-silver-heart-necklace', description: 'A sweet steel heart pendant on a short chain, perfect for young girls. Hypoallergenic and gentle on skin.', price: 59, sku: 'GG-CN-001', categorySlug: 'children-necklaces', imageUrl: '/products/cat-children-necklaces.jpg', material: 'Premium Stainless Steel · 38cm chain', weight: '2.8 g', tags: ['necklace', 'heart', 'kids', 'cute'], isNew: true, stock: 35 },
  { name: 'Kids Silver Star Studs', slug: 'kids-silver-star-studs', description: 'Tiny star-shaped steel stud earrings for children. Comfortable push-back closure for sensitive ears.', price: 39, sku: 'GG-CE-001', categorySlug: 'children-earrings', imageUrl: '/products/cat-children-earrings.jpg', material: 'Premium Stainless Steel · Push-back', weight: '1.2 g (pair)', tags: ['earring', 'star', 'kids', 'stud'], stock: 45 },
  { name: 'Kids Silver Charm Bracelet', slug: 'kids-silver-charm-bracelet', description: 'A delicate charm bracelet with a heart, star, and butterfly charm. Adjustable to fit growing wrists.', price: 69, sku: 'GG-CB-001', categorySlug: 'children-bracelets', imageUrl: '/products/cat-children-bracelets.jpg', material: 'Premium Stainless Steel · 3 charms', weight: '4.1 g', tags: ['bracelet', 'charm', 'kids', 'gift'], isBestseller: true, stock: 28 },
  { name: 'Kids Silver Flower Pendant', slug: 'kids-silver-flower-pendant', description: 'A pretty flower-shaped steel pendant on a fine chain. Perfect for little girls who love nature.', price: 55, sku: 'GG-CP-001', categorySlug: 'children-pendants', imageUrl: '/products/cat-children-pendants.jpg', material: 'Premium Stainless Steel · 40cm chain', weight: '3.2 g', tags: ['pendant', 'flower', 'kids', 'nature'], stock: 32 },
  { name: 'Kids Silver Jewelry Set', slug: 'kids-silver-jewelry-set', description: 'A matching necklace and earring set for girls. Presented in a cute gift box.', price: 99, compareAtPrice: 125, sku: 'GG-CS-001', categorySlug: 'children-sets', imageUrl: '/products/cat-children-sets.jpg', material: 'Premium Stainless Steel · Set', weight: '6.5 g (set)', tags: ['set', 'kids', 'gift', 'boxed'], isFeatured: true, stock: 18 },
  { name: 'Kids Silver Watch', slug: 'kids-silver-watch', description: 'A fun steel-toned watch with a colorful silicone strap and easy-to-read dial. Water resistant.', price: 89, sku: 'GG-CW-001', categorySlug: 'children-watches', imageUrl: '/products/cat-children-watches.jpg', material: 'Premium Stainless Steel case · Silicone strap', weight: '35 g', tags: ['watch', 'kids', 'colorful', 'everyday'], stock: 22 },
  { name: 'Kids Silver Belt', slug: 'kids-silver-belt', description: 'A stylish adjustable belt for kids with a small steel buckle. Fits waist sizes 18–26 inches.', price: 45, sku: 'GG-CBE-001', categorySlug: 'children-belts', imageUrl: '/products/cat-children-belts.jpg', material: 'Genuine leather · Steel buckle', weight: '60 g', tags: ['belt', 'kids', 'adjustable'], stock: 34 },
  { name: 'Kids Canvas Backpack', slug: 'kids-canvas-backpack', description: 'A cute canvas backpack with steel-toned zippers and adjustable straps. Perfect for school or outings.', price: 75, compareAtPrice: 90, sku: 'GG-CBA-001', categorySlug: 'children-bags', imageUrl: '/products/cat-children-bags.jpg', material: 'Canvas · Steel hardware', weight: '180 g', tags: ['bag', 'backpack', 'kids', 'school'], isNew: true, stock: 20 },
]

const sampleReviews = [
  { rating: 5, title: 'Absolutely stunning', comment: 'Even more beautiful in person. The steel has a gorgeous shine and the packaging felt truly luxurious.', authorName: 'Elif K.' },
  { rating: 5, title: 'Perfect gift', comment: 'Bought this for my mother and she cried. The craftsmanship is exceptional — you can feel the weight and quality.', authorName: 'Mehmet A.' },
  { rating: 4, title: 'Lovely, sizing runs small', comment: 'Beautiful piece, but I would size up if you are between ring sizes. The diamond sparkle is incredible for the price.', authorName: 'Sofia R.' },
  { rating: 5, title: 'My new everyday piece', comment: 'I have not taken this off since it arrived. Tarnish-free so far after 3 months of daily wear. Highly recommend.', authorName: 'Aylin D.' },
  { rating: 5, title: 'Worth every lira', comment: 'The attention to detail is remarkable. Feels like a much more expensive piece. Will be buying from Gümüş Güneş again.', authorName: 'Can Ö.' },
]

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.SEED_API_KEY
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    // Wipe existing data (idempotent seed)
    await db.orderItem.deleteMany()
    await db.order.deleteMany()
    await db.review.deleteMany()
    await db.wishlistItem.deleteMany()
    await db.product.deleteMany()
    await db.category.deleteMany()
    await db.newsletter.deleteMany()

    const seedStore = await db.store.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' }, select: { id: true } })
    if (!seedStore) return NextResponse.json({ ok: false, error: 'No active store found. Run `prisma db seed` first.' }, { status: 500 })

    // Insert hierarchical categories
    const categoryMap: Record<string, string> = {}
    for (const parent of categories) {
      const { children, ...parentData } = parent
      const createdParent = await db.category.create({ data: { ...parentData, storeId: seedStore.id } })
      categoryMap[parentData.slug] = createdParent.id
      for (const child of children) {
        const createdChild = await db.category.create({ data: { ...child, parentId: createdParent.id, storeId: seedStore.id } })
        categoryMap[child.slug] = createdChild.id
      }
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
          storeId: seedStore.id,
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
            storeId: seedStore.id,
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

    // Seed branch stock for POS — auto-create a default branch if none exists
    let branch = await db.branch.findFirst()
    if (!branch) {
      const branchPassword = process.env.SEED_BRANCH_PASSWORD
      if (!branchPassword) throw new Error('SEED_BRANCH_PASSWORD must be set for seeding')
      branch = await db.branch.create({
        data: { name: 'Main Branch', email: 'main@gumusgunes.com', password: branchPassword, storeId: seedStore.id },
      })
    }
    for (const p of products) {
      const created = await db.product.findFirst({ where: { slug: p.slug } })
      if (created) {
        await db.branchStock.upsert({
          where: { branchId_productId: { branchId: branch.id, productId: created.id } },
          create: { branchId: branch.id, productId: created.id, quantity: p.stock, storeId: seedStore.id },
          update: {},
        })
      }
    }

    // Seed default admin account
    const existingAdmin = await db.admin.findUnique({ where: { email: 'admin@gumusgunes.com' } })
    if (!existingAdmin) {
      const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD
      if (!seedAdminPassword) throw new Error('SEED_ADMIN_PASSWORD must be set for seeding')
      await db.admin.create({
        data: {
          storeId: seedStore.id,
          email: 'admin@gumusgunes.com',
          name: 'Admin',
          password: await hashPassword(seedAdminPassword),
          role: 'superadmin',
        },
      })
    }

    const counts = {
      categories: await db.category.count(),
      products: await db.product.count(),
      reviews: await db.review.count(),
      branches: 1,
      admins: await db.admin.count(),
    }

    return NextResponse.json({ ok: true, seeded: counts })
  } catch (err) {
    return handleApiError(err, 'seed-database')
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.SEED_API_KEY
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const counts = {
    categories: await db.category.count(),
    products: await db.product.count(),
    reviews: await db.review.count(),
    orders: await db.order.count(),
    newsletter: await db.newsletter.count(),
  }
  return NextResponse.json({ ok: true, counts })
}
