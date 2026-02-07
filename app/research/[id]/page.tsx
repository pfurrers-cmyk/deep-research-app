'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Clock, DollarSign, Star, Copy, Check, Download,
  FileText, ExternalLink, Trash2,
} from 'lucide-react';
import { getResearch, toggleFavorite, deleteResearch, type StoredResearch } from '@/lib/db';
import { MarkdownRenderer } from '@/components/research/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface ResearchPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export default function ResearchPage({ params }: ResearchPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [research, setResearch] = useState<StoredResearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getResearch(id).then((r) => {
      setResearch(r ?? null);
      setLoading(false);
    });
  }, [id]);

  const handleCopy = async () => {
    if (!research) return;
    await navigator.clipboard.writeText(research.reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!research) return;
    const frontmatter = `---
title: "${research.title}"
query: "${research.query}"
depth: ${research.depth}
date: ${research.createdAt}
sources: ${research.metadata.totalSourcesKept}
cost: $${research.costUSD.toFixed(3)}
models: ${research.metadata.modelsUsed.join(', ')}
---

`;
    const blob = new Blob([frontmatter + research.reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${research.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!research) return;
    if (!confirm('Excluir esta pesquisa permanentemente?')) return;
    await deleteResearch(research.id);
    router.push('/library');
  };

  const handleToggleFavorite = async () => {
    if (!research) return;
    await toggleFavorite(research.id);
    setResearch({ ...research, favorite: !research.favorite });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-muted-foreground">Carregando pesquisa...</p>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="text-muted-foreground">Pesquisa não encontrada.</p>
        <Link href="/library">
          <Button variant="outline">Voltar à Biblioteca</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Navigation */}
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Biblioteca
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">{research.title}</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleFavorite}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:text-yellow-400"
              >
                <Star className={`h-5 w-5 ${research.favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </button>
              <button
                onClick={handleDelete}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{research.query}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>{formatDate(research.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {research.durationMs < 60_000
                ? `${(research.durationMs / 1000).toFixed(0)}s`
                : `${(research.durationMs / 60_000).toFixed(1)}min`}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${research.costUSD.toFixed(3)}
            </span>
            <span>{research.metadata.totalSourcesKept} fontes mantidas</span>
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${
                research.confidenceLevel === 'high'
                  ? 'bg-green-500/20 text-green-400'
                  : research.confidenceLevel === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
              }`}
            >
              Confiança: {research.confidenceLevel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportMarkdown}>
            <Download className="h-3.5 w-3.5" />
            Exportar .md
          </Button>
        </div>

        {/* Report */}
        <Card>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none py-6">
            <MarkdownRenderer
              content={research.reportText}
              totalSources={research.citations.length}
            />
          </CardContent>
        </Card>

        {/* Citations */}
        {research.citations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Fontes ({research.citations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {research.citations.map((c) => (
                  <li key={c.index} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {c.index}
                    </span>
                    <div className="min-w-0">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        {c.title || c.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-xs text-muted-foreground">{c.domain}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metadados</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{research.id}</dd>
              <dt className="text-muted-foreground">Profundidade</dt>
              <dd>{research.depth}</dd>
              <dt className="text-muted-foreground">Modelos usados</dt>
              <dd className="font-mono text-xs">{research.metadata.modelsUsed.join(', ')}</dd>
              <dt className="text-muted-foreground">Fontes encontradas</dt>
              <dd>{research.metadata.totalSources}</dd>
              <dt className="text-muted-foreground">Fontes mantidas</dt>
              <dd>{research.metadata.totalSourcesKept}</dd>
              <dt className="text-muted-foreground">Pipeline</dt>
              <dd>v{research.metadata.pipelineVersion}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
