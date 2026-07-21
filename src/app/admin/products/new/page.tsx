'use client'

import { useState, useEffect } from 'react'
import { ProductForm } from '../ProductForm'

export default function NewProduct() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/products/categories')
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-display font-semibold text-navy mb-6">Add Product</h1>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Add Product</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
