'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { useTranslation } from '@/hooks/use-translation'

type Category = { id: string; name: string; parentId: string | null; parent?: { id: string; name: string } | null }

type Variant = { size: string; color: string; price: number; stock: number; sku: string; imageUrl: string }

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be > 0'),
  compareAtPrice: z.coerce.number().optional().or(z.literal('')),
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  material: z.string().optional(),
  weight: z.string().optional(),
  imageUrl: z.string().optional(),
  tags: z.string().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  isBestseller: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

const PRODUCT_TYPES = ['ring', 'necklace', 'bracelet', 'earrings', 'other'] as const

export function ProductForm({ categories, initialData, productId, productName }: {
  categories: Category[]
  initialData?: ProductFormValues & { images?: string }
  productId?: string
  productName?: string
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [productType, setProductType] = useState('ring')
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceResult, setEnhanceResult] = useState<{ enhancedUrl: string; originalUrl: string } | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const originalPreviewRef = useRef<string | null>(null)
  const [variants, setVariants] = useState<Variant[]>(() => {
    try {
      const parsed = initialData?.images ? JSON.parse(initialData.images) : []
      return Array.isArray(parsed) ? parsed.filter((v: any) => typeof v === 'object' && !Array.isArray(v) && v.size) : []
    } catch { return [] }
  })

  const parentCats = categories.filter(c => !c.parentId)
  const subCats = categories.filter(c => c.parentId)

  const form = useForm<ProductFormValues>({
    resolver: async (data) => {
      const r = productSchema.safeParse(data)
      return r.success ? { values: r.data, errors: {} } : { values: {} as any, errors: r.error.flatten().fieldErrors as any }
    },
    defaultValues: initialData ? {
      name: initialData.name,
      slug: initialData.slug,
      description: initialData.description,
      price: initialData.price,
      compareAtPrice: initialData.compareAtPrice || '',
      stock: initialData.stock,
      sku: initialData.sku,
      categoryId: initialData.categoryId,
      material: initialData.material || '',
      weight: initialData.weight || '',
      imageUrl: initialData.imageUrl || '',
      tags: initialData.tags || '',
      isActive: initialData.isActive ?? true,
      isFeatured: initialData.isFeatured ?? false,
      isNew: initialData.isNew ?? false,
      isBestseller: initialData.isBestseller ?? false,
    } : {
      name: '', slug: '', description: '', price: 0, compareAtPrice: '', stock: 0,
      sku: '', categoryId: '', material: '', weight: '', imageUrl: '', tags: '',
      isActive: true, isFeatured: false, isNew: false, isBestseller: false,
    },
  })

  useEffect(() => {
    return () => {
      if (originalPreviewRef.current) URL.revokeObjectURL(originalPreviewRef.current)
    }
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (originalPreviewRef.current) URL.revokeObjectURL(originalPreviewRef.current)
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setEnhanceResult(null)
    setOriginalPreview(url)
    originalPreviewRef.current = url
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error(t('admin.productForm.onlyImages')); return }
    if (originalPreviewRef.current) URL.revokeObjectURL(originalPreviewRef.current)
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setEnhanceResult(null)
    setOriginalPreview(url)
    originalPreviewRef.current = url
  }

  async function handleEnhance() {
    if (!selectedFile) { toast.error(t('admin.productForm.selectImageFirst')); return }
    setEnhancing(true)
    try {
      const fd = new FormData()
      fd.append('image', selectedFile)
      fd.append('productName', form.getValues('name') || 'product')
      fd.append('productType', productType)
      if (customPrompt.trim()) fd.append('customPrompt', customPrompt.trim())
      const res = await fetch('/api/admin/products/enhance-image', { method: 'POST', body: fd })
      if (!res.ok) { const err = await res.json(); throw new Error(err.details || err.error || t('admin.productForm.enhancementFailed')) }
      const data = await res.json()
      setEnhanceResult(data)
      toast.success(t('admin.productForm.imageEnhanced'))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('admin.productForm.errorOccurred'))
    } finally { setEnhancing(false) }
  }

  function handleAccept() {
    if (enhanceResult) {
      form.setValue('imageUrl', enhanceResult.enhancedUrl)
      setEnhanceResult(null); setSelectedFile(null); setOriginalPreview(null); setCustomPrompt('')
      toast.success(t('admin.productForm.imageSet'))
    }
  }

  function handleRetry() { setEnhanceResult(null) }

  function addVariant() {
    setVariants(v => [...v, { size: '', color: '', price: 0, stock: 0, sku: '', imageUrl: '' }])
  }

  function updateVariant(i: number, field: keyof Variant, value: string | number) {
    setVariants(v => v.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function removeVariant(i: number) {
    setVariants(v => v.filter((_, idx) => idx !== i))
  }

  async function onSubmit(data: ProductFormValues) {
    const url = productId ? '/api/admin/products/update' : '/api/admin/products/create'
    const payload = productId
      ? { ...data, id: productId, images: JSON.stringify(variants.length > 0 ? variants : []), compareAtPrice: data.compareAtPrice || undefined, material: data.material || undefined, weight: data.weight || undefined }
      : { name: data.name, description: data.description, price: data.price, stock: data.stock, categoryId: data.categoryId, images: [], tags: [], featured: data.isFeatured, weight: data.weight ? parseFloat(data.weight) : undefined }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      toast.success(productId ? t('admin.productForm.productUpdated') : t('admin.productForm.productCreated'))
      router.push('/admin/products')
    } else {
      toast.error(t('admin.productForm.saveFailed'))
    }
  }

  return (
    <Form {...form}>
      {productName && <h1 className="text-2xl font-display font-semibold text-navy mb-6">{t('admin.productForm.editTitle')} {productName}</h1>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.name')}</FormLabel>
              <FormControl><Input {...field} onChange={e => { field.onChange(e); form.setValue('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')) }} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="slug" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.slug')}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('admin.productForm.description')}</FormLabel>
            <FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.price')}</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="compareAtPrice" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.compareAt')}</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="stock" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.stock')}</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="sku" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.sku')}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="categoryId" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.category')}</FormLabel>
              <FormControl>
                <select {...field} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">—</option>
                  {parentCats.map(p => (
                    <optgroup key={p.id} label={p.name}>
                      {subCats.filter(c => c.parentId === p.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="material" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.material')}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="weight" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.weight')}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-3">
          <Label className="text-sm font-medium">{t('admin.productForm.productType')}</Label>
          <select
            value={productType}
            onChange={e => setProductType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PRODUCT_TYPES.map(tp => (
              <option key={tp} value={tp}>{t(`admin.productForm.productTypes.${tp}`)}</option>
            ))}
          </select>

          <Label className="text-sm font-medium">{t('admin.productForm.photo')}</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-gold/50 transition-colors ${isDragging ? 'border-gold' : 'border-border'}`}
          >
            {originalPreview ? (
              <img src={originalPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
            ) : (
              <p className="text-sm text-muted-foreground">{t('admin.productForm.dropImage')}</p>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          <div>
            <Label className="text-sm font-medium">{t('admin.productForm.customPrompt')}</Label>
            <Input
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="e.g. &quot;on a white marble surface with rose gold lighting&quot;"
              className="mt-1"
            />
          </div>

          <Button type="button" onClick={handleEnhance} disabled={!selectedFile || enhancing} variant="outline">
            {enhancing ? t('admin.productForm.enhancing') : t('admin.productForm.enhance')}
          </Button>
        </div>

        {enhanceResult && (
          <div className="p-4 rounded-xl border border-border/60 space-y-3">
            <p className="text-sm font-medium">{t('admin.productForm.result')}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('admin.productForm.original')}</p>
                <img src={enhanceResult.originalUrl} alt="Original" className="w-full rounded-lg border border-border" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('admin.productForm.enhanced')}</p>
                <img src={enhanceResult.enhancedUrl} alt="Enhanced" className="w-full rounded-lg border border-gold/30" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" onClick={handleAccept} variant="default" className="bg-green-600 hover:bg-green-700">{t('admin.productForm.accept')}</Button>
              <Button type="button" onClick={handleRetry} variant="outline">{t('admin.productForm.retry')}</Button>
            </div>
          </div>
        )}

        {!enhanceResult && (
          <FormField control={form.control} name="imageUrl" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.productForm.imageUrl')}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {/* Variants */}
        <div className="rounded-xl border border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t('admin.variants.title')}</Label>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="h-3 w-3" /> {t('admin.variants.add')}
            </Button>
          </div>
          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.variants.noVariants')}</p>
          ) : (
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2 p-3 rounded-lg border border-border/50 bg-background">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">{t('admin.variants.size')}</Label>
                    <Input value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} className="h-8 w-20 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">{t('admin.variants.color')}</Label>
                    <Input value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} className="h-8 w-24 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">{t('admin.variants.price')}</Label>
                    <Input type="number" step="0.01" value={v.price || ''} onChange={e => updateVariant(i, 'price', parseFloat(e.target.value) || 0)} className="h-8 w-24 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">{t('admin.variants.stock')}</Label>
                    <Input type="number" value={v.stock || ''} onChange={e => updateVariant(i, 'stock', parseInt(e.target.value) || 0)} className="h-8 w-20 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">{t('admin.variants.sku')}</Label>
                    <Input value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} className="h-8 w-24 text-xs" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(i)} className="h-8 w-8 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          {(['isFeatured', 'isNew', 'isBestseller', 'isActive'] as const).map(f => (
            <FormField key={f} control={form.control} name={f} render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="rounded border-gray-300" />
                </FormControl>
                <FormLabel className="text-sm font-normal">{t(`admin.productForm.flags.${f.replace('is', '').toLowerCase()}`)}</FormLabel>
              </FormItem>
            )} />
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="default">{productId ? t('admin.productForm.submitUpdate') : t('admin.productForm.submitCreate')}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>{t('admin.productForm.cancel')}</Button>
        </div>
      </form>
    </Form>
  )
}
