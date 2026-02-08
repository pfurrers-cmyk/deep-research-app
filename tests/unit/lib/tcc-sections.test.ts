// tests/unit/lib/tcc-sections.test.ts — Tests for TCC section prompts and citation extraction
import { describe, it, expect } from 'vitest';
import { extractAuthorYear, buildTccSections, extractTccConfig } from '@/lib/ai/prompts/tcc-sections';
import type { EvaluatedSource } from '@/lib/research/types';
import { DEFAULT_PREFERENCES } from '@/lib/config/settings-store';

function mockSource(overrides: Partial<EvaluatedSource> = {}): EvaluatedSource {
  return {
    url: 'https://example.com/article',
    title: 'Test Article Title',
    snippet: 'Test snippet',
    content: 'Test content',
    source: 'example.com',
    subQueryId: 'sq1',
    relevanceScore: 0.8,
    recencyScore: 0.7,
    authorityScore: 0.6,
    weightedScore: 0.7,
    credibilityScore: 0.7,
    credibilityTier: 'medium',
    flagged: false,
    kept: true,
    ...overrides,
  };
}

describe('TCC Sections', () => {
  describe('extractAuthorYear', () => {
    it('extrai autor e ano do campo author + publishedDate', () => {
      const source = mockSource({
        author: 'João Carlos Silva',
        publishedDate: '2023-05-15',
      });
      const result = extractAuthorYear(source);
      expect(result.surname).toBe('SILVA');
      expect(result.year).toBe('2023');
      expect(result.citeKey).toBe('(SILVA, 2023)');
    });

    it('usa domínio .gov.br como BRASIL', () => {
      const source = mockSource({
        source: 'www.gov.br',
        url: 'https://www.gov.br/planalto/2024/lei',
      });
      const result = extractAuthorYear(source);
      expect(result.surname).toBe('BRASIL');
      expect(result.year).toBe('2024');
    });

    it('extrai ano da URL quando não há publishedDate', () => {
      const source = mockSource({
        url: 'https://revista.com/2022/artigo-importante',
        source: 'revista.com',
      });
      const result = extractAuthorYear(source);
      expect(result.year).toBe('2022');
    });

    it('usa domínio como fallback para surname', () => {
      const source = mockSource({
        source: 'scielo.br',
      });
      const result = extractAuthorYear(source);
      expect(result.surname).toBe('SCIELO');
    });

    it('retorna S/A para surname vazio/curto', () => {
      const source = mockSource({
        source: '',
        url: 'https://x.com/',
      });
      const result = extractAuthorYear(source);
      // Should handle edge case
      expect(result.surname.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('buildTccSections', () => {
    it('gera seções obrigatórias do TCC ABNT', () => {
      const config = extractTccConfig(DEFAULT_PREFERENCES);
      const sections = buildTccSections(config);

      const ids = sections.map((s) => s.id);
      expect(ids).toContain('capa');
      expect(ids).toContain('folha_rosto');
      expect(ids).toContain('resumo');
      expect(ids).toContain('abstract');
      expect(ids).toContain('introducao');
      expect(ids).toContain('referencial_teorico');
      expect(ids).toContain('metodologia');
      expect(ids).toContain('resultados_discussao');
      expect(ids).toContain('consideracoes_finais');
      expect(ids).toContain('referencias');
    });

    it('todas as seções obrigatórias têm required: true', () => {
      const config = extractTccConfig(DEFAULT_PREFERENCES);
      const sections = buildTccSections(config);

      const requiredSections = sections.filter((s) => s.required);
      expect(requiredSections.length).toBeGreaterThanOrEqual(10);
    });

    it('não inclui dedicatória/agradecimentos/epígrafe sem config', () => {
      const config = extractTccConfig(DEFAULT_PREFERENCES);
      const sections = buildTccSections(config);

      const ids = sections.map((s) => s.id);
      expect(ids).not.toContain('dedicatoria');
      expect(ids).not.toContain('agradecimentos');
      expect(ids).not.toContain('epigrafe');
    });

    it('inclui dedicatória quando configurada', () => {
      const config = extractTccConfig(DEFAULT_PREFERENCES);
      config.dedicatoria = 'Aos meus pais';
      const sections = buildTccSections(config);

      const ids = sections.map((s) => s.id);
      expect(ids).toContain('dedicatoria');
    });

    it('cada seção textual tem estimatedPages > 0', () => {
      const config = extractTccConfig(DEFAULT_PREFERENCES);
      const sections = buildTccSections(config);

      const textualSections = sections.filter((s) => s.type === 'textual');
      for (const s of textualSections) {
        expect(s.estimatedPages).toBeGreaterThan(0);
      }
    });

    it('cada seção tem promptBuilder que retorna system e prompt', () => {
      const config = extractTccConfig(DEFAULT_PREFERENCES);
      const sections = buildTccSections(config);

      for (const section of sections) {
        const result = section.promptBuilder({
          query: 'Teste de pesquisa',
          tcc: config,
          sources: [mockSource()],
          previousSections: [],
          totalSources: 1,
        });
        expect(result.system).toBeTruthy();
        expect(result.prompt).toBeTruthy();
      }
    });

    it('seções pré-textuais vêm antes das textuais', () => {
      const config = extractTccConfig(DEFAULT_PREFERENCES);
      const sections = buildTccSections(config);

      let lastPretextual = -1;
      let firstTextual = sections.length;

      sections.forEach((s, i) => {
        if (s.type === 'pretextual') lastPretextual = i;
        if (s.type === 'textual' && i < firstTextual) firstTextual = i;
      });

      expect(lastPretextual).toBeLessThan(firstTextual);
    });
  });

  describe('extractTccConfig', () => {
    it('retorna valores default quando prefs estão vazias', () => {
      const config = extractTccConfig(DEFAULT_PREFERENCES);
      expect(config.titulo).toBe('[Título do TCC]');
      expect(config.minFontes).toBeGreaterThanOrEqual(15);
    });
  });
});
