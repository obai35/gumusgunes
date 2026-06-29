import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string

    if (!file || !orderId) {
      return NextResponse.json({ ok: false, error: 'Missing file or orderId' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const dir = path.join(process.cwd(), 'public/uploads/payments')
    await mkdir(dir, { recursive: true })
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${orderId}-${Date.now()}.${ext}`
    await writeFile(path.join(dir, filename), buffer)

    return NextResponse.json({ ok: true, url: `/uploads/payments/${filename}` })
  } catch {
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 })
  }
}
