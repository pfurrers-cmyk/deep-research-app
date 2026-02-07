// components/research/ResearchInput.tsx — Input principal com progressive disclosure
'use client';

import { useState, useRef, useCallback, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Search, Loader2, SlidersHorizontal, BookTemplate, Sparkles } from 'lucide-react';
import { ProConfigPanel } from '@/components/pro/ProConfigPanel';
import {
  UniversalAttachment,
  AttachmentPreview,
  useFileUpload,
  ATTACHMENT_CONFIGS,
} from '@/components/shared/UniversalAttachment';
import type { AttachmentFile } from '@/components/shared/UniversalAttachment';
import { APP_CONFIG, type DepthPreset, type DomainPreset } from '@/config/defaults';
import { cn } from '@/lib/utils';

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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const { strings, depth: depthConfig, domainPresets, templates } = APP_CONFIG;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      {/* Progressive disclosure — config panel */}
      {showConfig && !isLoading && (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20 p-4 space-y-4">
          {/* Depth Selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {strings.labels.depth}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presetEntries.map(([key, preset]) => (
                <button
                  key={key}
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

          {/* Domain Presets */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {strings.labels.domain}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
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

          {/* PRO Config */}
          <div className="space-y-2">
            <button
              onClick={() => setShowPro(!showPro)}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                showPro ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="h-4 w-4" />
              Prompt Reverso PRO
            </button>
            {showPro && (
              <div className="rounded-lg border border-primary/20 bg-card/50 p-3">
                <ProConfigPanel compact />
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="space-y-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <BookTemplate className="h-4 w-4" />
              Templates de Pesquisa
              <span className="text-xs">({templates.builtIn.length})</span>
            </button>
            {showTemplates && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {templates.builtIn.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setQuery(t.template);
                      setDepth(t.depth);
                      if (t.domainPreset) {
                        setDomainPreset(t.domainPreset as DomainPreset);
                      }
                      setShowTemplates(false);
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
