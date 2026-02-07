'use client';

import { useState, useRef } from 'react';
import { Swords, Plus, Trash2, Play, Loader2, Clock, DollarSign, FileText } from 'lucide-react';
import { APP_CONFIG, type DepthPreset } from '@/config/defaults';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { ModelSelector } from '@/components/ui/model-selector';
import { CostEstimator } from '@/components/ui/cost-estimator';
import { MarkdownRenderer } from '@/components/research/MarkdownRenderer';

interface ArenaConfig {
  id: string;
  label: string;
  decompositionModel: string;
  evaluationModel: string;
  synthesisModel: string;
  depth: DepthPreset;
}

interface ArenaResult {
  configId: string;
  label: string;
  reportText: string;
  durationMs: number;
  sourcesKept: number;
  modelsUsed: string[];
  costUSD: number;
  reportLength: number;
  error?: string;
}

interface ArenaComparison {
  query: string;
  totalDurationMs: number;
  results: ArenaResult[];
  winner: string | null;
}

const defaultConfig = (id: string, label: string): ArenaConfig => ({
  id,
  label,
  decompositionModel: 'auto',
  evaluationModel: 'auto',
  synthesisModel: 'auto',
  depth: 'normal',
});

export default function ArenaPage() {
  const [query, setQuery] = useState('');
  const [configs, setConfigs] = useState<ArenaConfig[]>([
    defaultConfig('a', 'Configuração A'),
    { ...defaultConfig('b', 'Configuração B'), depth: 'profunda' as DepthPreset },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [stageStatus, setStageStatus] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<Record<string, string>>({});
  const [comparison, setComparison] = useState<ArenaComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const depthOptions = Object.entries(APP_CONFIG.depth.presets).map(([key, p]) => ({
    value: key,
    label: `${p.icon} ${p.label}`,
  }));

  const canAddConfig = configs.length < 3;
  const canRemoveConfig = configs.length > 2;

  const addConfig = () => {
    if (!canAddConfig) return;
    const labels = ['A', 'B', 'C'];
    const id = labels[configs.length].toLowerCase();
    setConfigs([...configs, defaultConfig(id, `Configuração ${labels[configs.length]}`)]);
  };

  const removeConfig = (idx: number) => {
    if (!canRemoveConfig) return;
    setConfigs(configs.filter((_, i) => i !== idx));
  };

  const updateConfig = (idx: number, partial: Partial<ArenaConfig>) => {
    setConfigs(configs.map((c, i) => (i === idx ? { ...c, ...partial } : c)));
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  };

  const handleRun = async () => {
    if (!query.trim() || isRunning) return;
    setIsRunning(true);
    setStageStatus({});
    setReports({});
    setComparison(null);
    setError(null);
    setActiveTab(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), configs }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error ?? `HTTP ${res.status}`);
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
            const event = JSON.parse(data);

            if (event.type === 'arena-stage') {
              setStageStatus((prev) => ({
                ...prev,
                [event.data.configId]: event.data.message ?? event.data.stage,
              }));
            }

            if (event.type === 'arena-results') {
              const reps: Record<string, string> = {};
              for (const r of event.data.reports) {
                reps[r.configId] = r.reportText || r.error || 'Sem resultado';
              }
              setReports(reps);
              setActiveTab(event.data.reports[0]?.configId ?? null);
            }

            if (event.type === 'arena-complete') {
              setComparison(event.data);
            }

            if (event.type === 'error') {
              setError(event.error?.message ?? 'Erro na arena');
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Swords className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Arena de IAs</h1>
            <p className="text-sm text-muted-foreground">
              Compare até 3 configurações de modelos rodando a mesma pesquisa simultaneamente
            </p>
          </div>
        </div>

        {/* Query Input */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt da Pesquisa</CardTitle>
            <CardDescription>
              O mesmo prompt será usado para todas as configurações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Quais são os avanços mais significativos em computação quântica em 2025-2026?"
              rows={3}
              disabled={isRunning}
              className="w-full resize-none rounded-lg border border-input bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {canAddConfig && !isRunning && (
                  <Button variant="outline" size="sm" onClick={addConfig}>
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Config ({configs.length}/3)
                  </Button>
                )}
              </div>
              {isRunning ? (
                <Button variant="destructive" onClick={handleCancel}>
                  Cancelar
                </Button>
              ) : (
                <Button onClick={handleRun} disabled={!query.trim()} title={!query.trim() ? 'Digite um prompt para iniciar' : undefined}>
                  <Play className="h-4 w-4" />
                  Iniciar Arena
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurations Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {configs.map((config, idx) => (
            <Card key={config.id} className={comparison?.winner === config.id ? 'border-green-500/50 ring-1 ring-green-500/30' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {config.label}
                    {comparison?.winner === config.id && (
                      <span className="ml-2 text-xs text-green-400">🏆 Vencedor</span>
                    )}
                  </CardTitle>
                  {canRemoveConfig && !isRunning && (
                    <button
                      onClick={() => removeConfig(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {/* Stage status during execution */}
                {isRunning && stageStatus[config.id] && (
                  <p className="flex items-center gap-1.5 text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {stageStatus[config.id]}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Profundidade</label>
                  <Select
                    value={config.depth}
                    onChange={(e) => updateConfig(idx, { depth: e.target.value as DepthPreset })}
                    options={depthOptions}
                    disabled={isRunning}
                  />
                </div>
                <ModelSelector
                  label="Decomposição"
                  value={config.decompositionModel}
                  onChange={(v) => updateConfig(idx, { decompositionModel: v })}
                  disabled={isRunning}
                  showRecommendations={false}
                />
                <ModelSelector
                  label="Avaliação"
                  value={config.evaluationModel}
                  onChange={(v) => updateConfig(idx, { evaluationModel: v })}
                  disabled={isRunning}
                  showRecommendations={false}
                />
                <ModelSelector
                  label="Síntese"
                  value={config.synthesisModel}
                  onChange={(v) => updateConfig(idx, { synthesisModel: v })}
                  disabled={isRunning}
                  showRecommendations={false}
                />
                <CostEstimator
                  depth={config.depth}
                  decompositionModel={config.decompositionModel}
                  evaluationModel={config.evaluationModel}
                  synthesisModel={config.synthesisModel}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Comparative Report */}
        {comparison && (
          <Card>
            <CardHeader>
              <CardTitle>Relatório Comparativo</CardTitle>
              <CardDescription>
                Duração total: {(comparison.totalDurationMs / 1000).toFixed(1)}s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Config</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Duração</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Fontes</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Custo</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Tamanho</th>
                      <th className="pb-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.results.map((r) => (
                      <tr key={r.configId} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">
                          {r.label}
                          {comparison.winner === r.configId && ' 🏆'}
                        </td>
                        <td className="py-2 pr-4">{(r.durationMs / 1000).toFixed(1)}s</td>
                        <td className="py-2 pr-4">{r.sourcesKept}</td>
                        <td className="py-2 pr-4">${r.costUSD.toFixed(3)}</td>
                        <td className="py-2 pr-4">{r.reportLength.toLocaleString()} chars</td>
                        <td className="py-2">
                          {r.error ? (
                            <span className="text-destructive">Erro</span>
                          ) : (
                            <span className="text-green-400">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Tabs */}
        {Object.keys(reports).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border">
              {configs.map((c) =>
                reports[c.id] ? (
                  <button
                    key={c.id}
                    onClick={() => setActiveTab(c.id)}
                    className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === c.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                ) : null
              )}
            </div>
            {activeTab && reports[activeTab] && (
              <Card>
                <CardContent className="py-6">
                  <MarkdownRenderer content={reports[activeTab]} totalSources={0} />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
