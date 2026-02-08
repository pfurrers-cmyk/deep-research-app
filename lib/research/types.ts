// lib/research/types.ts — Tipos TypeScript para todo o pipeline de pesquisa

import type { AppConfig, DepthPreset, DomainPreset, ExportFormat } from '@/config/defaults';
import type { ProcessingMode } from '@/config/model-source-limits';
export type { ProcessingMode };

// ============================================================
// UTILITY TYPES
// ============================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================
// REQUEST / INPUT
// ============================================================

export interface ResearchAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  category: 'image' | 'document' | 'data' | 'video' | 'audio';
  purpose: string;
  extractedText?: string;
  extractedData?: {
    preview?: Record<string, unknown>[];
    columns?: string[];
    totalRows?: number;
  };
  base64?: string;
  metadata?: {
    width?: number;
    height?: number;
    pages?: number;
    wordCount?: number;
  };
}

export interface ResearchRequest {
  query: string;
  depth: DepthPreset;
  modelPreference: 'auto' | 'economy' | 'premium' | 'custom';
  domainPreset: DomainPreset | null;
  templateId?: string;
  configOverrides?: DeepPartial<AppConfig>;
  customModelMap?: Partial<Record<PipelineStageName, string>>;
  customPrompts?: {
    decomposition?: string;
    evaluation?: string;
    synthesis?: string;
  };
  sourceConfig?: {
    mode: 'manual';
    fetchMin: number;
    fetchMax: number;
    keepMin: number;
    keepMax: number;
  };
  comparativeTopics?: string[];
  timeMachineFilter?: {
    recencyFilter?: 'day' | 'week' | 'month' | 'year';
    afterDate?: string;
    beforeDate?: string;
  };
  attachments?: ResearchAttachment[];
  proSettings?: {
    writingStyle?: string;
    detailLevel?: string;
    reasoningLanguage?: string;
    citationFormat?: string;
    evaluationFramework?: string;
    researchMode?: string;
    enabledSections?: string[];
    sectionOrder?: string[];
    advancedFilters?: {
      recency?: null | 'day' | 'week' | 'month' | 'year';
      sourceTypes?: string[];
      languages?: string[];
      allowlist?: string[];
      blocklist?: string[];
    };
    exportFormat?: string;
  };
  tccSettings?: {
    titulo?: string;
    autor?: string;
    instituicao?: string;
    curso?: string;
    orientador?: string;
    cidade?: string;
    ano?: string;
    minFontes?: number;
    minPaginas?: number;
    tipoPesquisa?: string;
    areaConhecimento?: string;
    abordagem?: string;
    nivelAcademico?: string;
    dedicatoria?: string;
    agradecimentos?: string;
    epigrafe?: string;
    epigrafeAutor?: string;
    enabledSections?: string[];
  };
}

// ============================================================
// PIPELINE STAGES
// ============================================================

export type PipelineStageName =
  | 'decomposition'
  | 'search'
  | 'evaluation'
  | 'extraction'
  | 'synthesis'
  | 'postProcessing'
  | 'researchLoop'
  | 'devilsAdvocate'
  | 'mapBatch'
  | 'reduce'
  | 'enrich'
  | 'verify';

export type PipelineStageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'skipped';

export interface PipelineStageInfo {
  name: PipelineStageName;
  status: PipelineStageStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  progress: number; // 0-1
}

// ============================================================
// SUB-QUERIES
// ============================================================

export interface SubQuery {
  id: string;
  text: string;
  textEn?: string;
  justification: string;
  language: string;
  priority?: 'high' | 'medium' | 'low';
  angle?: 'conceptual' | 'historical' | 'comparative' | 'practical' | 'critical' | 'quantitative' | 'regulatory';
  searchTerms?: string[];
  searchTermsPt?: string[];
  expectedSourceType?: 'academic' | 'news' | 'official' | 'technical' | 'opinion';
  status: 'pending' | 'searching' | 'completed' | 'error';
  resultCount?: number;
}

// ============================================================
// SEARCH RESULTS & SOURCES
// ============================================================

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  content: string;
  source: string;
  publishedDate?: string;
  author?: string;
  language?: string;
  subQueryId: string;
}

export interface EvaluatedSource extends SearchResult {
  relevanceScore: number;   // 0-1
  recencyScore: number;     // 0-1
  authorityScore: number;   // 0-1
  biasScore?: number;       // 0-1 (neutrality)
  weightedScore: number;    // 0-1 (combined)
  credibilityScore: number; // 0-1
  credibilityTier: 'high' | 'medium' | 'low';
  sourceTier?: 'primary' | 'secondary' | 'tertiary';
  rationale?: string;       // LLM justification for scores
  contradicts?: string;     // URL of contradicting source, if any
  flagged: boolean;         // true if below flagBelowThreshold
  kept: boolean;            // true if passed relevanceThreshold
}

// ============================================================
// REPORT
// ============================================================

export type ReportSectionType =
  | 'executive_summary'
  | 'context'
  | 'key_findings'
  | 'analysis'
  | 'conclusion'
  | 'sources'
  | 'counterarguments'
  | 'deepening'
  | 'timeline'
  | 'comparison_table';

export interface ReportSection {
  id: string;
  type: ReportSectionType;
  title: string;
  content: string;
  confidenceScore: number; // 0-1
  sourceIndices: number[]; // indices into citations array
}

export interface Citation {
  index: number;
  url: string;
  title: string;
  snippet: string;
  domain: string;
  credibilityScore: number;
  credibilityTier: 'high' | 'medium' | 'low';
  publishedDate?: string;
  author?: string;
}

export interface Report {
  title: string;
  sections: ReportSection[];
  citations: Citation[];
  generatedAt: string;
  modelUsed: string;
  outputLanguage: string;
}

// ============================================================
// CONFIDENCE
// ============================================================

export interface ConfidenceScore {
  overall: number; // 0-1
  bySection: Record<string, number>;
  level: 'high' | 'medium' | 'low';
  suggestions: string[];
}

// ============================================================
// COST TRACKING
// ============================================================

export interface CostEntry {
  stage: PipelineStageName | 'search';
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  timestamp: string;
}

export interface CostBreakdown {
  entries: CostEntry[];
  totalCostUSD: number;
  byStage: Record<string, number>;
  byModel: Record<string, number>;
}

// ============================================================
// RESEARCH RESPONSE (complete result)
// ============================================================

export interface ResearchResponse {
  id: string;
  query: string;
  report: Report;
  sources: EvaluatedSource[];
  subQueries: SubQuery[];
  metadata: ResearchMetadata;
  confidence: ConfidenceScore;
  cost: CostBreakdown;
}

export interface ResearchMetadata {
  id: string;
  query: string;
  title: string;
  depth: DepthPreset;
  domainPreset: DomainPreset | null;
  modelPreference: string;
  processingMode?: ProcessingMode;
  totalSources: number;
  totalSourcesKept: number;
  totalSourcesFiltered: number;
  durationMs: number;
  modelsUsed: string[];
  createdAt: string;
  completedAt: string;
  pipelineVersion: string;
  synthesizer?: 'tcc' | 'standard';
  researchMode?: string;
  proSettingsReceived?: boolean;
  tccSettingsReceived?: boolean;
}

// ============================================================
// PIPELINE EVENTS (SSE streaming)
// ============================================================

export type PipelineEvent =
  | StageEvent
  | QueriesEvent
  | SourceEvent
  | EvaluationEvent
  | TextDeltaEvent
  | ConfidenceEvent
  | CostEvent
  | MetadataEvent
  | CompleteEvent
  | ErrorEvent
  | ProcessingModeEvent
  | SectionProgressEvent;

export interface SectionProgressEvent {
  type: 'section-progress';
  sectionId: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  progress?: number;
}

export interface ProcessingModeEvent {
  type: 'processing-mode';
  mode: ProcessingMode;
  label: string;
  costMultiplier: number;
  latencyMultiplier: number;
}

export interface StageEvent {
  type: 'stage';
  stage: string;
  status: PipelineStageStatus;
  progress: number; // 0-1
  message: string;
}

export interface QueriesEvent {
  type: 'queries';
  data: SubQuery[];
}

export interface SourceEvent {
  type: 'source';
  data: {
    url: string;
    title: string;
    relevance: number;
    credibility: number;
    subQueryId: string;
  };
}

export interface EvaluationEvent {
  type: 'evaluation';
  data: {
    totalFound: number;
    kept: number;
    filtered: number;
  };
}

export interface TextDeltaEvent {
  type: 'text-delta';
  text: string;
}

export interface ConfidenceEvent {
  type: 'confidence';
  data: {
    section: string;
    score: number;
  };
}

export interface CostEvent {
  type: 'cost';
  data: CostEntry;
}

export interface MetadataEvent {
  type: 'metadata';
  data: ResearchMetadata;
}

export interface CompleteEvent {
  type: 'complete';
  data: ResearchResponse;
}

export interface ErrorEvent {
  type: 'error';
  error: {
    code: string;
    message: string;
    stage?: string;
    recoverable: boolean;
  };
}

// ============================================================
// FOLLOW-UP
// ============================================================

export interface FollowUpMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  costUSD?: number;
}

export interface FollowUpContext {
  researchId: string;
  report: Report;
  sources: EvaluatedSource[];
  messages: FollowUpMessage[];
}

// ============================================================
// HISTORY
// ============================================================

export interface ResearchHistoryItem {
  id: string;
  query: string;
  title: string;
  depth: DepthPreset;
  domainPreset: DomainPreset | null;
  createdAt: string;
  completedAt: string;
  favorite: boolean;
  totalSources: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  totalCostUSD: number;
  durationMs: number;
  tags: string[];
}

// ============================================================
// TEMPLATES
// ============================================================

export interface ResearchTemplate {
  id: string;
  label: string;
  template: string;
  depth: DepthPreset;
  domainPreset: DomainPreset | null;
  reportSections: string[];
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// COMPARATIVE MODE
// ============================================================

export interface ComparativeResearch {
  topics: string[];
  results: ResearchResponse[];
  comparisonTable: ComparisonRow[];
  differenceAnalysis: string;
}

export interface ComparisonRow {
  aspect: string;
  values: Record<string, string>; // topic -> value
}

// ============================================================
// RESEARCH DIFF
// ============================================================

export interface ResearchDiff {
  originalId: string;
  newId: string;
  newSources: Citation[];
  removedSources: Citation[];
  updatedSections: Array<{
    sectionType: string;
    changeType: 'added' | 'removed' | 'modified';
    summary: string;
  }>;
  overallChangeSummary: string;
}

// ============================================================
// TIMELINE
// ============================================================

export interface TimelineEntry {
  date: string;
  title: string;
  description: string;
  sourceIndices: number[];
}

// ============================================================
// RESEARCH GRAPH
// ============================================================

export interface GraphNode {
  id: string;
  type: 'query' | 'sub-query' | 'source';
  label: string;
  relevanceScore?: number;
  url?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface ResearchGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ============================================================
// USER SETTINGS
// ============================================================

export interface UserSettings {
  overrides: DeepPartial<AppConfig>;
  updatedAt: string;
}
