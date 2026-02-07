'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Settings, RotateCcw, Save, Check } from 'lucide-react';
import { APP_CONFIG, type DepthPreset } from '@/config/defaults';
import { useSettings } from '@/hooks/useSettings';
import { MODELS, getTextModels } from '@/config/models';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

export default function SettingsPage() {
  const { prefs, loaded, update, reset } = useSettings();
  const { setTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  // Local form state seeded from prefs
  const [defaultDepth, setDefaultDepth] = useState<DepthPreset>(prefs.defaultDepth);
  const [modelPreference, setModelPreference] = useState<string>(prefs.modelPreference);
  const [outputLanguage, setOutputLanguage] = useState(prefs.outputLanguage);
  const [defaultTheme, setDefaultTheme] = useState<string>(prefs.defaultTheme);
  const [stageModels, setStageModels] = useState(prefs.stageModels);
  const [customPrompts, setCustomPrompts] = useState(prefs.customPrompts);

  // Sync when loaded changes (first mount)
  const [synced, setSynced] = useState(false);
  if (loaded && !synced) {
    setDefaultDepth(prefs.defaultDepth);
    setModelPreference(prefs.modelPreference);
    setOutputLanguage(prefs.outputLanguage);
    setDefaultTheme(prefs.defaultTheme);
    setStageModels(prefs.stageModels);
    setCustomPrompts(prefs.customPrompts);
    setSynced(true);
  }

  const textModels = getTextModels();
  const modelOptions = [
    { value: 'auto', label: '🤖 Automático (baseado na profundidade)' },
    ...textModels.map((m) => ({
      value: m.id,
      label: `${m.name} — $${m.inputPricePer1M}/$${m.outputPricePer1M} · ${(m.contextWindow / 1000).toFixed(0)}K ctx`,
    })),
  ];

  const handleSave = () => {
    update({
      defaultDepth,
      modelPreference: modelPreference as 'auto' | 'economy' | 'premium' | 'custom',
      outputLanguage,
      defaultTheme: defaultTheme as 'dark' | 'light' | 'system',
      stageModels,
      customPrompts,
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
    setTheme('dark');
    setSaved(false);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-muted-foreground">Carregando configurações...</p>
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

        {/* Pesquisa */}
        <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Modelos por Fase do Pipeline</CardTitle>
            <CardDescription>
              Selecione o modelo de IA específico para cada etapa da pesquisa.
              &quot;Automático&quot; usa o modelo ideal para a profundidade selecionada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Decomposição de Query</label>
              <p className="text-xs text-muted-foreground">
                Gera sub-queries a partir da pergunta principal
              </p>
              <Select
                value={stageModels.decomposition}
                onChange={(e) =>
                  setStageModels((s) => ({ ...s, decomposition: e.target.value }))
                }
                options={modelOptions}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Avaliação de Fontes</label>
              <p className="text-xs text-muted-foreground">
                Pontua relevância e credibilidade das fontes coletadas
              </p>
              <Select
                value={stageModels.evaluation}
                onChange={(e) =>
                  setStageModels((s) => ({ ...s, evaluation: e.target.value }))
                }
                options={modelOptions}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Síntese do Relatório</label>
              <p className="text-xs text-muted-foreground">
                Gera o relatório analítico final com citações
              </p>
              <Select
                value={stageModels.synthesis}
                onChange={(e) =>
                  setStageModels((s) => ({ ...s, synthesis: e.target.value }))
                }
                options={modelOptions}
              />
            </div>

            <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              Total de {MODELS.length} modelos disponíveis via Vercel AI Gateway.
              Modelos com custo mais alto tendem a produzir relatórios mais detalhados e precisos.
            </p>
          </CardContent>
        </Card>

        {/* Prompts Customizáveis */}
        <Card>
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

        {/* Aparência */}
        <Card>
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
                value={defaultTheme}
                onChange={(e) => setDefaultTheme(e.target.value)}
                options={[
                  { value: 'dark', label: 'Escuro' },
                  { value: 'light', label: 'Claro' },
                  { value: 'system', label: 'Sistema' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Versão</dt>
                <dd className="font-mono">0.1.0</dd>
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
      </div>
    </div>
  );
}
