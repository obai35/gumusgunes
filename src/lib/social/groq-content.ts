import type { PostType } from './types'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const MODEL = 'llama-3.3-70b-versatile'

export type ContentTone = 'luxury' | 'casual' | 'promotional' | 'educational'

export type GeneratedContent = {
  caption: string
  hashtags: string[]
  ideas?: string[]
}

const BRAND_IDENTITY = `
Brand: Gümüş Güneş (Silver Sun) — Egyptian stainless steel jewelry brand.
Sourcing: Materials and manufacturing from Turkey — high quality Turkish craftsmanship.
Current products: Stainless steel jewelry (necklaces, rings, bracelets, earrings, anklets).
Expanding to: Watches, belts, wallets, bags, shoes — becoming a full lifestyle accessories brand.
Audience: Everyone — women (primary target 14-45), men, children, couples.
Positioning: Both luxury AND everyday wear. Pieces are elegant enough for special occasions but durable and affordable enough for daily use.
Markets: Egypt (primary), with regional Arab world and global reach.
Values: Quality, affordability, style, versatility, family.
Language: Mix of Egyptian Arabic + English + Turkish naturally.
- Egyptian Arabic (عامية مصرية) for casual/relatable posts
- English for modern/lifestyle/fashion terms and hashtags
- Turkish words/phrases for authenticity (e.g., "gümüş", "bileklik", "kalite", "Türkiye'den")
- Captions should feel like how a bilingual Egyptian actually talks — Arabic sentence with English words mixed in naturally, occasional Turkish flair to highlight the Turkish connection
- Hashtags: mix of Arabic, English, and Turkish`

export class GroqContentGenerator {
  private async generate(prompt: string, maxTokens = 800): Promise<string> {
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
        max_tokens: maxTokens,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq API error: ${err}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  private systemPrompt(): string {
    return `أنت مدير محتوى لعلامة "${BRAND_IDENTITY.trim()}"

قواعد المحتوى:
- Mix languages naturally: Egyptian Arabic + English + Turkish words
- Example: "ده bracelets استانليس ستيل من Türkiye جودة و Kalite 🌙✨"
- Turkish words to sprinkle: gümüş, bileklik, kolye, yüzük, kalite, Türkiye'den, el yapımı
- استخدم emojis مناسبة 🌙✨💫🪙🇪🇬
- العبارات تكون دافئة وقريبة من القلب
- العروض الترويجية تكون محترمة مش رخيصة
- المحتوى التعليمي مفيد وعملي
- خلي بالك من المناسبات المصرية والعربية (شهر رمضان، عيد الفطر، عيد الأضحى، عيد الحب، المولد النبوي، شم النسيم، الكريسماس، رأس السنة)
- خلي بالك من مواسم الزواج في مصر

Return your response as valid Arabic JSON.`
  }

  async generatePost(
    product: { name: string; description: string; material: string; price: number; tags: string[] },
    postType: PostType,
    tone: ContentTone = 'luxury',
  ): Promise<GeneratedContent> {
    const toneGuide: Record<ContentTone, string> = {
      luxury: 'لوكس وراقي — use elegant، فخم، refined language. Mention Turkish craftsmanship and exclusivity.',
      casual: 'عادي وقريب من القلب — كأنك صاحبتك بتكلميها. Use Egyptian Arabic.',
      promotional: 'عرض — exciting but classy. Limited stock phrases، عروض حصرية.',
      educational: 'تعليمي — how to style، كيف تنسق الاكسسوارات، العناية بالمجوهرات.',
    }

    const prompt = `${this.systemPrompt()}
    
اكتب بوست سوشيال ميديا (${postType}) لمنتج "${product.name}".

معلومات المنتج:
- الاسم: ${product.name}
- الوصف: ${product.description}
- الخامة: ${product.material} (استانليس ستيل من تركيا)
- السعر: ${product.price} LE / EGP
- التاجات: ${product.tags.join('، ')}

النغمة: ${toneGuide[tone]}

Return JSON:
{
  "caption": "نص البوست. للـ Feed استخدم 2-3 فقرات قصيرة. للـ Reel استخدم hook قوي + فقرة.",
  "hashtags": ["٨-١٢ هاشتاج مناسب — mix of Arabic and English، مشهورة ومتخصصة"],
  "ideas": ["٢-٣ أفكار إضافية للبوست"]
}

Important: Arabic text only in the JSON values.`
    const raw = await this.generate(prompt)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return { caption: raw, hashtags: ['#مجوهرات', '#استانليس_ستيل', '#gumusgunes'], ideas: [] }
    }
  }

  async generateCaption(productName: string, tone: ContentTone = 'luxury'): Promise<string> {
    const prompt = `${this.systemPrompt()}
اكتب كابشن جذاب للمنتج "${productName}" (${tone}). أقل من ١٥٠ حرف. بس الكابشن من غير مقدمة.`
    return (await this.generate(prompt, 300)).trim()
  }

  async generateHashtags(
    product: { name: string; material: string; tags: string[] },
    count = 10,
  ): Promise<string[]> {
    const prompt = `${this.systemPrompt()}
منتج "${product.name}" من ${product.material} استانليس ستيل. Tags: ${product.tags.join('، ')}.

اعمل ${count} هاشتاج مناسب:
- mix of Arabic (مصري وعام) and English
- mix of popular (١٠٠ك+ post) and niche (١٠ك- post)
- brand hashtag: #GumusGunes #جوموش_جونش
- مصر related: #مصر #handmade_egypt
- jewelry type specific
- occasion specific if applicable

Return as JSON array of strings.`
    const raw = await this.generate(prompt, 400)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return ['#مجوهرات', '#استانليس_ستيل', '#مصر', '#GumusGunes', '#اكسسوارات']
    }
  }

  async generateTrendingHashtags(region: 'global' | 'egypt' | 'gulf' = 'egypt', niche?: string): Promise<{
    trending: string[]
    regional: string[]
    suggestions: string[]
  }> {
    const regionHint = region === 'egypt' ? 'مصر والعالم العربي'
      : region === 'gulf' ? 'الخليج'
      : 'global (USA, Europe, Asia)'

    const prompt = `${this.systemPrompt()}

ابدأ ببحث تريندات الهاشتاجات دلوقتي في ${regionHint} لمجال المجوهرات والاكسسوارات.

لو ${niche} ركز على المجال ده.

Return JSON:
{
  "trending": ["أكتر ١٠ هاشتاجات trending حالياً"],
  "regional": ["هاشتاجات خاصة ب ${regionHint}"],
  "suggestions": ["هاشتاجات مقترحة للعلامة Gümüş Güneş"]
}`
    const raw = await this.generate(prompt, 600)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return { trending: ['#jewelry', '#accessories'], regional: ['#مصر', '#اكسسوارات'], suggestions: ['#GumusGunes'] }
    }
  }

  async analyzeTrends(topic: string, region: 'global' | 'egypt' | 'gulf' = 'egypt'): Promise<{
    summary: string
    trending: boolean
    momentum: 'rising' | 'stable' | 'declining'
    relatedQueries: string[]
    bestHashtags: string[]
  }> {
    const regionHint = region === 'egypt' ? 'مصر' : region === 'gulf' ? 'الخليج' : 'global'

    const prompt = `${this.systemPrompt()}

حلل تريند "${topic}" في ${regionHint} دلوقتي لمجال المجوهرات والاكسسوارات.

Return JSON:
{
  "summary": "ملخص التحليل (عربي)",
  "trending": true or false,
  "momentum": "rising" or "stable" or "declining",
  "relatedQueries": ["مواضيع مرتبطة"],
  "bestHashtags": ["أفضل ٥ هاشتاجات للاستخدام"]
}`
    const raw = await this.generate(prompt, 600)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return { summary: 'Trend analysis unavailable', trending: false, momentum: 'stable', relatedQueries: [], bestHashtags: [] }
    }
  }

  async generateContentPlan(products: Array<{ name: string; tags: string[] }>, count = 5): Promise<{
    posts: Array<{
      title: string
      idea: string
      postType: PostType
      tone: ContentTone
      targetAudience: string
      hashtags: string[]
    }>
    contentMix: string
    weekPlan: string[]
  }> {
    const productList = products.map(p => `- ${p.name} (${p.tags.join('، ')})`).join('\n')

    const prompt = `${this.systemPrompt()}

اعمل خطة محتوى لـ ${count} بوستات للمنتجات دي:

${productList}

Return JSON:
{
  "posts": [
    {
      "title": "عنوان الفكرة",
      "idea": "وصف الفكرة بالتفصيل",
      "postType": "feed or reel or story or carousel",
      "tone": "luxury or casual or promotional or educational",
      "targetAudience": "الفئة المستهدفة",
      "hashtags": ["هاشتاجات"]
    }
  ],
  "contentMix": "نصيحة عن توزيع المحتوى (٪ ترفيهي، تعليمي، ترويجي)",
  "weekPlan": ["خطة الأسبوع"]
}`
    const raw = await this.generate(prompt, 1000)
    try {
      return JSON.parse(raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim())
    } catch {
      return { posts: [], contentMix: '50% casual, 30% educational, 20% promotional', weekPlan: [] }
    }
  }
}
