export async function register() {
  if (process.env.NODE_ENV !== 'production') return
  const missing: string[] = []
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    missing.push('UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN')
  }
  if (missing.length > 0) {
    console.warn(`[env] Missing production env vars: ${missing.join(', ')} — auth rate limiting is FAILING OPEN`)
  }
}