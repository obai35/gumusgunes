import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const post = await db.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json(post)
}, 'blog')

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const body = await req.json()
    const { title, slug, content, excerpt, featuredImage, category, status } = body

    if (slug && slug !== existing.slug) {
      const slugConflict = await db.blogPost.findUnique({ where: { slug } })
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const wasPublished = status === 'published' && existing.status !== 'published'

    const post = await db.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(wasPublished && { publishedAt: new Date() }),
      },
    })

    return NextResponse.json(post)
  } catch (err) {
    console.error('Update blog post error:', err)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}, 'blog')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    await db.blogPost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete blog post error:', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}, 'blog')
