import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const { id } = await params
  const sdb = storeDb(admin.storeId)
  const post = await sdb.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json(post)
}, 'blog')

export const PUT = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const { id } = await params
  const sdb = storeDb(admin.storeId)
  try {
    const existing = await sdb.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const body = await req.json()
    const { title, slug, content, excerpt, featuredImage, category, status } = body

    if (slug && slug !== existing.slug) {
      const slugConflict = await sdb.blogPost.findUnique({ where: { slug } })
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const wasPublished = status === 'published' && existing.status !== 'published'

    const post = await sdb.blogPost.update({
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

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const { id } = await params
  const sdb = storeDb(admin.storeId)
  try {
    const existing = await sdb.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    await sdb.blogPost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete blog post error:', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}, 'blog')
