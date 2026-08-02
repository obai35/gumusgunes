'use client'

import { useEffect, useState } from 'react'
import { AdjustForm } from './AdjustForm'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function AdjustStockPage() {
  const { ta } = useAdminTranslate()
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string; stock: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/products?limit=200')
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock })) : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">{ta('Adjust Stock')}</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground">{ta('Loading...')}</p>
      ) : (
        <AdjustForm products={products} />
      )}
    </div>
  )
}
