const { test, expect } = require('@playwright/test')

test('home page shows title', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText(/Accueil|REKOMA/)
})
