import { test, expect } from '@playwright/test'

test.describe('AEO indexing surface', () => {
  test('llms.txt serves curated markdown ≤5KB with absolute URLs', async ({ request }) => {
    const res = await request.get('/llms.txt')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body.length).toBeLessThanOrEqual(5 * 1024)
    expect(body).toMatch(/^# /m)
    expect(body).toContain('https://gumusgunes.com/products')
    expect(body).toContain('https://gumusgunes.com/faq')
    expect(body).not.toContain('localhost')
    expect(body).not.toContain('http://')
  })

  test('robots.txt lists AI retrieval agents and keeps admin/api disallowed', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    for (const ua of [
      'Googlebot',
      'OAI-SearchBot',
      'Claude-SearchBot',
      'PerplexityBot',
      'ChatGPT-User',
      'Claude-User',
      'Perplexity-User',
    ]) {
      expect(body).toContain(`User-Agent: ${ua}`)
    }
    expect(body).toMatch(/Allow: \//)
    expect(body).toContain('Disallow: /admin')
    expect(body).toContain('Disallow: /api')
    expect(body).toContain('Disallow: /pos')
    expect(body).toContain('Disallow: /preview')
    expect(body).toContain('Sitemap:')
  })

  test('guest flow: cart and checkout reachable without auth wall', async ({ page }) => {
    await page.goto('/cart')
    await expect(page).toHaveURL(/\/cart$/)

    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page).not.toHaveURL(/\/login/)
  })
})