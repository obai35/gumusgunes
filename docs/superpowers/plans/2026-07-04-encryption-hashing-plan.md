# Encryption & Hashing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate password hashing, add pepper support, add encryption key rotation, encrypt more fields, hash reset tokens, add customer 2FA login flow, and write tests.

**Architecture:** Single shared `password.ts` utility replaces 4 duplicated implementations. Encryption gets key rotation via fallback key. Customer 2FA uses existing totp.ts + existing 2FA API routes + new two-step login flow.

**Tech Stack:** bcryptjs, Node.js crypto (aes-256-gcm), speakeasy (TOTP), Vitest

---

### Task 1: Consolidated Password Hashing

**Files:**
- Create: `src/lib/password.ts`
- Modify: `src/lib/admin-auth.ts`
- Modify: `src/lib/customer-auth.ts`
- Modify: `src/lib/pos-auth.ts`
- Modify: `src/lib/auth-utils.ts`
- Modify: `src/app/api/auth/reset-password/route.ts`
- Modify: `src/app/api/customer/auth/register/route.ts`
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/app/api/auth/google/route.ts`
- Modify: `src/app/api/admin/admins/route.ts`
- Modify: `src/app/api/admin/admins/[id]/route.ts`
- Modify: `src/app/api/admin/branches/route.ts`
- Modify: `src/app/api/admin/seed/route.ts`
- Modify: `src/app/api/seed/route.ts`

**Step 1: Create `src/lib/password.ts`**

```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12
const PEPPER = process.env.PASSWORD_PEPPER || ''

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(PEPPER + password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (await bcrypt.compare(PEPPER + password, hash)) return true
  if (!PEPPER) return false
  return bcrypt.compare(password, hash)
}
```

**Step 2: Update `src/lib/admin-auth.ts`**

Remove the `import bcrypt` and `hashPassword`/`verifyPassword` functions. Add `import { hashPassword, verifyPassword } from '@/lib/password'`. The file should keep `signAdminToken` and `verifyAdminToken`.

The file becomes:

```typescript
import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET
if (!ADMIN_JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET environment variable is required')
}

export { hashPassword, verifyPassword }

export function signAdminToken(payload: { adminId: string; email: string }): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '24h' })
}

export function verifyAdminToken(token: string): { adminId: string; email: string } | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: string; email: string }
  } catch {
    return null
  }
}
```

**Step 3: Update `src/lib/customer-auth.ts`**

Same pattern — remove `import bcrypt` and `hashPassword`/`verifyPassword` functions. Add `import { hashPassword, verifyPassword } from '@/lib/password'` and re-export them:

```typescript
import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or NEXTAUTH_SECRET environment variable is required')
}

export { hashPassword, verifyPassword }

export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
  } catch {
    return null
  }
}
```

**Step 4: Update `src/lib/pos-auth.ts`**

```typescript
import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '@/lib/password'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET or NEXTAUTH_SECRET environment variable')

export { hashPassword, verifyPassword }

export function signPosToken(payload: { branchId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyPosToken(token: string): { branchId: string; email: string } | null {
  try { return jwt.verify(token, JWT_SECRET) as { branchId: string; email: string } } catch { return null }
}
```

**Step 5: Update `src/lib/auth-utils.ts`**

If it has `hashPassword`/`verifyPassword`, replace with imports from `@/lib/password`.

Read the file first to see its content.

**Step 6: Update all routes that import `hashPassword` or `verifyPassword`**

These routes currently import from the old files. They'll keep working because the old files still re-export the functions from the new location. No route changes needed because we kept the same exports in admin-auth, customer-auth, pos-auth.

**Step 7: Commit**

```bash
git add src/lib/password.ts src/lib/admin-auth.ts src/lib/customer-auth.ts src/lib/pos-auth.ts src/lib/auth-utils.ts
git commit -m "feat: consolidate password hashing into shared utility with pepper support"
```

---

### Task 2: Encryption Key Rotation

**Files:**
- Modify: `src/lib/encryption.ts`

**Step 1: Update `src/lib/encryption.ts`**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_HEX = process.env.ENCRYPTION_KEY || ''
const PREV_KEY_HEX = process.env.ENCRYPTION_KEY_PREVIOUS || ''

function getKey(): Buffer {
  if (!KEY_HEX) throw new Error('ENCRYPTION_KEY env var is required')
  return Buffer.from(KEY_HEX, 'hex')
}

function getPreviousKey(): Buffer | null {
  if (!PREV_KEY_HEX) return null
  return Buffer.from(PREV_KEY_HEX, 'hex')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted text format')
  const [ivHex, authTagHex, encrypted] = parts

  try {
    return decryptWithKey(encryptedText, getKey())
  } catch {
    const prevKey = getPreviousKey()
    if (!prevKey) throw new Error('Decryption failed and no previous key available')
    return decryptWithKey(encryptedText, prevKey)
  }
}

function decryptWithKey(encryptedText: string, key: Buffer): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted text format')
  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

**Step 2: Commit**

```bash
git add src/lib/encryption.ts
git commit -m "feat: add encryption key rotation with previous key fallback"
```

---

### Task 3: Encrypt More Fields on Orders

**Files:**
- Modify: `src/app/api/orders/route.ts`
- Modify: `src/app/api/admin/orders/[id]/route.ts`

**Step 1: Update `src/app/api/orders/route.ts`**

Read the file. Find where `paymentProofUrl` and `paymentReference` are stored in the order creation. Encrypt them before saving.

Add import: `import { encrypt } from '@/lib/encryption'`

On the order create data, wrap the fields:
```typescript
paymentProofUrl: paymentProofUrl ? encrypt(paymentProofUrl) : null,
paymentReference: paymentReference ? encrypt(paymentReference) : null,
```

**Step 2: Update `src/app/api/admin/orders/[id]/route.ts`**

Read the file. Find where order data is returned. Decrypt the fields.

Add import: `import { decrypt } from '@/lib/encryption'`

After fetching the order, decrypt the fields before returning:
```typescript
if (order.paymentProofUrl) {
  try { order.paymentProofUrl = decrypt(order.paymentProofUrl) } catch {}
}
if (order.paymentReference) {
  try { order.paymentReference = decrypt(order.paymentReference) } catch {}
}
```

**Step 3: Commit**

```bash
git add src/app/api/orders/route.ts 'src/app/api/admin/orders/[id]/route.ts'
git commit -m "feat: encrypt paymentProofUrl and paymentReference on orders"
```

---

### Task 4: Hash Reset Tokens

**Files:**
- Modify: `src/app/api/auth/forgot-password/route.ts`
- Modify: `src/app/api/auth/reset-password/route.ts`

**Step 1: Read `src/app/api/auth/forgot-password/route.ts`**

Find where the reset token is created and stored. Currently looks something like:
```typescript
const token = crypto.randomUUID()
await db.resetToken.create({ data: { email, token, expiresAt } })
```

Change to:
```typescript
import bcrypt from 'bcryptjs'

const token = crypto.randomUUID()
const hashedToken = await bcrypt.hash(token, 10)
await db.resetToken.create({ data: { email, token: hashedToken, expiresAt } })
```

The plain `token` is still returned in the response (or logged) — the user needs the plain token to put in their reset link. Only the stored version is hashed.

**Step 2: Read `src/app/api/auth/reset-password/route.ts`**

Find where the token is looked up. Currently:
```typescript
const record = await db.resetToken.findUnique({ where: { token } })
```

Change to: find all non-expired, non-used tokens for the email, then iterate to find one where bcrypt.compare matches:

```typescript
import bcrypt from 'bcryptjs'

const records = await db.resetToken.findMany({
  where: { email, usedAt: null, expiresAt: { gt: new Date() } },
})

let record = null
for (const r of records) {
  if (await bcrypt.compare(token, r.token)) {
    record = r
    break
  }
}

if (!record) {
  return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
}
```

**Step 3: Commit**

```bash
git add src/app/api/auth/forgot-password/route.ts src/app/api/auth/reset-password/route.ts
git commit -m "feat: hash password reset tokens before storing in database"
```

---

### Task 5: Customer 2FA Login Flow

**Files:**
- Modify: `src/app/api/customer/auth/login/route.ts`
- Create: `src/app/api/customer/auth/login/2fa/route.ts`

**Step 1: Update login route to detect 2FA**

Add after password verification (before issuing the full JWT):

```typescript
import { signToken } from '@/lib/customer-auth'

// After verifying password, check 2FA:
if (user.totpEnabled) {
  // Issue a short-lived temp token
  const tempToken = signToken({ userId: user.id, email: user.email }, { expiresIn: '5m' } as any)
  return NextResponse.json({ requiresTotp: true, tempToken })
}

// Normal flow continues...
```

Wait, `signToken` doesn't accept options. I need to use jwt directly for the temp token. Let me rethink.

Actually, I should just use `jsonwebtoken` directly with a short expiry:

```typescript
import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET

if (user.totpEnabled) {
  const tempToken = jwt.sign({ userId: user.id, email: user.email, totp: true }, JWT_SECRET, { expiresIn: '5m' })
  return NextResponse.json({ requiresTotp: true, tempToken })
}
```

**Step 2: Create the 2FA verification route**

Create `src/app/api/customer/auth/login/2fa/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { withRateLimit } from '@/lib/rate-limit'
import { verifyTotpCode } from '@/lib/totp'
import { signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const Schema = z.object({
  tempToken: z.string(),
  code: z.string().length(6),
}).strict()

const handler = async (req: NextRequest) => {
  try {
    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { tempToken, code } = parsed.data
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    if (!JWT_SECRET) throw new Error('JWT_SECRET not configured')

    let payload: { userId: string; email: string }
    try {
      payload = jwt.verify(tempToken, JWT_SECRET) as { userId: string; email: string }
    } catch {
      return NextResponse.json({ error: 'Invalid or expired temp token' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.totpSecret || !user.totpEnabled) {
      return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
    }

    if (!verifyTotpCode(code, user.totpSecret)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    const token = signToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })

    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 604800,
    })

    return response
  } catch (e) {
    console.error('2FA login error:', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 5, window: '60s' })
```

Hmm, I have an issue with the types. `signToken` only takes `{ userId, email }` and doesn't accept options. Since the tempToken needs a short expiry, I'll use `jsonwebtoken.sign` directly.

But the signToken function is:
```typescript
export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
```

So for the temp token in login, I should use `jwt.sign` directly with `{ expiresIn: '5m' }`.

**Step 3: Commit**

```bash
git add src/app/api/customer/auth/login/route.ts 'src/app/api/customer/auth/login/2fa/route.ts'
git commit -m "feat: add two-step login flow for customers with 2FA enabled"
```

---

### Task 6: Customer 2FA UI on Account Page

**Files:**
- Modify: `src/app/account/page.tsx`

**Step 1: Read the account page**

Read `src/app/account/page.tsx` to understand its structure and find where to add the 2FA section.

**Step 2: Add 2FA section**

The account page is a client component. Add a "Security" section with:

- Status display: "Two-factor authentication: Enabled/Disabled"
- If disabled: "Enable 2FA" button → shows QR code → code input → verify
- If enabled: "Disable 2FA" button → shows code input → confirm disable

The UI pattern:
```tsx
const [totpSetup, setTotpSetup] = useState<{ secret: string; qrCode: string } | null>(null)
const [totpCode, setTotpCode] = useState('')
const [totpStatus, setTotpStatus] = useState<'idle' | 'loading' | 'error'>('idle')

const handleEnable2FA = async () => {
  const res = await fetch('/api/auth/2fa/setup')
  if (!res.ok) return toast.error('Failed to setup 2FA')
  const data = await res.json()
  setTotpSetup(data)
}

const handleVerify2FA = async () => {
  const res = await fetch('/api/auth/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: totpCode }),
  })
  if (!res.ok) return toast.error('Invalid code')
  setTotpSetup(null)
  setTotpCode('')
  toast.success('2FA enabled')
  // Refresh user data
}

const handleDisable2FA = async () => {
  const res = await fetch('/api/auth/2fa/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: totpCode }),
  })
  if (!res.ok) return toast.error('Invalid code')
  setTotpCode('')
  toast.success('2FA disabled')
  // Refresh user data
}
```

**Step 3: Commit**

```bash
git add src/app/account/page.tsx
git commit -m "feat: add 2FA enable/disable UI to customer account page"
```

---

### Task 7: Tests

**Files:**
- Create: `src/lib/password.test.ts`
- Create: `src/lib/encryption.test.ts`
- Create: `src/lib/totp.test.ts`

**Step 1: Create `src/lib/password.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password hashing', () => {
  it('hashes a password successfully', async () => {
    const hash = await hashPassword('test-password')
    expect(hash).toBeTruthy()
    expect(hash.startsWith('$2a$')).toBe(true)
  })

  it('produces different hashes for same input', async () => {
    const hash1 = await hashPassword('same-password')
    const hash2 = await hashPassword('same-password')
    expect(hash1).not.toBe(hash2)
  })

  it('verifies correct password', async () => {
    const hash = await hashPassword('my-password')
    expect(await verifyPassword('my-password', hash)).toBe(true)
  })

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('correct-password')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})
```

**Step 2: Create `src/lib/encryption.test.ts`**

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { encrypt, decrypt } from './encryption'

const ORIGINAL_KEY = process.env.ENCRYPTION_KEY

beforeAll(() => {
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  }
})

describe('encryption', () => {
  it('encrypts and decrypts a string', () => {
    const original = 'sensitive-data-123'
    const encrypted = encrypt(original)
    expect(encrypted).not.toBe(original)
    expect(encrypted.split(':').length).toBe(3)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it('produces different ciphertext for same input', () => {
    const plain = 'same-input'
    const enc1 = encrypt(plain)
    const enc2 = encrypt(plain)
    expect(enc1).not.toBe(enc2)
  })

  it('throws on invalid format', () => {
    expect(() => decrypt('invalid')).toThrow()
    expect(() => decrypt('a:b')).toThrow()
  })

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('test')
    const parts = encrypted.split(':')
    const tampered = `${parts[0]}:${parts[1]}:ffff${parts[2].slice(4)}`
    expect(() => decrypt(tampered)).toThrow()
  })
})
```

**Step 3: Create `src/lib/totp.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { verifyTotpCode } from './totp'

describe('TOTP', () => {
  it('rejects invalid code', () => {
    expect(verifyTotpCode('000000', 'JBSWY3DPEHPK3PXP')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(verifyTotpCode('', 'JBSWY3DPEHPK3PXP')).toBe(false)
  })
})
```

**Step 4: Run tests**

```bash
npx vitest run
```

Expected: 7 tests passing.

**Step 5: Commit**

```bash
git add src/lib/password.test.ts src/lib/encryption.test.ts src/lib/totp.test.ts
git commit -m "test: add tests for password hashing, encryption, and TOTP"
```

---

### Task 8: Build + Verify

- [ ] **Run build**

```bash
npx next build
```

Verify:
- Build succeeds
- No regressions

- [ ] **Push**

```bash
git push
```
