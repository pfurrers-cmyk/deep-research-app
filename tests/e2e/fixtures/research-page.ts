// tests/e2e/fixtures/research-page.ts — Page Object Model for research page
import { type Page, type Locator, expect } from '@playwright/test'

export class ResearchPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly depthSelect: Locator
  readonly reportContainer: Locator
  readonly progressIndicator: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.locator('textarea').first()
    this.depthSelect = page.locator('select').first()
    this.reportContainer = page.locator('[class*="prose"]').first()
    this.progressIndicator = page.locator('[role="progressbar"], [class*="progress"], [class*="animate"]').first()
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
  }

  async waitForReport(timeout = 120_000) {
    await expect(this.reportContainer).toBeVisible({ timeout })
  }

  async getReportText() {
    return this.reportContainer.textContent()
  }
}

export class LibraryPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/library')
    await this.page.waitForLoadState('networkidle')
  }

  async getResearchCount() {
    const items = this.page.locator('[data-testid="research-item"], [class*="card"]')
    return items.count()
  }
}

export class SettingsPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/settings')
    await this.page.waitForLoadState('networkidle')
  }

  async getVersion() {
    const versionEl = this.page.locator('text=/v\\d+\\.\\d+/')
    return versionEl.textContent()
  }
}

export class GeneratePage {
  readonly page: Page
  readonly promptInput: Locator
  readonly generateButton: Locator

  constructor(page: Page) {
    this.page = page
    this.promptInput = page.locator('textarea').first()
    this.generateButton = page.getByRole('button', { name: /gerar/i })
  }

  async goto() {
    await this.page.goto('/generate')
    await this.page.waitForLoadState('networkidle')
  }

  async generate(prompt: string) {
    await this.promptInput.fill(prompt)
    await this.generateButton.click()
  }
}
