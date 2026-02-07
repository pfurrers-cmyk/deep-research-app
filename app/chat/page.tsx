'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare, Plus, Sparkles } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatModelPicker } from '@/components/chat/ChatModelPicker';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const {
    conversations,
    activeConversation,
    messages,
    isStreaming,
    error,
    selectedModel,
    loaded,
    sendMessage,
    cancelStream,
    newChat,
    switchChat,
    deleteChat,
    renameChat,
    setModel,
    exportMarkdown,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversation?.id ?? null}
        onSelect={switchChat}
        onNew={newChat}
        onDelete={deleteChat}
        onRename={renameChat}
        onExport={exportMarkdown}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-4 w-4 text-primary shrink-0" />
            <h2 className="truncate text-sm font-medium">
              {activeConversation?.title ?? 'Pergunte à IA'}
            </h2>
          </div>
          <ChatModelPicker value={selectedModel} onChange={setModel} />
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {!activeConversation || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Pergunte à IA</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-8">
                Converse com qualquer modelo de IA. Faça perguntas, peça resumos, gere código,
                analise dados, produza tarefas — tudo em um só lugar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {[
                  'Explique computação quântica de forma simples',
                  'Escreva um script Python para web scraping',
                  'Resuma as principais tendências de IA em 2026',
                  'Crie um plano de estudos para machine learning',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6 space-y-1">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          onCancel={cancelStream}
        />
      </div>
    </div>
  );
}
