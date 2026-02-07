// hooks/useResearch.ts — Hook que lê do TaskManager singleton (persiste entre navegações)
'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { DepthPreset, DomainPreset } from '@/config/defaults';
import { taskManager, type ResearchTaskState, type TaskStatus } from '@/lib/store/task-manager';
import type { ResearchAttachment } from '@/lib/research/types';

export type ResearchStatus = TaskStatus;

interface UseResearchReturn {
  execute: (
    query: string,
    depth: DepthPreset,
    domainPreset?: DomainPreset | null,
    attachments?: ResearchAttachment[]
  ) => void;
  cancel: () => void;
  reset: () => void;
  status: ResearchStatus;
  currentStage: ResearchTaskState['currentStage'];
  subQueries: ResearchTaskState['subQueries'];
  sourcesFound: number;
  sourcesKept: number;
  reportText: string;
  metadata: ResearchTaskState['metadata'];
  costUSD: number;
  response: ResearchTaskState['response'];
  error: string | null;
}

export function useResearch(): UseResearchReturn {
  const state = useSyncExternalStore(
    taskManager.subscribe,
    taskManager.getResearchSnapshot,
    taskManager.getResearchSnapshot
  );

  const execute = useCallback(
    (query: string, depth: DepthPreset, domainPreset?: DomainPreset | null, attachments?: ResearchAttachment[]) => {
      taskManager.executeResearch(query, depth, domainPreset, attachments);
    },
    []
  );

  const cancel = useCallback(() => taskManager.cancelResearch(), []);
  const reset = useCallback(() => taskManager.resetResearch(), []);

  return {
    execute,
    cancel,
    reset,
    status: state.status,
    currentStage: state.currentStage,
    subQueries: state.subQueries,
    sourcesFound: state.sourcesFound,
    sourcesKept: state.sourcesKept,
    reportText: state.reportText,
    metadata: state.metadata,
    costUSD: state.costUSD,
    response: state.response,
    error: state.error,
  };
}
