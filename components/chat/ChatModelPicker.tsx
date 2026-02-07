'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Zap, Brain, Code2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getChatModels, type ModelDefinition } from '@/config/models';

interface ChatModelPickerProps {
  value: string;
  onChange: (modelId: string) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'text-green-400',
  anthropic: 'text-amber-400',
  google: 'text-blue-400',
  meta: 'text-indigo-400',
  mistral: 'text-orange-400',
  xai: 'text-purple-400',
  deepseek: 'text-cyan-400',
  cohere: 'text-rose-400',
  perplexity: 'text-teal-400',
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  flagship: <Star className="h-3 w-3 text-amber-400" />,
  reasoning: <Brain className="h-3 w-3 text-purple-400" />,
  code: <Code2 className="h-3 w-3 text-blue-400" />,
  budget: <Zap className="h-3 w-3 text-green-400" />,
};

export function ChatModelPicker({ value, onChange }: ChatModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const chatModels = useMemo(() => getChatModels(), []);

  const currentModel = chatModels.find((m) => m.id === value);
  const displayName = currentModel
    ? currentModel.name
    : value.split('/')[1] ?? value;

  // Filter models
  const filtered = useMemo(() => {
    if (!search) return chatModels;
    const q = search.toLowerCase();
    return chatModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.tier.toLowerCase().includes(q)
    );
  }, [chatModels, search]);

  // Group by provider
  const grouped = useMemo(() => {
    const groups: Record<string, ModelDefinition[]> = {};
    for (const m of filtered) {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-1.5 text-xs hover:bg-muted/40 transition-colors"
      >
        <span className={cn('font-medium', PROVIDER_COLORS[currentModel?.provider ?? ''] ?? 'text-foreground')}>
          {displayName}
        </span>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background py-1.5 pl-8 pr-8 text-xs placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Models list */}
          <div className="max-h-80 overflow-y-auto p-1">
            {grouped.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Nenhum modelo encontrado</p>
            )}
            {grouped.map(([provider, models]) => (
              <div key={provider} className="mb-1">
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  {provider}
                </p>
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors',
                      m.id === value
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/80 hover:bg-muted/60'
                    )}
                  >
                    <div className="shrink-0 w-4 flex justify-center">
                      {TIER_ICONS[m.tier] ?? <Zap className="h-3 w-3 text-muted-foreground/50" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-medium">{m.name}</span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                      <span>{(m.contextWindow / 1000).toFixed(0)}K</span>
                      <span>${m.inputPricePer1M.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
