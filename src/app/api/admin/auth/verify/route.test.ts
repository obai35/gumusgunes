import { describe, it, expect, vi, beforeEach } from 'vitest'
import speakeasy from 'speakeasy'
import { authenticator } from 'otplib'
import { NextRequest } from 'next/server'
import { BACKUP_CODE_PATTERN } from '@/lib/backup-codes'

process.env.ADMIN_JWT_SECRET = 'test-secret'

const mocks = vi.hoisted(() => ({
  getAdmin: vi.fn(),
  clearCache: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  createMany: vi.fn(),
  deleteMany: vi.fn(),
  transaction: vi.fn(async (ops: unknown[]) => {
    for (const op of ops as unknown[]) {
      if (typeof op === 'function') await (op as () => Promise<unknown>)()
    }
  }),
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
    $transaction: mocks.transaction,
    admin: { findUnique: mocks.findUnique, update: mocks.update },
    backupCode: { createMany: mocks.createMany, deleteMany: mocks.deleteMany },
  },
}))

vi.mock('@/lib/admin-permissions', () => ({
  getAdminFromToken: mocks.getAdmin,
  clearAdminCache: mocks.clearCache,
}))

import { POST } from './route'
import { signAdminSetupToken } from '@/lib/admin-auth'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getAdmin.mockResolvedValue({ id: 'a1', email: 'admin@x.com', storeId: 's1', totpEnabled: false })
  mocks.findUnique.mockResolvedValue({ id: 'a1', email: 'admin@x.com', storeId: 's1', totpEnabled: false })
})

const secret = speakeasy.generateSecret({ length: 20 }).base32
const setupToken = signAdminSetupToken('a1', secret)

function currentTotp(): string {
  return authenticator.generate(secret)
}

function post(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/auth/verify', () => {
  it('rejects unauthenticated requests', async () => {
    mocks.getAdmin.mockResolvedValue(null)
    const res = await POST(post({ token: '123456', setupToken }))
    expect(res.status).toBe(401)
  })

  it('rejects an invalid setup token (expired or forged)', async () => {
    const res = await POST(post({ token: '123456', setupToken: 'forged' }))
    expect(res.status).toBe(400)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('rejects a setup token bound to a different admin', async () => {
    const other = signAdminSetupToken('other-admin', secret)
    const res = await POST(post({ token: '123456', setupToken: other }))
    expect(res.status).toBe(400)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('does NOT enable 2FA on an invalid code', async () => {
    const res = await POST(post({ token: '000000', setupToken }))
    expect(res.status).toBe(400)
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.createMany).not.toHaveBeenCalled()
  })

  it('enables 2FA only after the code is proven, and issues hashed backup codes once', async () => {
    const code = currentTotp()
    const res = await POST(post({ token: code, setupToken }))
    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(Array.isArray(data.backupCodes)).toBe(true)
    expect(data.backupCodes).toHaveLength(10)
    for (const bc of data.backupCodes) {
      expect(BACKUP_CODE_PATTERN.test(bc)).toBe(true)
    }

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { totpSecret: secret, totpEnabled: true },
    })
    expect(mocks.createMany).toHaveBeenCalledTimes(1)
    const created = mocks.createMany.mock.calls[0][0]
    expect(created.data).toHaveLength(10)
    const hashes = created.data.map((r: { hash: string }) => r.hash)
    expect(new Set(hashes).size).toBe(10)
    for (const record of created.data) {
      expect(record.ownerId).toBe('a1')
      expect(record.ownerType).toBe('admin')
      expect(record.index).toBeGreaterThanOrEqual(0)
      expect(record.index).toBeLessThan(10)
      // Hashes never embed plaintext backup codes
      expect(record.hash.startsWith('$2')).toBe(true)
      for (const bc of data.backupCodes) {
        expect(record.hash).not.toContain(bc)
      }
    }
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { ownerId: 'a1', ownerType: 'admin' } })
    expect(mocks.clearCache).toHaveBeenCalledWith('a1')
  })
})