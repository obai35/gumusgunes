import { NextRequest, NextResponse } from 'next/server'
import { readdir, writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { withAdmin } from '@/lib/admin-permissions'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/media')
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
const MAX_SIZE = 10 * 1024 * 1024

async function ensureDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

export const GET = withAdmin(async () => {
  try {
    await ensureDir()
    const files = await readdir(UPLOAD_DIR)
    const items = await Promise.all(
      files
        .filter(f => ALLOWED_EXTS.includes(path.extname(f).toLowerCase()))
        .map(async (f) => {
          try {
            const { stat } = await import('fs/promises')
            const s = await stat(path.join(UPLOAD_DIR, f))
            return {
              name: f,
              url: `/uploads/media/${f}`,
              size: s?.size || 0,
              uploadedAt: s?.birthtime?.toISOString() || new Date().toISOString(),
            }
          } catch { return null }
        })
    )
    const valid = items.filter(Boolean) as { name: string; url: string; size: number; uploadedAt: string }[]
    valid.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return NextResponse.json({ files: valid })
  } catch (err) {
    console.error('List media error:', err)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}, 'media')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    await ensureDir()
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB' }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
    }

    const filename = `${crypto.randomUUID()}${ext}`
    await writeFile(path.join(UPLOAD_DIR, filename), buffer)

    return NextResponse.json({ ok: true, url: `/uploads/media/${filename}`, name: filename })
  } catch (err) {
    console.error('Upload media error:', err)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}, 'media')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name')
    if (!name) return NextResponse.json({ error: 'Missing file name' }, { status: 400 })

    const filePath = path.join(UPLOAD_DIR, path.basename(name))
    await unlink(filePath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete media error:', err)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}, 'media')
