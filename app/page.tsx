'use client';

import { useState, useRef } from 'react';
import { Search, Send, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { APP_CONFIG } from '@/config/defaults';
import { useResearch } from '@/hooks/useResearch';
import { useSettings } from '@/hooks/useSettings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ResearchInput } from '@/components/research/ResearchInput';
import { ResearchProgress } from '@/components/research/ResearchProgress';
import { ReportViewer } from '@/components/research/ReportViewer';
import { MarkdownRenderer } from '@/components/research/MarkdownRenderer';
import { Button } from '@/components/ui/button';

interface FollowUpMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const { app } = APP_CONFIG;
  const research = useResearch();
  const { prefs } = useSettings();
  useKeyboardShortcuts();

  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<{ query: string; depth: string; domain: string | null }>({ query: '', depth: 'normal', domain: null });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isIdle = research.status === 'idle';
  const isRunning = research.status === 'running';
  const isComplete = research.status === 'complete';
  const isError = research.status === 'error';

  const handleSubmit = (query: string, depth: Parameters<typeof research.execute>[1], domainPreset: Parameters<typeof research.execute>[2]) => {
    research.execute(query, depth, domainPreset);
    setLastQuery({ query, depth, domain: domainPreset ?? null });
    setFollowUpMessages([]);
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

  const handleFollowUp = async () => {
    if (!followUpInput.trim() || followUpLoading || !research.response) return;

    const question = followUpInput.trim();
    setFollowUpInput('');
    setFollowUpMessages((prev) => [...prev, { role: 'user', content: question }]);
    setFollowUpLoading(true);

    try {
      const reportContext = research.reportText;
      const sourcesContext = research.response.report.citations
        .map((c) => `[${c.index}] ${c.title} — ${c.url}`)
        .join('\n');

      const res = await fetch(`/api/research/${research.response.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, reportContext, sourcesContext }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No body');

      const decoder = new TextDecoder();
      let assistantText = '';

      setFollowUpMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setFollowUpMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantText };
          return updated;
        });
      }

      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setFollowUpMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Erro: ${err instanceof Error ? err.message : 'Falha no follow-up'}` },
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
          <div className="flex flex-col items-center gap-3 pt-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{app.name}</h1>
            <p className="max-w-md text-muted-foreground">
              Ferramenta pessoal de pesquisa profunda automatizada com busca,
              análise, síntese e relatório estruturado com fontes citadas.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Atalhos: <kbd className="rounded border px-1">/</kbd> Focar busca ·{' '}
              <kbd className="rounded border px-1">Ctrl+N</kbd> Nova pesquisa ·{' '}
              <kbd className="rounded border px-1">Ctrl+H</kbd> Biblioteca ·{' '}
              <kbd className="rounded border px-1">Ctrl+,</kbd> Config
            </p>
          </div>
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
          <div className="w-full space-y-4 rounded-xl border border-border bg-card p-4">
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
