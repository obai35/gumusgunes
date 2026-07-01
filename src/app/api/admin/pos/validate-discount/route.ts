import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { code, subtotal, items } = await req.json()
    const discount = await db.discount.findUnique({ where: { code } })
    if (!discount || !discount.isActive) return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return NextResponse.json({ error: 'Discount code expired' }, { status: 400 })
    if (discount.maxUses && discount.usedCount >= discount.maxUses) return NextResponse.json({ error: 'Usage limit reached' }, { status: 400 })

    if (discount.minOrder && subtotal < discount.minOrder) {
      return NextResponse.json({ error: `Minimum order amount of $${discount.minOrder.toFixed(2)} required` }, { status: 400 })
    }

    let eligibleSubtotal = subtotal

    if (discount.appliesTo !== 'all' && discount.targetValue && items?.length) {
      const target = discount.targetValue.toLowerCase()

      const productIds = items.map((i: any) => i.productId)
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
        include: { category: { select: { name: true, parent: { select: { name: true } } } } },
      })

      const productMap = new Map(products.map(p => [p.id, p]))
      eligibleSubtotal = 0

      for (const item of items) {
        const product = productMap.get(item.productId)
        if (!product) continue

        if (discount.appliesTo === 'category') {
          const catName = product.category.name.toLowerCase()
          const parentName = (product.category as any).parent?.name?.toLowerCase()
          if (catName === target || parentName === target) {
            eligibleSubtotal += item.price * item.quantity
          }
        } else if (discount.appliesTo === 'tag') {
          const tags: string[] = JSON.parse(product.tags || '[]')
          if (tags.some(t => t.toLowerCase().includes(target))) {
            eligibleSubtotal += item.price * item.quantity
          }
        }
      }

      if (eligibleSubtotal === 0) {
        return NextResponse.json({ error: 'Discount does not apply to any items in the cart' }, { status: 400 })
      }
    }

    const amount = discount.type === 'PERCENTAGE' ? eligibleSubtotal * (discount.value / 100) : discount.value
    return NextResponse.json({
      amount: Math.min(amount, eligibleSubtotal),
      type: discount.type,
      value: discount.value,
      appliesTo: discount.appliesTo,
      targetValue: discount.targetValue,
    })
  } catch (err) {
    console.error('Validate discount error:', err)
    return NextResponse.json({ error: 'Failed to validate discount' }, { status: 500 })
  }
}
