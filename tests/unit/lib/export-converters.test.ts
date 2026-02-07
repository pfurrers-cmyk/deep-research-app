// tests/unit/lib/export-converters.test.ts — Tests for export format converters
import { describe, it, expect } from 'vitest'
import {
  exportToMarkdown,
  exportToPDFHtml,
  exportToSlides,
  exportToPodcastScript,
  exportToSocialThread,
  exportToJSON,
  exportReport,
  type ExportInput,
} from '@/lib/export/converters'

const sampleInput: ExportInput = {
  reportText: `## Resumo Executivo\n\nEste é um relatório de teste sobre IA [1][2].\n\n## Achados Principais\n\nA inteligência artificial cresceu 340% em adoção [1]. Dados indicam tendência de alta [3].\n\n## Conclusão\n\nIA é transformadora [1][2][3].\n\n## Fontes\n\n1. [Fonte A](https://example.com/a)\n2. [Fonte B](https://example.com/b)\n3. [Fonte C](https://example.com/c)`,
  query: 'Impacto da IA na educação',
  citations: [
    { index: 1, title: 'Fonte A', url: 'https://example.com/a', domain: 'example.com' },
    { index: 2, title: 'Fonte B', url: 'https://example.com/b', domain: 'example.com' },
    { index: 3, title: 'Fonte C', url: 'https://example.com/c', domain: 'example.com' },
  ],
  metadata: { generatedAt: '2026-02-07T12:00:00Z', model: 'anthropic/claude-sonnet-4.5', depth: 'normal', costUSD: 0.25 },
}

describe('Export Converters', () => {
  describe('exportToMarkdown', () => {
    it('gera markdown com frontmatter', () => {
      const result = exportToMarkdown(sampleInput)
      expect(result.mimeType).toBe('text/markdown')
      expect(result.filename).toMatch(/\.md$/)
      expect(result.content).toContain('---')
      expect(result.content).toContain('title: "Impacto da IA na educação"')
      expect(result.content).toContain('generator: "Deep Research App"')
      expect(result.content).toContain('## Resumo Executivo')
    })
  })

  describe('exportToPDFHtml', () => {
    it('gera HTML válido com estilos', () => {
      const result = exportToPDFHtml(sampleInput)
      expect(result.mimeType).toBe('text/html')
      expect(result.filename).toMatch(/\.html$/)
      expect(result.content).toContain('<!DOCTYPE html>')
      expect(result.content).toContain('<style>')
      expect(result.content).toContain('Impacto da IA na educa')
      expect(result.blob).toBeDefined()
    })
  })

  describe('exportToSlides', () => {
    it('gera slides HTML com seções', () => {
      const result = exportToSlides(sampleInput)
      expect(result.mimeType).toBe('text/html')
      expect(result.filename).toMatch(/slides-.*\.html$/)
      expect(result.content).toContain('class="slide"')
      expect(result.content).toContain('slide-num')
    })
  })

  describe('exportToPodcastScript', () => {
    it('gera script com formatação de podcast', () => {
      const result = exportToPodcastScript(sampleInput)
      expect(result.mimeType).toBe('text/markdown')
      expect(result.filename).toMatch(/podcast-.*\.md$/)
      expect(result.content).toContain('SCRIPT DE PODCAST')
      expect(result.content).toContain('HOST')
      expect(result.content).toContain('ABERTURA')
      expect(result.content).toContain('ENCERRAMENTO')
    })
  })

  describe('exportToSocialThread', () => {
    it('gera thread com posts numerados', () => {
      const result = exportToSocialThread(sampleInput)
      expect(result.mimeType).toBe('text/plain')
      expect(result.filename).toMatch(/thread-.*\.txt$/)
      expect(result.content).toContain('THREAD')
      expect(result.content).toContain('Post 1/')
      expect(result.content).toContain('Deep Research App')
    })
  })

  describe('exportToJSON', () => {
    it('gera JSON estruturado com seções', () => {
      const result = exportToJSON(sampleInput)
      expect(result.mimeType).toBe('application/json')
      expect(result.filename).toMatch(/\.json$/)

      const data = JSON.parse(result.content)
      expect(data.query).toBe('Impacto da IA na educação')
      expect(data.metadata.generator).toBe('Deep Research App')
      expect(data.citations).toHaveLength(3)
      expect(data.sections.length).toBeGreaterThan(0)
    })
  })

  describe('exportReport (master)', () => {
    it('roteia para o converter correto', () => {
      expect(exportReport('markdown', sampleInput).mimeType).toBe('text/markdown')
      expect(exportReport('pdf', sampleInput).mimeType).toBe('text/html')
      expect(exportReport('slides', sampleInput).mimeType).toBe('text/html')
      expect(exportReport('podcast', sampleInput).mimeType).toBe('text/markdown')
      expect(exportReport('social', sampleInput).mimeType).toBe('text/plain')
      expect(exportReport('json', sampleInput).mimeType).toBe('application/json')
    })

    it('fallback para markdown quando formato desconhecido', () => {
      const result = exportReport('xyz', sampleInput)
      expect(result.mimeType).toBe('text/markdown')
    })
  })
})
