import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

const POS_DEFAULTS: Record<string, string> = {
  posDefaultTaxRate: '0',
  posCurrencySymbol: 'E£',
  posCurrencyCode: 'EGP',
}

export const GET = withPosOrAdmin(async (_req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const settings = await sdb.siteSetting.findMany({
    where: { key: { in: Object.keys(POS_DEFAULTS) } },
  })
  const map: Record<string, string> = { ...POS_DEFAULTS }
  for (const s of settings) map[s.key] = s.value
  return NextResponse.json({
    ok: true,
    taxRate: map.posDefaultTaxRate,
    currencySymbol: map.posCurrencySymbol,
    currencyCode: map.posCurrencyCode,
  })
}, 'pos')
