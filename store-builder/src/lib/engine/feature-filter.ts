import fs from 'fs'
import path from 'path'
import { MODULE_FILE_MAP } from '../features'

/**
 * Determines which files to INCLUDE based on enabled feature set.
 * Files not matching any feature are always included (core files).
 */
export function filterFilesByFeatures(
  allFiles: string[],
  enabledFeatures: string[]
): string[] {
  const featureFilePatterns = new Set<string>()

  // Build set of all files patterns from ALL features
  for (const [, files] of Object.entries(MODULE_FILE_MAP)) {
    for (const f of files) featureFilePatterns.add(f)
  }

  // Files that match an enabled feature's pattern
  const enabledPatterns = new Set<string>()
  for (const key of enabledFeatures) {
    const files = MODULE_FILE_MAP[key]
    if (files) for (const f of files) enabledPatterns.add(f)
  }

  return allFiles.filter(file => {
    // Always include core files (not in any feature map)
    const matchedFeature = [...featureFilePatterns].find(pattern =>
      file.startsWith(pattern) || file.includes(pattern)
    )
    if (!matchedFeature) return true // core file

    // Only include if its feature is enabled
    return enabledPatterns.has(matchedFeature)
  })
}

export function getSourceFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    if (entry.isDirectory()) {
      files.push(...getSourceFiles(full, baseDir))
    } else {
      const rel = path.relative(baseDir, full).replace(/\\/g, '/')
      files.push(rel)
    }
  }
  return files
}