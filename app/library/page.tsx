'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, Star, Trash2, Clock, DollarSign, Database,
  Image as ImageIcon, MessageSquare, CheckSquare, Square, XCircle,
} from 'lucide-react';
import { useQueryState, parseAsBoolean, parseAsString } from 'nuqs';
import { toast } from 'sonner';
import {
  getAllResearches, deleteResearch, toggleFavorite,
  getAllPrompts, deletePrompt,
  getAllGenerations, deleteGeneration,
  clearByType, deleteMultiple,
  type StoredResearch, type StoredPrompt, type StoredGeneration,
} from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

type TabType = 'researches' | 'images' | 'prompts';

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function LibraryPage() {
  const [researches, setResearches] = useState<StoredResearch[]>([]);
  const [prompts, setPrompts] = useState<StoredPrompt[]>([]);
  const [generations, setGenerations] = useState<StoredGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('researches'));
  const [searchQuery, setSearchQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [filterFavorites, setFilterFavorites] = useQueryState('fav', parseAsBoolean.withDefault(false));
  const [filterDepth, setFilterDepth] = useQueryState('depth', parseAsString.withDefault(''));

  const tab = (activeTab || 'researches') as TabType;

  const load = useCallback(async () => {
    try {
      const [r, p, g] = await Promise.all([getAllResearches(), getAllPrompts(), getAllGenerations()]);
      setResearches(r);
      setPrompts(p);
      setGenerations(g);
    } catch (e) {
      console.error('Failed to load library:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab]);

  // Research actions
  const handleDeleteResearch = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = researches.find((r) => r.id === id);
    if (!item) return;
    setResearches((prev) => prev.filter((r) => r.id !== id));
    toast.success('Pesquisa excluída', {
      action: {
        label: 'Desfazer',
        onClick: () => setResearches((prev) => [...prev, item].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      },
    });
    try { await deleteResearch(id); } catch {
      setResearches((prev) => [...prev, item].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      toast.error('Falha ao excluir');
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResearches((prev) => prev.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)));
    try { await toggleFavorite(id); } catch {
      setResearches((prev) => prev.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)));
      toast.error('Falha ao atualizar favorito');
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds((prev) => prev.size === ids.length ? new Set() : new Set(ids));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const count = ids.length;
    try {
      await deleteMultiple(tab === 'images' ? 'generations' : tab, ids);
      if (tab === 'researches') setResearches((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      else if (tab === 'prompts') setPrompts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      else setGenerations((prev) => prev.filter((g) => !selectedIds.has(g.id)));
      setSelectedIds(new Set());
      toast.success(`${count} item(ns) excluído(s)`);
    } catch { toast.error('Falha ao excluir itens'); }
  };

  const handleClearTab = async () => {
    try {
      await clearByType(tab === 'images' ? 'generations' : tab);
      if (tab === 'researches') setResearches([]);
      else if (tab === 'prompts') setPrompts([]);
      else setGenerations([]);
      setShowClearConfirm(false);
      toast.success('Dados limpos com sucesso');
    } catch { toast.error('Falha ao limpar dados'); }
  };

  // Filters
  const filteredResearches = researches.filter((r) => {
    if (filterFavorites && !r.favorite) return false;
    if (filterDepth && r.depth !== filterDepth) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.query.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredPrompts = prompts.filter((p) => {
    if (searchQuery) return p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const filteredGenerations = generations.filter((g) => {
    if (searchQuery) return g.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const totalCost = researches.reduce((sum, r) => sum + r.costUSD, 0);

  const tabCounts = {
    researches: researches.length,
    images: generations.length,
    prompts: prompts.length,
  };

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
                {researches.length} pesquisa{researches.length !== 1 ? 's' : ''}
                {generations.length > 0 && ` · ${generations.length} geração(ões)`}
                {prompts.length > 0 && ` · ${prompts.length} prompt(s)`}
                {totalCost > 0 && ` · $${totalCost.toFixed(2)}`}
              </p>
            </div>
          </div>
          <Link href="/">
            <Button size="sm">Nova Pesquisa</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { key: 'researches' as TabType, label: 'Pesquisas', icon: BookOpen },
            { key: 'images' as TabType, label: 'Imagens', icon: ImageIcon },
            { key: 'prompts' as TabType, label: 'Prompts', icon: MessageSquare },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => void setActiveTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono">{tabCounts[key]}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => void setSearchQuery(e.target.value || null)}
              placeholder={tab === 'researches' ? 'Buscar pesquisas...' : tab === 'images' ? 'Buscar gerações...' : 'Buscar prompts...'}
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {tab === 'researches' && (
            <>
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
            </>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Excluir selecionados
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
              <XCircle className="h-3.5 w-3.5" />
              Limpar seleção
            </Button>
          </div>
        )}

        {/* Clear section */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const ids = tab === 'researches' ? filteredResearches.map((r) => r.id)
                : tab === 'prompts' ? filteredPrompts.map((p) => p.id)
                : filteredGenerations.map((g) => g.id);
              selectAll(ids);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedIds.size > 0 ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            Selecionar todos
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs text-destructive/70 hover:text-destructive transition-colors"
          >
            Limpar toda a aba
          </button>
        </div>

        {/* Clear confirmation modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-2xl">
              <h3 className="text-lg font-semibold">Limpar {tab === 'researches' ? 'Pesquisas' : tab === 'images' ? 'Imagens' : 'Prompts'}?</h3>
              <p className="text-sm text-muted-foreground">
                Esta ação é irreversível. Todos os dados desta aba serão permanentemente excluídos.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)} className="flex-1">Cancelar</Button>
                <Button variant="destructive" size="sm" onClick={handleClearTab} className="flex-1">
                  <Trash2 className="h-3.5 w-3.5" />
                  Confirmar exclusão
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Pesquisas */}
        {tab === 'researches' && (
          filteredResearches.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {researches.length === 0 ? 'Nenhuma pesquisa salva ainda.' : 'Nenhuma pesquisa encontrada com os filtros atuais.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResearches.map((r) => (
                <Link key={r.id} href={`/research/${r.id}`}>
                  <Card className={`transition-colors hover:border-primary/30 ${selectedIds.has(r.id) ? 'border-primary/50 bg-primary/5' : ''}`}>
                    <CardContent className="flex items-start gap-4 py-4">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(r.id); }}
                        className="mt-0.5 text-muted-foreground hover:text-foreground"
                      >
                        {selectedIds.has(r.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold">{r.title}</h3>
                          {r.favorite && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.query}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{DEPTH_LABELS[r.depth] ?? r.depth}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(r.durationMs)}</span>
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${r.costUSD.toFixed(3)}</span>
                          <span>{r.metadata.totalSourcesKept} fontes</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            r.confidenceLevel === 'high' ? 'bg-green-500/20 text-green-400'
                              : r.confidenceLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>{r.confidenceLevel}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => handleToggleFavorite(r.id, e)} className="rounded p-1 text-muted-foreground transition-colors hover:text-yellow-400">
                            <Star className={`h-3.5 w-3.5 ${r.favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </button>
                          <button onClick={(e) => handleDeleteResearch(r.id, e)} className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Tab: Imagens/Vídeos */}
        {tab === 'images' && (
          filteredGenerations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {generations.length === 0 ? 'Nenhuma imagem/vídeo gerado ainda.' : 'Nenhum resultado com os filtros atuais.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredGenerations.map((g) => (
                <div key={g.id} className={`group relative rounded-xl border overflow-hidden transition-colors ${
                  selectedIds.has(g.id) ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border hover:border-primary/30'
                }`}>
                  <button
                    onClick={() => toggleSelect(g.id)}
                    className="absolute top-2 left-2 z-10"
                  >
                    {selectedIds.has(g.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-white/70" />}
                  </button>
                  {g.type === 'image' ? (
                    <img
                      src={URL.createObjectURL(g.blobData)}
                      alt={g.prompt}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                  <div className="p-2 space-y-1">
                    <p className="truncate text-xs font-medium">{g.prompt}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{g.model.split('/')[1]}</span>
                      <span>{formatBytes(g.sizeBytes)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{formatDate(g.timestamp)}</span>
                      <button
                        onClick={() => { deleteGeneration(g.id); setGenerations((prev) => prev.filter((x) => x.id !== g.id)); toast.success('Geração excluída'); }}
                        className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab: Prompts */}
        {tab === 'prompts' && (
          filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {prompts.length === 0 ? 'Nenhum prompt salvo ainda.' : 'Nenhum resultado com os filtros atuais.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPrompts.map((p) => (
                <div key={p.id} className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selectedIds.has(p.id) ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-border'
                }`}>
                  <button onClick={() => toggleSelect(p.id)} className="text-muted-foreground hover:text-foreground">
                    {selectedIds.has(p.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.prompt}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className={`rounded-full px-1.5 py-0.5 font-medium ${
                        p.type === 'research' ? 'bg-blue-500/20 text-blue-400'
                          : p.type === 'image' ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>{p.type}</span>
                      <span>{p.model}</span>
                      {p.depth && <span>{DEPTH_LABELS[p.depth] ?? p.depth}</span>}
                      <span>{formatDate(p.timestamp)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { deletePrompt(p.id); setPrompts((prev) => prev.filter((x) => x.id !== p.id)); toast.success('Prompt excluído'); }}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
