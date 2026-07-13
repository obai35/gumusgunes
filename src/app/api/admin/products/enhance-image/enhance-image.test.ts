import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/enhance-image', () => ({
  enhanceImage: vi.fn(),
}))

vi.mock('@/lib/admin-permissions', () => ({
  withAdmin: (_handler: any) => _handler,
}))

import { POST } from './route'
import { enhanceImage } from '@/lib/enhance-image'

describe('POST /api/admin/products/enhance-image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when no image file provided', async () => {
    const formData = new FormData()
    formData.append('productName', 'Ring')
    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Image file is required')
  })

  it('returns 400 when no product name provided', async () => {
    const formData = new FormData()
    formData.append('image', new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' }))
    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Product name is required')
  })

  it('calls enhanceImage and returns URLs on success', async () => {
    const mockEnhanceImage = vi.mocked(enhanceImage)
    mockEnhanceImage.mockResolvedValue({
      enhancedUrl: '/products/enhanced/123.jpg',
      originalUrl: '/products/enhanced/123-original.jpg',
    })

    const formData = new FormData()
    formData.append('image', new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' }))
    formData.append('productName', 'Silver Ring')
    formData.append('productType', 'ring')

    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.enhancedUrl).toBe('/products/enhanced/123.jpg')
    expect(json.originalUrl).toBe('/products/enhanced/123-original.jpg')
    expect(mockEnhanceImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Silver Ring',
      'ring',
      undefined,
    )
  })

  it('passes custom prompt when provided', async () => {
    const mockEnhanceImage = vi.mocked(enhanceImage)
    mockEnhanceImage.mockResolvedValue({
      enhancedUrl: '/products/enhanced/456.jpg',
      originalUrl: '/products/enhanced/456-original.jpg',
    })

    const formData = new FormData()
    formData.append('image', new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' }))
    formData.append('productName', 'Ring')
    formData.append('customPrompt', 'On a red velvet background')

    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockEnhanceImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Ring',
      'other',
      'On a red velvet background',
    )
  })

  it('returns 502 when enhanceImage throws', async () => {
    const mockEnhanceImage = vi.mocked(enhanceImage)
    mockEnhanceImage.mockRejectedValue(new Error('API rate limited'))

    const formData = new FormData()
    formData.append('image', new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' }))
    formData.append('productName', 'Ring')

    const req = new NextRequest('http://localhost/api/admin/products/enhance-image', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.error).toBe('Failed to enhance image')
    expect(json.details).toBe('API rate limited')
  })
})
