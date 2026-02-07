// components/ui/cost-estimator.tsx — Live cost preview calculator
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { getModelById } from '@/config/models';
import { APP_CONFIG, type DepthPreset } from '@/config/defaults';

interface CostEstimatorProps {
  depth: DepthPreset;
  decompositionModel: string;
  evaluationModel: string;
  synthesisModel: string;
  className?: string;
}

interface StageCost {
  stage: string;
  modelId: string;
  modelName: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  costUSD: number;
}

function resolveModelId(stageModel: string, depth: DepthPreset, stage: 'decomposition' | 'evaluation' | 'synthesis'): string {
  if (stageModel !== 'auto') return stageModel;
  const preset = APP_CONFIG.depth.presets[depth];
  if (!preset) return 'google/gemini-2.5-flash';
  // Auto selection based on depth
  const map: Record<string, Record<DepthPreset, string>> = {
    decomposition: {
      rapida: 'google/gemini-2.5-flash-lite',
      normal: 'openai/gpt-4.1-mini',
      profunda: 'openai/gpt-4.1',
      exaustiva: 'anthropic/claude-sonnet-4.5',
    },
    evaluation: {
      rapida: 'google/gemini-2.5-flash-lite',
      normal: 'google/gemini-2.5-flash',
      profunda: 'openai/gpt-4.1-mini',
      exaustiva: 'openai/gpt-4.1',
    },
    synthesis: {
      rapida: 'google/gemini-2.5-flash',
      normal: 'openai/gpt-4.1',
      profunda: 'anthropic/claude-sonnet-4.5',
      exaustiva: 'anthropic/claude-opus-4.6',
    },
  };
  return map[stage]?.[depth] ?? 'google/gemini-2.5-flash';
}

function estimateTokens(depth: DepthPreset, stage: 'decomposition' | 'evaluation' | 'synthesis'): { input: number; output: number } {
  const preset = APP_CONFIG.depth.presets[depth];
  const subQueries = preset?.subQueries ?? 5;
  const maxSources = preset?.maxSources ?? 15;

  switch (stage) {
    case 'decomposition':
      return { input: 800 + 200, output: subQueries * 120 };
    case 'evaluation':
      return { input: 1000 + maxSources * 600, output: maxSources * 80 };
    case 'synthesis':
      return { input: 1500 + maxSources * 1500, output: preset?.maxSources ? maxSources * 400 : 4000 };
    default:
      return { input: 1000, output: 1000 };
  }
}

function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getModelById(modelId);
  if (!model) return 0;
  return (inputTokens / 1_000_000) * model.inputPricePer1M + (outputTokens / 1_000_000) * model.outputPricePer1M;
}

export function CostEstimator({ depth, decompositionModel, evaluationModel, synthesisModel, className }: CostEstimatorProps) {
  const stages = useMemo((): StageCost[] => {
    const stageConfigs: { stage: string; key: 'decomposition' | 'evaluation' | 'synthesis'; modelSetting: string }[] = [
      { stage: 'Decomposição', key: 'decomposition', modelSetting: decompositionModel },
      { stage: 'Avaliação', key: 'evaluation', modelSetting: evaluationModel },
      { stage: 'Síntese', key: 'synthesis', modelSetting: synthesisModel },
    ];

    return stageConfigs.map(({ stage, key, modelSetting }) => {
      const resolvedId = resolveModelId(modelSetting, depth, key);
      const model = getModelById(resolvedId);
      const tokens = estimateTokens(depth, key);
      const cost = calculateCost(resolvedId, tokens.input, tokens.output);

      return {
        stage,
        modelId: resolvedId,
        modelName: model?.name ?? resolvedId,
        estimatedInputTokens: tokens.input,
        estimatedOutputTokens: tokens.output,
        costUSD: cost,
      };
    });
  }, [depth, decompositionModel, evaluationModel, synthesisModel]);

  const searchCost = useMemo(() => {
    const preset = APP_CONFIG.depth.presets[depth];
    const subQueries = preset?.subQueries ?? 5;
    return subQueries * 0.005;
  }, [depth]);

  const totalCost = stages.reduce((sum, s) => sum + s.costUSD, 0) + searchCost;

  const prevCostRef = useRef(totalCost);
  const [highlight, setHighlight] = useState(false);
  useEffect(() => {
    if (prevCostRef.current !== totalCost) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 800);
      prevCostRef.current = totalCost;
      return () => clearTimeout(t);
    }
  }, [totalCost]);

  return (
    <div className={className}>
      <div className={`rounded-lg border bg-muted/30 p-3 space-y-2 transition-colors duration-500 ${highlight ? 'border-primary/60 bg-primary/5' : 'border-border'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <DollarSign className="h-3.5 w-3.5" />
            Custo Estimado
          </div>
          <div className={`text-lg font-bold transition-colors duration-500 ${highlight ? 'text-primary' : 'text-foreground'}`}>
            ${totalCost.toFixed(4)}
          </div>
        </div>

        <div className="space-y-1">
          {stages.map((s) => (
            <div key={s.stage} className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{s.stage}</span>
                <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">{s.modelId.split('/')[1]}</span>
              </div>
              <div className="flex items-center gap-2 pl-0 sm:pl-0">
                <span className="text-[10px] text-muted-foreground">{(s.estimatedInputTokens / 1000).toFixed(1)}K in · {(s.estimatedOutputTokens / 1000).toFixed(1)}K out</span>
                <span className="font-medium">${s.costUSD.toFixed(4)}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Busca Web</span>
            <span className="font-medium">${searchCost.toFixed(4)}</span>
          </div>
        </div>

        {totalCost > 0.50 && (
          <div className="flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Custo alto — considere modelos mais econômicos
          </div>
        )}
      </div>
    </div>
  );
}
