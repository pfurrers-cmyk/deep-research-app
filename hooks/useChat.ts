// hooks/useChat.ts — Reactive hook for the chat store
'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { chatStore, type ChatState } from '@/lib/store/chat-store';
import type { ChatAttachment, ChatConversation, ChatMessage } from '@/lib/chat/types';

export function useChat() {
  const state = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getSnapshot
  );

  // Load conversations from IndexedDB on first mount
  useEffect(() => {
    chatStore.loadConversations();
  }, []);

  const sendMessage = useCallback(
    (content: string, attachments?: ChatAttachment[]) => {
      chatStore.sendMessage(content, attachments);
    },
    []
  );

  const cancelStream = useCallback(() => chatStore.cancelStream(), []);

  const newChat = useCallback(() => chatStore.newConversation(), []);

  const switchChat = useCallback(
    (id: string) => chatStore.switchConversation(id),
    []
  );

  const deleteChat = useCallback(
    (id: string) => chatStore.deleteConversation(id),
    []
  );

  const renameChat = useCallback(
    (id: string, title: string) => chatStore.renameConversation(id, title),
    []
  );

  const setModel = useCallback(
    (modelId: string) => chatStore.setModel(modelId),
    []
  );

  const exportMarkdown = useCallback(
    (id: string) => chatStore.exportAsMarkdown(id),
    []
  );

  // Derived data
  const activeConversation: ChatConversation | null =
    state.conversations.find((c) => c.id === state.activeConversationId) ?? null;

  const messages: ChatMessage[] = activeConversation?.messages ?? [];

  return {
    // State
    conversations: state.conversations,
    activeConversation,
    activeConversationId: state.activeConversationId,
    messages,
    isStreaming: state.isStreaming,
    error: state.error,
    selectedModel: state.selectedModel,
    loaded: state.loaded,

    // Actions
    sendMessage,
    cancelStream,
    newChat,
    switchChat,
    deleteChat,
    renameChat,
    setModel,
    exportMarkdown,
  };
}
