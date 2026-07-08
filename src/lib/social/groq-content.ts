import type { PostType } from './types'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const MODEL = 'llama-3.3-70b-versatile'

export type ContentTone = 'luxury' | 'casual' | 'promotional' | 'educational'
export type GeneratedContent = {
  caption: string
  hashtags: string[]
  ideas?: string[]
}

export class GroqContentGenerator {
  private async generate(prompt: string): Promise<string> {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq API error: ${err}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  async generatePost(
    product: { name: string; description: string; material: string; price: number; tags: string[] },
    postType: PostType,
    tone: ContentTone = 'luxury',
  ): Promise<GeneratedContent> {
    const toneGuide = {
      luxury: 'Elegant, sophisticated, use refined language. Mention exclusivity and craftsmanship.',
      casual: 'Friendly, relatable, use everyday language. Feel like a friend sharing a discovery.',
      promotional: 'Create urgency and excitement. Highlight discounts, limited stock, or special offers.',
      educational: 'Informative and helpful. Explain the product features, materials, or styling tips.',
    }

    const prompt = `You are a social media content creator for "${product.name}", a jewelry product.

Product details:
- Name: ${product.name}
- Description: ${product.description}
- Material: ${product.material}
- Price: $${product.price}
- Tags: ${product.tags.join(', ')}

Generate a social media post (${postType}) with ${toneGuide[tone]}.

Return JSON with:
{
  "caption": "The post caption text. For feed posts, use 2-3 short paragraphs. For reels, use a hook + 1 paragraph.",
  "hashtags": ["5-8 relevant hashtags"],
  "ideas": ["2-3 additional caption variations or content ideas"]
}`

    const raw = await this.generate(prompt)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return { caption: raw, hashtags: ['#jewelry', '#luxury'], ideas: [] }
    }
  }

  async generateCaption(productName: string, tone: ContentTone = 'luxury'): Promise<string> {
    const prompt = `Write a captivating ${tone} social media caption for "${productName}" jewelry. Keep it under 150 characters. Just return the caption text.`
    return (await this.generate(prompt)).trim()
  }

  async generateHashtags(product: { name: string; material: string; tags: string[] }, count = 8): Promise<string[]> {
    const prompt = `Generate ${count} hashtags for a jewelry product named "${product.name}" made of ${product.material}. Tags: ${product.tags.join(', ')}. Return as a JSON array of strings.`
    const raw = await this.generate(prompt)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return ['#jewelry', '#luxury', '#fashion']
    }
  }
}
