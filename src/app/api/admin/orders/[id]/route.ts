import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export const PUT = withAdmin(async (req, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const body = await req.json()
    const { items, fullName, phone, address, city, postalCode, notes, editedById } = body

    if (!editedById) return NextResponse.json({ error: 'Edited by is required' }, { status: 400 })

    const admin = await db.admin.findUnique({ where: { id: editedById } })
    if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 400 })

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'cancelled') return NextResponse.json({ error: 'Cannot edit cancelled order' }, { status: 400 })

    const editEntries: any[] = []

    if (items) {
      for (const newItem of items) {
        const existing = order.items.find((oi) => oi.id === newItem.id)
        if (existing) {
          const diff = newItem.quantity - existing.quantity
          if (diff > 0) {
            const product = await db.product.findUnique({ where: { id: existing.productId } })
            if (!product || product.stock < diff) return NextResponse.json({ error: `Insufficient stock for ${existing.productId}` }, { status: 400 })
          }
          editEntries.push({ field: `item_${existing.productId}_qty`, oldValue: existing.quantity, newValue: newItem.quantity, editedAt: new Date().toISOString(), editedBy: editedById })
        }
      }
    }

    if (fullName && fullName !== order.fullName) editEntries.push({ field: 'fullName', oldValue: order.fullName, newValue: fullName, editedAt: new Date().toISOString(), editedBy: editedById })
    if (phone !== undefined && phone !== order.phone) editEntries.push({ field: 'phone', oldValue: order.phone || '', newValue: phone || '', editedAt: new Date().toISOString(), editedBy: editedById })
    if (address && address !== order.address) editEntries.push({ field: 'address', oldValue: order.address, newValue: address, editedAt: new Date().toISOString(), editedBy: editedById })
    if (city && city !== order.city) editEntries.push({ field: 'city', oldValue: order.city, newValue: city, editedAt: new Date().toISOString(), editedBy: editedById })
    if (postalCode !== undefined && postalCode !== order.postalCode) editEntries.push({ field: 'postalCode', oldValue: order.postalCode, newValue: postalCode || '', editedAt: new Date().toISOString(), editedBy: editedById })

    const existingHistory = order.editHistory ? JSON.parse(order.editHistory) : []
    const updatedHistory = [...existingHistory, ...editEntries]

    const result = await db.$transaction(async (tx) => {
      if (items) {
        for (const newItem of items) {
          const existing = order.items.find((oi) => oi.id === newItem.id)
          if (existing) {
            const diff = newItem.quantity - existing.quantity
            if (diff !== 0) {
              await tx.product.update({
                where: { id: existing.productId },
                data: { stock: { increment: -diff } },
              })
              await tx.inventoryLog.create({
                data: {
                  productId: existing.productId,
                  type: 'ADJUSTMENT',
                  change: -diff,
                  note: `Order edit - ${order.orderNumber}`,
                },
              })
            }
            await tx.orderItem.update({
              where: { id: existing.id },
              data: { quantity: newItem.quantity },
            })
          }
        }
      }

      const updateData: any = { editHistory: JSON.stringify(updatedHistory) }
      if (fullName) updateData.fullName = fullName
      if (phone !== undefined) updateData.phone = phone
      if (address) updateData.address = address
      if (city) updateData.city = city
      if (postalCode !== undefined) updateData.postalCode = postalCode
      if (notes !== undefined) updateData.notes = notes

      return tx.order.update({
        where: { id },
        data: updateData,
        include: { items: { include: { product: { select: { name: true } } } } },
      })
    })

    if (result.paymentProofUrl) {
      try { result.paymentProofUrl = decrypt(result.paymentProofUrl) } catch {}
    }
    if (result.paymentReference) {
      try { result.paymentReference = decrypt(result.paymentReference) } catch {}
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to edit order' }, { status: 500 })
  }
}, 'orders')
