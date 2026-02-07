// tests/e2e/navigation.e2e.ts — Testes E2E de navegação e carregamento
import { test, expect } from '@playwright/test'

test.describe('Navegação', () => {
  test('página principal carrega corretamente', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Header com nome do app
    await expect(page.getByText('Âmago.AI')).toBeVisible()

    // Input de pesquisa presente
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
  })

  test('navega para todas as seções via header', async ({ page }) => {
    await page.goto('/')

    // Pesquisa (home)
    await expect(page).toHaveURL('/')

    // Imagens
    await page.getByRole('link', { name: /imagens/i }).click()
    await expect(page).toHaveURL('/generate')
    await expect(page.getByText(/geração de imagens/i)).toBeVisible()

    // Arena
    await page.getByRole('link', { name: /arena/i }).click()
    await expect(page).toHaveURL('/arena')

    // Biblioteca
    await page.getByRole('link', { name: /biblioteca/i }).click()
    await expect(page).toHaveURL('/library')

    // Config
    await page.getByRole('link', { name: /config/i }).click()
    await expect(page).toHaveURL('/settings')
  })

  test('botão flutuante de debug logs está visível em todas as páginas', async ({ page }) => {
    const debugButton = page.locator('button[title*="Debug"]')

    await page.goto('/')
    await expect(debugButton).toBeVisible()

    await page.goto('/generate')
    await expect(debugButton).toBeVisible()

    await page.goto('/settings')
    await expect(debugButton).toBeVisible()

    await page.goto('/library')
    await expect(debugButton).toBeVisible()
  })

  test('debug log drawer abre e fecha', async ({ page }) => {
    await page.goto('/')

    const debugButton = page.locator('button[title*="Debug"]')
    await debugButton.click()

    // Drawer deve aparecer
    await expect(page.getByText('Debug Logs')).toBeVisible()

    // Tabs cliente/servidor
    await expect(page.getByText(/cliente/i)).toBeVisible()
    await expect(page.getByText(/servidor/i)).toBeVisible()

    // Fechar
    const closeBtn = page.locator('button[title="Fechar"]')
    await closeBtn.click()
    await expect(page.getByText('Debug Logs')).not.toBeVisible()
  })
})

test.describe('Settings', () => {
  test('exibe versão do app', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('text=/v\\d+\\.\\d+/')).toBeVisible()
  })
})

test.describe('Generate', () => {
  test('página de geração carrega com input e botão', async ({ page }) => {
    await page.goto('/generate')

    await expect(page.locator('textarea').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /gerar/i })).toBeVisible()

    // Tabs imagem/vídeo
    await expect(page.getByText(/imagem/i).first()).toBeVisible()
    await expect(page.getByText(/vídeo/i).first()).toBeVisible()
  })
})
