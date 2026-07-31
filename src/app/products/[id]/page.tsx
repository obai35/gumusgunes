import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { T } from '@/components/store/Translated'
import ProductDetailClient from './ProductDetailClient'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    select: { name: true, description: true, imageUrl: true, price: true },
  })

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [{ url: product.imageUrl, width: 1200, height: 1200 }],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params

  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    include: {
      category: true,
      reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  if (!product) notFound()

  const related = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    take: 4,
    orderBy: { isBestseller: 'desc' },
  })

  const serialized = JSON.parse(JSON.stringify({ product, related }))

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors"><T path="nav.home" /></a></li>
              <li><span className="mx-2">/</span></li>
              <li><a href="/products" className="hover:text-gold transition-colors"><T path="productsPage.products" /></a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium truncate max-w-[200px]">{serialized.product.name}</li>
            </ol>
          </nav>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: serialized.product.name,
                description: serialized.product.description,
                image: serialized.product.imageUrl,
                brand: { "@type": "Brand", name: "Gümüş Güneş" },
                offers: {
                  "@type": "Offer",
                  price: serialized.product.price,
                  priceCurrency: "EGP",
                  availability: serialized.product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                },
                aggregateRating: serialized.product.reviewCount > 0 ? {
                  "@type": "AggregateRating",
                  ratingValue: serialized.product.rating,
                  reviewCount: serialized.product.reviewCount,
                } : undefined,
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://gumusgunes.com" },
                  { "@type": "ListItem", position: 2, name: "Products", item: "https://gumusgunes.com/products" },
                  { "@type": "ListItem", position: 3, name: serialized.product.name },
                ],
              }),
            }}
          />
          <ProductDetailClient product={serialized.product} related={serialized.related} />
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
