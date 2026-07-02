import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string

    if (!file || !orderId) {
      return NextResponse.json({ ok: false, error: 'Missing file or orderId' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: 'File too large. Maximum 5MB.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ ok: false, error: 'Invalid file type. Allowed: jpg, jpeg, png, webp' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'Invalid MIME type' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const dir = path.join(process.cwd(), 'public/uploads/payments')
    await mkdir(dir, { recursive: true })
    const filename = `${orderId}-${Date.now()}.${ext}`
    await writeFile(path.join(dir, filename), buffer)

    return NextResponse.json({ ok: true, url: `/uploads/payments/${filename}` })
  } catch {
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 })
  }
}, 'orders')
