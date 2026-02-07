// lib/research/readability-metrics.ts — Text readability metrics using text-readability-ts
// Post-generation quality assessment for reports.
import readability from 'text-readability-ts';

// ============================================================
// TYPES
// ============================================================

export interface ReadabilityResult {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFog: number;
  smogIndex: number;
  colemanLiauIndex: number;
  automatedReadabilityIndex: number;
  textStandard: string;
  wordCount: number;
  sentenceCount: number;
  uniqueWords: number;
  estimatedReadingTimeMinutes: number;
  gradeLabel: string;
}

// ============================================================
// HELPERS
// ============================================================

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

function countUniqueWords(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return new Set(words).size;
}

function getGradeLabel(grade: number): string {
  if (grade <= 6) return 'Fundamental';
  if (grade <= 9) return 'Ensino Médio';
  if (grade <= 12) return 'Vestibular';
  if (grade <= 16) return 'Universitário';
  return 'Pós-graduação';
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Compute readability metrics for a report text.
 * Strips Markdown formatting before analysis.
 */
export function computeReadability(markdownText: string): ReadabilityResult {
  // Strip markdown formatting for accurate text analysis
  const plainText = markdownText
    .replace(/#{1,6}\s+/g, '') // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/\|[^\n]+\|/g, '') // table rows
    .replace(/---+/g, '') // horizontal rules
    .replace(/>\s+/g, '') // blockquotes
    .replace(/\[(\d+)\]/g, '') // citation markers
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (plainText.length < 100) {
    return {
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      gunningFog: 0,
      smogIndex: 0,
      colemanLiauIndex: 0,
      automatedReadabilityIndex: 0,
      textStandard: 'N/A',
      wordCount: countWords(plainText),
      sentenceCount: countSentences(plainText),
      uniqueWords: countUniqueWords(plainText),
      estimatedReadingTimeMinutes: 0,
      gradeLabel: 'N/A',
    };
  }

  const fre = readability.fleschReadingEase(plainText);
  const fkg = readability.fleschKincaidGrade(plainText);
  const gf = readability.gunningFog(plainText);
  const smog = readability.smogIndex(plainText);
  const cli = readability.colemanLiauIndex(plainText);
  const ari = readability.automatedReadabilityIndex(plainText);
  const standard = readability.textStandard(plainText) as string;
  const wc = countWords(plainText);
  const sc = countSentences(plainText);
  const uw = countUniqueWords(plainText);
  const readTime = Math.ceil(wc / 200); // ~200 words/min reading speed

  return {
    fleschReadingEase: Math.round(fre * 10) / 10,
    fleschKincaidGrade: Math.round(fkg * 10) / 10,
    gunningFog: Math.round(gf * 10) / 10,
    smogIndex: Math.round(smog * 10) / 10,
    colemanLiauIndex: Math.round(cli * 10) / 10,
    automatedReadabilityIndex: Math.round(ari * 10) / 10,
    textStandard: standard,
    wordCount: wc,
    sentenceCount: sc,
    uniqueWords: uw,
    estimatedReadingTimeMinutes: readTime,
    gradeLabel: getGradeLabel(fkg),
  };
}

/**
 * Format readability metrics as a markdown card for display.
 */
export function formatReadabilityCard(metrics: ReadabilityResult): string {
  return `
---

## 📊 Métricas de Legibilidade

| Métrica | Valor |
|---|---|
| **Flesch Reading Ease** | ${metrics.fleschReadingEase} |
| **Flesch-Kincaid Grade** | ${metrics.fleschKincaidGrade} (${metrics.gradeLabel}) |
| **Gunning Fog** | ${metrics.gunningFog} |
| **SMOG Index** | ${metrics.smogIndex} |
| **Coleman-Liau** | ${metrics.colemanLiauIndex} |
| **ARI** | ${metrics.automatedReadabilityIndex} |
| **Consenso** | ${metrics.textStandard} |

| Estatística | Valor |
|---|---|
| Palavras | ${metrics.wordCount.toLocaleString('pt-BR')} |
| Frases | ${metrics.sentenceCount.toLocaleString('pt-BR')} |
| Vocabulário único | ${metrics.uniqueWords.toLocaleString('pt-BR')} |
| Tempo de leitura | ~${metrics.estimatedReadingTimeMinutes} min |
`;
}
