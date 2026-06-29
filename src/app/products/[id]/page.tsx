import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import ProductDetailClient from './ProductDetailClient'

interface Props {
  params: Promise<{ id: string }>
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
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li><a href="/products" className="hover:text-gold transition-colors">Products</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium truncate max-w-[200px]">{serialized.product.name}</li>
            </ol>
          </nav>
          <ProductDetailClient product={serialized.product} related={serialized.related} />
        </div>
      </main>
      <Footer />
    </>
  )
}
