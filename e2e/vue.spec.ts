import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Операционная панель кальянной' })).toBeVisible()

  await page.getByRole('link', { name: 'Заказы' }).click()
  await expect(page.getByRole('heading', { name: 'Контур заказов' })).toBeVisible()
})
