import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export interface ExportOptions {
  inputDir: string
  outputPath: string
  createArchive: boolean
}

export async function exportStorefront(options: ExportOptions): Promise<string> {
  const { inputDir, createArchive } = options

  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory not found: ${inputDir}`)
  }

  if (createArchive) {
    // Use archiver to create zip
    const archiver = require('archiver')
    const output = fs.createWriteStream(options.outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(options.outputPath))
      archive.on('error', reject)
      archive.pipe(output)
      archive.directory(inputDir, false)
      archive.finalize()
    })
  }

  return inputDir
}