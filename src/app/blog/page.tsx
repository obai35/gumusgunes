import { db } from '@/lib/db'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const revalidate = 60

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1'))
  const categoryFilter = sp.category || ''
  const take = 12
  const skip = (page - 1) * take

  const where: any = { status: 'published' }
  if (categoryFilter) where.category = categoryFilter

  const [posts, total, categories] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        featuredImage: true, category: true, publishedAt: true,
      },
    }),
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where: { status: 'published' },
      select: { category: true },
      distinct: ['category'],
    }),
  ])

  const totalPages = Math.ceil(total / take)
  const catList = [...new Set(categories.map(c => c.category).filter(Boolean))] as string[]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium">Blog</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-display font-semibold text-navy mb-2">Our Journal</h1>
          <p className="text-muted-foreground mb-8 max-w-xl">Stories, guides, and insights from the world of Gümüş Güneş.</p>

          {catList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              <Link href="/blog" className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? 'bg-navy text-silver' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>All</Link>
              {catList.map(cat => (
                <Link key={cat} href={`/blog?category=${encodeURIComponent(cat)}`} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-navy text-silver' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>{cat}</Link>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block bg-white rounded-xl border border-border/60 overflow-hidden hover:shadow-lg transition-all">
                    {post.featuredImage ? (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-gold/10 to-navy/10 flex items-center justify-center">
                        <span className="text-4xl font-display text-gold/30">GG</span>
                      </div>
                    )}
                    <div className="p-5">
                      {post.category && (
                        <span className="text-[10px] tracking-widest uppercase text-gold font-semibold">{post.category}</span>
                      )}
                      <h3 className="font-display text-lg font-semibold text-navy mt-1 mb-2 group-hover:text-gold transition-colors">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.publishedAt).toLocaleDateString()}</span>
                        )}
                        <span className="flex items-center gap-1 text-gold group-hover:gap-2 transition-all">Read <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Link key={p} href={`/blog?page=${p}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''}`}
                      className={`w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${p === page ? 'bg-navy text-silver' : 'text-muted-foreground hover:bg-secondary'}`}>
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
