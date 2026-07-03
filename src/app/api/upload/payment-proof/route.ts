import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { withAdmin } from '@/lib/admin-permissions'

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

async function handler(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB' }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
    }

    const dir = path.join(process.cwd(), 'private/uploads/payments')
    await mkdir(dir, { recursive: true })
    const filename = `${crypto.randomUUID()}${ext}`
    await writeFile(path.join(dir, filename), buffer)

    return NextResponse.json({ ok: true, filename })
  } catch (error) {
    console.error('[upload-payment-proof]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAdmin(handler, 'orders')
