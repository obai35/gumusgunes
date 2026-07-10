import { describe, it, expect, vi } from 'vitest'
import { handleApiError } from './api-error'

describe('handleApiError', () => {
  it('returns 500 with error message for generic Error', () => {
    const res = handleApiError(new Error('test error'), 'test-context')
    expect(res.status).toBe(500)
    return res.json().then((body) => {
      expect(body).toEqual({ error: 'test error', code: 'INTERNAL_ERROR' })
    })
  })

  it('maps 401 for Unauthorized', () => {
    const res = handleApiError(new Error('Unauthorized'))
    expect(res.status).toBe(401)
  })

  it('maps 404 for not found', () => {
    const res = handleApiError(new Error('resource not found'))
    expect(res.status).toBe(404)
  })

  it('maps 409 for already exists', () => {
    const res = handleApiError(new Error('record already exists'))
    expect(res.status).toBe(409)
  })

  it('maps 429 for rate limit', () => {
    const res = handleApiError(new Error('rate limit exceeded'))
    expect(res.status).toBe(429)
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
