// lib/research/search.ts — Wrapper para busca web via AI Gateway tools
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { getSearchTool } from '@/lib/ai/gateway-config';
import { selectModel } from '@/lib/ai/model-router';
import type { AppConfig } from '@/config/defaults';
import type { SubQuery, SearchResult } from '@/lib/research/types';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout after ${ms}ms`)),
      ms
    );
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchSingleQuery(
  subQuery: SubQuery,
  config: AppConfig,
  domainFilters?: string[],
  languageFilters?: string[]
): Promise<SearchResult[]> {
  const searchConfig = config.pipeline.search;
  const provider = searchConfig.defaultProvider;

  const searchTool = getSearchTool(
    provider === 'both' ? 'perplexity' : provider,
    {
      perplexity: {
        ...searchConfig.perplexity,
        ...(languageFilters && { searchLanguageFilter: languageFilters }),
        ...(domainFilters && { searchDomainFilter: domainFilters }),
      },
      parallel: searchConfig.parallel,
    }
  );

  const modelSelection = selectModel(
    'search',
    'auto',
    'normal',
    config
  );

  const toolName =
    provider === 'parallel' ? 'parallelSearch' : 'perplexitySearch';

  // Build enriched search prompt using bilingual terms from decomposition
  let searchPrompt = subQuery.text;
  if (subQuery.searchTerms?.length || subQuery.searchTermsPt?.length) {
    const enTerms = subQuery.searchTerms?.join(', ') ?? '';
    const ptTerms = subQuery.searchTermsPt?.join(', ') ?? '';
    const enQuery = subQuery.textEn ?? '';
    searchPrompt = [
      subQuery.text,
      enQuery && enQuery !== subQuery.text ? `\nAlso search: ${enQuery}` : '',
      enTerms ? `\nKey terms (EN): ${enTerms}` : '',
      ptTerms ? `\nTermos-chave (PT): ${ptTerms}` : '',
    ].filter(Boolean).join('');
  }

  const { toolResults } = await generateText({
    model: gateway(modelSelection.modelId),
    tools: {
      [toolName]: searchTool,
    },
    toolChoice: 'required',
    prompt: searchPrompt,
  });

  const results: SearchResult[] = [];

  for (const toolResult of toolResults) {
    const output = toolResult.output as Record<string, unknown>;

    if ('error' in output) continue;

    const rawResults = (output.results ?? output.data ?? []) as Array<
      Record<string, unknown>
    >;

    for (const r of rawResults) {
      results.push({
        url: String(r.url ?? r.link ?? ''),
        title: String(r.title ?? ''),
        snippet: String(r.snippet ?? r.excerpt ?? r.content ?? '').slice(
          0,
          500
        ),
        content: String(r.content ?? r.excerpt ?? r.snippet ?? ''),
        source: String(r.source ?? r.url ?? ''),
        publishedDate: r.publishedDate
          ? String(r.publishedDate)
          : undefined,
        author: r.author ? String(r.author) : undefined,
        language: subQuery.language,
        subQueryId: subQuery.id,
      });
    }
  }

  return results;
}

async function searchWithRetry(
  subQuery: SubQuery,
  config: AppConfig,
  domainFilters?: string[],
  languageFilters?: string[]
): Promise<SearchResult[]> {
  const { retryAttempts, retryDelayMs, timeoutPerQueryMs } =
    config.pipeline.search;

  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      return await withTimeout(
        searchSingleQuery(subQuery, config, domainFilters, languageFilters),
        timeoutPerQueryMs
      );
    } catch (error) {
      if (attempt < retryAttempts) {
        const delay = retryDelayMs * Math.pow(2, attempt);
        console.error(
          `Search attempt ${attempt + 1} failed for "${subQuery.text}", retrying in ${delay}ms...`,
          error
        );
        await sleep(delay);
      } else {
        console.error(
          `Search failed after ${retryAttempts + 1} attempts for "${subQuery.text}"`,
          error
        );
        return [];
      }
    }
  }

  return [];
}

function deduplicateByUrl(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const normalized = r.url.replace(/\/$/, '').toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export async function executeSearch(
  subQueries: SubQuery[],
  config: AppConfig,
  onSourceFound?: (source: SearchResult) => void,
  domainFilters?: string[],
  languageFilters?: string[]
): Promise<SearchResult[]> {
  const searchConfig = config.pipeline.search;

  const results = await Promise.allSettled(
    subQueries.map((sq) =>
      searchWithRetry(sq, config, domainFilters, languageFilters)
    )
  );

  const allResults: SearchResult[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const source of result.value) {
        allResults.push(source);
        onSourceFound?.(source);
      }
    }
  }

  if (searchConfig.deduplicateByUrl) {
    return deduplicateByUrl(allResults);
  }

  return allResults;
}
