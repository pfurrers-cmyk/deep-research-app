'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, Star, Trash2, Clock, DollarSign, Database,
} from 'lucide-react';
import { useQueryState, parseAsBoolean, parseAsString } from 'nuqs';
import { toast } from 'sonner';
import { getAllResearches, deleteResearch, toggleFavorite, type StoredResearch } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

const DEPTH_LABELS: Record<string, string> = {
  rapida: '⚡ Rápida',
  normal: '🔍 Normal',
  profunda: '🔬 Profunda',
  exaustiva: '🏛️ Exaustiva',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
}

export default function LibraryPage() {
  const [researches, setResearches] = useState<StoredResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [filterFavorites, setFilterFavorites] = useQueryState('fav', parseAsBoolean.withDefault(false));
  const [filterDepth, setFilterDepth] = useQueryState('depth', parseAsString.withDefault(''));

  const load = useCallback(async () => {
    try {
      const all = await getAllResearches();
      setResearches(all);
    } catch (e) {
      console.error('Failed to load researches:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = researches.find((r) => r.id === id);
    if (!item) return;
    // Optimistic removal
    setResearches((prev) => prev.filter((r) => r.id !== id));
    toast.success('Pesquisa excluída', {
      action: {
        label: 'Desfazer',
        onClick: () => setResearches((prev) => [...prev, item].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      },
    });
    try {
      await deleteResearch(id);
    } catch {
      setResearches((prev) => [...prev, item].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      toast.error('Falha ao excluir pesquisa');
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Optimistic toggle
    setResearches((prev) =>
      prev.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r))
    );
    try {
      await toggleFavorite(id);
    } catch {
      setResearches((prev) =>
        prev.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r))
      );
      toast.error('Falha ao atualizar favorito');
    }
  };

  const filtered = researches.filter((r) => {
    if (filterFavorites && !r.favorite) return false;
    if (filterDepth && r.depth !== filterDepth) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.query.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
    }
    return true;
  });

  const totalCost = researches.reduce((sum, r) => sum + r.costUSD, 0);

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded animate-shimmer" />
            <div className="space-y-1.5">
              <div className="h-6 w-32 rounded animate-shimmer" />
              <div className="h-4 w-48 rounded animate-shimmer" />
            </div>
          </div>
          <div className="h-10 w-full rounded-lg animate-shimmer" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/30 p-4 space-y-2">
              <div className="h-5 w-3/4 rounded animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="h-4 w-1/2 rounded animate-shimmer" style={{ animationDelay: `${i * 100 + 50}ms` }} />
              <div className="flex gap-3 mt-2">
                <div className="h-3 w-16 rounded animate-shimmer" />
                <div className="h-3 w-12 rounded animate-shimmer" />
                <div className="h-3 w-20 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (researches.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Biblioteca de Pesquisas</h1>
          <p className="max-w-sm text-muted-foreground">
            Nenhuma pesquisa salva ainda. Execute uma pesquisa na página principal
            e ela aparecerá aqui automaticamente.
          </p>
          <Link href="/">
            <Button>Nova Pesquisa</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold">Biblioteca</h1>
              <p className="text-sm text-muted-foreground">
                {researches.length} pesquisa{researches.length !== 1 ? 's' : ''} · ${totalCost.toFixed(2)} total
              </p>
            </div>
          </div>
          <Link href="/">
            <Button size="sm">Nova Pesquisa</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => void setSearchQuery(e.target.value || null)}
              placeholder="Buscar pesquisas..."
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Select
            value={filterDepth}
            onChange={(e) => void setFilterDepth(e.target.value || null)}
            options={[
              { value: '', label: 'Todas profundidades' },
              ...Object.entries(DEPTH_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
          <Button
            variant={filterFavorites ? 'default' : 'outline'}
            size="sm"
            onClick={() => void setFilterFavorites(!filterFavorites || null)}
            className="h-10"
          >
            <Star className={`h-4 w-4 ${filterFavorites ? 'fill-current' : ''}`} />
            Favoritas
          </Button>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma pesquisa encontrada com os filtros atuais.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <Link key={r.id} href={`/research/${r.id}`}>
                <Card className="transition-colors hover:border-primary/30">
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{r.title}</h3>
                        {r.favorite && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.query}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{DEPTH_LABELS[r.depth] ?? r.depth}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(r.durationMs)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${r.costUSD.toFixed(3)}
                        </span>
                        <span>{r.metadata.totalSourcesKept} fontes</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            r.confidenceLevel === 'high'
                              ? 'bg-green-500/20 text-green-400'
                              : r.confidenceLevel === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {r.confidenceLevel}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleFavorite(r.id, e)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:text-yellow-400"
                        >
                          <Star className={`h-3.5 w-3.5 ${r.favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(r.id, e)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
