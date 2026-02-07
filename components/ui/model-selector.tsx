// components/ui/model-selector.tsx — Advanced model selector with search, filters, sort, groups
'use client';

import * as React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, X, Star, Zap, Brain, Code2, Filter, ArrowUpDown, DollarSign, Clock, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModelDefinition, ModelTier, ModelCapability } from '@/config/models';
import { getTextModels, getImageModels, getAllProviders, getAllTiers } from '@/config/models';

// ============================================================
// TYPES
// ============================================================

type SortField = 'name' | 'price-asc' | 'price-desc' | 'context' | 'latency' | 'tps';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  mode?: 'text' | 'image' | 'all';
  label?: string;
  disabled?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

// ============================================================
// RECOMMENDATIONS per use-case
// ============================================================

const RECOMMENDATIONS: Record<string, { label: string; models: string[] }> = {
  'best-value': {
    label: 'Melhor Custo-Benefício',
    models: ['google/gemini-2.5-flash', 'openai/gpt-4.1-mini', 'deepseek/deepseek-v3.1', 'anthropic/claude-haiku-4.5'],
  },
  'highest-quality': {
    label: 'Maior Qualidade',
    models: ['anthropic/claude-opus-4.6', 'openai/gpt-5.2', 'google/gemini-2.5-pro', 'anthropic/claude-sonnet-4.5'],
  },
  'fastest': {
    label: 'Mais Rápidos',
    models: ['openai/gpt-4.1-nano', 'google/gemini-2.0-flash-lite', 'meta/llama-3.1-8b', 'mistral/mistral-nemo'],
  },
  'reasoning': {
    label: 'Raciocínio Avançado',
    models: ['openai/o3', 'openai/o4-mini', 'deepseek/deepseek-r1', 'anthropic/claude-sonnet-4'],
  },
};

// ============================================================
// PROVIDER DISPLAY CONFIG
// ============================================================

const PROVIDER_META: Record<string, { label: string; color: string }> = {
  openai: { label: 'OpenAI', color: 'bg-green-500/15 text-green-400' },
  anthropic: { label: 'Anthropic', color: 'bg-amber-500/15 text-amber-400' },
  google: { label: 'Google', color: 'bg-blue-500/15 text-blue-400' },
  meta: { label: 'Meta', color: 'bg-indigo-500/15 text-indigo-400' },
  mistral: { label: 'Mistral', color: 'bg-orange-500/15 text-orange-400' },
  xai: { label: 'xAI', color: 'bg-purple-500/15 text-purple-400' },
  deepseek: { label: 'DeepSeek', color: 'bg-cyan-500/15 text-cyan-400' },
  alibaba: { label: 'Alibaba/Qwen', color: 'bg-red-500/15 text-red-400' },
  amazon: { label: 'Amazon', color: 'bg-yellow-500/15 text-yellow-400' },
  cohere: { label: 'Cohere', color: 'bg-pink-500/15 text-pink-400' },
  perplexity: { label: 'Perplexity', color: 'bg-teal-500/15 text-teal-400' },
  nvidia: { label: 'NVIDIA', color: 'bg-lime-500/15 text-lime-400' },
};

const TIER_LABELS: Record<ModelTier, { label: string; icon: React.ReactNode }> = {
  flagship: { label: 'Flagship', icon: <Star className="h-3 w-3" /> },
  workhorse: { label: 'Workhorse', icon: <Zap className="h-3 w-3" /> },
  budget: { label: 'Budget', icon: <DollarSign className="h-3 w-3" /> },
  reasoning: { label: 'Reasoning', icon: <Brain className="h-3 w-3" /> },
  code: { label: 'Code', icon: <Code2 className="h-3 w-3" /> },
  search: { label: 'Search', icon: <Search className="h-3 w-3" /> },
  embedding: { label: 'Embedding', icon: <Cpu className="h-3 w-3" /> },
  image: { label: 'Image', icon: <Star className="h-3 w-3" /> },
  video: { label: 'Video', icon: <Star className="h-3 w-3" /> },
};

// ============================================================
// HELPERS
// ============================================================

function formatContext(ctx: number): string {
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(ctx % 1_000_000 === 0 ? 0 : 1)}M`;
  return `${(ctx / 1_000).toFixed(0)}K`;
}

function formatPrice(p: number): string {
  if (p === 0) return 'Free';
  if (p < 0.1) return `$${p.toFixed(3)}`;
  if (p < 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(2)}`;
}

function sortModels(models: ModelDefinition[], sort: SortField): ModelDefinition[] {
  const sorted = [...models];
  switch (sort) {
    case 'name': return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'price-asc': return sorted.sort((a, b) => a.inputPricePer1M - b.inputPricePer1M);
    case 'price-desc': return sorted.sort((a, b) => b.inputPricePer1M - a.inputPricePer1M);
    case 'context': return sorted.sort((a, b) => b.contextWindow - a.contextWindow);
    case 'latency': {
      const parseLat = (l: string) => { const n = parseFloat(l); return isNaN(n) ? 999 : n; };
      return sorted.sort((a, b) => parseLat(a.latency) - parseLat(b.latency));
    }
    case 'tps': {
      const parseTps = (t: string) => { const n = parseInt(t); return isNaN(n) ? 0 : n; };
      return sorted.sort((a, b) => parseTps(b.tps) - parseTps(a.tps));
    }
    default: return sorted;
  }
}

// ============================================================
// COMPONENT
// ============================================================

export function ModelSelector({
  value,
  onChange,
  mode = 'text',
  label,
  disabled = false,
  showRecommendations = true,
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<ModelTier | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Focus search when opening
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const allModels = useMemo(() => {
    if (mode === 'image') return getImageModels();
    if (mode === 'text') return getTextModels();
    return [...getTextModels(), ...getImageModels()];
  }, [mode]);

  const providers = useMemo(() => {
    const p = new Set(allModels.map((m) => m.provider));
    return [...p].sort();
  }, [allModels]);

  const tiers = useMemo(() => {
    const t = new Set(allModels.map((m) => m.tier));
    return [...t];
  }, [allModels]);

  const filteredModels = useMemo(() => {
    let result = allModels;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q)
      );
    }
    if (filterProvider) result = result.filter((m) => m.provider === filterProvider);
    if (filterTier) result = result.filter((m) => m.tier === filterTier);
    return sortModels(result, sortField);
  }, [allModels, search, filterProvider, filterTier, sortField]);

  // Group by provider
  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelDefinition[]> = {};
    for (const m of filteredModels) {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    }
    return groups;
  }, [filteredModels]);

  const selectedModel = allModels.find((m) => m.id === value);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-ring'
        )}
      >
        {value === 'auto' ? (
          <span className="text-muted-foreground">Automático</span>
        ) : selectedModel ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', PROVIDER_META[selectedModel.provider]?.color ?? 'bg-muted text-muted-foreground')}>
              {selectedModel.provider}
            </span>
            <span className="truncate font-medium">{selectedModel.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatPrice(selectedModel.inputPricePer1M)}/{formatPrice(selectedModel.outputPricePer1M)}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Selecionar modelo...</span>
        )}
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[420px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {/* Search + Filter Bar */}
          <div className="border-b border-border p-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar modelo, provider..."
                  className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn('flex h-8 items-center gap-1 rounded-md border px-2 text-xs transition-colors', showFilters ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-muted')}
              >
                <Filter className="h-3 w-3" />
                Filtros
              </button>
            </div>

            {/* Filters Row */}
            {showFilters && (
              <div className="flex flex-wrap gap-2">
                {/* Sort */}
                <div className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="h-7 rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="name">Nome</option>
                    <option value="price-asc">Preço ↑</option>
                    <option value="price-desc">Preço ↓</option>
                    <option value="context">Contexto</option>
                    <option value="latency">Latência</option>
                    <option value="tps">TPS</option>
                  </select>
                </div>

                {/* Provider filter */}
                <select
                  value={filterProvider ?? ''}
                  onChange={(e) => setFilterProvider(e.target.value || null)}
                  className="h-7 rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Todos Providers</option>
                  {providers.map((p) => (
                    <option key={p} value={p}>{PROVIDER_META[p]?.label ?? p}</option>
                  ))}
                </select>

                {/* Tier filter */}
                <select
                  value={filterTier ?? ''}
                  onChange={(e) => setFilterTier((e.target.value || null) as ModelTier | null)}
                  className="h-7 rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Todos Tiers</option>
                  {tiers.map((t) => (
                    <option key={t} value={t}>{TIER_LABELS[t]?.label ?? t}</option>
                  ))}
                </select>

                {(filterProvider || filterTier) && (
                  <button
                    onClick={() => { setFilterProvider(null); setFilterTier(null); }}
                    className="flex h-7 items-center gap-1 rounded border border-destructive/30 px-2 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3" /> Limpar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Auto option */}
          <button
            onClick={() => handleSelect('auto')}
            className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted', value === 'auto' && 'bg-primary/10 text-primary')}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="font-medium">Automático</span>
            <span className="text-xs text-muted-foreground">— baseado na profundidade da pesquisa</span>
          </button>

          <div className="max-h-[400px] overflow-y-auto">
            {/* Recommendations */}
            {showRecommendations && !search && !filterProvider && !filterTier && (
              <div className="border-b border-border p-2">
                <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recomendados</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(RECOMMENDATIONS).map(([key, rec]) => (
                    <div key={key}>
                      <p className="px-1 text-[10px] font-medium text-muted-foreground">{rec.label}</p>
                      {rec.models.map((id) => {
                        const rm = allModels.find((m) => m.id === id);
                        if (!rm) return null;
                        return (
                          <button
                            key={id}
                            onClick={() => handleSelect(id)}
                            className={cn('flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs transition-colors hover:bg-muted', value === id && 'bg-primary/10 text-primary')}
                          >
                            <span className={cn('shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase', PROVIDER_META[rm.provider]?.color ?? 'bg-muted')}>{rm.provider}</span>
                            <span className="truncate">{rm.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grouped model list */}
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider} className="border-b border-border/50 last:border-0">
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-card/95 px-3 py-1.5 backdrop-blur-sm">
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', PROVIDER_META[provider]?.color ?? 'bg-muted text-muted-foreground')}>
                    {PROVIDER_META[provider]?.label ?? provider}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{models.length} modelos</span>
                </div>
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                      value === m.id && 'bg-primary/10'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('font-medium', value === m.id && 'text-primary')}>{m.name}</span>
                        <span className={cn('rounded px-1 py-0.5 text-[9px] font-semibold', getTierColor(m.tier))}>
                          {TIER_LABELS[m.tier]?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span title="Contexto">{formatContext(m.contextWindow)} ctx</span>
                        <span title="Max Output">{formatContext(m.maxOutput)} out</span>
                        {m.latency !== '—' && <span title="Latência"><Clock className="mr-0.5 inline h-2.5 w-2.5" />{m.latency}</span>}
                        {m.tps !== '—' && <span title="Tokens/s"><Zap className="mr-0.5 inline h-2.5 w-2.5" />{m.tps} t/s</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-medium">{formatPrice(m.inputPricePer1M)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatPrice(m.outputPricePer1M)}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {filteredModels.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhum modelo encontrado
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            {filteredModels.length} modelos · Preço por 1M tokens (input/output)
          </div>
        </div>
      )}
    </div>
  );
}

function getTierColor(tier: ModelTier): string {
  switch (tier) {
    case 'flagship': return 'bg-amber-500/15 text-amber-400';
    case 'workhorse': return 'bg-blue-500/15 text-blue-400';
    case 'budget': return 'bg-green-500/15 text-green-400';
    case 'reasoning': return 'bg-purple-500/15 text-purple-400';
    case 'code': return 'bg-cyan-500/15 text-cyan-400';
    case 'search': return 'bg-teal-500/15 text-teal-400';
    default: return 'bg-muted text-muted-foreground';
  }
}
