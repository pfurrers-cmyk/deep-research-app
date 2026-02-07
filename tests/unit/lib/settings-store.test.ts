// tests/unit/lib/settings-store.test.ts — Testes para persistência de preferências
import { describe, it, expect, beforeEach } from 'vitest'
import { loadPreferences, savePreferences, clearPreferences, DEFAULT_PREFERENCES } from '@/lib/config/settings-store'

describe('settings-store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadPreferences retorna defaults quando vazio', () => {
    const prefs = loadPreferences()
    expect(prefs.defaultDepth).toBe(DEFAULT_PREFERENCES.defaultDepth)
    expect(prefs.modelPreference).toBe('auto')
    expect(prefs.outputLanguage).toBe('pt-BR')
    expect(prefs.defaultTheme).toBe('dark')
  })

  it('savePreferences persiste e merge com defaults', () => {
    savePreferences({ defaultDepth: 'profunda' })
    const loaded = loadPreferences()

    expect(loaded.defaultDepth).toBe('profunda')
    expect(loaded.modelPreference).toBe('auto') // default mantido
    expect(loaded.outputLanguage).toBe('pt-BR') // default mantido
  })

  it('savePreferences faz deep merge em stageModels', () => {
    savePreferences({ stageModels: { decomposition: 'openai/gpt-4.1' } as any })
    const loaded = loadPreferences()

    expect(loaded.stageModels.decomposition).toBe('openai/gpt-4.1')
    expect(loaded.stageModels.evaluation).toBe('auto') // default mantido
    expect(loaded.stageModels.synthesis).toBe('auto')   // default mantido
  })

  it('savePreferences atualiza updatedAt', () => {
    const before = new Date().toISOString()
    savePreferences({ defaultDepth: 'rapida' })
    const loaded = loadPreferences()

    expect(loaded.updatedAt >= before).toBe(true)
  })

  it('clearPreferences remove tudo', () => {
    savePreferences({ defaultDepth: 'profunda' })
    expect(loadPreferences().defaultDepth).toBe('profunda')

    clearPreferences()
    expect(loadPreferences().defaultDepth).toBe(DEFAULT_PREFERENCES.defaultDepth)
  })

  it('loadPreferences sobrevive a JSON corrompido', () => {
    localStorage.setItem('deep-research-settings', 'not-valid-json')
    const prefs = loadPreferences()
    expect(prefs.defaultDepth).toBe(DEFAULT_PREFERENCES.defaultDepth)
  })
})
