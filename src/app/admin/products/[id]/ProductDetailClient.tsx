'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Package, DollarSign, Clock, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'

type SerializedProduct = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice: number | null
  costPrice: number | null
  stock: number
  sku: string
  imageUrl: string
  images: string
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  isBestseller: boolean
  category: { id: string; name: string } | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function ProductDetailClient({ product }: { product: SerializedProduct }) {
  const { t } = useTranslation()
  const router = useRouter()

  const margin = product.costPrice && product.price
    ? ((product.price - product.costPrice) / product.price * 100).toFixed(1)
    : null

  return (
    <div className="max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/products')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-display font-semibold text-navy">{t('admin.productDetail.title')}</h1>
        </div>
        <Link href={`/admin/products/${product.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-3 w-3 mr-1" /> {t('admin.productDetail.edit')}
          </Button>
        </Link>
      </div>

      <section className="rounded-xl border border-border/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-navy flex items-center gap-2"><Package className="h-4 w-4" /> {t('admin.productDetail.overview')}</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><span className="text-muted-foreground">{t('admin.productForm.name')}</span><p className="font-medium">{product.name}</p></div>
          <div><span className="text-muted-foreground">{t('admin.productForm.slug')}</span><p className="font-medium">/{product.slug}</p></div>
          <div><span className="text-muted-foreground">{t('admin.productForm.sku')}</span><p className="font-medium">{product.sku}</p></div>
          <div><span className="text-muted-foreground">{t('admin.productDetail.category')}</span><p className="font-medium">{product.category?.name || t('admin.productDetail.noCategory')}</p></div>
          <div className="col-span-2">
            <span className="text-muted-foreground">{t('admin.productForm.description')}</span>
            <p className="font-medium whitespace-pre-wrap">{product.description}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-navy flex items-center gap-2"><DollarSign className="h-4 w-4" /> {t('admin.productDetail.pricing')}</h2>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">{t('admin.productDetail.sellingPrice')}</span>
            <p className="text-lg font-bold text-navy">${product.price.toFixed(2)}</p>
          </div>
          {product.compareAtPrice != null && (
            <div>
              <span className="text-muted-foreground">{t('admin.productForm.compareAt')}</span>
              <p className="text-lg font-medium text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">{t('admin.productDetail.costPrice')}</span>
            <p className="text-lg font-medium">{product.costPrice ? `$${product.costPrice.toFixed(2)}` : '\u2014'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('admin.productDetail.margin')}</span>
            <p className="text-lg font-medium">{margin ? `${margin}%` : '\u2014'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-navy flex items-center gap-2"><Package className="h-4 w-4" /> {t('admin.productDetail.status')}</h2>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">{t('admin.productDetail.stockInfo')}</span>
            <p className={`text-lg font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 5 ? 'text-amber-600' : 'text-green-600'}`}>
              {product.stock === 0 ? t('admin.productDetail.outOfStock') : product.stock < 5 ? t('admin.productDetail.lowStock') : t('admin.productDetail.inStock')}
              <span className="ml-2 font-normal text-sm">({product.stock})</span>
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('admin.productForm.flags.featured')}</span>
            <p className="text-lg font-medium">{product.isFeatured ? '\u2705' : '\u2014'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('admin.productForm.flags.new')}</span>
            <p className="text-lg font-medium">{product.isNew ? '\u2705' : '\u2014'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-navy flex items-center gap-2"><Clock className="h-4 w-4" /> {t('admin.productDetail.metadata')}</h2>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">{t('admin.productDetail.createdAt')}</span>
            <p className="font-medium">{new Date(product.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('admin.productDetail.updatedAt')}</span>
            <p className="font-medium">{new Date(product.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-navy flex items-center gap-2"><Tag className="h-4 w-4" /> {t('admin.productDetail.tags')}</h2>
        {product.tags?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.tags.map(tg => (
              <span key={tg} className="px-2 py-1 text-xs rounded-full bg-secondary/30 text-muted-foreground border border-border">{tg}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('admin.productDetail.noTags')}</p>
        )}
      </section>
    </div>
  )
}
