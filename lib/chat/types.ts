// lib/chat/types.ts — Types for the "Pergunte à IA" chat feature

// ============================================================
// CHAT MESSAGE
// ============================================================

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  extractedText?: string;
  thumbnail?: string;
}

export interface ChatArtifact {
  id: string;
  type: 'code' | 'markdown' | 'html' | 'react' | 'json' | 'text';
  title: string;
  content: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
  artifacts?: ChatArtifact[];
  model?: string;
  timestamp: string;
  isStreaming?: boolean;
}

// ============================================================
// CONVERSATION
// ============================================================

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// STREAM EVENTS (SSE from /api/chat)
// ============================================================

export type ChatStreamEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'artifact-start'; artifact: { id: string; type: ChatArtifact['type']; title: string; language: string } }
  | { type: 'artifact-delta'; id: string; text: string }
  | { type: 'artifact-end'; id: string }
  | { type: 'done'; usage?: { promptTokens: number; completionTokens: number } }
  | { type: 'error'; message: string };

// ============================================================
// API REQUEST / RESPONSE
// ============================================================

export interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  model: string;
  systemPrompt?: string;
  attachmentContext?: string;
}
