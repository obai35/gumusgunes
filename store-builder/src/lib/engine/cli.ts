import { generateStorefront } from './generator'
import { DEFAULT_ENABLED_FEATURES } from '../features'

async function main() {
  const args = process.argv.slice(2)
  const storeName = args[0] || 'my-store'
  const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  const sourceDir = process.cwd() // The store-builder dir, but we use relative ../..
  
  // Default: use the main site as template (relative to store-builder/)
  const mainSourceDir = require('path').resolve(__dirname, '..', '..', '..', '..')
  
  await generateStorefront({
    sourceDir: mainSourceDir,
    outputDir: require('path').resolve(process.cwd(), 'generated', storeSlug),
    enabledFeatures: DEFAULT_ENABLED_FEATURES,
    theme: {
      primaryColor: '#C8A97E',
      secondaryColor: '#1a1a2e',
      accentColor: '#e2b14a',
      borderRadius: '0.5rem',
      fontFamily: 'Inter',
    },
    demo: { enabled: false, storeName },
    storeName,
    storeSlug,
  })
}

main().catch(console.error)