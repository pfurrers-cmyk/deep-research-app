// lib/db/index.ts — IndexedDB persistence via Dexie.js
import Dexie, { type EntityTable } from 'dexie';

// ============================================================
// STORED TYPES
// ============================================================

export interface StoredFollowUpMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface StoredResearch {
  id: string;
  query: string;
  title: string;
  depth: string;
  domainPreset: string | null;
  modelPreference: string;
  reportText: string;
  reportHtml?: string;
  citations: StoredCitation[];
  subQueries: StoredSubQuery[];
  metadata: StoredMetadata;
  costUSD: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  favorite: boolean;
  tags: string[];
  createdAt: string;
  completedAt: string;
  durationMs: number;
  followUpMessages?: StoredFollowUpMessage[];
}

export interface StoredCitation {
  index: number;
  url: string;
  title: string;
  snippet: string;
  domain: string;
  credibilityTier: 'high' | 'medium' | 'low';
}

export interface StoredSubQuery {
  id: string;
  text: string;
  language: string;
  resultCount: number;
}

export interface StoredMetadata {
  totalSources: number;
  totalSourcesKept: number;
  modelsUsed: string[];
  pipelineVersion: string;
}

export interface StoredCostEntry {
  id?: number;
  researchId: string;
  stage: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  timestamp: string;
}

export interface StoredPrompt {
  id: string;
  prompt: string;
  type: 'research' | 'image' | 'video';
  model: string;
  depth?: string;
  domainPreset?: string | null;
  researchId?: string;
  timestamp: string;
}

export interface StoredGeneration {
  id: string;
  prompt: string;
  model: string;
  type: 'image' | 'video';
  blobData: Blob;
  mediaType: string;
  sizeBytes: number;
  timestamp: string;
}

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: string;
  attachments?: { id: string; name: string; size: number; mimeType: string; extractedText?: string }[];
  artifacts?: { id: string; type: string; title: string; content: string; language: string }[];
}

export interface StoredConversation {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// DATABASE
// ============================================================

class ResearchDB extends Dexie {
  researches!: EntityTable<StoredResearch, 'id'>;
  costs!: EntityTable<StoredCostEntry, 'id'>;
  prompts!: EntityTable<StoredPrompt, 'id'>;
  generations!: EntityTable<StoredGeneration, 'id'>;
  conversations!: EntityTable<StoredConversation, 'id'>;

  constructor() {
    super('deep-research');
    this.version(1).stores({
      researches: 'id, query, title, depth, createdAt, favorite, confidenceLevel, *tags',
      costs: '++id, researchId, stage, modelId, timestamp',
    });
    this.version(2).stores({
      researches: 'id, query, title, depth, createdAt, favorite, confidenceLevel, *tags',
      costs: '++id, researchId, stage, modelId, timestamp',
      prompts: 'id, type, model, timestamp, researchId',
      generations: 'id, type, model, timestamp',
    });
    this.version(3).stores({
      researches: 'id, query, title, depth, createdAt, favorite, confidenceLevel, *tags',
      costs: '++id, researchId, stage, modelId, timestamp',
      prompts: 'id, type, model, timestamp, researchId',
      generations: 'id, type, model, timestamp',
      conversations: 'id, title, model, createdAt, updatedAt',
    });
  }
}

export const db = new ResearchDB();

// ============================================================
// RESEARCH CRUD
// ============================================================

export async function saveResearch(research: StoredResearch): Promise<void> {
  await db.researches.put(research);
}

export async function getResearch(id: string): Promise<StoredResearch | undefined> {
  return db.researches.get(id);
}

export async function getAllResearches(): Promise<StoredResearch[]> {
  return db.researches.orderBy('createdAt').reverse().toArray();
}

export async function searchResearches(query: string): Promise<StoredResearch[]> {
  const q = query.toLowerCase();
  const all = await getAllResearches();
  return all.filter(
    (r) =>
      r.query.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export async function deleteResearch(id: string): Promise<void> {
  await db.researches.delete(id);
  await db.costs.where('researchId').equals(id).delete();
}

export async function toggleFavorite(id: string): Promise<void> {
  const research = await db.researches.get(id);
  if (research) {
    await db.researches.update(id, { favorite: !research.favorite });
  }
}

export async function updateFollowUpMessages(id: string, messages: StoredFollowUpMessage[]): Promise<void> {
  await db.researches.update(id, { followUpMessages: messages });
}

export async function addTag(id: string, tag: string): Promise<void> {
  const research = await db.researches.get(id);
  if (research && !research.tags.includes(tag)) {
    await db.researches.update(id, { tags: [...research.tags, tag] });
  }
}

export async function removeTag(id: string, tag: string): Promise<void> {
  const research = await db.researches.get(id);
  if (research) {
    await db.researches.update(id, { tags: research.tags.filter((t) => t !== tag) });
  }
}

// ============================================================
// COST TRACKING
// ============================================================

export async function saveCostEntries(entries: StoredCostEntry[]): Promise<void> {
  await db.costs.bulkPut(entries);
}

export async function getTotalCostUSD(): Promise<number> {
  const all = await db.costs.toArray();
  return all.reduce((sum, e) => sum + e.costUSD, 0);
}

export async function getCostsByDateRange(
  startDate: string,
  endDate: string
): Promise<StoredCostEntry[]> {
  return db.costs
    .where('timestamp')
    .between(startDate, endDate)
    .toArray();
}

export async function getResearchCount(): Promise<number> {
  return db.researches.count();
}

// ============================================================
// PROMPT HISTORY
// ============================================================

export async function savePrompt(prompt: StoredPrompt): Promise<void> {
  await db.prompts.put(prompt);
}

export async function getAllPrompts(): Promise<StoredPrompt[]> {
  return db.prompts.orderBy('timestamp').reverse().toArray();
}

export async function getPromptsByType(type: StoredPrompt['type']): Promise<StoredPrompt[]> {
  return db.prompts.where('type').equals(type).reverse().sortBy('timestamp');
}

export async function deletePrompt(id: string): Promise<void> {
  await db.prompts.delete(id);
}

// ============================================================
// GENERATED FILES (images/videos)
// ============================================================

export async function saveGeneration(gen: StoredGeneration): Promise<void> {
  await db.generations.put(gen);
}

export async function getAllGenerations(): Promise<StoredGeneration[]> {
  return db.generations.orderBy('timestamp').reverse().toArray();
}

export async function getGenerationsByType(type: 'image' | 'video'): Promise<StoredGeneration[]> {
  return db.generations.where('type').equals(type).reverse().sortBy('timestamp');
}

export async function deleteGeneration(id: string): Promise<void> {
  await db.generations.delete(id);
}

export async function getGenerationCount(): Promise<number> {
  return db.generations.count();
}

// ============================================================
// BULK OPERATIONS
// ============================================================

// ============================================================
// CONVERSATIONS CRUD
// ============================================================

export async function saveConversation(conv: StoredConversation): Promise<void> {
  await db.conversations.put(conv);
}

export async function getConversation(id: string): Promise<StoredConversation | undefined> {
  return db.conversations.get(id);
}

export async function getAllConversations(): Promise<StoredConversation[]> {
  return db.conversations.orderBy('updatedAt').reverse().toArray();
}

export async function deleteConversation(id: string): Promise<void> {
  await db.conversations.delete(id);
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await db.conversations.update(id, { title, updatedAt: new Date().toISOString() });
}

export async function getConversationCount(): Promise<number> {
  return db.conversations.count();
}

export async function clearAllData(): Promise<void> {
  await db.researches.clear();
  await db.costs.clear();
  await db.prompts.clear();
  await db.generations.clear();
  await db.conversations.clear();
}

export async function clearByType(type: 'researches' | 'prompts' | 'generations'): Promise<void> {
  await db[type].clear();
  if (type === 'researches') await db.costs.clear();
}

export async function deleteMultiple(table: 'researches' | 'prompts' | 'generations' | 'conversations', ids: string[]): Promise<void> {
  await db[table].bulkDelete(ids);
  if (table === 'researches') {
    for (const id of ids) {
      await db.costs.where('researchId').equals(id).delete();
    }
  }
}
