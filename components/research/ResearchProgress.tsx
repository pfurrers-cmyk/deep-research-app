// components/research/ResearchProgress.tsx — Indicador de progresso multi-etapa
'use client';

import { CheckCircle2, Circle, Loader2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { APP_CONFIG } from '@/config/defaults';
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
  'post-processing',
  'complete',
] as const;

function StageIcon({ status }: { status: 'pending' | 'running' | 'completed' | 'error' }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
}

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
  const [showDetails, setShowDetails] = useState(true);
  const { strings } = APP_CONFIG;
  const progress = currentStage?.progress ?? 0;

  return (
    <div className="w-full space-y-4 rounded-xl border border-border bg-card p-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {currentStage?.message ?? 'Iniciando...'}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progress * 100, 2)}%` }}
          />
        </div>
      </div>

      {/* Toggle details */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        {showDetails ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        Detalhes
      </button>

      {showDetails && (
        <div className="space-y-3">
          {/* Pipeline stages */}
          <div className="space-y-1.5">
            {PIPELINE_STAGES.filter((s) => s !== 'complete').map((stageName) => {
              const stageStatus = getStageStatus(stageName, currentStage);
              const label =
                (strings.stages as Record<string, string>)[stageName] ??
                stageName;
              return (
                <div
                  key={stageName}
                  className="flex items-center gap-2 text-sm"
                >
                  <StageIcon status={stageStatus} />
                  <span
                    className={
                      stageStatus === 'running'
                        ? 'font-medium text-foreground'
                        : stageStatus === 'completed'
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/50'
                    }
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 border-t border-border pt-3 text-sm">
            {subQueries.length > 0 && (
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {subQueries.length}
                </span>{' '}
                sub-queries
              </div>
            )}
            {sourcesFound > 0 && (
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {sourcesFound}
                </span>{' '}
                {strings.labels.sources} encontradas
              </div>
            )}
            {sourcesKept > 0 && (
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {sourcesKept}
                </span>{' '}
                {strings.labels.sources} selecionadas
              </div>
            )}
            {costUSD > 0 && (
              <div className="text-muted-foreground">
                {strings.labels.actualCost}:{' '}
                <span className="font-medium text-foreground">
                  ${costUSD.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Sub-queries list */}
          {subQueries.length > 0 && (
            <div className="space-y-1 border-t border-border pt-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Sub-queries geradas
              </p>
              <ul className="space-y-1">
                {subQueries.map((sq) => (
                  <li key={sq.id} className="text-sm text-muted-foreground">
                    <span className="mr-1.5 text-primary">›</span>
                    {sq.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
