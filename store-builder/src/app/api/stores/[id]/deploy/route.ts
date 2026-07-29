import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { execSync } from 'child_process'
import path from 'path'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const store = await prisma.store.findUnique({
    where: { id: params.id },
    include: { deployments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const lastDeployment = store.deployments[0]
  if (!lastDeployment || !lastDeployment.outputPath) {
    return NextResponse.json({ error: 'No generated storefront found. Generate first.' }, { status: 400 })
  }

  // Create a zip archive of the generated store
  const outputDir = lastDeployment.outputPath
  const archiveDir = path.resolve(process.cwd(), 'archives')
  const archiveName = `${store.slug}-v${lastDeployment.version}.zip`
  const archivePath = path.join(archiveDir, archiveName)

  try {
    const fs = require('fs')
    // Ensure archive directory exists
    require('fs').mkdirSync(archiveDir, { recursive: true })

    // Use PowerShell Compress-Archive for zip creation
    execSync(
      `powershell -Command "Compress-Archive -Path '${outputDir}\\*' -DestinationPath '${archivePath}' -Force"`,
      { timeout: 120000 }
    )

    // Update deployment with archive path
    const deployment = await prisma.deployment.update({
      where: { id: lastDeployment.id },
      data: {
        archivePath,
        status: 'ready',
      },
    })

    return NextResponse.json({
      ok: true,
      archivePath,
      downloadUrl: `/api/download/${encodeURIComponent(archiveName)}`,
      deployment,
    })
  } catch (err: any) {
    console.error('Deploy failed:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}