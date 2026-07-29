import { storeDb } from './store-scoped'

export interface AllocationResult {
  productsCosted: number
  totalMaterialCost: number
  totalLaborCost: number
  totalMfgOverhead: number
  totalAdminOverhead: number
  totalSellingOverhead: number
  totalAllocatedCost: number
  errors: string[]
}

export async function runCostAllocation(storeId: string): Promise<AllocationResult> {
  const sdb = storeDb(storeId)
  const errors: string[] = []

  const pools = await sdb.costPool.findMany({ where: { isActive: true } })
  const products = await sdb.product.findMany({
    where: { isActive: true },
    include: {
      costBreakdown: true,
      billOfMaterials: { where: { isActive: true }, include: { items: { include: { product: true } } } },
      productionOrders: { where: { status: 'completed' }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const mfgPools = pools.filter(p => p.category === 'mfg_overhead')
  const adminPools = pools.filter(p => p.category === 'admin_overhead')
  const sellingPools = pools.filter(p => p.category === 'selling_overhead')

  const totalDirectLabor = products.reduce((sum, p) => {
    const lastOrder = p.productionOrders[0]
    return sum + (lastOrder ? lastOrder.actualLaborCost : 0)
  }, 0) || 1

  const totalMaterial = products.reduce((sum, p) => {
    const activeBom = p.billOfMaterials[0]
    if (activeBom) {
      return sum + activeBom.items.reduce((s, i) => s + ((i.unitCost ?? i.product.costPrice ?? 0) * i.quantity), 0)
    }
    return sum + (p.costPrice ?? 0)
  }, 0) || 1

  const totalDirect = totalDirectLabor + totalMaterial || 1
  const totalCostBase = products.reduce((sum, p) => sum + (p.costPrice ?? 0), 0) || 1

  let productsCosted = 0
  let totalMaterialCost = 0
  let totalLaborCost = 0
  let totalMfgOverhead = 0
  let totalAdminOverhead = 0
  let totalSellingOverhead = 0

  for (const product of products) {
    try {
      const activeBom = product.billOfMaterials[0]
      let materialCost = 0
      if (activeBom) {
        for (const item of activeBom.items) {
          const uc = item.unitCost ?? item.product.costPrice ?? 0
          materialCost += uc * item.quantity * (1 + item.scrapPct / 100)
        }
      } else {
        materialCost = product.costPrice ?? 0
      }

      const lastOrder = product.productionOrders[0]
      const laborCost = lastOrder ? lastOrder.actualLaborCost : 0

      let mfgOverhead = 0
      for (const pool of mfgPools) {
        if (pool.basis === 'labor_pct' && totalDirectLabor > 0) {
          mfgOverhead += (laborCost / totalDirectLabor) * pool.rate
        } else if (pool.basis === 'material_pct' && totalMaterial > 0) {
          mfgOverhead += (materialCost / totalMaterial) * pool.rate
        } else if (pool.basis === 'total_pct' && totalCostBase > 0) {
          mfgOverhead += ((materialCost + laborCost) / totalCostBase) * pool.rate
        } else if (pool.basis === 'direct_pct' && totalDirect > 0) {
          mfgOverhead += ((materialCost + laborCost) / totalDirect) * pool.rate
        } else if (pool.basis === 'fixed_amount') {
          mfgOverhead += pool.rate / Math.max(products.length, 1)
        }
      }

      let adminOverhead = 0
      for (const pool of adminPools) {
        if (pool.basis === 'total_pct' && totalCostBase > 0) {
          adminOverhead += ((materialCost + laborCost + mfgOverhead) / totalCostBase) * pool.rate
        } else if (pool.basis === 'direct_pct' && totalDirect > 0) {
          adminOverhead += ((materialCost + laborCost) / totalDirect) * pool.rate
        } else if (pool.basis === 'fixed_amount') {
          adminOverhead += pool.rate / Math.max(products.length, 1)
        }
      }

      let sellingOverhead = 0
      for (const pool of sellingPools) {
        if (pool.basis === 'material_pct' && totalMaterial > 0) {
          sellingOverhead += (materialCost / totalMaterial) * pool.rate
        } else if (pool.basis === 'direct_pct' && totalDirect > 0) {
          sellingOverhead += ((materialCost + laborCost) / totalDirect) * pool.rate
        } else if (pool.basis === 'total_pct' && totalCostBase > 0) {
          sellingOverhead += ((materialCost + laborCost + mfgOverhead + adminOverhead) / totalCostBase) * pool.rate
        } else if (pool.basis === 'fixed_amount') {
          sellingOverhead += pool.rate / Math.max(products.length, 1)
        }
      }

      const totalCost = materialCost + laborCost + mfgOverhead + adminOverhead + sellingOverhead
      const margin = product.price > 0 && totalCost > 0 ? ((product.price - totalCost) / product.price) * 100 : null

      await (sdb.productCostBreakdown as any).upsert({
        where: { productId: product.id },
        update: {
          materialCost: Math.round(materialCost * 100) / 100,
          laborCost: Math.round(laborCost * 100) / 100,
          mfgOverhead: Math.round(mfgOverhead * 100) / 100,
          adminOverhead: Math.round(adminOverhead * 100) / 100,
          sellingOverhead: Math.round(sellingOverhead * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          currentPrice: product.price,
          margin: margin !== null ? Math.round(margin * 100) / 100 : null,
          lastAllocatedAt: new Date(),
        },
        create: {
          productId: product.id,
          materialCost: Math.round(materialCost * 100) / 100,
          laborCost: Math.round(laborCost * 100) / 100,
          mfgOverhead: Math.round(mfgOverhead * 100) / 100,
          adminOverhead: Math.round(adminOverhead * 100) / 100,
          sellingOverhead: Math.round(sellingOverhead * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          currentPrice: product.price,
          margin: margin !== null ? Math.round(margin * 100) / 100 : null,
          lastAllocatedAt: new Date(),
        },
      })

      productsCosted++
      totalMaterialCost += materialCost
      totalLaborCost += laborCost
      totalMfgOverhead += mfgOverhead
      totalAdminOverhead += adminOverhead
      totalSellingOverhead += sellingOverhead
    } catch (e) {
      errors.push(`Product ${product.id} (${product.name}): ${e instanceof Error ? e.message : 'unknown error'}`)
    }
  }

  return {
    productsCosted,
    totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
    totalLaborCost: Math.round(totalLaborCost * 100) / 100,
    totalMfgOverhead: Math.round(totalMfgOverhead * 100) / 100,
    totalAdminOverhead: Math.round(totalAdminOverhead * 100) / 100,
    totalSellingOverhead: Math.round(totalSellingOverhead * 100) / 100,
    totalAllocatedCost: Math.round((totalMaterialCost + totalLaborCost + totalMfgOverhead + totalAdminOverhead + totalSellingOverhead) * 100) / 100,
    errors,
  }
}

export async function getCostCard(productId: string, storeId: string) {
  const sdb = storeDb(storeId)
  const product = await sdb.product.findFirst({
    where: { id: productId },
    include: {
      costBreakdown: true,
      billOfMaterials: { where: { isActive: true }, include: { items: { include: { product: true } } } },
      priceListItems: { include: { priceList: true } },
    },
  })
  if (!product) return null

  const formulas = await sdb.pricingFormula.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })

  const suggestedPrices = formulas.map(f => {
    const totalCost = product.costBreakdown?.totalCost ?? product.costPrice ?? 0
    let price = 0
    if (f.type === 'margin') price = totalCost / (1 - f.value / 100)
    else if (f.type === 'markup_multiplier') price = totalCost * f.value
    else if (f.type === 'fixed_amount') price = totalCost + f.value
    return { formulaId: f.id, formulaName: f.name, type: f.type, value: f.value, suggestedPrice: Math.round(price * 100) / 100 }
  })

  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl: product.imageUrl,
      price: product.price,
      costPrice: product.costPrice,
    },
    costBreakdown: product.costBreakdown ? {
      materialCost: product.costBreakdown.materialCost,
      laborCost: product.costBreakdown.laborCost,
      mfgOverhead: product.costBreakdown.mfgOverhead,
      adminOverhead: product.costBreakdown.adminOverhead,
      sellingOverhead: product.costBreakdown.sellingOverhead,
      totalCost: product.costBreakdown.totalCost,
      currentPrice: product.costBreakdown.currentPrice,
      margin: product.costBreakdown.margin,
      lastAllocatedAt: product.costBreakdown.lastAllocatedAt,
    } : null,
    bomItems: product.billOfMaterials[0]?.items.map(i => ({
      productId: i.productId,
      name: i.product.name,
      quantity: i.quantity,
      unitCost: i.unitCost ?? i.product.costPrice ?? 0,
      scrapPct: i.scrapPct,
      total: (i.unitCost ?? i.product.costPrice ?? 0) * i.quantity * (1 + i.scrapPct / 100),
    })) ?? [],
    priceListItems: product.priceListItems.map(pli => ({
      priceListId: pli.priceListId,
      priceListName: pli.priceList.name,
      price: pli.price,
      minQuantity: pli.minQuantity,
    })),
    suggestedPrices,
  }
}

export async function calculateSuggestedPrice(productId: string, formulaId: string, storeId: string) {
  const sdb = storeDb(storeId)
  const [breakdown, formula] = await Promise.all([
    sdb.productCostBreakdown.findFirst({ where: { productId } }),
    sdb.pricingFormula.findFirst({ where: { id: formulaId } }),
  ])
  if (!breakdown || !formula) throw new Error('Breakdown or formula not found')

  const totalCost = breakdown.totalCost
  let price = 0
  if (formula.type === 'margin') price = totalCost / (1 - formula.value / 100)
  else if (formula.type === 'markup_multiplier') price = totalCost * formula.value
  else if (formula.type === 'fixed_amount') price = totalCost + formula.value

  return {
    totalCost,
    formulaName: formula.name,
    formulaType: formula.type,
    formulaValue: formula.value,
    suggestedPrice: Math.round(price * 100) / 100,
    margin: price > 0 ? Math.round(((price - totalCost) / price) * 100 * 100) / 100 : 0,
  }
}
