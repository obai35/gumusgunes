export const LOCKOUT_THRESHOLD = 10
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000

export type LockoutRecord = { failedLoginAttempts: number; lockedUntil: Date | null }

export type LockoutUpdate = (data: {
  failedLoginAttempts: number
  lockedUntil: Date | null
}) => Promise<unknown>

/** Remaining locked seconds, or null when the account is not locked. */
export function lockedFor(record: LockoutRecord): number | null {
  if (record.lockedUntil && record.lockedUntil.getTime() > Date.now()) {
    return Math.ceil((record.lockedUntil.getTime() - Date.now()) / 1000)
  }
  return null
}

/** +1 failure; locks at LOCKOUT_THRESHOLD for LOCKOUT_DURATION_MS. Model-agnostic: pass the db delegate update. */
export async function recordFailedAttempt(
  record: LockoutRecord,
  update: LockoutUpdate
): Promise<{ attempts: number; locked: boolean }> {
  const attempts = record.failedLoginAttempts + 1
  const locked = attempts >= LOCKOUT_THRESHOLD
  await update({
    failedLoginAttempts: attempts,
    lockedUntil: locked ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
  })
  return { attempts, locked }
}

/** Call only on full authentication success (after the TOTP step when enabled). */
export async function resetFailedAttempts(update: LockoutUpdate): Promise<void> {
  await update({ failedLoginAttempts: 0, lockedUntil: null })
}
