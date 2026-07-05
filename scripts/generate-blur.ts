import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const OUTPUT = path.join(process.cwd(), 'src', 'lib', 'blur-map.json')

async function generate() {
  const map: Record<string, string> = {}
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp']

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await scan(full)
      else if (imageExts.includes(path.extname(entry.name).toLowerCase())) {
        try {
          const buf = await sharp(full).resize(10).jpeg({ quality: 30 }).toBuffer()
          map['/' + path.relative(PUBLIC_DIR, full).replace(/\\/g, '/')] = `data:image/jpeg;base64,${buf.toString('base64')}`
        } catch { /* skip unreadable */ }
      }
    }
  }

  await scan(PUBLIC_DIR)
  await fs.writeFile(OUTPUT, JSON.stringify(map))
  console.log(`Generated blur placeholders for ${Object.keys(map).length} images`)
}

generate().catch(console.error)
