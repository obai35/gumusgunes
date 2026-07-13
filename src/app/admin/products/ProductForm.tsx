'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type ProductData = {
  name: string; slug: string; description: string; price: number; compareAtPrice?: number
  sku: string; categoryId: string; material: string; weight?: string; stock: number
  imageUrl: string; images: string; tags: string; isActive: boolean; isFeatured: boolean
  isNew: boolean; isBestseller: boolean
}

const PRODUCT_TYPES = [
  { value: 'ring', label: 'Ring' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'other', label: 'Other' },
]

export function ProductForm({ categories, initialData, productId }: {
  categories: { id: string; name: string; parentId: string | null; parent?: { id: string; name: string } | null }[]
  initialData?: ProductData
  productId?: string
}) {
  const parentCats = categories.filter(c => !c.parentId)
  const subCats = categories.filter(c => c.parentId)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ProductData>(initialData || {
    name: '', slug: '', description: '', price: 0, sku: '', categoryId: '',
    material: '', stock: 0, imageUrl: '', images: '[]', tags: '[]',
    isActive: true, isFeatured: false, isNew: false, isBestseller: false,
  })
  const [productType, setProductType] = useState('ring')
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceResult, setEnhanceResult] = useState<{ enhancedUrl: string; originalUrl: string } | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setEnhanceResult(null)
    setOriginalPreview(URL.createObjectURL(file))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setEnhanceResult(null)
    setOriginalPreview(URL.createObjectURL(file))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleEnhance() {
    if (!selectedFile) {
      toast.error('Select an image first')
      return
    }
    setEnhancing(true)
    try {
      const fd = new FormData()
      fd.append('image', selectedFile)
      fd.append('productName', form.name || 'product')
      fd.append('productType', productType)
      if (customPrompt.trim()) fd.append('customPrompt', customPrompt.trim())

      const res = await fetch('/api/admin/products/enhance-image', {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || 'Enhancement failed')
      }
      const data = await res.json()
      setEnhanceResult(data)
      setForm(f => ({ ...f, imageUrl: data.enhancedUrl }))
      toast.success('Image enhanced successfully')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setEnhancing(false)
    }
  }

  function handleAccept() {
    if (enhanceResult) {
      setForm(f => ({ ...f, imageUrl: enhanceResult.enhancedUrl }))
      setEnhanceResult(null)
      setSelectedFile(null)
      setOriginalPreview(null)
      setCustomPrompt('')
      toast.success('Image set')
    }
  }

  function handleRetry() {
    setEnhanceResult(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = productId ? '/api/admin/products/update' : '/api/admin/products/create'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: productId }),
    })
    if (res.ok) { toast.success(productId ? 'Product updated' : 'Product created'); router.push('/admin/products'); router.refresh() }
    else { toast.error('Failed to save product') }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Slug</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>
      <div><label className="text-sm font-medium text-navy">Description</label><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1 min-h-[80px]" /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="text-sm font-medium text-navy">Price ($)</label><input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Compare At</label><input type="number" step="0.01" value={form.compareAtPrice || ''} onChange={(e) => setForm({ ...form, compareAtPrice: parseFloat(e.target.value) || undefined })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Stock</label><input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">SKU</label><input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Category</label><select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1">{parentCats.map((p) => (<optgroup key={p.id} label={p.name}>{subCats.filter(c => c.parentId === p.id).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</optgroup>))}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">Material</label><input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Weight</label><input value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>

      <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
        <label className="text-sm font-medium text-navy">Product Type</label>
        <select
          value={productType}
          onChange={e => setProductType(e.target.value)}
          className="w-full p-2 rounded-lg border border-border text-sm"
        >
          {PRODUCT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <label className="text-sm font-medium text-navy">Photo</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold/50 transition-colors"
        >
          {originalPreview ? (
            <img src={originalPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
          ) : (
            <p className="text-sm text-muted-foreground">Drop image here or click to upload</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-navy">Custom Prompt (optional)</label>
          <input
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder='e.g. "on a white marble surface with rose gold lighting"'
            className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1"
          />
        </div>

        <button
          type="button"
          onClick={handleEnhance}
          disabled={!selectedFile || enhancing}
          className="px-6 py-2.5 bg-gold/10 text-gold border border-gold/30 rounded-lg text-sm font-medium hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enhancing ? 'Enhancing...' : 'Enhance with AI'}
        </button>
      </div>

      {enhanceResult && (
        <div className="p-4 rounded-xl border border-border/60 space-y-3">
          <p className="text-sm font-medium text-navy">Result</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Original</p>
              <img src={enhanceResult.originalUrl} alt="Original" className="w-full rounded-lg border border-border" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Enhanced</p>
              <img src={enhanceResult.enhancedUrl} alt="Enhanced" className="w-full rounded-lg border border-gold/30" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleAccept} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Accept</button>
            <button type="button" onClick={handleRetry} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Retry</button>
          </div>
        </div>
      )}

      {!enhanceResult && (
        <div><label className="text-sm font-medium text-navy">Image URL</label><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      )}

      <div className="flex gap-4">
        {(['isFeatured', 'isNew', 'isBestseller', 'isActive'] as const).map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.checked })} className="rounded" />{f.replace('is', '')}</label>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{productId ? 'Update' : 'Create'} Product</button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </form>
  )
}
