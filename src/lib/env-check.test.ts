import { describe, it, expect, vi, afterEach } from 'vitest'
import { checkEnvProduction, REQUIRED_SECRETS, WARN_ONLY_VARS } from './env-check'

const GOOD = {
  PASSWORD_PEPPER: 'pepper-value',
  ADMIN_JWT_SECRET: 'admin-secret',
  NEXTAUTH_SECRET: 'nextauth-secret',
  CUSTOMER_JWT_SECRET: 'customer-secret',
  ENCRYPTION_KEY: 'encryption-key',
  GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  GOOGLE_REDIRECT_URI: 'https://gumusgunes.com/api/auth/google/callback',
  CRON_SECRET: 'cron-secret',
  DATABASE_URL: 'postgresql://user:pass@host:5432/db',
  UPSTASH_REDIS_REST_URL: 'https://upstash.example',
  UPSTASH_REDIS_REST_TOKEN: 'upstash-token',
} as Record<string, string>

function withEnv(vars: Record<string, string | undefined>) {
  vi.stubEnv('NODE_ENV', 'test')
  for (const [k, v] of Object.entries(GOOD)) vi.stubEnv(k, v)
  for (const [k, v] of Object.entries(vars)) {
    vi.stubEnv(k, v === undefined ? '' : v)
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('checkEnvProduction', () => {
  it('passes with the full secret set', () => {
    withEnv({ CUSTOMER_JWT_SECRET: 'customer-secret' })
    const result = checkEnvProduction()
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('accepts the CUSTOMER_JWT_SECRET -> NEXTAUTH_SECRET fallback', () => {
    withEnv({ CUSTOMER_JWT_SECRET: undefined })
    const result = checkEnvProduction()
    expect(result.ok).toBe(true)
  })

  it('flags a missing PASSWORD_PEPPER as an error', () => {
    withEnv({ PASSWORD_PEPPER: undefined })
    const result = checkEnvProduction()
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('PASSWORD_PEPPER')
  })

  it('flags placeholder values (e.g. ungenerated PASSWORD_PEPPER)', () => {
    withEnv({ PASSWORD_PEPPER: '<generate with: openssl rand -hex 32>' })
    const result = checkEnvProduction()
    expect(result.errors.join('\n')).toContain('PASSWORD_PEPPER')
  })

  it('flags placeholder GOOGLE_CLIENT_ID', () => {
    withEnv({ GOOGLE_CLIENT_ID: 'xxx.apps.googleusercontent.com' })
    const result = checkEnvProduction()
    expect(result.errors.join('\n')).toContain('GOOGLE_CLIENT_ID')
  })

  it('flags a missing database URL', () => {
    withEnv({ DATABASE_URL: undefined, DIRECT_URL: undefined })
    const result = checkEnvProduction()
    expect(result.errors.join('\n')).toContain('DATABASE_URL')
  })

  it('flags secrets reused across surfaces', () => {
    withEnv({ ADMIN_JWT_SECRET: 'same-value', CUSTOMER_JWT_SECRET: 'same-value', ENCRYPTION_KEY: 'same-value' })
    const result = checkEnvProduction()
    expect(result.errors.join('\n')).toContain('distinct')
  })

  it('reports missing UPSTASH as warnings only (fail-open stance)', () => {
    withEnv({ UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined })
    const result = checkEnvProduction()
    expect(result.ok).toBe(true)
    expect(result.warnings.some((w) => w.includes('UPSTASH'))).toBe(true)
  })

  it('covers every required secret in the recommended set', () => {
    expect(REQUIRED_SECRETS).toContain('PASSWORD_PEPPER')
    expect(REQUIRED_SECRETS).toContain('ADMIN_JWT_SECRET')
    expect(REQUIRED_SECRETS).toContain('ENCRYPTION_KEY')
    expect(WARN_ONLY_VARS).toContain('UPSTASH_REDIS_REST_TOKEN')
  })
})