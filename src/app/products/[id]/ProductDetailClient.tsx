'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingBag, Star, Truck, ShieldCheck, RefreshCw, Minus, Plus, ZoomIn } from 'lucide-react'
import { useCart, useWishlist, useRecentlyViewed } from '@/lib/store'
import { formatDate, cn } from '@/lib/format'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Product, Review } from '@/lib/types'

interface Props {
  product: Product & { category: any; reviews: Review[] }
  related: Product[]
}

export default function ProductDetailClient({ product, related }: Props) {
  const router = useRouter()
  const { addItem } = useCart()
  const wishlist = useWishlist()
  const { add: addToRecentlyViewed } = useRecentlyViewed()
  const formatPrice = useFormatPrice()
  const { t } = useTranslation()
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => { addToRecentlyViewed(product.id) }, [product.id, addToRecentlyViewed])

  const handleAdd = useCallback(() => {
    addItem(product, qty)
    toast.success(`${product.name} added to cart`)
    router.push('/cart')
  }, [product, qty, addItem, router])

  const toggleWishlist = useCallback(() => {
    wishlist.toggle(product.id)
    toast(wishlist.has(product.id) ? t('wishlist.saved') : t('wishlist.removed'))
  }, [product.id, wishlist, t])

  const avgRating = product.reviews?.length
    ? product.reviews.reduce((s: number, r: Review) => s + r.rating, 0) / product.reviews.length
    : product.rating || 0

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      {/* Image column */}
      <div>
        <div
          ref={imageRef}
          className="aspect-square relative rounded-2xl overflow-hidden bg-secondary cursor-zoom-in group"
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={(e) => {
            const rect = imageRef.current?.getBoundingClientRect()
            if (!rect) return
            setZoomPos({
              x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
              y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
            })
          }}
        >
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-200"
            style={zoom ? { transform: 'scale(2.2)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          />
          <div className={cn(
            'absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-deep/70 backdrop-blur-md text-silver text-[10px] tracking-[0.15em] uppercase transition-opacity',
            zoom ? 'opacity-0' : 'opacity-100'
          )}>
            <ZoomIn className="h-3 w-3 text-gold" />
            {t('products.hoverToZoom')}
          </div>
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            {product.isNew && (
              <span className="px-3 py-1 rounded-full bg-navy text-silver text-[10px] font-semibold tracking-[0.15em] uppercase">{t('products.new')}</span>
            )}
            {product.isBestseller && (
              <span className="px-3 py-1 rounded-full bg-gold text-navy-deep text-[10px] font-semibold tracking-[0.15em] uppercase">{t('products.bestseller')}</span>
            )}
          </div>
        </div>
        {/* Thumbnails */}
        <div className="p-3 flex gap-2">
          {[product.imageUrl, product.imageUrl, product.imageUrl].map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={cn('h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors', activeImage === i ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100')}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Info column */}
      <div className="space-y-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-gold font-medium mb-1">{product.category?.name}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy leading-tight">{product.name}</h1>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn('h-4 w-4', s <= Math.round(avgRating) ? 'fill-gold text-gold' : 'fill-muted text-muted')} />
            ))}
          </div>
          <span className="text-sm font-medium text-navy">{avgRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({product.reviews?.length || 0} reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-navy">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <>
              <span className="text-base text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
              <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                Save {formatPrice(product.compareAtPrice - product.price)}
              </span>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-secondary/50">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-0.5">{t('products.material')}</p>
            <p className="text-sm font-medium text-navy">{product.material}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-0.5">{t('products.weight')}</p>
            <p className="text-sm font-medium text-navy">{product.weight || '—'}</p>
          </div>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-2 text-sm">
          <div className={cn('h-2 w-2 rounded-full', product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-gold' : 'bg-destructive')} />
          <span className="text-navy font-medium">
            {product.stock > 10 ? t('products.inStock') : product.stock > 0 ? t('products.onlyLeft', product.stock) : t('products.outOfStock')}
          </span>
        </div>

        {/* Quantity + Add */}
        {product.stock > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-full">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="h-11 w-11 flex items-center justify-center text-navy hover:text-gold transition-colors"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold text-navy">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="h-11 w-11 flex items-center justify-center text-navy hover:text-gold transition-colors"><Plus className="h-4 w-4" /></button>
            </div>
            <Button onClick={handleAdd} className="flex-1 h-11 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors text-sm font-semibold tracking-wide">
              <ShoppingBag className="h-4 w-4 mr-2" />
              {t('products.addToBag')} · {formatPrice(product.price * qty)}
            </Button>
            <button onClick={toggleWishlist} className={cn('h-11 w-11 rounded-full border flex items-center justify-center transition-colors', wishlist.has(product.id) ? 'border-gold bg-gold/10 text-gold' : 'border-border text-navy hover:text-gold hover:border-gold')}>
              <Heart className={cn('h-4 w-4', wishlist.has(product.id) && 'fill-current')} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-destructive font-medium">{t('products.outOfStock')}</p>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
          {[
            { icon: Truck, label: t('trust.shippingDesc') },
            { icon: ShieldCheck, label: t('trust.warranty') },
            { icon: RefreshCw, label: t('trust.returns') },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center gap-1.5">
              <item.icon className="h-4 w-4 text-gold" />
              <span className="text-[10px] text-muted-foreground leading-tight">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <div>
            <h3 className="font-display text-lg font-semibold text-navy mb-3">
              {t('testimonials.headingGold')} ({product.reviews.length})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {product.reviews.map((r: Review) => (
                <div key={r.id} className="p-3 rounded-xl bg-secondary/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn('h-3 w-3', s <= r.rating ? 'fill-gold text-gold' : 'fill-muted text-muted')} />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-navy">{r.authorName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h3 className="font-display text-lg font-semibold text-navy mb-3">{t('products.youMayAlsoLove')}</h3>
            <div className="grid grid-cols-4 gap-2">
              {related.slice(0, 4).map((rp) => (
                <Link
                  key={rp.id}
                  href={`/products/${rp.id}`}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
                >
                  <Image src={rp.imageUrl} alt={rp.name} fill sizes="120px" className="object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-navy-deep/0 group-hover:bg-navy-deep/30 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
