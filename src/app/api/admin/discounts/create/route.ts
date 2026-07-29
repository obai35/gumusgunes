import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { code, type, value, maxUses, expiresAt, appliesTo, targetValue, minOrder, governorateId } = await req.json()
    const discount = await sdb.discount.create({
      data: {
        code: code.toUpperCase().replace(/\s+/g, '_'),
        type,
        value: parseFloat(value),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        appliesTo: type === 'SHIPPING' ? 'all' : (appliesTo || 'all'),
        targetValue: type === 'SHIPPING' ? null : (targetValue || null),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        governorateId: governorateId || null,
      },
    })
    return NextResponse.json({ discount })
  } catch (err) {
    return handleApiError(err, 'admin-discounts-create')
  }
}, 'discounts')
