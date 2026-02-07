// hooks/useResearch.ts — Hook principal que conecta frontend ao pipeline via SSE
'use client';

import { useState, useCallback, useRef } from 'react';
import type { DepthPreset, DomainPreset } from '@/config/defaults';
import type {
  PipelineEvent,
  SubQuery,
  EvaluatedSource,
  ResearchMetadata,
  CostEntry,
  ResearchResponse,
} from '@/lib/research/types';
import { saveResearch, type StoredResearch } from '@/lib/db';
import { loadPreferences } from '@/lib/config/settings-store';

export type ResearchStatus = 'idle' | 'running' | 'complete' | 'error';

interface StageInfo {
  stage: string;
  status: string;
  progress: number;
  message: string;
}

interface UseResearchReturn {
  execute: (
    query: string,
    depth: DepthPreset,
    domainPreset?: DomainPreset | null
  ) => void;
  cancel: () => void;
  reset: () => void;
  status: ResearchStatus;
  currentStage: StageInfo | null;
  subQueries: SubQuery[];
  sourcesFound: number;
  sourcesKept: number;
  reportText: string;
  metadata: ResearchMetadata | null;
  costUSD: number;
  response: ResearchResponse | null;
  error: string | null;
}

export function useResearch(): UseResearchReturn {
  const [status, setStatus] = useState<ResearchStatus>('idle');
  const [currentStage, setCurrentStage] = useState<StageInfo | null>(null);
  const [subQueries, setSubQueries] = useState<SubQuery[]>([]);
  const [sourcesFound, setSourcesFound] = useState(0);
  const [sourcesKept, setSourcesKept] = useState(0);
  const [reportText, setReportText] = useState('');
  const [metadata, setMetadata] = useState<ResearchMetadata | null>(null);
  const [costUSD, setCostUSD] = useState(0);
  const [response, setResponse] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setCurrentStage(null);
    setSubQueries([]);
    setSourcesFound(0);
    setSourcesKept(0);
    setReportText('');
    setMetadata(null);
    setCostUSD(0);
    setResponse(null);
    setError(null);
  }, []);

  const execute = useCallback(
    (query: string, depth: DepthPreset, domainPreset?: DomainPreset | null) => {
      // Reset state
      setStatus('running');
      setCurrentStage(null);
      setSubQueries([]);
      setSourcesFound(0);
      setSourcesKept(0);
      setReportText('');
      setMetadata(null);
      setCostUSD(0);
      setResponse(null);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          // Read user preferences for model selection
          const prefs = loadPreferences();
          const customModelMap: Record<string, string> = {};
          if (prefs.stageModels.decomposition !== 'auto') {
            customModelMap.decomposition = prefs.stageModels.decomposition;
          }
          if (prefs.stageModels.evaluation !== 'auto') {
            customModelMap.evaluation = prefs.stageModels.evaluation;
          }
          if (prefs.stageModels.synthesis !== 'auto') {
            customModelMap.synthesis = prefs.stageModels.synthesis;
          }

          const res = await fetch('/api/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              depth,
              domainPreset: domainPreset ?? null,
              modelPreference: prefs.modelPreference,
              customModelMap: Object.keys(customModelMap).length > 0 ? customModelMap : undefined,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(
              (err as Record<string, string>).error ?? `HTTP ${res.status}`
            );
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const event = JSON.parse(data) as PipelineEvent;
                processEvent(event);
              } catch {
                // Skip malformed events
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim().startsWith('data: ')) {
            const data = buffer.trim().slice(6);
            if (data !== '[DONE]') {
              try {
                const event = JSON.parse(data) as PipelineEvent;
                processEvent(event);
              } catch {
                // Skip
              }
            }
          }

          setStatus((prev) => {
            if (prev === 'running') {
              // Auto-save handled by the 'complete' event processor
              return 'complete';
            }
            return prev;
          });
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          console.error('Research fetch error:', err);
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
          setStatus('error');
        }
      })();

      function processEvent(event: PipelineEvent) {
        switch (event.type) {
          case 'stage':
            setCurrentStage({
              stage: event.stage,
              status: event.status,
              progress: event.progress,
              message: event.message,
            });
            if (event.stage === 'complete') {
              setStatus('complete');
            }
            break;

          case 'queries':
            setSubQueries(event.data);
            break;

          case 'source':
            setSourcesFound((prev) => prev + 1);
            break;

          case 'evaluation':
            setSourcesKept(event.data.kept);
            break;

          case 'text-delta':
            setReportText((prev) => prev + event.text);
            break;

          case 'metadata':
            setMetadata(event.data);
            break;

          case 'cost':
            setCostUSD(event.data.costUSD);
            break;

          case 'complete':
            setResponse(event.data);
            setStatus('complete');
            // Auto-save to IndexedDB
            try {
              const r = event.data;
              const stored: StoredResearch = {
                id: r.id,
                query: r.query,
                title: r.metadata.title,
                depth: r.metadata.depth,
                domainPreset: r.metadata.domainPreset,
                modelPreference: r.metadata.modelPreference,
                reportText: r.report.sections.map((s) => s.content).join('\n\n'),
                citations: r.report.citations.map((c) => ({
                  index: c.index,
                  url: c.url,
                  title: c.title,
                  snippet: c.snippet,
                  domain: c.domain,
                  credibilityTier: c.credibilityTier,
                })),
                subQueries: r.subQueries.map((sq) => ({
                  id: sq.id,
                  text: sq.text,
                  language: sq.language,
                  resultCount: sq.resultCount ?? 0,
                })),
                metadata: {
                  totalSources: r.metadata.totalSources,
                  totalSourcesKept: r.metadata.totalSourcesKept,
                  modelsUsed: r.metadata.modelsUsed,
                  pipelineVersion: r.metadata.pipelineVersion,
                },
                costUSD: r.cost.totalCostUSD,
                confidenceLevel: r.confidence.level,
                favorite: false,
                tags: [],
                createdAt: r.metadata.createdAt,
                completedAt: r.metadata.completedAt,
                durationMs: r.metadata.durationMs,
              };
              saveResearch(stored).catch(console.error);
            } catch (e) {
              console.error('Failed to auto-save research:', e);
            }
            break;

          case 'error':
            setError(event.error.message);
            if (!event.error.recoverable) {
              setStatus('error');
            }
            break;
        }
      }
    },
    []
  );

  return {
    execute,
    cancel,
    reset,
    status,
    currentStage,
    subQueries,
    sourcesFound,
    sourcesKept,
    reportText,
    metadata,
    costUSD,
    response,
    error,
  };
}
