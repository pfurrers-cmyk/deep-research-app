'use client';

import { useState } from 'react';
import { Copy, Check, RotateCcw, User, Bot, FileText, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/research/MarkdownRenderer';
import { useAppStore } from '@/lib/store/app-store';
import type { ChatMessage as ChatMessageType } from '@/lib/chat/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const { dispatch } = useAppStore();
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenArtifact = (artifact: NonNullable<ChatMessageType['artifacts']>[0]) => {
    dispatch({
      type: 'ADD_ARTIFACT',
      payload: {
        id: artifact.id,
        type: artifact.type as 'code' | 'markdown' | 'html' | 'json' | 'text' | 'react',
        title: artifact.title,
        versions: [{
          id: `v_${Date.now()}`,
          content: artifact.content,
          language: artifact.language,
          title: artifact.title,
          timestamp: Date.now(),
        }],
        currentVersionIndex: 0,
        createdAt: Date.now(),
      },
    });
    dispatch({ type: 'SET_ACTIVE_ARTIFACT', payload: artifact.id });
    if (!document.querySelector('[data-artifacts-open="true"]')) {
      dispatch({ type: 'TOGGLE_ARTIFACTS_PANEL' });
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-3 py-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'relative max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted/40 rounded-bl-md'
        )}
      >
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.attachments.map((att) => (
              <span
                key={att.id}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px]',
                  isUser ? 'bg-primary-foreground/20' : 'bg-muted'
                )}
              >
                <Paperclip className="h-2.5 w-2.5" />
                {att.name}
              </span>
            ))}
          </div>
        )}

        {/* Text content */}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : message.content ? (
          <div className="prose-chat text-sm">
            <MarkdownRenderer content={message.content} />
          </div>
        ) : isStreaming ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-sm animate-pulse" />
            <span className="opacity-60">Pensando...</span>
          </div>
        ) : null}

        {/* Streaming cursor */}
        {isStreaming && message.content && (
          <span className="inline-block w-0.5 h-4 bg-primary/60 rounded-sm animate-pulse ml-0.5 align-text-bottom" />
        )}

        {/* Artifacts */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.artifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => handleOpenArtifact(artifact)}
                className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 text-left text-xs hover:bg-background hover:border-primary/30 transition-colors"
              >
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{artifact.title}</p>
                  <p className="text-muted-foreground truncate">
                    {artifact.language} · {artifact.content.length} chars
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Actions (assistant only) */}
        {!isUser && !isStreaming && message.content && (
          <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Copiar"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}

        {/* Model tag */}
        {!isUser && message.model && !isStreaming && (
          <p className="mt-1.5 text-[10px] text-muted-foreground/50">
            {message.model.split('/')[1]}
          </p>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/10 mt-0.5">
          <User className="h-4 w-4 text-foreground/70" />
        </div>
      )}
    </div>
  );
}
