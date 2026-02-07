// components/research/ResearchProgress.tsx — Reasoning chain + progress indicator
'use client';

import { CheckCircle2, Loader2, XCircle, ChevronDown, BrainCircuit } from 'lucide-react';
import { useState } from 'react';
import { APP_CONFIG } from '@/config/defaults';
import { cn } from '@/lib/utils';
import type { SubQuery } from '@/lib/research/types';

interface StageInfo {
  stage: string;
  status: string;
  progress: number;
  message: string;
}

interface ResearchProgressProps {
  currentStage: StageInfo | null;
  subQueries: SubQuery[];
  sourcesFound: number;
  sourcesKept: number;
  costUSD: number;
}

const PIPELINE_STAGES = [
  'decomposing',
  'searching',
  'evaluating',
  'extracting',
  'synthesizing',
  'map-batch',
  'reduce',
  'enrich',
  'verify',
  'post-processing',
  'complete',
] as const;

const EXTENDED_STAGES = new Set(['map-batch', 'reduce', 'enrich', 'verify']);

const statusIcons = {
  pending: <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />,
  running: <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />,
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-success/70" />,
  error: <XCircle className="w-3.5 h-3.5 text-destructive/70" />,
};

function getStageStatus(
  stageName: string,
  currentStage: StageInfo | null
): 'pending' | 'running' | 'completed' | 'error' {
  if (!currentStage) return 'pending';
  if (currentStage.stage === stageName) {
    return currentStage.status as 'running' | 'completed' | 'error';
  }
  const currentIdx = PIPELINE_STAGES.indexOf(
    currentStage.stage as (typeof PIPELINE_STAGES)[number]
  );
  const stageIdx = PIPELINE_STAGES.indexOf(
    stageName as (typeof PIPELINE_STAGES)[number]
  );
  if (currentIdx > stageIdx) return 'completed';
  return 'pending';
}

export function ResearchProgress({
  currentStage,
  subQueries,
  sourcesFound,
  sourcesKept,
  costUSD,
}: ResearchProgressProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { strings } = APP_CONFIG;
  const progress = currentStage?.progress ?? 0;
  const isStreaming = currentStage?.status === 'running';

  const completedCount = PIPELINE_STAGES.filter(
    (s) => s !== 'complete' && getStageStatus(s, currentStage) === 'completed'
  ).length;
  const totalStages = PIPELINE_STAGES.length - 1;

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border/50 bg-muted/20 overflow-hidden relative',
        isStreaming && 'border-primary/20'
      )}
      role="region"
      aria-label="Cadeia de raciocínio da IA"
    >
      {isStreaming && (
        <div className="absolute inset-0 rounded-xl border border-primary/30 animate-pulse pointer-events-none" />
      )}

      {/* Progress bar (thin) */}
      <div className="h-1 w-full bg-muted/50">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progress * 100, 2)}%` }}
        />
      </div>

      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors z-10 relative"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className={cn('w-4 h-4', isStreaming && 'animate-pulse text-primary')} />
          <span>
            Cadeia de Raciocínio
            <span className="text-xs ml-1 opacity-60">
              ({completedCount}/{totalStages} etapas)
            </span>
          </span>
          {currentStage?.message && (
            <span className="text-xs text-primary/70 hidden sm:inline">
              — {currentStage.message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums">{Math.round(progress * 100)}%</span>
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', isOpen && 'rotate-180')} />
        </div>
      </button>

      {/* Collapsible details */}
      {isOpen && (
        <div className="border-t border-border/30">
          <div className="p-3 space-y-1.5 font-mono text-xs max-h-[400px] overflow-y-auto">
            {/* Pipeline stages */}
            {PIPELINE_STAGES.filter((s) => s !== 'complete').map((stageName) => {
              const stageStatus = getStageStatus(stageName, currentStage);
              // Hide extended stages if they haven't been activated
              if (EXTENDED_STAGES.has(stageName) && stageStatus === 'pending') return null;
              const extendedLabels: Record<string, string> = {
                'map-batch': 'MAP: Processando batches',
                'reduce': 'REDUCE: Sintetizando resumos',
                'enrich': 'Enriquecimento iterativo',
                'verify': 'Verificação cruzada',
              };
              const label = extendedLabels[stageName]
                ?? (strings.stages as Record<string, string>)[stageName]
                ?? stageName;
              return (
                <div key={stageName} className={cn("flex gap-2.5 items-start", EXTENDED_STAGES.has(stageName) && "pl-4")}>
                  <div className="mt-0.5 min-w-[16px] flex justify-center">
                    {statusIcons[stageStatus]}
                  </div>
                  <div
                    className={cn(
                      'flex-1 transition-colors leading-relaxed',
                      stageStatus === 'running' && 'text-foreground',
                      stageStatus === 'completed' && 'text-muted-foreground',
                      stageStatus === 'error' && 'text-destructive/80 line-through',
                      stageStatus === 'pending' && 'text-muted-foreground/50'
                    )}
                  >
                    {label}
                    {stageStatus === 'running' && currentStage?.message && (
                      <span className="text-primary/60 ml-1.5">
                        — {currentStage.message}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Sub-queries inline */}
            {subQueries.length > 0 && (
              <div className="pl-[26px] space-y-0.5 mt-1">
                {subQueries.map((sq) => (
                  <div key={sq.id} className="text-muted-foreground/70">
                    <span className="text-primary/50">›</span> {sq.text}
                  </div>
                ))}
              </div>
            )}

            {/* Streaming cursor */}
            {isStreaming && (
              <div className="flex gap-2 items-center text-primary/70 pl-[26px] mt-2">
                <span className="w-0.5 h-4 bg-primary/50 rounded-full animate-pulse" />
                <span>Processando...</span>
              </div>
            )}
          </div>

          {/* Stats footer */}
          <div className="flex flex-wrap gap-4 px-3 py-2.5 border-t border-border/30 text-xs text-muted-foreground">
            {subQueries.length > 0 && (
              <span>
                <span className="font-medium text-foreground">{subQueries.length}</span> sub-queries
              </span>
            )}
            {sourcesFound > 0 && (
              <span>
                <span className="font-medium text-foreground">{sourcesFound}</span> fontes encontradas
              </span>
            )}
            {sourcesKept > 0 && (
              <span>
                <span className="font-medium text-foreground">{sourcesKept}</span> fontes selecionadas
              </span>
            )}
            {costUSD > 0 && (
              <span>
                Custo: <span className="font-medium text-foreground">${costUSD.toFixed(4)}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ARIA live region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic={false}>
        {currentStage && (
          <span>
            Etapa {completedCount + 1} de {totalStages}: {currentStage.message}
          </span>
        )}
      </div>
    </div>
  );
}
