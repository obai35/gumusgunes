import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { readFile } from 'fs/promises'
import path from 'path'

async function handler(req: Request, { params }: { params: { file: string } }) {
  try {
    const filePath = path.join(process.cwd(), 'private/uploads/payments', params.file)
    const buffer = await readFile(filePath)
    const ext = path.extname(params.file).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }
    return new NextResponse(buffer, {
      headers: { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}

export const GET = withAdmin(handler, 'orders')
