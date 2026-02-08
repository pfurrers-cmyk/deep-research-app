// components/research/ResearchInput.tsx — Input principal com progressive disclosure
'use client';

import { useState, useRef, useCallback, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Search, Loader2, SlidersHorizontal, BookTemplate, Sparkles, Settings2, Cpu, Database, GraduationCap } from 'lucide-react';
import { ProConfigPanel } from '@/components/pro/ProConfigPanel';
import { ModelSelector } from '@/components/ui/model-selector';
import {
  UniversalAttachment,
  AttachmentPreview,
  useFileUpload,
  ATTACHMENT_CONFIGS,
} from '@/components/shared/UniversalAttachment';
import type { AttachmentFile } from '@/components/shared/UniversalAttachment';
import { APP_CONFIG, type DepthPreset, type DomainPreset } from '@/config/defaults';
import { loadPreferences, savePreferences } from '@/lib/config/settings-store';
import { resolveProcessingMode, getAbsoluteMaxSources, getModeOverhead } from '@/config/model-source-limits';
import { debug } from '@/lib/utils/debug-logger';
import { cn } from '@/lib/utils';

type ConfigTab = 'general' | 'pipeline' | 'pro' | 'tcc' | 'templates';

interface ResearchInputProps {
  onSubmit: (query: string, depth: DepthPreset, domainPreset: DomainPreset | null, attachments?: AttachmentFile[]) => void;
  isLoading: boolean;
  onCancel?: () => void;
  initialDepth?: DepthPreset;
}

export function ResearchInput({ onSubmit, isLoading, onCancel, initialDepth = 'normal' }: ResearchInputProps) {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<DepthPreset>(initialDepth);
  const [domainPreset, setDomainPreset] = useState<DomainPreset | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configTab, setConfigTab] = useState<ConfigTab>('general');
  const { strings, depth: depthConfig, domainPresets, templates } = APP_CONFIG;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pipeline settings (models + sources) — loaded from preferences
  const [stageModels, setStageModels] = useState(() => loadPreferences().stageModels);
  const [sourceConfig, setSourceConfig] = useState(() => loadPreferences().sourceConfig);
  const [tccConfig, setTccConfig] = useState(() => loadPreferences().tcc);
  const [tccActive, setTccActive] = useState(() => loadPreferences().pro.researchMode === 'tcc');

  const updateTccConfig = useCallback((patch: Partial<typeof tccConfig>) => {
    setTccConfig((prev) => {
      const next = { ...prev, ...patch };
      savePreferences({ tcc: next });
      return next;
    });
  }, []);

  const activateTccMode = useCallback(() => {
    debug.info('TCC:UI', '🎓 ATIVANDO MODO TCC', {
      previousMode: loadPreferences().pro.researchMode,
      timestamp: new Date().toISOString(),
    });
    setTccActive(true);
    setDepth('exaustiva' as DepthPreset);
    setDomainPreset('academico' as DomainPreset);
    const saved = savePreferences({
      pro: {
        ...loadPreferences().pro,
        writingStyle: 'academic',
        citationFormat: 'abnt',
        detailLevel: 'exhaustive',
        researchMode: 'tcc',
        reasoningLanguage: 'pt',
      },
    });
    debug.info('TCC:UI', 'Preferências salvas após ativação TCC', {
      researchMode: saved.pro.researchMode,
      citationFormat: saved.pro.citationFormat,
      detailLevel: saved.pro.detailLevel,
      writingStyle: saved.pro.writingStyle,
    });
    setConfigTab('tcc');
  }, []);

  const deactivateTccMode = useCallback(() => {
    debug.info('TCC:UI', '🔴 DESATIVANDO MODO TCC');
    setTccActive(false);
    savePreferences({
      pro: {
        ...loadPreferences().pro,
        researchMode: 'standard',
        citationFormat: 'inline_numbered',
        detailLevel: 'standard',
      },
    });
    setConfigTab('general');
  }, []);

  const updateStageModels = useCallback((patch: Partial<typeof stageModels>) => {
    setStageModels((prev) => {
      const next = { ...prev, ...patch };
      savePreferences({ stageModels: next });
      return next;
    });
  }, []);

  const updateSourceConfig = useCallback((patch: Partial<typeof sourceConfig>) => {
    setSourceConfig((prev) => {
      const next = { ...prev, ...patch };
      savePreferences({ sourceConfig: next });
      return next;
    });
  }, []);

  const {
    attachments,
    isProcessing,
    addFiles,
    removeAttachment,
    clearAttachments,
    openFilePicker,
    handleFileInputChange,
    handlePaste,
    fileInputRef,
    acceptString,
    config: attachConfig,
  } = useFileUpload(ATTACHMENT_CONFIGS.research);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => { autoResize(); }, [query, autoResize]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    const readyAttachments = attachments.filter((a) => a.status === 'ready');
    onSubmit(query.trim(), depth, domainPreset, readyAttachments.length > 0 ? readyAttachments : undefined);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value === '/') {
      setShowConfig(true);
      setQuery('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const presetEntries = Object.entries(depthConfig.presets) as [DepthPreset, typeof depthConfig.presets[DepthPreset]][];

  const domainEntries = Object.entries(domainPresets).filter(
    ([key]) => key !== '_custom'
  ) as [DomainPreset, { label: string; icon: string; description: string }][];

  const selectedPreset = depthConfig.presets[depth];
  const hasCustomConfig = depth !== 'normal' || domainPreset !== null;

  return (
    <search role="search" className="w-full space-y-3">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <label htmlFor="research-input" className="sr-only">Campo de pesquisa</label>
          <textarea
            ref={textareaRef}
            id="research-input"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(e) => handlePaste(e)}
            placeholder={strings.placeholders.queryInput}
            disabled={isLoading}
            rows={1}
            className="min-h-[56px] max-h-[200px] w-full resize-none rounded-xl border border-input bg-card pl-12 pr-52 pt-4 pb-4 text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            autoFocus
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
            {!isLoading && (
              <UniversalAttachment
                attachments={attachments}
                onAddFiles={addFiles}
                onRemove={removeAttachment}
                config={ATTACHMENT_CONFIGS.research}
                variant="inline"
                fileInputRef={fileInputRef}
                acceptString={acceptString}
                onFileInputChange={handleFileInputChange}
                openFilePicker={openFilePicker}
                disabled={isLoading}
              />
            )}
            {!isLoading && query.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showConfig || hasCustomConfig
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-muted-foreground'
                )}
                aria-label="Configurar pesquisa"
                aria-expanded={showConfig}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            )}
            {isLoading ? (
              <button
                type="button"
                onClick={onCancel}
                className="flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {strings.buttons.cancel}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!query.trim()}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {strings.buttons.startResearch}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="px-1">
          <AttachmentPreview
            attachments={attachments}
            onRemove={removeAttachment}
            layout="horizontal"
            compact
          />
        </div>
      )}

      {/* Config summary (when collapsed but has custom config) */}
      {!showConfig && hasCustomConfig && !isLoading && (
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{selectedPreset.icon} {selectedPreset.label}</span>
          {domainPreset && domainEntries.find(([k]) => k === domainPreset) && (
            <>
              <span className="text-border">·</span>
              <span>{domainEntries.find(([k]) => k === domainPreset)?.[1].icon} {domainEntries.find(([k]) => k === domainPreset)?.[1].label}</span>
            </>
          )}
          <span className="text-border">·</span>
          <span className="text-primary/70">editar</span>
        </button>
      )}

      {/* Progressive disclosure — tabbed config panel */}
      {showConfig && !isLoading && (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
          {/* Tab navigation */}
          <div className="flex border-b border-border/50 bg-muted/10">
            {([
              { id: 'general' as ConfigTab, label: 'Geral', icon: SlidersHorizontal },
              { id: 'pipeline' as ConfigTab, label: 'Pipeline', icon: Cpu },
              { id: 'pro' as ConfigTab, label: 'PRO', icon: Sparkles },
              { id: 'tcc' as ConfigTab, label: tccActive ? '🎓 TCC' : 'TCC', icon: GraduationCap },
              { id: 'templates' as ConfigTab, label: 'Templates', icon: BookTemplate },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setConfigTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2',
                  configTab === id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* TAB: Geral — Depth + Domain */}
            {configTab === 'general' && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {strings.labels.depth}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {presetEntries.map(([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDepth(key)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-lg border p-3 transition-all',
                          depth === key
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        )}
                      >
                        <span className="text-xl">{preset.icon}</span>
                        <span className="text-sm font-medium">{preset.label}</span>
                        <span className="text-xs opacity-70">
                          ~{preset.estimatedTimeSeconds < 60
                            ? `${preset.estimatedTimeSeconds}s`
                            : `${Math.round(preset.estimatedTimeSeconds / 60)}min`}
                          {' · '}
                          ${preset.estimatedCostUSD < 0.01
                            ? '<0.01'
                            : preset.estimatedCostUSD.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {strings.labels.domain}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDomainPreset(null)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                        domainPreset === null
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      🌐 Geral
                    </button>
                    {domainEntries.map(([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDomainPreset(key)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                          domainPreset === key
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        )}
                      >
                        {preset.icon} {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB: Pipeline — Models + Sources */}
            {configTab === 'pipeline' && (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Modelos por Fase</p>
                  <ModelSelector
                    label="Decomposição"
                    value={stageModels.decomposition}
                    onChange={(v) => updateStageModels({ decomposition: v })}
                  />
                  <ModelSelector
                    label="Avaliação"
                    value={stageModels.evaluation}
                    onChange={(v) => updateStageModels({ evaluation: v })}
                  />
                  <ModelSelector
                    label="Síntese"
                    value={stageModels.synthesis}
                    onChange={(v) => updateStageModels({ synthesis: v })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Fontes</p>
                    <div className="flex rounded-lg border border-input">
                      <button
                        type="button"
                        onClick={() => updateSourceConfig({ mode: 'auto' })}
                        className={cn('px-3 py-1 text-xs transition-colors', sourceConfig.mode === 'auto' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground')}
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSourceConfig({ mode: 'manual' })}
                        className={cn('border-l border-input px-3 py-1 text-xs transition-colors', sourceConfig.mode === 'manual' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground')}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {sourceConfig.mode === 'manual' && (() => {
                    const synthModelId = stageModels.synthesis !== 'auto'
                      ? stageModels.synthesis
                      : APP_CONFIG.depth.presets[depth].synthesisModel;
                    const absMax = getAbsoluteMaxSources(synthModelId);
                    const { mode: resolvedMode } = resolveProcessingMode(synthModelId, sourceConfig.fetchMax, sourceConfig.keepMax);
                    const modeInfo = getModeOverhead(resolvedMode);
                    return (
                      <div className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          resolvedMode === 'base' ? 'bg-green-500/10 text-green-500' : resolvedMode === 'extended' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'
                        )}>
                          {resolvedMode === 'base' ? '⚡' : resolvedMode === 'extended' ? '🔀' : '🔄'} {modeInfo.labelShort}
                        </span>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Buscar: {sourceConfig.fetchMin}–{sourceConfig.fetchMax}</span>
                            <span className="opacity-60">máx {absMax.maxSearch}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="range" min={1} max={sourceConfig.fetchMax} value={sourceConfig.fetchMin}
                              onChange={(e) => updateSourceConfig({ fetchMin: Number(e.target.value) })}
                              className="flex-1 accent-primary h-1" />
                            <input type="range" min={sourceConfig.fetchMin} max={absMax.maxSearch} value={Math.min(sourceConfig.fetchMax, absMax.maxSearch)}
                              onChange={(e) => updateSourceConfig({ fetchMax: Number(e.target.value) })}
                              className="flex-1 accent-primary h-1" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Selecionar: {sourceConfig.keepMin}–{sourceConfig.keepMax}</span>
                            <span className="opacity-60">máx {absMax.maxSelect}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="range" min={1} max={sourceConfig.keepMax} value={sourceConfig.keepMin}
                              onChange={(e) => updateSourceConfig({ keepMin: Number(e.target.value) })}
                              className="flex-1 accent-primary h-1" />
                            <input type="range" min={sourceConfig.keepMin} max={absMax.maxSelect} value={Math.min(sourceConfig.keepMax, absMax.maxSelect)}
                              onChange={(e) => updateSourceConfig({ keepMax: Number(e.target.value) })}
                              className="flex-1 accent-primary h-1" />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {sourceConfig.mode === 'auto' && (
                    <p className="text-xs text-muted-foreground">
                      Fontes determinadas pela profundidade selecionada.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* TAB: PRO Config */}
            {configTab === 'pro' && (
              <div className="rounded-lg border border-primary/20 bg-card/50 p-3">
                <ProConfigPanel compact />
              </div>
            )}

            {/* TAB: TCC — Modo Trabalho de Conclusão de Curso */}
            {configTab === 'tcc' && (
              <div className="space-y-4">
                {!tccActive ? (
                  <div className="text-center space-y-3 py-4">
                    <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Modo TCC</p>
                      <p className="text-xs text-muted-foreground">Ativa automaticamente formatação ABNT, citações acadêmicas, profundidade exaustiva e estrutura completa de monografia.</p>
                    </div>
                    <button
                      type="button"
                      onClick={activateTccMode}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Ativar Modo TCC
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">🎓 TCC Ativo</span>
                        <span className="text-xs text-muted-foreground">ABNT · Exaustiva · Acadêmico</span>
                      </div>
                      <button
                        type="button"
                        onClick={deactivateTccMode}
                        className="text-xs text-destructive hover:underline"
                      >
                        Desativar
                      </button>
                    </div>
                    {/* Dados do trabalho */}
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dados do trabalho</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Título do TCC</label>
                        <input type="text" value={tccConfig.titulo} onChange={(e) => updateTccConfig({ titulo: e.target.value })}
                          placeholder="Ex: Inteligência Artificial na Educação" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Autor(es)</label>
                        <input type="text" value={tccConfig.autor} onChange={(e) => updateTccConfig({ autor: e.target.value })}
                          placeholder="Nome completo" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Instituição</label>
                        <input type="text" value={tccConfig.instituicao} onChange={(e) => updateTccConfig({ instituicao: e.target.value })}
                          placeholder="Ex: Universidade Federal de..." className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Curso</label>
                        <input type="text" value={tccConfig.curso} onChange={(e) => updateTccConfig({ curso: e.target.value })}
                          placeholder="Ex: Ciência da Computação" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Orientador(a)</label>
                        <input type="text" value={tccConfig.orientador} onChange={(e) => updateTccConfig({ orientador: e.target.value })}
                          placeholder="Prof. Dr. ..." className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Cidade</label>
                          <input type="text" value={tccConfig.cidade} onChange={(e) => updateTccConfig({ cidade: e.target.value })}
                            placeholder="São Paulo" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Ano</label>
                          <input type="text" value={tccConfig.ano} onChange={(e) => updateTccConfig({ ano: e.target.value })}
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Configuração metodológica */}
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-2">Configuração metodológica</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Área do conhecimento</label>
                        <input type="text" value={tccConfig.areaConhecimento} onChange={(e) => updateTccConfig({ areaConhecimento: e.target.value })}
                          placeholder="Ex: Ciências Sociais, Direito, Educação..." className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Nível acadêmico</label>
                        <select value={tccConfig.nivelAcademico} onChange={(e) => updateTccConfig({ nivelAcademico: e.target.value })}
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                          <option value="graduacao">Graduação (TCC)</option>
                          <option value="especializacao">Especialização (Monografia)</option>
                          <option value="mestrado">Mestrado (Dissertação)</option>
                          <option value="doutorado">Doutorado (Tese)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Tipo de pesquisa</label>
                        <select value={tccConfig.tipoPesquisa} onChange={(e) => updateTccConfig({ tipoPesquisa: e.target.value })}
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                          <option value="revisao_bibliografica">Revisão bibliográfica</option>
                          <option value="revisao_sistematica">Revisão sistemática</option>
                          <option value="estudo_caso">Estudo de caso</option>
                          <option value="pesquisa_campo">Pesquisa de campo</option>
                          <option value="pesquisa_documental">Pesquisa documental</option>
                          <option value="pesquisa_acao">Pesquisa-ação</option>
                          <option value="pesquisa_historica">Pesquisa histórica</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Abordagem</label>
                        <select value={tccConfig.abordagem} onChange={(e) => updateTccConfig({ abordagem: e.target.value })}
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                          <option value="qualitativa">Qualitativa</option>
                          <option value="quantitativa">Quantitativa</option>
                          <option value="mista">Mista (quali-quanti)</option>
                        </select>
                      </div>
                    </div>

                    {/* Parâmetros */}
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-2">Parâmetros</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Mín. fontes</label>
                        <input type="number" min={5} max={100} value={tccConfig.minFontes} onChange={(e) => updateTccConfig({ minFontes: Number(e.target.value) })}
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Mín. páginas</label>
                        <input type="number" min={20} max={200} value={tccConfig.minPaginas} onChange={(e) => updateTccConfig({ minPaginas: Number(e.target.value) })}
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center" />
                      </div>
                    </div>

                    {/* Elementos opcionais */}
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-2">Elementos opcionais (pré-textuais)</p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Dedicatória <span className="text-muted-foreground/60">(deixe vazio para omitir)</span></label>
                        <input type="text" value={tccConfig.dedicatoria} onChange={(e) => updateTccConfig({ dedicatoria: e.target.value })}
                          placeholder="Ex: Aos meus pais, pelo apoio incondicional." className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Agradecimentos <span className="text-muted-foreground/60">(deixe vazio para omitir)</span></label>
                        <textarea value={tccConfig.agradecimentos} onChange={(e) => updateTccConfig({ agradecimentos: e.target.value })}
                          placeholder="Ex: Agradeço ao meu orientador, à UNIFESP..." rows={2}
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm resize-none" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground">Epígrafe <span className="text-muted-foreground/60">(citação)</span></label>
                          <input type="text" value={tccConfig.epigrafe} onChange={(e) => updateTccConfig({ epigrafe: e.target.value })}
                            placeholder="Ex: A justiça atrasada não é justiça..." className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Autor da epígrafe</label>
                          <input type="text" value={tccConfig.epigrafeAutor} onChange={(e) => updateTccConfig({ epigrafeAutor: e.target.value })}
                            placeholder="Rui Barbosa" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB: Templates */}
            {configTab === 'templates' && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {templates.builtIn.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setQuery(t.template);
                      setDepth(t.depth);
                      if (t.domainPreset) {
                        setDomainPreset(t.domainPreset as DomainPreset);
                      }
                      setShowConfig(false);
                    }}
                    className="flex flex-col items-start gap-0.5 rounded-lg border border-border p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.template}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint for "/" shortcut + depth indicator (only when idle and no query) */}
      {!query && !isLoading && !showConfig && (
        <p className="text-center text-xs text-muted-foreground/50">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground mr-2">{selectedPreset.icon} {selectedPreset.label}</span>
          Digite <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">/</kbd> para configurar profundidade e domínio
        </p>
      )}
    </search>
  );
}
