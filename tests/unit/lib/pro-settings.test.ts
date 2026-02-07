// tests/unit/lib/pro-settings.test.ts — Tests for PRO settings persistence
import { describe, it, expect, beforeEach } from 'vitest'
import { loadPreferences, savePreferences, clearPreferences, DEFAULT_PREFERENCES } from '@/lib/config/settings-store'
import { APP_CONFIG } from '@/config/defaults'

describe('PRO settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadPreferences retorna PRO defaults corretos', () => {
    const prefs = loadPreferences()
    expect(prefs.pro.writingStyle).toBe('academic')
    expect(prefs.pro.detailLevel).toBe('standard')
    expect(prefs.pro.reasoningLanguage).toBe('auto')
    expect(prefs.pro.citationFormat).toBe('inline_numbered')
    expect(prefs.pro.evaluationFramework).toBe('craap')
    expect(prefs.pro.researchMode).toBe('standard')
    expect(prefs.pro.exportFormat).toBe('markdown')
    expect(prefs.pro.enabledSections).toContain('executive_summary')
    expect(prefs.pro.enabledSections).toContain('sources')
  })

  it('savePreferences persiste PRO settings parciais', () => {
    savePreferences({ pro: { ...DEFAULT_PREFERENCES.pro, writingStyle: 'executive', detailLevel: 'exhaustive' } })
    const loaded = loadPreferences()
    expect(loaded.pro.writingStyle).toBe('executive')
    expect(loaded.pro.detailLevel).toBe('exhaustive')
    expect(loaded.pro.citationFormat).toBe('inline_numbered') // preserved
  })

  it('savePreferences faz deep merge em advancedFilters', () => {
    savePreferences({
      pro: {
        ...DEFAULT_PREFERENCES.pro,
        advancedFilters: { ...DEFAULT_PREFERENCES.pro.advancedFilters, recency: 'week', allowlist: ['arxiv.org'] },
      },
    })
    const loaded = loadPreferences()
    expect(loaded.pro.advancedFilters.recency).toBe('week')
    expect(loaded.pro.advancedFilters.allowlist).toEqual(['arxiv.org'])
    expect(loaded.pro.advancedFilters.languages).toEqual(['pt', 'en']) // preserved
  })

  it('sectionOrder aceita reordenação', () => {
    const newOrder = ['sources', 'executive_summary', 'analysis', 'conclusion']
    savePreferences({ pro: { ...DEFAULT_PREFERENCES.pro, sectionOrder: newOrder } })
    const loaded = loadPreferences()
    expect(loaded.pro.sectionOrder).toEqual(newOrder)
  })

  it('APP_CONFIG.pro contém todos os writing styles', () => {
    const styles = Object.keys(APP_CONFIG.pro.writingStyle.options)
    expect(styles).toContain('academic')
    expect(styles).toContain('journalistic')
    expect(styles).toContain('technical')
    expect(styles).toContain('casual')
    expect(styles).toContain('executive')
    expect(styles.length).toBe(5)
  })

  it('APP_CONFIG.pro contém 4 detail levels', () => {
    const levels = Object.keys(APP_CONFIG.pro.detailLevel.options)
    expect(levels).toEqual(['summary', 'standard', 'detailed', 'exhaustive'])
  })

  it('APP_CONFIG.pro contém 6 citation formats', () => {
    const formats = Object.keys(APP_CONFIG.pro.citationFormat.options)
    expect(formats.length).toBe(6)
    expect(formats).toContain('abnt')
    expect(formats).toContain('apa7')
  })

  it('APP_CONFIG.pro contém 4 evaluation frameworks', () => {
    const fws = Object.keys(APP_CONFIG.pro.evaluationFramework.options)
    expect(fws).toEqual(['craap', 'sift', 'radar', 'custom'])
  })

  it('APP_CONFIG.pro contém 6 research modes', () => {
    const modes = Object.keys(APP_CONFIG.pro.researchMode.options)
    expect(modes.length).toBe(6)
    expect(modes).toContain('fact_check')
    expect(modes).toContain('meta_analysis')
  })

  it('reportSections required sections são executive_summary e sources', () => {
    const required = APP_CONFIG.pro.reportSections.available.filter((s) => s.required)
    expect(required.map((s) => s.id)).toEqual(['executive_summary', 'sources'])
  })

  it('clearPreferences reseta PRO para defaults', () => {
    savePreferences({ pro: { ...DEFAULT_PREFERENCES.pro, writingStyle: 'casual' } })
    expect(loadPreferences().pro.writingStyle).toBe('casual')
    clearPreferences()
    expect(loadPreferences().pro.writingStyle).toBe('academic')
  })
})
