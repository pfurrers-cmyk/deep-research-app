// lib/store/chat-store.ts — Singleton store for chat conversations (persists across navigation)
import type { ChatMessage, ChatConversation, ChatAttachment, ChatArtifact } from '@/lib/chat/types';
import { saveConversation, getAllConversations, deleteConversation as dbDeleteConv, updateConversationTitle as dbUpdateTitle } from '@/lib/db';
import type { StoredConversation } from '@/lib/db';
import { loadPreferences } from '@/lib/config/settings-store';

// ============================================================
// TYPES
// ============================================================

export interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  error: string | null;
  selectedModel: string;
  loaded: boolean;
}

type Listener = () => void;

function generateId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function msgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ============================================================
// ARTIFACT DETECTION
// ============================================================

const ARTIFACT_REGEX = /<artifact\s+type="([^"]+)"\s+language="([^"]*)"\s+title="([^"]+)">([\s\S]*?)<\/artifact>/g;

function extractArtifacts(text: string): { cleanText: string; artifacts: ChatArtifact[] } {
  const artifacts: ChatArtifact[] = [];
  const cleanText = text.replace(ARTIFACT_REGEX, (_match, type, language, title, content) => {
    const artifact: ChatArtifact = {
      id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: type as ChatArtifact['type'],
      title,
      content: content.trim(),
      language: language || 'text',
    };
    artifacts.push(artifact);
    return `\n\n**[Artifact: ${title}]**\n`;
  });
  return { cleanText, artifacts };
}

// ============================================================
// DEFAULT STATE
// ============================================================

const DEFAULT_MODEL = 'openai/gpt-4.1-mini';

const DEFAULT_STATE: ChatState = {
  conversations: [],
  activeConversationId: null,
  isStreaming: false,
  error: null,
  selectedModel: DEFAULT_MODEL,
  loaded: false,
};

// ============================================================
// SINGLETON
// ============================================================

class ChatStore {
  private _state: ChatState = { ...DEFAULT_STATE };
  private _listeners = new Set<Listener>();
  private _abortController: AbortController | null = null;

  // --- Subscribe / Snapshot ---

  subscribe = (listener: Listener): (() => void) => {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  };

  private _notify() {
    // Create new reference for useSyncExternalStore
    this._state = { ...this._state };
    this._listeners.forEach((l) => l());
  }

  getSnapshot = (): ChatState => this._state;

  // --- Load from DB ---

  async loadConversations() {
    if (this._state.loaded) return;
    try {
      const stored = await getAllConversations();
      const conversations: ChatConversation[] = stored.map((s) => ({
        id: s.id,
        title: s.title,
        messages: s.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          model: m.model,
          timestamp: m.timestamp,
          attachments: m.attachments as ChatAttachment[] | undefined,
          artifacts: m.artifacts as ChatArtifact[] | undefined,
        })),
        model: s.model,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
      this._state.conversations = conversations;
      this._state.loaded = true;
      // Load preferred model from settings
      const prefs = loadPreferences();
      const prefsAny = prefs as unknown as Record<string, unknown>;
      if (prefsAny.defaultChatModel && typeof prefsAny.defaultChatModel === 'string') {
        this._state.selectedModel = prefsAny.defaultChatModel;
      }
      this._notify();
    } catch (e) {
      console.error('[ChatStore] Failed to load conversations:', e);
    }
  }

  // --- Model ---

  setModel(modelId: string) {
    this._state.selectedModel = modelId;
    this._notify();
  }

  // --- Conversation management ---

  newConversation(): string {
    const id = generateId();
    const now = new Date().toISOString();
    const conv: ChatConversation = {
      id,
      title: 'Nova conversa',
      messages: [],
      model: this._state.selectedModel,
      createdAt: now,
      updatedAt: now,
    };
    this._state.conversations = [conv, ...this._state.conversations];
    this._state.activeConversationId = id;
    this._notify();
    return id;
  }

  switchConversation(id: string) {
    const conv = this._state.conversations.find((c) => c.id === id);
    if (!conv) return;
    this._state.activeConversationId = id;
    this._state.selectedModel = conv.model;
    this._notify();
  }

  async deleteConversation(id: string) {
    this._state.conversations = this._state.conversations.filter((c) => c.id !== id);
    if (this._state.activeConversationId === id) {
      this._state.activeConversationId = this._state.conversations[0]?.id ?? null;
    }
    this._notify();
    try {
      await dbDeleteConv(id);
    } catch (e) {
      console.error('[ChatStore] Delete failed:', e);
    }
  }

  async renameConversation(id: string, title: string) {
    const conv = this._state.conversations.find((c) => c.id === id);
    if (!conv) return;
    conv.title = title;
    conv.updatedAt = new Date().toISOString();
    this._notify();
    try {
      await dbUpdateTitle(id, title);
    } catch (e) {
      console.error('[ChatStore] Rename failed:', e);
    }
  }

  // --- Active conversation helper ---

  private _getActiveConv(): ChatConversation | null {
    if (!this._state.activeConversationId) return null;
    return this._state.conversations.find((c) => c.id === this._state.activeConversationId) ?? null;
  }

  // --- Send message ---

  async sendMessage(content: string, attachments?: ChatAttachment[]) {
    // Cancel any ongoing stream
    this.cancelStream();

    // Ensure we have an active conversation
    if (!this._state.activeConversationId) {
      this.newConversation();
    }

    const conv = this._getActiveConv();
    if (!conv) return;

    // Update model on conversation
    conv.model = this._state.selectedModel;

    // Build attachment context
    let attachmentContext = '';
    if (attachments && attachments.length > 0) {
      attachmentContext = attachments
        .filter((a) => a.extractedText)
        .map((a) => `--- ARQUIVO: ${a.name} (${a.mimeType}) ---\n${a.extractedText}`)
        .join('\n\n');
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: msgId(),
      role: 'user',
      content,
      attachments,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    // Add assistant placeholder
    const assistantMsg: ChatMessage = {
      id: msgId(),
      role: 'assistant',
      content: '',
      model: this._state.selectedModel,
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    conv.messages.push(assistantMsg);

    this._state.isStreaming = true;
    this._state.error = null;
    this._notify();

    // Auto-generate title from first message
    if (conv.messages.filter((m) => m.role === 'user').length === 1) {
      conv.title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
      this._notify();
    }

    // Build messages for API (exclude streaming placeholder)
    const apiMessages = conv.messages
      .filter((m) => m.role !== 'assistant' || m.content.length > 0)
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));

    // Stream response
    const controller = new AbortController();
    this._abortController = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: this._state.selectedModel,
          attachmentContext: attachmentContext || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMsg.content += chunk;
        this._notify();
      }

      // Post-process: extract artifacts
      const { cleanText, artifacts } = extractArtifacts(assistantMsg.content);
      if (artifacts.length > 0) {
        assistantMsg.content = cleanText;
        assistantMsg.artifacts = artifacts;
      }

      assistantMsg.isStreaming = false;
      conv.updatedAt = new Date().toISOString();
      this._state.isStreaming = false;
      this._notify();

      // Save to DB
      this._saveConversation(conv);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        assistantMsg.isStreaming = false;
        this._state.isStreaming = false;
        this._notify();
        return;
      }
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[ChatStore] Stream error:', msg);
      assistantMsg.content = assistantMsg.content || '';
      assistantMsg.isStreaming = false;
      this._state.isStreaming = false;
      this._state.error = msg;
      this._notify();
    }
  }

  cancelStream() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this._state.isStreaming) {
      this._state.isStreaming = false;
      // Mark any streaming messages as done
      const conv = this._getActiveConv();
      if (conv) {
        const last = conv.messages[conv.messages.length - 1];
        if (last?.isStreaming) {
          last.isStreaming = false;
        }
      }
      this._notify();
    }
  }

  // --- Persistence ---

  private async _saveConversation(conv: ChatConversation) {
    try {
      const stored: StoredConversation = {
        id: conv.id,
        title: conv.title,
        messages: conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          model: m.model,
          timestamp: m.timestamp,
          attachments: m.attachments,
          artifacts: m.artifacts,
        })),
        model: conv.model,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
      await saveConversation(stored);
    } catch (e) {
      console.error('[ChatStore] Save failed:', e);
    }
  }

  // --- Export ---

  exportAsMarkdown(conversationId: string): string | null {
    const conv = this._state.conversations.find((c) => c.id === conversationId);
    if (!conv) return null;
    let md = `# ${conv.title}\n\n`;
    md += `**Modelo:** ${conv.model}\n**Criado em:** ${new Date(conv.createdAt).toLocaleString()}\n\n---\n\n`;
    for (const msg of conv.messages) {
      const role = msg.role === 'user' ? '**Você**' : '**Assistente**';
      md += `### ${role}\n\n${msg.content}\n\n`;
      if (msg.artifacts?.length) {
        for (const art of msg.artifacts) {
          md += `\`\`\`${art.language}\n// ${art.title}\n${art.content}\n\`\`\`\n\n`;
        }
      }
      md += '---\n\n';
    }
    return md;
  }
}

export const chatStore = new ChatStore();
