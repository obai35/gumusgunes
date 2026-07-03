import { test, expect } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Gümüş Güneş|gumusgunes|Silver Sun/i)
})

test('health API returns 200', async ({ request }) => {
  const res = await request.get('/api')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body).toHaveProperty('message')
})
