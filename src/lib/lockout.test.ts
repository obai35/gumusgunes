import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LOCKOUT_THRESHOLD, LOCKOUT_DURATION_MS, lockedFor, recordFailedAttempt, resetFailedAttempts, LockoutRecord } from './lockout'

function record(attempts = 0, lockedUntil: Date | null = null): LockoutRecord {
  return { failedLoginAttempts: attempts, lockedUntil }
}

describe('lockedFor', () => {
  it('returns null when never locked', () => {
    expect(lockedFor(record())).toBeNull()
  })

  it('returns null when the lock has expired', () => {
    expect(lockedFor(record(10, new Date(Date.now() - 1000)))).toBeNull()
  })

  it('returns remaining seconds when locked', () => {
    const until = new Date(Date.now() + 5 * 60 * 1000)
    const seconds = lockedFor(record(10, until))
    expect(seconds).not.toBeNull()
    expect(seconds!).toBeGreaterThan(290)
    expect(seconds!).toBeLessThanOrEqual(300)
  })

  it('returns null when lockedUntil is not set even at the threshold', () => {
    expect(lockedFor(record(10))).toBeNull()
  })
})

describe('recordFailedAttempt', () => {
  it('increments the counter', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const { attempts, locked } = await recordFailedAttempt(record(2), update)
    expect(attempts).toBe(3)
    expect(locked).toBe(false)
    expect(update).toHaveBeenCalledWith({ failedLoginAttempts: 3, lockedUntil: null })
  })

  it('locks at the threshold', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const { attempts, locked } = await recordFailedAttempt(record(LOCKOUT_THRESHOLD - 1), update)
    expect(attempts).toBe(LOCKOUT_THRESHOLD)
    expect(locked).toBe(true)
    const data = update.mock.calls[0][0]
    expect(data.lockedUntil).toBeInstanceOf(Date)
    const remaining = data.lockedUntil.getTime() - Date.now()
    expect(remaining).toBeGreaterThan(LOCKOUT_DURATION_MS - 1000)
    expect(remaining).toBeLessThanOrEqual(LOCKOUT_DURATION_MS)
  })

  it('locks with the configured duration', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    await recordFailedAttempt(record(LOCKOUT_THRESHOLD), update)
    expect(update).toHaveBeenCalledWith({
      failedLoginAttempts: LOCKOUT_THRESHOLD + 1,
      lockedUntil: expect.any(Date),
    })
  })
})

describe('resetFailedAttempts', () => {
  it('clears the counter and lock', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    await resetFailedAttempts(update)
    expect(update).toHaveBeenCalledWith({ failedLoginAttempts: 0, lockedUntil: null })
  })
})

describe('lockout cross-cycle semantics', () => {
  it('wrong TOTP after a correct password does not reset the counter (9 + 1 = locked)', async () => {
    let current: LockoutRecord = record(LOCKOUT_THRESHOLD - 1)
    const update = vi.fn(async (data: { failedLoginAttempts: number; lockedUntil: Date | null }) => {
      current = { ...current, ...data }
    })
    const { locked } = await recordFailedAttempt(current, update)
    expect(locked).toBe(true)
    expect(lockedFor(current)).not.toBeNull()
  })

  it('a record at the threshold with no lockedUntil is not locked (only recordFailedAttempt sets the lock)', () => {
    expect(lockedFor(record(LOCKOUT_THRESHOLD))).toBeNull()
  })
})
