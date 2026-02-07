'use client';

import { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Pencil, Download, MoreHorizontal, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatConversation } from '@/lib/chat/types';

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onExport: (id: string) => string | null;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem. atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function groupByDate(conversations: ChatConversation[]): { label: string; items: ChatConversation[] }[] {
  const groups: Record<string, ChatConversation[]> = {};

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays === 0) label = 'Hoje';
    else if (diffDays === 1) label = 'Ontem';
    else if (diffDays < 7) label = 'Última semana';
    else if (diffDays < 30) label = 'Último mês';
    else label = 'Anteriores';

    if (!groups[label]) groups[label] = [];
    groups[label].push(conv);
  }

  const order = ['Hoje', 'Ontem', 'Última semana', 'Último mês', 'Anteriores'];
  return order.filter((l) => groups[l]).map((label) => ({ label, items: groups[label] }));
}

export function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, onRename, onExport }: ChatSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const filtered = search
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const groups = groupByDate(filtered);

  const handleRenameStart = (conv: ChatConversation) => {
    setRenaming(conv.id);
    setRenameValue(conv.title);
    setMenuOpen(null);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      onRename(id, renameValue.trim());
    }
    setRenaming(null);
  };

  const handleExport = (id: string) => {
    const md = onExport(id);
    if (!md) return;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${id.slice(0, 12)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(null);
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-r border-border/50 bg-muted/10 px-2 py-3 w-12 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Expandir sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNew}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          title="Nova conversa"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-border/50 bg-muted/10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo chat
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Recolher sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-background py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground/60">Nenhuma conversa ainda</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
              {group.label}
            </p>
            {group.items.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group relative flex items-center rounded-lg px-2 py-2 text-sm transition-colors cursor-pointer',
                  conv.id === activeId
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 mr-2 opacity-50" />

                {renaming === conv.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(conv.id);
                      if (e.key === 'Escape') setRenaming(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 bg-transparent text-xs outline-none border-b border-primary"
                  />
                ) : (
                  <span className="flex-1 truncate text-xs">{conv.title}</span>
                )}

                {/* Context menu button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === conv.id ? null : conv.id);
                  }}
                  className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                {/* Dropdown menu */}
                {menuOpen === conv.id && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-popover py-1 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleRenameStart(conv)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3 w-3" /> Renomear
                    </button>
                    <button
                      onClick={() => handleExport(conv.id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                    >
                      <Download className="h-3 w-3" /> Exportar MD
                    </button>
                    <button
                      onClick={() => { onDelete(conv.id); setMenuOpen(null); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
