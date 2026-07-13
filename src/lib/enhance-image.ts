import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'node:crypto'

const HF_API_URL = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell'

const PROMPT_TEMPLATES: Record<string, string> = {
  ring: 'on a white marble surface with soft studio lighting, jewelry macro photography, 8K',
  necklace: 'on a velvet display bust with soft studio lighting, jewelry photography, 8K',
  bracelet: 'on a clean white surface with natural lighting, jewelry photography, 8K',
  earrings: 'on a minimalist display stand with soft studio lighting, jewelry photography, 8K',
  other: 'professional studio lighting, clean background, commercial product photography, 8K',
}

export function buildPrompt(productName: string, productType: string): string {
  const suffix = PROMPT_TEMPLATES[productType] || PROMPT_TEMPLATES.other
  return `Professional product photography of ${productName}, ${suffix}`
}

export async function enhanceImage(
  imageBuffer: Buffer,
  productName: string,
  productType: string,
  customPrompt?: string,
): Promise<{ enhancedUrl: string; originalUrl: string }> {
  const apiKey = process.env.HF_API_KEY
  if (!apiKey) throw new Error('HF_API_KEY not set')

  try {
    await sharp(imageBuffer).metadata()
  } catch {
    throw new Error('Invalid image file')
  }

  const prompt = customPrompt || buildPrompt(productName, productType)
  const uid = crypto.randomUUID()
  const filename = `${uid}.jpg`
  const originalFilename = `${uid}-original.jpg`
  const outputDir = path.join(process.cwd(), 'public', 'products', 'enhanced')

  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, originalFilename), imageBuffer)

  const base64Image = imageBuffer.toString('base64')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  let response: Response
  try {
    response = await fetch(HF_API_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: base64Image,
        parameters: { prompt, strength: 0.85, guidance_scale: 7.5 },
      }),
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Hugging Face API error: ${response.status} ${errText}`)
  }

  const enhancedBuffer = Buffer.from(await response.arrayBuffer())
  let optimized: Buffer
  try {
    optimized = await sharp(enhancedBuffer).jpeg({ quality: 90 }).toBuffer()
  } catch {
    throw new Error('Failed to process enhanced image with sharp')
  }
  await fs.writeFile(path.join(outputDir, filename), optimized)

  return {
    enhancedUrl: `/products/enhanced/${filename}`,
    originalUrl: `/products/enhanced/${originalFilename}`,
  }
}
