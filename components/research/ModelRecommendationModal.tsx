// components/research/ModelRecommendationModal.tsx — Modal de recomendação de modelos IA
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, X, DollarSign, Clock, Cpu, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TierRecommendation {
  tier: string;
  label: string;
  icon: string;
  description: string;
  models: Record<string, string>;
  costEstimate: { costUSD: number; breakdown: Record<string, number> };
  reasoning: string;
  estimatedTimeSeconds: number;
}

interface ModelRecommendationModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (models: Record<string, string>) => void;
  onSkip: () => void;
  prompt: string;
  depth: string;
  domain: string | null;
}

export function ModelRecommendationModal({
  open, onClose, onSelect, onSkip, prompt, depth, domain,
}: ModelRecommendationModalProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState('');
  const [tiers, setTiers] = useState<TierRecommendation[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    setTiers([]);
    setAnalysis('');

    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, depth, domain }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAnalysis(data.analysis);
        setTiers(data.tiers);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar recomendações'))
      .finally(() => setLoading(false));
  }, [open, prompt, depth, domain]);

  if (!open) return null;

  const STAGE_LABELS: Record<string, string> = {
    decomposition: 'Decomposição',
    evaluation: 'Avaliação',
    synthesis: 'Síntese',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 rounded p-1 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Configuração Recomendada por IA</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Analisando seu prompt...</p>
              <p className="text-xs text-muted-foreground">A IA está avaliando a complexidade e recomendando configurações ideais</p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border/30 p-4 space-y-3">
                  <div className="h-5 w-24 rounded animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                  <div className="h-4 w-full rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                  <div className="h-16 w-full rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 100}ms` }} />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={onSkip} className="mt-4">
              Seguir com pré-configurada
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Analysis */}
            {analysis && (
              <p className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">{analysis}</p>
            )}

            {/* Tier cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.tier}
                  className={`rounded-xl border p-4 space-y-3 transition-all hover:border-primary/50 ${
                    tier.tier === 'costBenefit' ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/10' : 'border-border'
                  }`}
                >
                  {/* Tier header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tier.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold">{tier.label}</h3>
                      <p className="text-[10px] text-muted-foreground">{tier.description}</p>
                    </div>
                  </div>

                  {/* Models per stage */}
                  <div className="space-y-1.5">
                    {Object.entries(tier.models).map(([stage, modelId]) => (
                      <div key={stage} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{STAGE_LABELS[stage] ?? stage}</span>
                        <span className="font-mono text-[10px]">{modelId.split('/')[1]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cost & Time */}
                  <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-1 text-xs">
                      <DollarSign className="h-3 w-3 text-green-400" />
                      <span className="font-mono font-medium">${tier.costEstimate.costUSD.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-blue-400" />
                      <span className="font-mono">~{tier.estimatedTimeSeconds}s</span>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{tier.reasoning}</p>

                  {/* Select button */}
                  <Button
                    size="sm"
                    variant={tier.tier === 'costBenefit' ? 'default' : 'outline'}
                    onClick={() => onSelect(tier.models)}
                    className="w-full"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Usar esta configuração
                  </Button>
                </div>
              ))}
            </div>

            {/* Skip button */}
            <div className="flex justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                Seguir com configuração atual
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
