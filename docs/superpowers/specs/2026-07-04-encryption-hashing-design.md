# Encryption & Hashing Overhaul

## Overview

Consolidate, strengthen, and test all encryption and hashing across the Gümüş Güneş platform.

## Sections

### 1. Consolidate Password Hashing

Create `src/lib/password.ts` — a single shared utility replacing the duplicated `hashPassword`/`verifyPassword` in `admin-auth.ts`, `customer-auth.ts`, `pos-auth.ts`, and `auth-utils.ts`.

Implementation:
- bcrypt with 12 salt rounds
- Optional pepper (`PASSWORD_PEPPER` env var) mixed into every hash
- Legacy fallback: if pepper is set, try with pepper first, then without (for pre-pepper hashes)

Files to update:
- `src/lib/admin-auth.ts` — replace `hashPassword`/`verifyPassword` usage with import from `@/lib/password`
- `src/lib/customer-auth.ts` — same
- `src/lib/pos-auth.ts` — same
- `src/lib/auth-utils.ts` — same
- All routes that import `hashPassword` from these files

### 2. Encryption — Key Rotation Support

Update `src/lib/encryption.ts`:
- `ENCRYPTION_KEY` remains the active key for both encrypt/decrypt
- `ENCRYPTION_KEY_PREVIOUS` (optional) used as fallback for decryption only
- `decrypt()` tries active key first, falls back to previous key
- This enables zero-downtime key rotation

### 3. Encrypt More Fields

Currently only payment method configs are encrypted. Add encryption for:
- `paymentProofUrl` on orders (contains sensitive file paths)
- `paymentReference` on orders (contains payment gateway references)

Update `src/app/api/orders/route.ts` and `src/app/api/admin/orders/[id]/route.ts` to encrypt/decrypt these fields.

### 4. Hash Reset Tokens

Update password reset flow to store hashed tokens instead of plain UUIDs:

- `src/app/api/auth/forgot-password/route.ts` — hash token with bcrypt before storing
- `src/app/api/auth/reset-password/route.ts` — hash submitted token with bcrypt before comparing

### 5. Tests

Add `src/lib/password.test.ts`:
- `hashPassword` produces different output for same input (salt works)
- `verifyPassword` returns true for correct password
- `verifyPassword` returns false for incorrect password
- With pepper: verify works with pepper, legacy fallback works

Add `src/lib/encryption.test.ts`:
- Roundtrip: encrypt then decrypt returns original
- Decrypt with wrong key throws error
- Invalid format throws error
- Previous key fallback works (if implemented)

Add `src/lib/totp.test.ts`:
- `verifyTotpCode` returns false for invalid token
