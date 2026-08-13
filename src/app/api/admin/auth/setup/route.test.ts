import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAdmin: vi.fn(),
  clearCache: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn(() => ({})) },
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => ({}))
    limit = vi.fn(async () => ({ success: true, remaining: 9, reset: 0 }))
  },
}))

vi.mock('@/lib/db', () => ({
  db: {
    admin: { findUnique: mocks.findUnique, update: mocks.update },
  },
}))

vi.mock('@/lib/admin-permissions', () => ({
  getAdminFromToken: mocks.getAdmin,
  clearAdminCache: mocks.clearCache,
}))

import { NextRequest } from 'next/server'
import { POST } from './route'

beforeAll(() => {
  process.env.ADMIN_JWT_SECRET = 'test-secret'
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getAdmin.mockResolvedValue({ id: 'a1', email: 'admin@x.com', storeId: 's1', totpEnabled: false })
})

function post(): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/auth/setup', { method: 'POST' })
}

describe('POST /api/admin/auth/setup', () => {
  it('rejects unauthenticated requests', async () => {
    mocks.getAdmin.mockResolvedValue(null)
    const res = await POST(post())
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('rejects when 2FA is already enabled', async () => {
    mocks.getAdmin.mockResolvedValue({ id: 'a1', email: 'admin@x.com', storeId: 's1', totpEnabled: true })
    mocks.findUnique.mockResolvedValue({ id: 'a1', email: 'admin@x.com', storeId: 's1', totpEnabled: true })
    const res = await POST(post())
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('2FA already enabled')
  })

  it('returns a secret, QR code and setup token WITHOUT persisting the secret', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'a1', email: 'admin@x.com', storeId: 's1', totpEnabled: false })
    const res = await POST(post())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.secret).toMatch(/^[A-Z2-7]+$/)
    expect(data.qrCode).toContain('data:image')
    expect(data.setupToken).toBeTruthy()
    expect(mocks.findUnique).toHaveBeenCalledTimes(1)
    expect(mocks.update).not.toHaveBeenCalled()
  })
})