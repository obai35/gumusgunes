import { Suspense } from 'react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { ProductCard } from '@/components/store/ProductCard'
import { ConciergeChat } from '@/components/store/ConciergeChat'
import type { Product } from '@/lib/types'

export function ProductShelfPage({
  eyebrow,
  title,
  description,
  products,
}: {
  eyebrow: string
  title: string
  description: string
  products: Product[]
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-navy-deep py-20 sm:py-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.12)_0%,_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(212,175,55,0.06)_0%,_transparent_50%)]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">{eyebrow}</span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-silver mt-4 mb-4">
              {title}
            </h1>
            <p className="text-silver/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              {description}
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-navy mb-2">Coming soon</p>
              <p className="text-muted-foreground text-sm">
                New pieces are on the way. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <Suspense fallback={null}>
        <ConciergeChat />
      </Suspense>
    </>
  )
}
