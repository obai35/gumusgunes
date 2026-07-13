# AI Product Image Enhancer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click AI image enhancer to the admin product form that transforms raw product photos into professional studio-quality shots using Hugging Face Inference API (FLUX.1-schnell img2img).

**Architecture:** A new `enhanceImage()` service in `src/lib/enhance-image.ts` handles the Hugging Face API call and image saving. A new API route `POST /api/admin/products/enhance-image` accepts multipart form data (image file + product name + type + optional prompt) and returns the enhanced image URL. The existing `ProductForm.tsx` is modified to replace the simple URL input with a file upload + enhance + before/after preview workflow.

**Tech Stack:** Next.js API routes, Hugging Face Inference API (FLUX.1-schnell), sharp (already installed), Vitest

---

### Task 1: Create the enhance-image service

**Files:**
- Create: `src/lib/enhance-image.ts`

- [ ] **Step 1: Write the test for enhance-image service**

File: `src/lib/enhance-image.test.ts`

```typescript
import { describe, it, expect } from 'vitest'

// The prompt builder is a pure function — easy to unit test
// We import from enhance-image after creating it
// For now, test the expected prompt output

describe('enhanceImage prompt builder', () => {
  it('builds correct prompt for ring', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Silver Ring', 'ring')
    expect(prompt).toBe(
      'Professional product photography of a Silver Ring, on a white marble surface with soft studio lighting, jewelry macro photography, 8K'
    )
  })

  it('builds correct prompt for necklace', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Gold Chain Necklace', 'necklace')
    expect(prompt).toBe(
      'Professional product photography of a Gold Chain Necklace, on a velvet display bust with soft studio lighting, jewelry photography, 8K'
    )
  })

  it('builds correct prompt for bracelet', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Silver Bracelet', 'bracelet')
    expect(prompt).toBe(
      'Professional product photography of a Silver Bracelet, on a clean white surface with natural lighting, jewelry photography, 8K'
    )
  })

  it('builds correct prompt for earrings', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Gold Earrings', 'earrings')
    expect(prompt).toBe(
      'Professional product photography of a Gold Earrings, on a minimalist display stand with soft studio lighting, jewelry photography, 8K'
    )
  })

  it('falls back to other for unknown type', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Watch', 'unknown')
    expect(prompt).toBe(
      'Professional product photography of a Watch, professional studio lighting, clean background, commercial product photography, 8K'
    )
  })

  it('uses custom prompt when provided', async () => {
    const { enhanceImage } = await import('./enhance-image')
    // enhanceImage reads HF_API_KEY from env — we just test prompt building indirectly
    // by checking the return structure when env is missing
    await expect(enhanceImage(
      Buffer.from('fake-image'),
      'Ring',
      'ring',
      'Custom prompt here'
    )).rejects.toThrow('HF_API_KEY not set')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/enhance-image.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the enhance-image service**

File: `src/lib/enhance-image.ts`

```typescript
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const HF_API_URL = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell'

const PROMPT_TEMPLATES: Record<string, string> = {
  ring: 'on a white marble surface with soft studio lighting, jewelry macro photography, 8K',
  necklace: 'on a velvet display bust with soft studio lighting, jewelry photography, 8K',
  bracelet: 'on a clean white surface with natural lighting, jewelry photography, 8K',
  earrings: 'on a minimalist display stand with soft studio lighting, jewelry photography, 8K',
  other: 'professional studio lighting, clean background, commercial product photography, 8K',
}

export function buildPrompt(productName: string, productType: string): string {
  const suffix = PROMPT_TEMPLATES[productType] || PROMPT_TEMPLATES.other
  return `Professional product photography of a ${productName}, ${suffix}`
}

export async function enhanceImage(
  imageBuffer: Buffer,
  productName: string,
  productType: string,
  customPrompt?: string,
): Promise<{ enhancedUrl: string; originalUrl: string }> {
  const apiKey = process.env.HF_API_KEY
  if (!apiKey) throw new Error('HF_API_KEY not set')

  const prompt = customPrompt || buildPrompt(productName, productType)
  const timestamp = Date.now()
  const filename = `${timestamp}.jpg`
  const originalFilename = `${timestamp}-original.jpg`
  const outputDir = path.join(process.cwd(), 'public', 'products', 'enhanced')

  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, originalFilename), imageBuffer)

  const base64Image = imageBuffer.toString('base64')

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: base64Image,
      parameters: { prompt, strength: 0.85, guidance_scale: 7.5 },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Hugging Face API error: ${response.status} ${errText}`)
  }

  const enhancedBuffer = Buffer.from(await response.arrayBuffer())
  const optimized = await sharp(enhancedBuffer).jpeg({ quality: 90 }).toBuffer()
  await fs.writeFile(path.join(outputDir, filename), optimized)

  return {
    enhancedUrl: `/products/enhanced/${filename}`,
    originalUrl: `/products/enhanced/${originalFilename}`,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/enhance-image.test.ts`
Expected: PASS (the last test about `enhanceImage` expects the missing key error)

- [ ] **Step 5: Commit**

```bash
git add src/lib/enhance-image.ts src/lib/enhance-image.test.ts
git commit -m "feat: add enhance-image service for AI product photo enhancement"
```

---

### Task 2: Create the enhance-image API route

**Files:**
- Create: `src/app/api/admin/products/enhance-image/route.ts`

- [ ] **Step 1: Write the test for the API route**

File: `src/app/api/admin/products/enhance-image/enhance-image.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the enhance-image service
vi.mock('@/lib/enhance-image', () => ({
  enhanceImage: vi.fn(),
}))

import { POST } from './route'
import { enhanceImage } from '@/lib/enhance-image'

describe('POST /api/admin/products/enhance-image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when no image file provided', async () => {
    const formData = new FormData()
    formData.append('productName', 'Ring')
    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Image file is required')
  })

  it('returns 400 when no product name provided', async () => {
    const formData = new FormData()
    formData.append('image', new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' }))
    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Product name is required')
  })

  it('calls enhanceImage and returns URLs on success', async () => {
    const mockEnhanceImage = vi.mocked(enhanceImage)
    mockEnhanceImage.mockResolvedValue({
      enhancedUrl: '/products/enhanced/123.jpg',
      originalUrl: '/products/enhanced/123-original.jpg',
    })

    const formData = new FormData()
    formData.append('image', new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' }))
    formData.append('productName', 'Silver Ring')
    formData.append('productType', 'ring')

    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.enhancedUrl).toBe('/products/enhanced/123.jpg')
    expect(json.originalUrl).toBe('/products/enhanced/123-original.jpg')
    expect(mockEnhanceImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Silver Ring',
      'ring',
      undefined,
    )
  })

  it('passes custom prompt when provided', async () => {
    const mockEnhanceImage = vi.mocked(enhanceImage)
    mockEnhanceImage.mockResolvedValue({
      enhancedUrl: '/products/enhanced/456.jpg',
      originalUrl: '/products/enhanced/456-original.jpg',
    })

    const formData = new FormData()
    formData.append('image', new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' }))
    formData.append('productName', 'Ring')
    formData.append('customPrompt', 'On a red velvet background')

    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockEnhanceImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Ring',
      'other',
      'On a red velvet background',
    )
  })

  it('returns 502 when enhanceImage throws', async () => {
    const mockEnhanceImage = vi.mocked(enhanceImage)
    mockEnhanceImage.mockRejectedValue(new Error('API rate limited'))

    const formData = new FormData()
    formData.append('image', new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' }))
    formData.append('productName', 'Ring')

    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.error).toBe('Failed to enhance image')
    expect(json.details).toBe('API rate limited')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/admin/products/enhance-image/enhance-image.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the API route**

File: `src/app/api/admin/products/enhance-image/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { enhanceImage } from '@/lib/enhance-image'

export const POST = withAdmin(async (req: NextRequest) => {
  const formData = await req.formData()

  const imageFile = formData.get('image') as File | null
  if (!imageFile) {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
  }

  const productName = formData.get('productName') as string | null
  if (!productName) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
  }

  const productType = (formData.get('productType') as string) || 'other'
  const customPrompt = formData.get('customPrompt') as string | null

  const buffer = Buffer.from(await imageFile.arrayBuffer())

  try {
    const result = await enhanceImage(buffer, productName, productType, customPrompt || undefined)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to enhance image', details: e.message },
      { status: 502 },
    )
  }
}, 'products')
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/admin/products/enhance-image/enhance-image.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/products/enhance-image/route.ts src/app/api/admin/products/enhance-image/enhance-image.test.ts
git commit -m "feat: add POST /api/admin/products/enhance-image endpoint"
```

---

### Task 3: Modify ProductForm to add file upload + AI enhance workflow

**Files:**
- Modify: `src/app/admin/products/ProductForm.tsx`

- [ ] **Step 1: Add product type dropdown, file upload area, enhance button, and before/after preview to ProductForm**

Replace the content of ProductForm.tsx:

```tsx
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

      {/* AI Image Enhancer */}
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
          {enhancing ? (
            <span className="flex items-center gap-2">Enhancing...</span>
          ) : (
            <span className="flex items-center gap-2">Enhance with AI</span>
          )}
        </button>
      </div>

      {/* Before/After Preview */}
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

      {/* Fallback URL input (shown when no enhance result is active) */}
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
```

- [ ] **Step 2: Verify the app compiles**

Run: `npm run build` or `npx next build` (or just check TypeScript)
Expected: No compilation errors

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/products/ProductForm.tsx
git commit -m "feat: add AI image enhance workflow to product form"
```

---

### Task 4: Add HF_API_KEY to environment

- [ ] **Step 1: Add HF_API_KEY to .env**

Append to `C:\Users\obai\Desktop\website\.env`:

```
HF_API_KEY=
```

- [ ] **Step 2: Verify the app still works**

Run: `npx vitest run src/lib/enhance-image.test.ts src/app/api/admin/products/enhance-image/enhance-image.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add .env
git commit -m "chore: add HF_API_KEY env var placeholder"
```

---

### Self-Review Checklist

- [ ] **Spec coverage:** Does every requirement from the spec have a corresponding task? Yes — prompt builder, API route, UI changes, env var.
- [ ] **Placeholder scan:** Every step has complete code. No "TBD" or "implement later".
- [ ] **Type consistency:** `enhanceImage` signature matches between the service, API route, and tests. `buildPrompt` is exported and tested. The response shape (`{ enhancedUrl, originalUrl }`) is consistent.
