import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const revalidate = 60

export default async function StaticPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await db.staticPage.findUnique({ where: { slug } })
  if (!page || page.status !== 'published') notFound()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium">{page.title}</li>
            </ol>
          </nav>

          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-navy mb-8">{page.title}</h1>

          <div
            className="prose prose-gray max-w-none prose-headings:text-navy prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
