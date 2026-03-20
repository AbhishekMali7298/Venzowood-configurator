import { expect, test } from '@playwright/test'

test('user can change wall decor and see canvas update', async ({ page }) => {
  await page.goto('/e2e/room')
  const canvas = page.locator('[data-testid="room-canvas"]').first()
  await expect(canvas).toBeVisible()

  await page.click('[data-testid="hotspot-wall-main"]')
  await expect(page.locator('[data-testid="decor-drawer"]')).toBeVisible()

  const before = await canvas.screenshot()

  await page.click('[data-testid="decor-card-H3309_ST28"]')
  await page.waitForTimeout(250)

  const after = await canvas.screenshot()
  expect(before).not.toEqual(after)
})
