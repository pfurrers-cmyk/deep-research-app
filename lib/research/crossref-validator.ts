// lib/research/crossref-validator.ts — CrossRef API citation verification
// Validates academic citations against the CrossRef database (free, no API key required).
// Used post-generation in academic/TCC modes.

// ============================================================
// TYPES
// ============================================================

export interface CitationCheck {
  original: string;
  author: string;
  year: string;
  status: 'verified' | 'not_found' | 'inconclusive' | 'error';
  doi?: string;
  crossrefTitle?: string;
  crossrefAuthors?: string;
  confidence: number; // 0-1
}

export interface CrossRefWork {
  DOI: string;
  title: string[];
  author?: Array<{ given?: string; family?: string }>;
  'published-print'?: { 'date-parts': number[][] };
  'published-online'?: { 'date-parts': number[][] };
  score: number;
}

interface CrossRefResponse {
  status: string;
  message: {
    items: CrossRefWork[];
    'total-results': number;
  };
}

// ============================================================
// CITATION EXTRACTION
// ============================================================

/**
 * Extract ABNT-style citations: (AUTOR, ano) or (AUTOR; AUTOR2, ano)
 */
export function extractAbntCitations(text: string): Array<{ original: string; author: string; year: string }> {
  const abntRegex = /\(([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s;]+?),\s*(\d{4})[^)]*\)/g;
  const citations: Array<{ original: string; author: string; year: string }> = [];
  const seen = new Set<string>();

  let match;
  while ((match = abntRegex.exec(text)) !== null) {
    const author = match[1].split(';')[0].trim();
    const year = match[2];
    const key = `${author}-${year}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({ original: match[0], author, year });
    }
  }

  return citations;
}

/**
 * Extract "Segundo Autor (ano)" style citations
 */
export function extractInlineCitations(text: string): Array<{ original: string; author: string; year: string }> {
  const inlineRegex = /(?:Segundo|Conforme|De acordo com|Para|Segundo)\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(?:\s+(?:e|et\s+al\.?))?)\s*\((\d{4})\)/g;
  const citations: Array<{ original: string; author: string; year: string }> = [];
  const seen = new Set<string>();

  let match;
  while ((match = inlineRegex.exec(text)) !== null) {
    const author = match[1].trim();
    const year = match[2];
    const key = `${author}-${year}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({ original: match[0], author, year });
    }
  }

  return citations;
}

/**
 * Extract all citation patterns from report text
 */
export function extractCitations(text: string): Array<{ original: string; author: string; year: string }> {
  const abnt = extractAbntCitations(text);
  const inline = extractInlineCitations(text);
  // Deduplicate by author+year
  const seen = new Set(abnt.map((c) => `${c.author}-${c.year}`));
  const unique = [...abnt];
  for (const c of inline) {
    const key = `${c.author}-${c.year}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }
  return unique;
}

// ============================================================
// CROSSREF API
// ============================================================

const CROSSREF_API = 'https://api.crossref.org/works';
const THROTTLE_MS = 250; // 4 req/s to be polite

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Query CrossRef API for a specific author+year combination.
 */
async function queryCrossRef(author: string, year: string): Promise<CrossRefWork[]> {
  const query = `${author} ${year}`;
  const params = new URLSearchParams({
    query,
    rows: '3',
    filter: `from-pub-date:${year},until-pub-date:${year}`,
  });

  try {
    const response = await fetch(`${CROSSREF_API}?${params}`, {
      headers: {
        'User-Agent': 'Amago.AI/1.0 (mailto:contato@amago.ai)',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`CrossRef API error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as CrossRefResponse;
    return data.message?.items ?? [];
  } catch (error) {
    console.error('CrossRef query failed:', error);
    return [];
  }
}

/**
 * Check if a CrossRef result matches the citation author.
 */
function matchesAuthor(work: CrossRefWork, authorQuery: string): boolean {
  if (!work.author?.length) return false;
  const normalizedQuery = authorQuery.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return work.author.some((a) => {
    const family = (a.family ?? '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return family.includes(normalizedQuery) || normalizedQuery.includes(family);
  });
}

/**
 * Verify a single citation against CrossRef.
 */
async function verifyCitation(citation: { original: string; author: string; year: string }): Promise<CitationCheck> {
  const works = await queryCrossRef(citation.author, citation.year);

  if (works.length === 0) {
    return {
      ...citation,
      status: 'not_found',
      confidence: 0,
    };
  }

  // Find best match
  for (const work of works) {
    if (matchesAuthor(work, citation.author)) {
      const authors = work.author
        ?.map((a) => `${a.family ?? ''}, ${a.given ?? ''}`)
        .join('; ') ?? '';
      return {
        ...citation,
        status: 'verified',
        doi: work.DOI,
        crossrefTitle: work.title?.[0] ?? '',
        crossrefAuthors: authors,
        confidence: Math.min(work.score / 100, 1),
      };
    }
  }

  // Partial match — found works for that year but author doesn't match well
  const bestWork = works[0];
  return {
    ...citation,
    status: 'inconclusive',
    doi: bestWork.DOI,
    crossrefTitle: bestWork.title?.[0] ?? '',
    confidence: Math.min(bestWork.score / 200, 0.5),
  };
}

// ============================================================
// MAIN VALIDATOR
// ============================================================

/**
 * Validate all citations in a report text against CrossRef.
 * Returns array of CitationCheck results.
 * Only runs for academic/TCC modes.
 */
export async function validateCitations(
  reportText: string,
  options?: { maxCitations?: number }
): Promise<CitationCheck[]> {
  const citations = extractCitations(reportText);
  const maxToCheck = options?.maxCitations ?? 20;
  const toCheck = citations.slice(0, maxToCheck);

  if (toCheck.length === 0) return [];

  const results: CitationCheck[] = [];
  for (const citation of toCheck) {
    try {
      const result = await verifyCitation(citation);
      results.push(result);
    } catch {
      results.push({
        ...citation,
        status: 'error',
        confidence: 0,
      });
    }
    await sleep(THROTTLE_MS);
  }

  return results;
}

/**
 * Generate a markdown summary of citation validation results.
 */
export function formatCitationReport(results: CitationCheck[]): string {
  if (results.length === 0) return '';

  const verified = results.filter((r) => r.status === 'verified').length;
  const notFound = results.filter((r) => r.status === 'not_found').length;
  const inconclusive = results.filter((r) => r.status === 'inconclusive').length;

  let report = `\n---\n\n## 📚 Verificação de Citações (CrossRef)\n\n`;
  report += `| Status | Quantidade |\n|---|---|\n`;
  report += `| ✅ Verificadas | ${verified} |\n`;
  report += `| ❓ Inconclusivas | ${inconclusive} |\n`;
  report += `| ⚠️ Não encontradas | ${notFound} |\n`;
  report += `| **Total verificadas** | **${results.length}** |\n\n`;

  if (verified > 0) {
    report += `### ✅ Citações Verificadas\n`;
    for (const r of results.filter((r) => r.status === 'verified')) {
      report += `- **${r.original}** → ${r.crossrefTitle} (DOI: ${r.doi})\n`;
    }
    report += '\n';
  }

  if (notFound > 0) {
    report += `### ⚠️ Citações Não Encontradas\n`;
    for (const r of results.filter((r) => r.status === 'not_found')) {
      report += `- ${r.original}\n`;
    }
    report += '\n';
  }

  return report;
}
