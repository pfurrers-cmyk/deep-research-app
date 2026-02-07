// seed.spec.ts — Seed test for Playwright Agents
import { test, expect } from '@playwright/test'

test('seed: app loads and is interactive', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // App loads with header
  await expect(page.getByText('Âmago.AI')).toBeVisible()

  // Search input is interactive
  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible()
  await textarea.fill('Test query')
  await expect(textarea).toHaveValue('Test query')
})
