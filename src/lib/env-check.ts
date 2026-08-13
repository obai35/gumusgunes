const PLACEHOLDER_PATTERNS = [
  /<generate/,
  /^xxx/,
  /changeme/i,
  /your[-_ ]?secret/i,
  /example/i,
]

function looksLikePlaceholder(value: string | undefined): boolean {
  if (!value) return true
  return PLACEHOLDER_PATTERNS.some((re) => re.test(value))
}

export const REQUIRED_SECRETS = [
  'PASSWORD_PEPPER',
  'ADMIN_JWT_SECRET',
  'NEXTAUTH_SECRET',
  'ENCRYPTION_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'CRON_SECRET',
] as const

export const WARN_ONLY_VARS = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'] as const

export interface EnvCheckResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export function checkEnvProduction(): EnvCheckResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const name of REQUIRED_SECRETS) {
    const value = process.env[name]
    if (looksLikePlaceholder(value)) {
      errors.push(`${name} is missing or still a placeholder`)
    }
  }

  const customerSecret = process.env.CUSTOMER_JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (looksLikePlaceholder(customerSecret)) {
    errors.push('CUSTOMER_JWT_SECRET (or NEXTAUTH_SECRET/JWT_SECRET fallback) is missing or still a placeholder')
  }

  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL
  if (looksLikePlaceholder(dbUrl)) {
    errors.push('DATABASE_URL (or DIRECT_URL) is missing or still a placeholder')
  }

  // Per-surface key separation: pepper, admin JWT, customer JWT and encryption
  // must not reuse the same value. (CUSTOMER_JWT_SECRET may intentionally fall
  // back to NEXTAUTH_SECRET at runtime - that is documented sharing and is
  // only an error here when the explicit customer secret equals another one.)
  const distinctSecrets = [
    process.env.PASSWORD_PEPPER,
    process.env.ADMIN_JWT_SECRET,
    process.env.CUSTOMER_JWT_SECRET,
    process.env.ENCRYPTION_KEY,
  ].filter((v): v is string => Boolean(v))
  if (new Set(distinctSecrets).size !== distinctSecrets.length) {
    errors.push('Secrets must be distinct across surfaces (password pepper, admin JWT, customer JWT, encryption key)')
  }

  for (const name of WARN_ONLY_VARS) {
    if (!process.env[name]) {
      warnings.push(`${name} is missing - auth rate limiting fails open (documented R1 stance)`)
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}

export function isProductionDeploy(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production'
}

export function validateEnvAtBoot(): void {
  if (!isProductionDeploy()) return
  const { ok, errors, warnings } = checkEnvProduction()
  for (const warning of warnings) console.warn(`[env] ${warning}`)
  if (!ok) {
    console.error(`[env] Production secrets validation FAILED:\n- ${errors.join('\n- ')}`)
    throw new Error('[env] Missing or invalid production secrets - refusing to boot')
  }
}