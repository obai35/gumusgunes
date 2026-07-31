import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

export const POST = withPosOrAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { code, subtotal, items } = await req.json()
    const discount = await sdb.discount.findFirst({ where: { code } })
    if (!discount || !discount.isActive) return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return NextResponse.json({ error: 'Discount code expired' }, { status: 400 })
    if (discount.maxUses && discount.usedCount >= discount.maxUses) return NextResponse.json({ error: 'Usage limit reached' }, { status: 400 })

    const clientSubtotal = Number(subtotal)
    if (!Number.isFinite(clientSubtotal) || clientSubtotal < 0) {
      return NextResponse.json({ error: 'Invalid subtotal' }, { status: 400 })
    }
    if (discount.minOrder && clientSubtotal < discount.minOrder) {
      return NextResponse.json({ error: `Minimum order amount of E£${discount.minOrder.toFixed(2)} required` }, { status: 400 })
    }

    const validatedItems: { productId: string; quantity: number }[] = []
    for (const item of items || []) {
      if (!item?.productId) return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
      const quantity = Math.floor(Number(item.quantity))
      if (!Number.isFinite(quantity) || quantity <= 0) return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
      validatedItems.push({ productId: item.productId, quantity })
    }

    const productIds = validatedItems.map(i => i.productId)
    const products = await sdb.product.findMany({
      where: { id: { in: productIds } },
      include: { category: { select: { name: true, parent: { select: { name: true } } } } },
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    const totalSubtotal = validatedItems.reduce((sum, item) => {
      const product = productMap.get(item.productId)
      return sum + (product ? product.price * item.quantity : 0)
    }, 0)

    let eligibleSubtotal = totalSubtotal

    if (discount.appliesTo !== 'all' && discount.targetValue) {
      const target = discount.targetValue.toLowerCase()
      eligibleSubtotal = 0

      for (const item of validatedItems) {
        const product = productMap.get(item.productId)
        if (!product) continue

        if (discount.appliesTo === 'category') {
          const catName = product.category.name.toLowerCase()
          const parentName = (product.category as any).parent?.name?.toLowerCase()
          if (catName === target || parentName === target) {
            eligibleSubtotal += product.price * item.quantity
          }
        } else if (discount.appliesTo === 'tag') {
          const tags: string[] = JSON.parse(product.tags || '[]')
          if (tags.some(t => t.toLowerCase().includes(target))) {
            eligibleSubtotal += product.price * item.quantity
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
}, 'pos')
