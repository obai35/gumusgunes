import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const revalidate = 60

export async function generateStaticParams() {
  const posts = await db.blogPost.findMany({ where: { status: 'published' }, select: { slug: true } })
  return posts.map(p => ({ slug: p.slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await db.blogPost.findUnique({ where: { slug } })
  if (!post || post.status !== 'published') notFound()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li><Link href="/blog" className="hover:text-gold transition-colors">Blog</Link></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium truncate max-w-[200px]">{post.title}</li>
            </ol>
          </nav>

          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          {post.featuredImage && (
            <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8">
              <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}

          <header className="mb-8">
            {post.category && (
              <span className="text-xs tracking-widest uppercase text-gold font-semibold">{post.category}</span>
            )}
            <h1 className="text-3xl sm:text-4xl font-display font-semibold text-navy mt-2 mb-3">{post.title}</h1>
            {post.publishedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
          </header>

          <div
            className="prose prose-gray max-w-none prose-headings:text-navy prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.excerpt && (
            <div className="mt-10 p-6 bg-secondary/30 rounded-xl border border-border/60">
              <p className="text-sm text-muted-foreground italic">{post.excerpt}</p>
            </div>
          )}
        </article>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
