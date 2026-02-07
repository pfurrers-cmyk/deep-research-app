'use client';

import { useState, lazy, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { Settings, RotateCcw, Save, Check, Sparkles } from 'lucide-react';
import { APP_CONFIG, type DepthPreset } from '@/config/defaults';
import { useSettings } from '@/hooks/useSettings';
import { MODELS } from '@/config/models';
import { resolveProcessingMode, getAbsoluteMaxSources, getModeOverhead } from '@/config/model-source-limits';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { ModelSelector } from '@/components/ui/model-selector';
import { CostEstimator } from '@/components/ui/cost-estimator';
import { LogViewer } from '@/components/debug/LogViewer';
const ProConfigPanel = lazy(() => import('@/components/pro/ProConfigPanel').then(m => ({ default: m.ProConfigPanel })));
const TemplateManager = lazy(() => import('@/components/pro/TemplateManager').then(m => ({ default: m.TemplateManager })));
import { BUILD_INFO } from '@/lib/buildInfo';

export default function SettingsPage() {
  const { prefs, loaded, update, reset } = useSettings();
  const { theme: currentTheme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  // Local form state seeded from prefs
  const [defaultDepth, setDefaultDepth] = useState<DepthPreset>(prefs.defaultDepth);
  const [modelPreference, setModelPreference] = useState<string>(prefs.modelPreference);
  const [outputLanguage, setOutputLanguage] = useState(prefs.outputLanguage);
  const [defaultTheme, setDefaultTheme] = useState<string>(prefs.defaultTheme);
  const [stageModels, setStageModels] = useState(prefs.stageModels);
  const [customPrompts, setCustomPrompts] = useState(prefs.customPrompts);
  const [sourceConfig, setSourceConfig] = useState(prefs.sourceConfig);

  // Sync when loaded changes (first mount)
  const [synced, setSynced] = useState(false);
  if (loaded && !synced) {
    setDefaultDepth(prefs.defaultDepth);
    setModelPreference(prefs.modelPreference);
    setOutputLanguage(prefs.outputLanguage);
    setDefaultTheme(prefs.defaultTheme);
    setStageModels(prefs.stageModels);
    setCustomPrompts(prefs.customPrompts);
    setSourceConfig(prefs.sourceConfig);
    setSynced(true);
  }

  const handleSave = () => {
    update({
      defaultDepth,
      modelPreference: modelPreference as 'auto' | 'economy' | 'premium' | 'custom',
      outputLanguage,
      defaultTheme: defaultTheme as 'dark' | 'light' | 'system',
      stageModels,
      customPrompts,
      sourceConfig,
    });
    // Apply theme immediately
    setTheme(defaultTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    reset();
    setDefaultDepth('normal');
    setModelPreference('auto');
    setOutputLanguage('pt-BR');
    setDefaultTheme('dark');
    setStageModels({ decomposition: 'auto', evaluation: 'auto', synthesis: 'auto' });
    setCustomPrompts({ decomposition: '', evaluation: '', synthesis: '' });
    setSourceConfig({ mode: 'auto', fetchMin: 5, fetchMax: 50, keepMin: 3, keepMax: 20 });
    setTheme('dark');
    setSaved(false);
  };

  if (!loaded) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-6 w-40 rounded bg-muted animate-pulse" />
              <div className="h-4 w-64 rounded bg-muted animate-pulse" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/30 p-5 space-y-3">
              <div className="h-5 w-1/3 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="h-4 w-2/3 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
              <div className="space-y-2 pt-2">
                <div className="h-10 w-full rounded-lg bg-muted animate-pulse" style={{ animationDelay: `${i * 100 + 100}ms` }} />
                <div className="h-10 w-full rounded-lg bg-muted animate-pulse" style={{ animationDelay: `${i * 100 + 150}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold">Configurações</h1>
              <p className="text-sm text-muted-foreground">
                Personalize o comportamento padrão da pesquisa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar
            </Button>
            <Button size="sm" onClick={handleSave}>
              {saved ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick navigation TOC */}
        <nav className="sticky top-14 z-30 -mx-1 flex flex-wrap gap-1 rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm p-2" aria-label="Navegação rápida das configurações">
          {[
            { id: 'sec-pesquisa', label: 'Pesquisa' },
            { id: 'sec-modelos', label: 'Modelos' },
            { id: 'sec-prompts', label: 'Prompts' },
            { id: 'sec-fontes', label: 'Fontes' },
            { id: 'sec-aparencia', label: 'Aparência' },
            { id: 'sec-pro', label: 'PRO' },
            { id: 'sec-templates', label: 'Templates' },
            { id: 'sec-sobre', label: 'Sobre' },
            { id: 'sec-debug', label: 'Logs' },
          ].map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Pesquisa */}
        <Card id="sec-pesquisa">
          <CardHeader>
            <CardTitle>Pesquisa</CardTitle>
            <CardDescription>
              Configurações padrão para novas pesquisas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Profundidade padrão</label>
              <Select
                value={defaultDepth}
                onChange={(e) => setDefaultDepth(e.target.value as DepthPreset)}
                options={Object.entries(APP_CONFIG.depth.presets).map(([key, p]) => ({
                  value: key,
                  label: `${p.icon} ${p.label} (~${p.estimatedTimeSeconds < 60 ? `${p.estimatedTimeSeconds}s` : `${Math.round(p.estimatedTimeSeconds / 60)}min`})`,
                }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preferência de modelo</label>
              <Select
                value={modelPreference}
                onChange={(e) => setModelPreference(e.target.value)}
                options={[
                  { value: 'auto', label: 'Automático (baseado na profundidade)' },
                  { value: 'economy', label: 'Econômico (modelos mais baratos)' },
                  { value: 'premium', label: 'Premium (modelos mais capazes)' },
                  { value: 'custom', label: 'Customizado (seleção por fase)' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Idioma do relatório</label>
              <Select
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value)}
                options={[
                  { value: 'pt-BR', label: 'Português (Brasil)' },
                  { value: 'en-US', label: 'English (US)' },
                  { value: 'es', label: 'Español' },
                  { value: 'fr', label: 'Français' },
                  { value: 'de', label: 'Deutsch' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modelos por Fase */}
        <Card id="sec-modelos">
          <CardHeader>
            <CardTitle>Modelos por Fase do Pipeline</CardTitle>
            <CardDescription>
              Selecione o modelo de IA específico para cada etapa da pesquisa.
              &quot;Automático&quot; usa o modelo ideal para a profundidade selecionada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ModelSelector
              label="Decomposição de Query — Gera sub-queries a partir da pergunta principal"
              value={stageModels.decomposition}
              onChange={(v) => setStageModels((s) => ({ ...s, decomposition: v }))}
            />

            <ModelSelector
              label="Avaliação de Fontes — Pontua relevância e credibilidade"
              value={stageModels.evaluation}
              onChange={(v) => setStageModels((s) => ({ ...s, evaluation: v }))}
            />

            <ModelSelector
              label="Síntese do Relatório — Gera o relatório analítico final"
              value={stageModels.synthesis}
              onChange={(v) => setStageModels((s) => ({ ...s, synthesis: v }))}
            />

            <CostEstimator
              depth={defaultDepth}
              decompositionModel={stageModels.decomposition}
              evaluationModel={stageModels.evaluation}
              synthesisModel={stageModels.synthesis}
            />

            <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              Total de {MODELS.length} modelos disponíveis via Vercel AI Gateway.
              Use os filtros e a busca para encontrar o modelo ideal.
            </p>
          </CardContent>
        </Card>

        {/* Prompts Customizáveis */}
        <Card id="sec-prompts">
          <CardHeader>
            <CardTitle>Prompts Customizáveis</CardTitle>
            <CardDescription>
              Personalize as instruções do sistema para cada fase do pipeline.
              Deixe em branco para usar o prompt padrão otimizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt de Decomposição</label>
              <textarea
                value={customPrompts.decomposition}
                onChange={(e) => setCustomPrompts((p) => ({ ...p, decomposition: e.target.value }))}
                placeholder="Instruções customizadas para decomposição de queries... (vazio = padrão)"
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt de Avaliação</label>
              <textarea
                value={customPrompts.evaluation}
                onChange={(e) => setCustomPrompts((p) => ({ ...p, evaluation: e.target.value }))}
                placeholder="Instruções customizadas para avaliação de fontes... (vazio = padrão)"
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt de Síntese</label>
              <textarea
                value={customPrompts.synthesis}
                onChange={(e) => setCustomPrompts((p) => ({ ...p, synthesis: e.target.value }))}
                placeholder="Instruções customizadas para síntese do relatório... (vazio = padrão)"
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              Dica: envie os prompts padrão a uma IA externa para obter versões otimizadas, depois cole o resultado aqui.
            </p>
          </CardContent>
        </Card>

        {/* Fontes */}
        <Card id="sec-fontes">
          <CardHeader>
            <CardTitle>Fontes</CardTitle>
            <CardDescription>
              Controle quantas fontes são buscadas e selecionadas em cada pesquisa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Modo</label>
              <div className="flex rounded-lg border border-input">
                <button
                  type="button"
                  onClick={() => setSourceConfig((s) => ({ ...s, mode: 'auto' }))}
                  className={`px-3 py-1.5 text-sm transition-colors ${sourceConfig.mode === 'auto' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Automático
                </button>
                <button
                  type="button"
                  onClick={() => setSourceConfig((s) => ({ ...s, mode: 'manual' }))}
                  className={`border-l border-input px-3 py-1.5 text-sm transition-colors ${sourceConfig.mode === 'manual' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Manual
                </button>
              </div>
            </div>

            {sourceConfig.mode === 'manual' && (() => {
              const synthModelId = stageModels.synthesis !== 'auto'
                ? stageModels.synthesis
                : APP_CONFIG.depth.presets[defaultDepth].synthesisModel;
              const absMax = getAbsoluteMaxSources(synthModelId);
              const { mode: resolvedMode } = resolveProcessingMode(synthModelId, sourceConfig.fetchMax, sourceConfig.keepMax);
              const modeInfo = getModeOverhead(resolvedMode);
              const badgeColors: Record<string, string> = {
                green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              };
              return (
                <div className="space-y-4 rounded-lg border border-border/50 bg-muted/10 p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColors[modeInfo.color] ?? badgeColors.green}`}
                      title={modeInfo.description}>
                      {resolvedMode === 'base' ? '⚡' : resolvedMode === 'extended' ? '🔀' : '🔄'} {modeInfo.labelShort}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ~{modeInfo.costMultiplier}× custo · ~{modeInfo.latencyMultiplier}× tempo
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Fontes a buscar</span>
                      <span className="font-mono text-muted-foreground">{sourceConfig.fetchMin}–{sourceConfig.fetchMax}
                        <span className="text-xs opacity-60"> / máx {absMax.maxSearch}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8">Mín</span>
                      <input type="range" min={1} max={sourceConfig.fetchMax} value={sourceConfig.fetchMin}
                        onChange={(e) => setSourceConfig((s) => ({ ...s, fetchMin: Number(e.target.value) }))}
                        className="flex-1 accent-primary" />
                      <span className="text-xs text-muted-foreground w-8">Máx</span>
                      <input type="range" min={sourceConfig.fetchMin} max={absMax.maxSearch} value={Math.min(sourceConfig.fetchMax, absMax.maxSearch)}
                        onChange={(e) => setSourceConfig((s) => ({ ...s, fetchMax: Number(e.target.value) }))}
                        className="flex-1 accent-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Fontes a selecionar (pós-avaliação)</span>
                      <span className="font-mono text-muted-foreground">{sourceConfig.keepMin}–{sourceConfig.keepMax}
                        <span className="text-xs opacity-60"> / máx {absMax.maxSelect}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8">Mín</span>
                      <input type="range" min={1} max={sourceConfig.keepMax} value={sourceConfig.keepMin}
                        onChange={(e) => setSourceConfig((s) => ({ ...s, keepMin: Number(e.target.value) }))}
                        className="flex-1 accent-primary" />
                      <span className="text-xs text-muted-foreground w-8">Máx</span>
                      <input type="range" min={sourceConfig.keepMin} max={absMax.maxSelect} value={Math.min(sourceConfig.keepMax, absMax.maxSelect)}
                        onChange={(e) => setSourceConfig((s) => ({ ...s, keepMax: Number(e.target.value) }))}
                        className="flex-1 accent-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No modo manual, o pipeline respeitará os limites definidos independente da profundidade. Limites máximos baseados no modelo de síntese: <strong>{synthModelId.split('/')[1]}</strong>.
                  </p>
                </div>
              );
            })()}

            {sourceConfig.mode === 'auto' && (
              <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                No modo automático, a quantidade de fontes é determinada pela profundidade selecionada (Rápida: 8, Normal: 15, Profunda: 30, Exaustiva: 50). O modo de processamento (direto, map-reduce ou iterativo) é resolvido automaticamente.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card id="sec-aparencia">
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Tema e preferências visuais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tema</label>
              <Select
                value={currentTheme ?? defaultTheme}
                onChange={(e) => { setDefaultTheme(e.target.value); setTheme(e.target.value); }}
                options={[
                  { value: 'dark', label: 'Escuro' },
                  { value: 'light', label: 'Claro' },
                  { value: 'system', label: 'Sistema' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prompt Reverso PRO */}
        <Card id="sec-pro">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Prompt Reverso PRO</CardTitle>
                <CardDescription>Estilo, detalhe, citação, framework, modo, seções, filtros e exportação</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-muted" />}>
              <ProConfigPanel />
            </Suspense>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card id="sec-templates">
          <CardHeader>
            <CardTitle>Templates de Pesquisa</CardTitle>
            <CardDescription>Salve e reutilize configurações PRO completas</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-muted" />}>
              <TemplateManager />
            </Suspense>
          </CardContent>
        </Card>

        {/* Sobre */}
        <Card id="sec-sobre">
          <CardHeader>
            <CardTitle>Sobre</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Versão</dt>
                <dd className="font-mono">{BUILD_INFO.version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Framework</dt>
                <dd className="font-mono">Next.js 16.1 + AI SDK 6</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Modelos disponíveis</dt>
                <dd className="font-mono">{MODELS.length} via AI Gateway</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Armazenamento</dt>
                <dd className="font-mono">IndexedDB + localStorage</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Debug Logs */}
        <div id="sec-debug">
          <LogViewer />
        </div>
      </div>
    </div>
  );
}
