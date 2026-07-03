import { describe, it, expect, vi } from 'vitest'
import { handleApiError } from './api-error'

describe('handleApiError', () => {
  it('returns 500 with generic message', () => {
    const res = handleApiError(new Error('test error'), 'test-context')
    expect(res.status).toBe(500)
    return res.json().then((body) => {
      expect(body).toEqual({ error: 'Internal server error' })
    })
  })

  it('logs the error with context prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    handleApiError('string error', 'my-context')
    expect(spy).toHaveBeenCalledWith('[my-context]', 'string error')
    spy.mockRestore()
  })

  it('handles non-Error types', () => {
    const res = handleApiError(null, 'null-test')
    expect(res.status).toBe(500)
  })

  it('handles object errors', () => {
    const res = handleApiError({ code: 123 }, 'obj-test')
    expect(res.status).toBe(500)
  })
})
