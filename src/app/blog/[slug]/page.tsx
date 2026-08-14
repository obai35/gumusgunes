import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Calendar, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { SafeHtml } from '@/components/ui/SafeHtml'
import { T } from '@/components/store/Translated'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

async function fetchPost(slug: string) {
  return db.blogPost.findUnique({ where: { slug } })
}

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await db.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, featuredImage: true },
  })
  if (!post) return {}
  const description = post.excerpt || undefined
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      images: post.featuredImage ? [{ url: post.featuredImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  }
}

export async function generateStaticParams() {
  try {
    const posts = await db.blogPost.findMany({ where: { status: 'published' }, select: { slug: true } })
    return posts.map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let post: Awaited<ReturnType<typeof fetchPost>> | null = null
  try {
    post = await fetchPost(slug)
  } catch {}
  if (!post || post.status !== 'published') notFound()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors"><T path="nav.home" /></a></li>
              <li><span className="mx-2">/</span></li>
              <li><Link href="/blog" className="hover:text-gold transition-colors"><T path="blogPage.blog" /></Link></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium truncate max-w-[200px]">{post.title}</li>
            </ol>
          </nav>

          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> <T path="blogPost.backToBlog" />
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

          <SafeHtml
            html={post.content}
            className="prose prose-gray max-w-none prose-headings:text-navy prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
          />

          {post.excerpt && (
            <div className="mt-10 p-6 bg-secondary/30 rounded-xl border border-border/60">
              <p className="text-sm text-muted-foreground italic">{post.excerpt}</p>
            </div>
          )}
        </article>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt || undefined,
            image: post.featuredImage || undefined,
            datePublished: post.publishedAt || post.createdAt,
            dateModified: post.updatedAt,
            mainEntityOfPage: `https://gumusgunes.com/blog/${post.slug}`,
            author: { "@type": "Organization", name: "Gümüş Güneş" },
            publisher: { "@type": "Organization", name: "Gümüş Güneş", url: "https://gumusgunes.com" },
          }),
        }}
      />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
