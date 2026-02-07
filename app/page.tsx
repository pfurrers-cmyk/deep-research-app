'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, Send, Loader2, RotateCcw, AlertTriangle, Trash2 } from 'lucide-react';
import { APP_CONFIG } from '@/config/defaults';
import { useResearch } from '@/hooks/useResearch';
import { useSettings } from '@/hooks/useSettings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppStore } from '@/lib/store/app-store';
import { saveResearch, updateFollowUpMessages, type StoredResearch } from '@/lib/db';
import { ResearchInput } from '@/components/research/ResearchInput';
import { ResearchProgress } from '@/components/research/ResearchProgress';
import { ReportViewer } from '@/components/research/ReportViewer';
import { ModelRecommendationModal } from '@/components/research/ModelRecommendationModal';
import { CostEstimator } from '@/components/ui/cost-estimator';
import { MarkdownRenderer } from '@/components/research/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import type { FollowUpMessage } from '@/lib/research/types';

export default function Home() {
  const { app } = APP_CONFIG;
  const research = useResearch();
  const { prefs } = useSettings();
  const { state: appState, dispatch } = useAppStore();
  useKeyboardShortcuts();

  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<{ query: string; depth: string; domain: string | null }>({ query: '', depth: 'normal', domain: null });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{ query: string; depth: Parameters<typeof research.execute>[1]; domain: Parameters<typeof research.execute>[2] } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isIdle = research.status === 'idle';
  const isRunning = research.status === 'running';
  const isComplete = research.status === 'complete';
  const isError = research.status === 'error';

  const handleSubmit = (query: string, depth: Parameters<typeof research.execute>[1], domainPreset: Parameters<typeof research.execute>[2]) => {
    // Show recommendation modal before executing
    setPendingSubmit({ query, depth, domain: domainPreset });
    setShowRecommendation(true);
  };

  const executeResearch = (customModelMap?: Record<string, string>) => {
    if (!pendingSubmit) return;
    const { query, depth, domain } = pendingSubmit;
    // If custom models selected from recommendation, store them temporarily
    if (customModelMap && Object.keys(customModelMap).length > 0) {
      // Save to sessionStorage for TaskManager to pick up
      sessionStorage.setItem('__recommended_models', JSON.stringify(customModelMap));
    } else {
      sessionStorage.removeItem('__recommended_models');
    }
    research.execute(query, depth, domain);
    setLastQuery({ query, depth, domain: domain ?? null });
    setFollowUpMessages([]);
    dispatch({ type: 'SET_RESEARCH', payload: { savedToDb: false } });
    setShowRecommendation(false);
    setPendingSubmit(null);
  };

  const handleRetry = () => {
    if (lastQuery.query) {
      research.execute(
        lastQuery.query,
        lastQuery.depth as Parameters<typeof research.execute>[1],
        lastQuery.domain as Parameters<typeof research.execute>[2]
      );
    }
  };

  const handleNewResearch = useCallback(() => {
    if (isComplete && research.reportText && !appState.research.savedToDb) {
      setShowResetConfirm(true);
    } else {
      research.reset();
      setFollowUpMessages([]);
      setFollowUpInput('');
      setLastQuery({ query: '', depth: 'normal', domain: null });
      setShowResetConfirm(false);
    }
  }, [isComplete, research, appState.research.savedToDb]);

  const handleSaveAndReset = async () => {
    if (research.response) {
      try {
        const r = research.response;
        const stored: StoredResearch = {
          id: r.id,
          query: r.query,
          title: r.report.title,
          depth: lastQuery.depth,
          domainPreset: lastQuery.domain,
          modelPreference: prefs.modelPreference,
          reportText: research.reportText,
          citations: r.report.citations.map((c) => ({
            index: c.index, url: c.url, title: c.title,
            snippet: c.snippet ?? '', domain: c.domain,
            credibilityTier: 'medium' as const,
          })),
          subQueries: research.subQueries.map((q, i) => ({
            id: `sq-${i}`, text: typeof q === 'string' ? q : q.text, language: typeof q === 'string' ? 'auto' : (q.language ?? 'auto'), resultCount: 0,
          })),
          metadata: {
            totalSources: research.sourcesFound,
            totalSourcesKept: research.sourcesKept,
            modelsUsed: r.metadata?.modelsUsed ?? [],
            pipelineVersion: '0.1.0',
          },
          costUSD: research.costUSD,
          confidenceLevel: 'medium',
          favorite: false,
          tags: [],
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: r.metadata?.durationMs ?? 0,
        };
        await saveResearch(stored);
        dispatch({ type: 'MARK_SAVED' });
      } catch (e) {
        console.error('Failed to save research:', e);
      }
    }
    research.reset();
    setFollowUpMessages([]);
    setFollowUpInput('');
    setLastQuery({ query: '', depth: 'normal', domain: null });
    setShowResetConfirm(false);
  };

  const handleFollowUp = async () => {
    if (!followUpInput.trim() || followUpLoading || !research.response) return;

    const question = followUpInput.trim();
    setFollowUpInput('');
    const userMsg: FollowUpMessage = { id: `fu-${Date.now()}`, role: 'user', content: question, timestamp: new Date().toISOString() };
    setFollowUpMessages((prev) => [...prev, userMsg]);
    setFollowUpLoading(true);

    try {
      const reportContext = research.reportText;
      const sourcesContext = research.response.report.citations
        .map((c) => `[${c.index}] ${c.title} — ${c.url}`)
        .join('\n');

      // Send full message history for multi-turn context
      const messageHistory = followUpMessages
        .filter((m) => m.content.trim())
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`/api/research/${research.response.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, reportContext, sourcesContext, messageHistory }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No body');

      const decoder = new TextDecoder();
      let assistantText = '';

      const assistantMsg: FollowUpMessage = { id: `fa-${Date.now()}`, role: 'assistant', content: '', timestamp: new Date().toISOString() };
      setFollowUpMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setFollowUpMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantText };
          return updated;
        });
      }

      // Persist follow-up messages to IndexedDB
      const allMsgs = [...followUpMessages, userMsg, { ...assistantMsg, content: assistantText }];
      updateFollowUpMessages(
        research.response!.id,
        allMsgs.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp }))
      ).catch(() => {});

      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setFollowUpMessages((prev) => [
        ...prev,
        { id: `fe-${Date.now()}`, role: 'assistant', content: `Erro: ${err instanceof Error ? err.message : 'Falha no follow-up'}`, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setFollowUpLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-8">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6">
        {/* Hero — only when idle */}
        {isIdle && (
          <div className="flex flex-col items-center gap-3 pt-12 text-center animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{app.name}</h1>
            <p className="max-w-md text-muted-foreground">
              Ferramenta pessoal de pesquisa profunda automatizada com busca,
              análise, síntese e relatório estruturado com fontes citadas.
            </p>
          </div>
        )}

        {/* Model Recommendation Modal */}
        <ModelRecommendationModal
          open={showRecommendation}
          onClose={() => { setShowRecommendation(false); setPendingSubmit(null); }}
          onSelect={(models) => executeResearch(models)}
          onSkip={() => executeResearch()}
          prompt={pendingSubmit?.query ?? ''}
          depth={pendingSubmit?.depth ?? 'normal'}
          domain={pendingSubmit?.domain ?? null}
        />

        {/* Reset confirmation modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-2xl">
              <h3 className="text-lg font-semibold">Nova Pesquisa</h3>
              <p className="text-sm text-muted-foreground">
                A pesquisa atual ainda não foi salva no histórico. O que deseja fazer?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="outline" size="sm" onClick={() => { research.reset(); setFollowUpMessages([]); setFollowUpInput(''); setLastQuery({ query: '', depth: 'normal', domain: null }); setShowResetConfirm(false); }} className="flex-1 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  Descartar
                </Button>
                <Button size="sm" onClick={handleSaveAndReset} className="flex-1">
                  Salvar e Nova
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* New Research button — visible when complete */}
        {(isComplete || isError) && (
          <Button variant="outline" size="sm" onClick={handleNewResearch} className="self-start">
            <RotateCcw className="h-3.5 w-3.5" />
            Nova Pesquisa
          </Button>
        )}

        {/* Input — always visible */}
        <ResearchInput
          onSubmit={handleSubmit}
          isLoading={isRunning}
          onCancel={research.cancel}
          initialDepth={prefs.defaultDepth}
        />

        {/* Error with retry */}
        {isError && research.error && (
          <div className="w-full space-y-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="flex-1 text-sm text-destructive">{research.error}</div>
            </div>
            {lastQuery.query && (
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RotateCcw className="h-3.5 w-3.5" />
                Tentar Novamente
              </Button>
            )}
          </div>
        )}

        {/* Progress — visible when running */}
        {isRunning && (
          <ResearchProgress
            currentStage={research.currentStage}
            subQueries={research.subQueries}
            sourcesFound={research.sourcesFound}
            sourcesKept={research.sourcesKept}
            costUSD={research.costUSD}
          />
        )}

        {/* Report — visible when streaming or complete */}
        {(isRunning || isComplete) && research.reportText && (
          <ReportViewer
            reportText={research.reportText}
            metadata={research.metadata}
            response={research.response}
            isStreaming={isRunning}
          />
        )}

        {/* Follow-up Chat */}
        {isComplete && research.response && (
          <div data-select-scope="followup" tabIndex={0} className="w-full space-y-4 rounded-xl border border-border bg-card p-4 focus:outline-none">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Perguntas de Follow-up
            </h3>

            {/* Messages */}
            {followUpMessages.length > 0 && (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {followUpMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-sm ${
                      msg.role === 'user'
                        ? 'ml-8 bg-primary/10'
                        : 'mr-8 bg-muted'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownRenderer content={msg.content} totalSources={0} />
                    ) : (
                      msg.content
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFollowUp();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                placeholder={APP_CONFIG.strings.placeholders.followUpInput}
                disabled={followUpLoading}
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!followUpInput.trim() || followUpLoading}
                className="h-10"
              >
                {followUpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
