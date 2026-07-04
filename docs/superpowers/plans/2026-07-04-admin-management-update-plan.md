# Admin Management Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the admin management page with phone/lastLoginAt tracking, 2FA status column, full permission labels, and search.

**Architecture:** Add two DB fields to Admin model, update login route to track lastLoginAt, update the admin management page component with new columns and full permission support.

**Tech Stack:** Next.js, Prisma, TypeScript, Tailwind

---

### Task 1: Schema — Add phone and lastLoginAt to Admin

**Files:**
- Modify: `prisma/schema.prisma` — add `phone` and `lastLoginAt` fields to Admin model

- [ ] **Step 1: Add fields to schema**

After `totpEnabled Boolean @default(false)` on the Admin model, add:

```prisma
  phone        String?
  lastLoginAt  DateTime?
```

- [ ] **Step 2: Push schema**

Run: `cd C:\Users\obai\Desktop\website && npx prisma db push`

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add phone and lastLoginAt fields to Admin model"
```

### Task 2: Track lastLoginAt on admin login

**Files:**
- Modify: `src/app/api/admin/auth/login/route.ts`

- [ ] **Step 1: Read the current login route**

Read `C:\Users\obai\Desktop\website\src\app\api\admin\auth\login\route.ts` to find where the successful login response is returned.

- [ ] **Step 2: Add lastLoginAt update**

Find the line where a successful login returns the response (after TOTP check, after signing the token). Before the response, add:

```typescript
await db.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
```

Make sure `db` is already imported at the top of the file (it likely already is, or imported via the auth library).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/auth/login/route.ts
git commit -m "feat: track lastLoginAt on admin login"
```

### Task 3: Update Admin Management Page UI

**Files:**
- Modify: `src/app/admin/admins/page.tsx`

- [ ] **Step 1: Read the current file**

Read `C:\Users\obai\Desktop\website\src\app\admin\admins\page.tsx` fully.

- [ ] **Step 2: Fix PERMISSION_LABELS — add all 23 permission labels**

Replace the existing `PERMISSION_LABELS` with the complete set:

```typescript
const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', accounting: 'Accounting', orders: 'Orders', receipts: 'Receipts',
  products: 'Products', inventory: 'Inventory', discounts: 'Discounts', stock_transfers: 'Stock Transfers',
  branches: 'Branches', pos: 'POS', editor: 'Site Editor', categories: 'Categories', settings: 'Settings',
  security: 'Security', admins: 'Admins', customers: 'Customers', payments: 'Payments',
  shipping: 'Shipping', reviews: 'Reviews', newsletter: 'Newsletter', activity: 'Activity Log',
  chat: 'Admin Chat', seed: 'Seed Data',
}
```

Also update the import to use the full permission list. Change:
```typescript
import { ALL_PERMISSIONS } from '@/lib/permissions'
```
to:
```typescript
import { ALL_PERMISSIONS } from '@/lib/admin-permissions'
```

This gives access to all 23 permissions instead of the client-only 19.

- [ ] **Step 3: Add Search to AdminsTab**

Inside `AdminsTab`, add state:
```typescript
const [search, setSearch] = useState('')
```

Add the search input above the admin table, after the "New Admin" button row:
```tsx
<div className="mb-4">
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search by name or email..."
    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
  />
</div>
```

Filter the admins list before rendering:
```typescript
const filtered = admins.filter(
  (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
)
```

Replace `{admins.map((a) => (` with `{filtered.map((a) => (` and `{admins.length === 0` with `{filtered.length === 0`.

- [ ] **Step 4: Add phone to modal and AdminUser type**

Update the `AdminUser` type:
```typescript
type AdminUser = { id: string; email: string; name: string; phone: string | null; role: string; roleId: string | null; totpEnabled: boolean; lastLoginAt: string | null; createdAt: string }
```

Add `phone` state to `AdminsTab`:
```typescript
const [phone, setPhone] = useState('')
```

Add phone to `resetForm()`:
```typescript
function resetForm() { setName(''); setEmail(''); setPhone(''); setPassword(''); setRoleId(''); setEditId(null) }
```

Add phone to `openEdit()`:
```typescript
function openEdit(admin: AdminUser) {
  setName(admin.name); setEmail(admin.email); setPhone(admin.phone || ''); setRoleId(admin.roleId || ''); setPassword(''); setEditId(admin.id); setShowModal(true)
}
```

Add phone to modal body (after the email input, before password):
```tsx
<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
```

Add phone to `handleSubmit` POST body:
```typescript
const body: any = { name, email, phone: phone || undefined, roleId }
```

- [ ] **Step 5: Add 2FA, Phone, and Last Login columns to admin table**

Replace the table header:
```tsx
<th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Email</th>
<th className="p-3 font-medium">Role</th><th className="p-3 font-medium">2FA</th>
<th className="p-3 font-medium">Phone</th><th className="p-3 font-medium">Last Login</th>
<th className="p-3 font-medium">Created</th><th className="p-3 font-medium">Actions</th>
```

Replace the table row cells:
```tsx
<td className="p-3 font-medium text-navy">{a.name}</td>
<td className="p-3 text-muted-foreground">{a.email}</td>
<td className="p-3"><span className="px-2 py-0.5 bg-navy/5 text-navy rounded text-xs font-medium">{a.role}</span></td>
<td className="p-3">
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.totpEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
    {a.totpEnabled ? 'Enabled' : 'Disabled'}
  </span>
</td>
<td className="p-3 text-muted-foreground text-sm">{a.phone || '—'}</td>
<td className="p-3 text-muted-foreground text-xs">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : 'Never'}</td>
<td className="p-3 text-muted-foreground text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
```

Update `colSpan` in the empty row: `<td colSpan={8}`

- [ ] **Step 6: Build to verify**

Run: `cd C:\Users\obai\Desktop\website && npx next build`

Expected: Build succeeds without errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/admins/page.tsx
git commit -m "feat: update admin management page with phone, 2FA, lastLogin, search, full permissions"
```
