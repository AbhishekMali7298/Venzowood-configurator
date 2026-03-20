import { expect, test } from '@playwright/test'

test('room studio shell renders canvas and customization controls', async ({ page }) => {
  await page.goto('/e2e/room')
  await expect(page.locator('[data-testid="room-canvas"]').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Customize Main Wall/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Save Project/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Export PNG/i })).toBeVisible()
})
