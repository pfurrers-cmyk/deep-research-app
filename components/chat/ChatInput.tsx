'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Square, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatAttachment } from '@/lib/chat/types';

interface ChatInputProps {
  onSend: (content: string, attachments?: ChatAttachment[]) => void;
  isStreaming: boolean;
  onCancel: () => void;
}

export function ChatInput({ onSend, isStreaming, onCancel }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isStreaming) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, attachments, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const att: ChatAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };

      // Extract text for text-based files
      if (file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
        try {
          att.extractedText = await file.text();
        } catch { /* skip */ }
      }

      setAttachments((prev) => [...prev, att]);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          const att: ChatAttachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: `clipboard-${Date.now()}.png`,
            size: file.size,
            mimeType: file.type,
          };
          setAttachments((prev) => [...prev, att]);
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
      <div className="mx-auto max-w-3xl">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map((att) => (
              <span
                key={att.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1 text-xs"
              >
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[150px] truncate">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="rounded-full p-0.5 hover:bg-muted transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="relative flex items-end gap-2 rounded-2xl border border-border/50 bg-muted/20 px-3 py-2 focus-within:border-primary/50 transition-colors">
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-0.5"
            title="Anexar arquivo"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".txt,.md,.csv,.json,.py,.js,.ts,.tsx,.html,.css,.xml,.yaml,.yml,.toml,.pdf,.png,.jpg,.jpeg,.gif,.webp"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envie uma mensagem..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none min-h-[24px] max-h-[200px]"
            disabled={isStreaming}
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              onClick={onCancel}
              className="shrink-0 rounded-lg bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors mb-0.5"
              title="Parar geração"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() && attachments.length === 0}
              className={cn(
                'shrink-0 rounded-lg p-2 transition-colors mb-0.5',
                input.trim() || attachments.length > 0
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              title="Enviar (Enter)"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/40">
          Enter para enviar · Shift+Enter para nova linha · Ctrl+V para colar imagem
        </p>
      </div>
    </div>
  );
}
