import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  const archivePath = path.resolve(process.cwd(), 'archives', params.name)

  if (!fs.existsSync(archivePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const file = fs.readFileSync(archivePath)
  return new NextResponse(file, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${params.name}"`,
    },
  })
}