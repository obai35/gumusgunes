import type { MetadataRoute } from 'next'

const SHARED_DISALLOW = ['/admin', '/api', '/pos', '/preview']

// Retrieval/fetch agents are explicitly allowed the public surface (they share
// the SHARED_DISALLOW so private paths stay blocked for every agent).
// Training crawlers (GPTBot, ClaudeBot, etc.) are intentionally left
// unlisted — the store wants its content cited, not blocked.
const AI_RETRIEVAL_AGENTS = [
  'OAI-SearchBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'ChatGPT-User',
  'Claude-User',
  'Perplexity-User',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'Googlebot', allow: '/', disallow: SHARED_DISALLOW },
      ...AI_RETRIEVAL_AGENTS.map((userAgent) => ({ userAgent, allow: '/' as const, disallow: SHARED_DISALLOW })),
      { userAgent: '*', allow: '/', disallow: SHARED_DISALLOW },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || 'https://gumusgunes.com'}/sitemap.xml`,
  }
}