import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

const HIERARCHY = [
  {
    name: 'Women',
    slug: 'women',
    icon: 'female',
    imageUrl: '/products/cat-women.jpg',
    description: 'Elegant stainless steel accessories for women',
    children: [
      { name: 'Rings', slug: 'women-rings', icon: 'ring', imageUrl: '/products/cat-rings.jpg', description: 'Stainless steel rings for women' },
      { name: 'Necklaces', slug: 'women-necklaces', icon: 'necklace', imageUrl: '/products/cat-necklaces.jpg', description: 'Steel chains and pendants for women' },
      { name: 'Earrings', slug: 'women-earrings', icon: 'earring', imageUrl: '/products/cat-earrings.jpg', description: 'Steel earrings for women' },
      { name: 'Bracelets', slug: 'women-bracelets', icon: 'bracelet', imageUrl: '/products/cat-bracelets.jpg', description: 'Steel bracelets for women' },
      { name: 'Pendants', slug: 'women-pendants', icon: 'pendant', imageUrl: '/products/cat-pendants.jpg', description: 'Statement pendants for women' },
      { name: 'Sets', slug: 'women-sets', icon: 'set', imageUrl: '/products/cat-sets.jpg', description: 'Coordinated jewelry sets for women' },
      { name: 'Watches', slug: 'women-watches', icon: 'watch', imageUrl: '/products/cat-watches.jpg', description: 'Elegant watches for women' },
      { name: 'Belts', slug: 'women-belts', icon: 'belt', imageUrl: '/products/cat-belts.jpg', description: 'Stylish belts for women' },
      { name: 'Bags', slug: 'women-bags', icon: 'bag', imageUrl: '/products/cat-bags.jpg', description: 'Handbags and clutches for women' },
    ],
  },
  {
    name: 'Men',
    slug: 'men',
    icon: 'male',
    imageUrl: '/products/cat-men.jpg',
    description: 'Bold stainless steel accessories for men',
    children: [
      { name: 'Rings', slug: 'men-rings', icon: 'ring', imageUrl: '/products/cat-men-rings.jpg', description: 'Stainless steel rings for men' },
      { name: 'Bracelets', slug: 'men-bracelets', icon: 'bracelet', imageUrl: '/products/cat-men-bracelets.jpg', description: 'Stainless steel bracelets for men' },
      { name: 'Pendants', slug: 'men-pendants', icon: 'pendant', imageUrl: '/products/cat-men-pendants.jpg', description: 'Stainless steel pendants for men' },
      { name: 'Watches', slug: 'men-watches', icon: 'watch', imageUrl: '/products/cat-men-watches.jpg', description: 'Bold watches for men' },
      { name: 'Belts', slug: 'men-belts', icon: 'belt', imageUrl: '/products/cat-men-belts.jpg', description: 'Leather and steel belts for men' },
      { name: 'Bags', slug: 'men-bags', icon: 'bag', imageUrl: '/products/cat-men-bags.jpg', description: 'Bags and wallets for men' },
    ],
  },
  {
    name: 'Children',
    slug: 'children',
    icon: 'child',
    imageUrl: '/products/cat-children.jpg',
    description: 'Adorable stainless steel accessories for kids and girls',
    children: [
      { name: 'Rings', slug: 'children-rings', icon: 'ring', imageUrl: '/products/cat-children-rings.jpg', description: 'Stainless steel rings for children' },
      { name: 'Necklaces', slug: 'children-necklaces', icon: 'necklace', imageUrl: '/products/cat-children-necklaces.jpg', description: 'Stainless steel necklaces for children' },
      { name: 'Earrings', slug: 'children-earrings', icon: 'earring', imageUrl: '/products/cat-children-earrings.jpg', description: 'Stainless steel earrings for children' },
      { name: 'Bracelets', slug: 'children-bracelets', icon: 'bracelet', imageUrl: '/products/cat-children-bracelets.jpg', description: 'Stainless steel bracelets for children' },
      { name: 'Pendants', slug: 'children-pendants', icon: 'pendant', imageUrl: '/products/cat-children-pendants.jpg', description: 'Stainless steel pendants for children' },
      { name: 'Sets', slug: 'children-sets', icon: 'set', imageUrl: '/products/cat-children-sets.jpg', description: 'Jewelry sets for children' },
      { name: 'Watches', slug: 'children-watches', icon: 'watch', imageUrl: '/products/cat-children-watches.jpg', description: 'Fun watches for children' },
      { name: 'Belts', slug: 'children-belts', icon: 'belt', imageUrl: '/products/cat-children-belts.jpg', description: 'Belts for children' },
      { name: 'Bags', slug: 'children-bags', icon: 'bag', imageUrl: '/products/cat-children-bags.jpg', description: 'Bags for children' },
    ],
  },
]

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const existing = await sdb.category.findFirst()
    if (existing) {
      await sdb.category.deleteMany()
    }

    for (const parent of HIERARCHY) {
      const { children, ...parentData } = parent
      const created = await sdb.category.create({ data: parentData })
      for (const child of children) {
        await sdb.category.create({
          data: { ...child, parentId: created.id },
        })
      }
    }

    return NextResponse.json({ ok: true, message: 'Category hierarchy seeded' })
  } catch (err) {
    console.error('Seed categories error:', err)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}, 'categories')
