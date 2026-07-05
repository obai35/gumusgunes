'use client'

import Image from 'next/image'
import { getBlurDataUrl } from '@/lib/blur'
import { useRouter } from 'next/navigation'
import { Heart, Star, Eye, GitCompare } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Product } from '@/lib/types'
import { parseTags, discountPercent, cn } from '@/lib/format'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useLoyaltyRate } from '@/hooks/use-loyalty-rate'
import { useTranslation } from '@/hooks/use-translation'
import { useCart, useUI, useWishlist, useCompare } from '@/lib/store'
import { toast } from 'sonner'

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const router = useRouter()
  const { addItem } = useCart()
  const { setProductModal } = useUI()
  const wishlist = useWishlist()
  const compare = useCompare()
  const formatPrice = useFormatPrice()
  const loyaltyRate = useLoyaltyRate()
  const tags = parseTags(product.tags)
  const discount = discountPercent(product.price, product.compareAtPrice)
  const { t } = useTranslation()
  const isWishlisted = wishlist.has(product.id)
  const isCompared = compare.has(product.id)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product, 1)
    toast.success(t('products.addedToBag', product.name), {
      description: formatPrice(product.price),
    })
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    wishlist.toggle(product.id)
    toast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist', {
      description: product.name,
    })
  }

  const handleOpen = () => router.push(`/products/${product.id}`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/60 card-hover cursor-pointer"
      onClick={handleOpen}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          placeholder="blur"
          blurDataURL={getBlurDataUrl(product.imageUrl)}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="px-2.5 py-1 rounded-full bg-navy text-silver text-[10px] font-semibold tracking-[0.15em] uppercase">
              {t('products.new')}
            </span>
          )}
          {product.isBestseller && (
            <span className="px-2.5 py-1 rounded-full bg-gold text-navy-deep text-[10px] font-semibold tracking-[0.15em] uppercase">
              {t('products.bestseller')}
            </span>
          )}
          {discount && (
            <span className="px-2.5 py-1 rounded-full bg-destructive text-white text-[10px] font-semibold tracking-wide">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist + Compare */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'h-9 w-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all',
              isWishlisted
                ? 'bg-gold text-navy-deep'
                : 'bg-background/80 text-navy hover:bg-background hover:text-gold'
            )}
            aria-label={t('products.toggleWishlist')}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!isCompared && compare.ids.length >= 3) {
                toast.error(t('compare.maxError'))
                return
              }
              compare.toggle(product.id)
              toast(isCompared ? t('general.delete') : t('general.save'), { description: product.name })
            }}
            className={cn(
              'h-9 w-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all',
              isCompared
                ? 'bg-navy text-gold ring-2 ring-gold'
                : 'bg-background/80 text-navy hover:bg-background hover:text-gold'
            )}
            aria-label={t('products.compare')}
          >
            <GitCompare className={cn('h-4 w-4', isCompared && 'scale-110')} />
          </button>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex gap-2">
            <button
              onClick={handleQuickAdd}
              className="flex-1 h-10 rounded-full bg-navy text-silver text-xs font-semibold tracking-wide hover:bg-gold hover:text-navy-deep transition-colors"
            >
              {t('products.quickAdd')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpen() }}
              className="h-10 w-10 rounded-full bg-background/90 backdrop-blur-md text-navy hover:bg-background hover:text-gold transition-colors flex items-center justify-center"
              aria-label={t('products.viewDetails')}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            {product.category?.name}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="font-medium text-navy">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground/60">({product.reviewCount})</span>
          </div>
        </div>

        <h3 className="font-display text-base font-semibold text-navy leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-gold transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {product.material.split('·')[0].trim()}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-navy">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gold font-medium tracking-wide mt-0.5">
              +{Math.floor(product.price / loyaltyRate)} {t('products.points')}
            </span>
          </div>
          {tags[0] && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground tracking-wide">
              {tags[0]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
