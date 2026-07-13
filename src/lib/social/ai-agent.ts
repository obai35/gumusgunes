import type { PostType } from './types'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const MODEL = 'llama-3.3-70b-versatile'

export type VideoSuggestion = {
  title: string
  concept: string
  hook: string
  duration: string
  structure: string[]
  musicStyle: string
  caption: string
  hashtags: string[]
}

export type AdRecommendation = {
  name: string
  objective: string
  budgetSuggestion: string
  targeting: Record<string, any>
  creativeStrategy: string
  platforms: string[]
  estimatedReach: string
}

export type TrendAnalysis = {
  trends: Array<{ name: string; momentum: 'rising' | 'stable' | 'declining'; relevance: 'high' | 'medium' | 'low'; suggestion: string }>
  nicheInsights: string
  recommendedActions: string[]
}

export type ContentInsight = {
  findings: string[]
  opportunities: string[]
  risks: string[]
  actions: string[]
}

export type ContentStrategy = {
  overview: string
  pillars: Array<{ name: string; description: string; postTypes: string[]; frequency: string }>
  weeklyPlan: string[]
  metrics: string[]
}

const BRAND_IDENTITY = `
Brand: Gümüş Güneş (Silver Sun) — Egyptian stainless steel jewelry brand.
Sourcing: Materials and manufacturing from Turkey — high quality Turkish craftsmanship.
Current products: Stainless steel jewelry (necklaces, rings, bracelets, earrings, anklets).
Expanding to: Watches, belts, wallets, bags, shoes — becoming a full lifestyle accessories brand.
Audience: Everyone — women (primary target 14-45), men, children, couples.
Positioning: Both luxury AND everyday wear.
Markets: Egypt (primary), with regional Arab world and global reach.
Values: Quality, affordability, style, versatility, family.
Language: Mix of Egyptian Arabic + English + Turkish naturally.`

export class SocialMediaAgent {
  private async callGroq(prompt: string, maxTokens = 1000): Promise<string> {
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
        temperature: 0.7,
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

  async analyzeTrends(niche: string, region: string = 'egypt'): Promise<TrendAnalysis> {
    const regionHint = region === 'egypt' ? 'مصر' : region === 'gulf' ? 'الخليج' : 'global'
    const prompt = `أنت خبير تحليل تريندات لمجال المجوهرات والاكسسوارات.

${BRAND_IDENTITY}

ابحث وحلل التريندات الحالية في ${regionHint} لمجال: "${niche}"

Return valid JSON only (no markdown):
{
  "trends": [
    {
      "name": "اسم التريند",
      "momentum": "rising or stable or declining",
      "relevance": "high or medium or low",
      "suggestion": "ازاي العلامة تستفيد من التريند ده"
    }
  ],
  "nicheInsights": "تحليل متعمق للسوق والفرص المتاحة للعلامة في المجال ده",
  "recommendedActions": ["أول اجراء", "تاني اجراء", "تالت اجراء"]
}

Return at least 5 trends.`
    const raw = await this.callGroq(prompt, 1000)
    try {
      const cleaned = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim()
      return JSON.parse(cleaned)
    } catch {
      return {
        trends: [
          { name: 'Personalized Jewelry', momentum: 'rising', relevance: 'high', suggestion: 'Offer custom engraving options' },
          { name: 'Stackable Rings', momentum: 'rising', relevance: 'high', suggestion: 'Create stackable ring sets' },
          { name: 'Minimalist Designs', momentum: 'stable', relevance: 'medium', suggestion: 'Highlight minimalist pieces' },
          { name: 'Sustainable Fashion', momentum: 'rising', relevance: 'medium', suggestion: 'Emphasize Turkish craftsmanship' },
          { name: 'Gift Sets', momentum: 'stable', relevance: 'high', suggestion: 'Create curated gift bundles' },
        ],
        nicheInsights: 'The jewelry market shows strong demand for personalized, stackable, and minimalist pieces.',
        recommendedActions: ['Create stackable ring collections', 'Offer gift bundles for occasions', 'Highlight craftsmanship story'],
      }
    }
  }

  async suggestVideos(product: { name: string; price: number; material: string; description: string }, count: number = 3): Promise<VideoSuggestion[]> {
    const prompt = `أنت مخرج فيديوهات تسويقية لماركة مجوهرات.

${BRAND_IDENTITY}

اقترح ${count} فكرة فيديو للمنتج:
- الاسم: ${product.name}
- السعر: ${product.price} EGP
- الخامة: ${product.material}
- الوصف: ${product.description}

Return valid JSON only (no markdown):
{
  "videos": [
    {
      "title": "عنوان الفيديو",
      "concept": "فكرة الفيديو بالتفصيل",
      "hook": "الhook اللي يشد المشاهد في أول ٣ ثواني",
      "duration": "15-30 seconds or 30-60 seconds",
      "structure": ["مشهد ١", "مشهد ٢", "مشهد ٣"],
      "musicStyle": "نوع المزيكا المناسبة",
      "caption": "كابشن الفيديو (mix Egyptian Arabic + English)",
      "hashtags": ["هاشتاجات"]
    }
  ]
}`
    const raw = await this.callGroq(prompt, 1200)
    try {
      const cleaned = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(cleaned)
      return parsed.videos || []
    } catch {
      return Array.from({ length: count }, (_, i) => ({
        title: `Video Idea ${i + 1}: ${product.name} Showcase`,
        concept: `A captivating showcase of ${product.name} highlighting its ${product.material} craftsmanship`,
        hook: `"This ${product.material} piece will transform your style"`,
        duration: '15-30 seconds',
        structure: ['Opening shot of product detail', 'Model wearing the piece', 'Lifestyle shot showing versatility', 'Price and CTA'],
        musicStyle: 'Elegant ambient with soft beats',
        caption: `Discover the beauty of ${product.name}. Handcrafted ${product.material} from Turkey ✨`,
        hashtags: ['#GumusGunes', '#مجوهرات', '#استانليس_ستيل', '#JewelryLover'],
      }))
    }
  }

  async recommendAds(goal: string, budget: number, target: string): Promise<AdRecommendation[]> {
    const prompt = `أنت مدير إعلانات فيسبوك وإنستجرام لماركة مجوهرات.

${BRAND_IDENTITY}

صمم حملة إعلانية:
- الهدف: ${goal}
- الميزانية: ${budget} EGP
- الجمهور المستهدف: ${target}

Return valid JSON only (no markdown):
{
  "campaigns": [
    {
      "name": "اسم الحملة",
      "objective": "هدف الحملة بالتفصيل",
      "budgetSuggestion": "توزيع الميزانية المقترح",
      "targeting": {
        "ageRange": "العمر من-الى",
        "gender": "ذكر/انثى/الكل",
        "interests": ["اهتمامات"],
        "locations": ["اماكن"]
      },
      "creativeStrategy": "استراتيجية المحتوى الإبداعي",
      "platforms": ["facebook", "instagram"],
      "estimatedReach": "الوصول المتوقع"
    }
  ]
}

Return 2 campaign variations.`
    const raw = await this.callGroq(prompt, 1000)
    try {
      const cleaned = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(cleaned)
      return parsed.campaigns || []
    } catch {
      return [
        {
          name: `Brand Awareness - ${goal}`,
          objective: `Increase brand awareness for ${goal}`,
          budgetSuggestion: `${budget} EGP split across 2 platforms`,
          targeting: { ageRange: '18-45', gender: 'all', interests: ['jewelry', 'fashion', 'accessories'], locations: ['Egypt'] },
          creativeStrategy: 'Use lifestyle imagery showing product versatility',
          platforms: ['facebook', 'instagram'],
          estimatedReach: `${Math.round(budget * 10).toLocaleString()} - ${Math.round(budget * 20).toLocaleString()}`,
        },
      ]
    }
  }

  async generateInsights(analytics: Record<string, any>): Promise<ContentInsight> {
    const prompt = `أنت محلل أداء سوشيال ميديا لماركة مجوهرات.

${BRAND_IDENTITY}

حلل بيانات الأداء دي:
${JSON.stringify(analytics, null, 2)}

Return valid JSON only (no markdown):
{
  "findings": ["أهم النتائج ٣-٥"],
  "opportunities": ["الفرص المتاحة ٢-٣"],
  "risks": ["المخاطر والتحديات ١-٢"],
  "actions": ["اجراءات مقترحة ٣-٥"]
}`
    const raw = await this.callGroq(prompt, 800)
    try {
      const cleaned = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim()
      return JSON.parse(cleaned)
    } catch {
      return {
        findings: ['Engagement rate indicates strong audience connection', 'Video content outperforms static posts', 'Peak activity during evening hours'],
        opportunities: ['Increase Reel production for higher reach', 'Collaborate with micro-influencers', 'Leverage user-generated content'],
        risks: ['Competitor brands increasing ad spend', 'Seasonal fluctuations in engagement'],
        actions: ['Post Reels 4x per week', 'Run a monthly giveaway campaign', 'Engage with top commenters'],
      }
    }
  }

  async competitorAnalysis(): Promise<string[]> {
    const prompt = `أنت محلل تنافسي لماركة مجوهرات.

${BRAND_IDENTITY}

حلل المشهد التنافسي واسأل:
- المنافسين الرئيسيين في مصر والوطن العربي
- استراتيجياتهم التسويقية
- نقاط قوة وضعف كل منافس
- فرص التميز للعلامة

Return valid JSON only (no markdown):
{
  "analysis": [
    "نقطة تحليلية ١",
    "نقطة تحليلية ٢",
    "نقطة تحليلية ٣",
    "نقطة تحليلية ٤",
    "نقطة تحليلية ٥"
  ]
}`
    const raw = await this.callGroq(prompt, 800)
    try {
      const cleaned = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(cleaned)
      return parsed.analysis || []
    } catch {
      return [
        'Focus on storytelling about Turkish craftsmanship to differentiate',
        'Offer competitive pricing while maintaining premium positioning',
        'Leverage Egyptian pride in owning internationally-sourced products',
        'Create limited edition collections to drive urgency',
        'Build community through user-generated content and testimonials',
      ]
    }
  }

  async contentStrategy(products: string[], goals: string): Promise<ContentStrategy> {
    const productList = products.join(', ')
    const prompt = `أنت استراتيجي محتوى لماركة مجوهرات.

${BRAND_IDENTITY}

المنتجات: ${productList}
الأهداف: ${goals}

Return valid JSON only (no markdown):
{
  "overview": "نظرة عامة على الاستراتيجية",
  "pillars": [
    {
      "name": "اسم الركيزة",
      "description": "وصف الركيزة",
      "postTypes": ["feed", "reel", "story"],
      "frequency": "3 times per week"
    }
  ],
  "weeklyPlan": ["خطة اليوم ١", "خطة اليوم ٢", "خطة اليوم ٣"],
  "metrics": ["مؤشر أداء ١", "مؤشر أداء ٢"]
}`
    const raw = await this.callGroq(prompt, 1200)
    try {
      const cleaned = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim()
      return JSON.parse(cleaned)
    } catch {
      return {
        overview: 'A balanced content strategy showcasing product quality, craftsmanship, and lifestyle integration.',
        pillars: [
          { name: 'Product Showcase', description: 'Highlight product details and quality', postTypes: ['feed', 'reel'], frequency: '3 times per week' },
          { name: 'Lifestyle & Styling', description: 'Show how products fit into daily life', postTypes: ['feed', 'reel', 'story'], frequency: '2 times per week' },
          { name: 'Educational', description: 'Share jewelry care and styling tips', postTypes: ['reel', 'story'], frequency: '1 time per week' },
        ],
        weeklyPlan: ['Mon: Product feature reel', 'Wed: Styling tips carousel', 'Fri: Customer testimonial', 'Sat: Behind the scenes'],
        metrics: ['Engagement rate', 'Reach', 'Saves', 'Profile visits'],
      }
    }
  }
}
