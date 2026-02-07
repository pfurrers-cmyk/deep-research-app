// components/research/ResearchInput.tsx — Input principal com seletor de profundidade
'use client';

import { useState, type FormEvent } from 'react';
import { Search, Loader2, BookTemplate } from 'lucide-react';
import { APP_CONFIG, type DepthPreset, type DomainPreset } from '@/config/defaults';

interface ResearchInputProps {
  onSubmit: (query: string, depth: DepthPreset, domainPreset: DomainPreset | null) => void;
  isLoading: boolean;
  onCancel?: () => void;
  initialDepth?: DepthPreset;
}

export function ResearchInput({ onSubmit, isLoading, onCancel, initialDepth = 'normal' }: ResearchInputProps) {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<DepthPreset>(initialDepth);
  const [domainPreset, setDomainPreset] = useState<DomainPreset | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const { strings, depth: depthConfig, domainPresets, templates } = APP_CONFIG;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim(), depth, domainPreset);
  };

  const presetEntries = Object.entries(depthConfig.presets) as [DepthPreset, typeof depthConfig.presets[DepthPreset]][];

  const domainEntries = Object.entries(domainPresets).filter(
    ([key]) => key !== '_custom'
  ) as [DomainPreset, { label: string; icon: string; description: string }][];

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={strings.placeholders.queryInput}
            disabled={isLoading}
            className="h-14 w-full rounded-xl border border-input bg-card pl-12 pr-32 text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
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
                <Search className="h-4 w-4" />
                {strings.buttons.startResearch}
              </button>
            )}
          </div>
        </div>
      </form>

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
              disabled={isLoading}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                depth === key
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
              } disabled:cursor-not-allowed disabled:opacity-50`}
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
            disabled={isLoading}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
              domainPreset === null
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            🌐 Geral
          </button>
          {domainEntries.map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setDomainPreset(key)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                domainPreset === key
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {preset.icon} {preset.label}
            </button>
          ))}
        </div>
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
                }}
                disabled={isLoading}
                className="flex flex-col items-start gap-0.5 rounded-lg border border-border p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.template}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
