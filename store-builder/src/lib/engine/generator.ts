import fs from 'fs'
import path from 'path'
import { filterFilesByFeatures, getSourceFiles } from './feature-filter'
import { applyThemeToFile, type ThemeConfig } from './theme-applier'
import { injectDemoGuard, injectDemoAPIGuard, DEMO_ENV_CONTENT, type DemoConfig } from './demo-injector'
import { execSync } from 'child_process'

export interface GeneratorConfig {
  sourceDir: string
  outputDir: string
  enabledFeatures: string[]
  theme: ThemeConfig
  demo: DemoConfig
  storeName: string
  storeSlug: string
  layoutType?: 'single-page' | 'multi-page'
}

const SRC_DIR = 'src'

const CONFIG_FILES = [
  'package.json', 'next.config.ts', 'tsconfig.json', 'tailwind.config.ts',
  'postcss.config.js', '.env.example', 'components.json',
]

const COPY_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md']

export async function generateStorefront(config: GeneratorConfig): Promise<void> {
  const { sourceDir, outputDir, enabledFeatures, theme, demo } = config

  // Clean output
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true })
  }

  // Get all source files
  const srcPath = path.join(sourceDir, SRC_DIR)
  const allFiles = getSourceFiles(srcPath)
  const filteredFiles = filterFilesByFeatures(allFiles, enabledFeatures)

  // Copy config files
  for (const cf of CONFIG_FILES) {
    const cfPath = path.join(sourceDir, cf)
    if (fs.existsSync(cfPath)) {
      const outPath = path.join(outputDir, cf)
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
      let content = fs.readFileSync(cfPath, 'utf-8')

      // Update package.json name
      if (cf === 'package.json') {
        const pkg = JSON.parse(content)
        pkg.name = config.storeSlug
        pkg.private = true
        content = JSON.stringify(pkg, null, 2)
      }

      fs.writeFileSync(outPath, content, 'utf-8')
    }
  }

  // Copy and transform source files
  for (const file of filteredFiles) {
    const srcFile = path.join(srcPath, file)
    const outFile = path.join(outputDir, SRC_DIR, file)

    // Skip if source doesn't exist
    if (!fs.existsSync(srcFile)) continue

    fs.mkdirSync(path.dirname(outFile), { recursive: true })

    let content = fs.readFileSync(srcFile, 'utf-8')

    // Apply theme
    content = applyThemeToFile(file, content, theme)

    // Inject demo protections
    if (demo.enabled) {
      if (file.includes('layout.tsx') || file.includes('layout.')) {
        content = injectDemoGuard(content, demo)
      }
      if (file.startsWith('app/api/')) {
        content = injectDemoAPIGuard(content, demo)
      }
    }

    fs.writeFileSync(outFile, content, 'utf-8')
  }

  // Write .env files
  const envContent = demo.enabled ? DEMO_ENV_CONTENT : `# Production
NEXT_PUBLIC_STORE_NAME="${config.storeName}"
`
  fs.writeFileSync(path.join(outputDir, '.env'), envContent, 'utf-8')

  // Copy prisma directory from main site (standalone schema overwritten later by API route)
  const prismaSrc = path.join(sourceDir, 'prisma')
  const prismaOut = path.join(outputDir, 'prisma')
  if (fs.existsSync(prismaSrc)) {
    fs.mkdirSync(prismaOut, { recursive: true })
    copyDirSync(prismaSrc, prismaOut)
  }

  // Handle layout type: merge multi-page routes into single-page sections
  if (config.layoutType === 'single-page') {
    convertToSinglePage(outputDir)
  }

  // Write generator metadata
  const meta = {
    generatedAt: new Date().toISOString(),
    storeName: config.storeName,
    storeSlug: config.storeSlug,
    features: enabledFeatures,
    isDemo: demo.enabled,
    demoExpiresAt: demo.expiresAt,
    layoutType: config.layoutType || 'multi-page',
  }
  fs.writeFileSync(path.join(outputDir, 'store-meta.json'), JSON.stringify(meta, null, 2), 'utf-8')

  console.log(`✅ Generated storefront at: ${outputDir}`)
  console.log(`   Features: ${enabledFeatures.length}`)
  console.log(`   Files: ${filteredFiles.length + CONFIG_FILES.length}`)
  console.log(`   Demo: ${demo.enabled ? 'Yes' : 'No'}`)
  console.log(`   Layout: ${config.layoutType || 'multi-page'}`)
}

// Single-page: preserve only the home page, strip route folders,
// and write a note for future single-page-conversion logic
function convertToSinglePage(outputDir: string) {
  const srcDir = path.join(outputDir, 'src', 'app')
  if (!fs.existsSync(srcDir)) return

  // Remove sub-route directories (products, cart, checkout, blog, faq, about, contact, admin, etc.)
  // Keep only: page.tsx, layout.tsx, globals.css, and the root components
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'components') {
      const fullPath = path.join(srcDir, entry.name)
      fs.rmSync(fullPath, { recursive: true, force: true })
    }
  }

  // Create a flag file so the generated project knows it's single-page
  fs.writeFileSync(path.join(outputDir, 'SINGLE_PAGE.md'),
    `# Single-Page Landing\nThis is a single-page landing storefront. All sections are on the homepage.\n`
  )
}

function copyDirSync(src: string, dest: string) {
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}