/**
 * TaskManager — Singleton que mantém tarefas (SSE, fetch) vivas entre navegações.
 *
 * O estado vive FORA do React. Hooks usam useSyncExternalStore para ler.
 * Navegar entre páginas NÃO mata as tarefas em andamento.
 */

import type { DepthPreset, DomainPreset } from '@/config/defaults';
import type {
  PipelineEvent,
  SubQuery,
  ResearchMetadata,
  ResearchResponse,
  ResearchAttachment,
} from '@/lib/research/types';
import { saveResearch, savePrompt, saveGeneration, type StoredResearch, type StoredPrompt, type StoredGeneration } from '@/lib/db';
import { loadPreferences } from '@/lib/config/settings-store';
import { debug } from '@/lib/utils/debug-logger';

// ============================================================
// TYPES
// ============================================================

export type TaskStatus = 'idle' | 'running' | 'complete' | 'error';

export interface StageInfo {
  stage: string;
  status: string;
  progress: number;
  message: string;
}

export interface ResearchTaskState {
  status: TaskStatus;
  currentStage: StageInfo | null;
  subQueries: SubQuery[];
  sourcesFound: number;
  sourcesKept: number;
  reportText: string;
  metadata: ResearchMetadata | null;
  costUSD: number;
  response: ResearchResponse | null;
  error: string | null;
  lastQuery: { query: string; depth: string; domain: string | null } | null;
}

export interface GenerateTaskState {
  status: TaskStatus;
  mode: 'image' | 'video' | null;
  resultUrl: string | null;
  resultType: 'image' | 'video' | null;
  error: string | null;
  model: string | null;
}

// ============================================================
// DEFAULT STATES
// ============================================================

const DEFAULT_RESEARCH: ResearchTaskState = {
  status: 'idle',
  currentStage: null,
  subQueries: [],
  sourcesFound: 0,
  sourcesKept: 0,
  reportText: '',
  metadata: null,
  costUSD: 0,
  response: null,
  error: null,
  lastQuery: null,
};

const DEFAULT_GENERATE: GenerateTaskState = {
  status: 'idle',
  mode: null,
  resultUrl: null,
  resultType: null,
  error: null,
  model: null,
};

// ============================================================
// SINGLETON
// ============================================================

type Listener = () => void;

class TaskManager {
  private _research: ResearchTaskState = { ...DEFAULT_RESEARCH };
  private _generate: GenerateTaskState = { ...DEFAULT_GENERATE };
  private _listeners = new Set<Listener>();
  private _abortResearch: AbortController | null = null;
  private _abortGenerate: AbortController | null = null;

  // --- Subscribe / Snapshot (for useSyncExternalStore) ---

  subscribe = (listener: Listener): (() => void) => {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  };

  private _notify() {
    this._listeners.forEach((l) => l());
  }

  getResearchSnapshot = (): ResearchTaskState => this._research;
  getGenerateSnapshot = (): GenerateTaskState => this._generate;

  // --- Research ---

  executeResearch(query: string, depth: DepthPreset, domainPreset?: DomainPreset | null, attachments?: ResearchAttachment[]) {
    // Cancel any running research
    this._abortResearch?.abort();

    this._research = {
      ...DEFAULT_RESEARCH,
      status: 'running',
      lastQuery: { query, depth, domain: domainPreset ?? null },
    };
    this._notify();

    const controller = new AbortController();
    this._abortResearch = controller;

    debug.info('TaskManager', `Pesquisa iniciada: "${query.slice(0, 60)}"`, { depth, attachments: attachments?.length ?? 0 });

    this._runResearchSSE(query, depth, domainPreset ?? null, controller, attachments);
  }

  cancelResearch() {
    this._abortResearch?.abort();
    this._abortResearch = null;
    this._research = { ...this._research, status: 'idle' };
    this._notify();
    debug.info('TaskManager', 'Pesquisa cancelada');
  }

  resetResearch() {
    this._abortResearch?.abort();
    this._abortResearch = null;
    this._research = { ...DEFAULT_RESEARCH };
    this._notify();
    debug.info('TaskManager', 'Pesquisa resetada');
  }

  // --- Generate ---

  executeGenerate(prompt: string, model: string, mode: 'image' | 'video', size?: string) {
    this._abortGenerate?.abort();

    this._generate = {
      status: 'running',
      mode,
      resultUrl: null,
      resultType: null,
      error: null,
      model,
    };
    this._notify();

    const controller = new AbortController();
    this._abortGenerate = controller;

    debug.info('TaskManager', `Geração iniciada: mode=${mode}, model=${model}`);

    this._runGenerate(prompt, model, mode, size, controller);
  }

  resetGenerate() {
    this._abortGenerate?.abort();
    this._abortGenerate = null;
    this._generate = { ...DEFAULT_GENERATE };
    this._notify();
    debug.info('TaskManager', 'Geração resetada');
  }

  // --- Private: Research SSE ---

  private async _runResearchSSE(
    query: string,
    depth: DepthPreset,
    domainPreset: string | null,
    controller: AbortController,
    attachments?: ResearchAttachment[]
  ) {
    try {
      const prefs = loadPreferences();
      const customModelMap: Record<string, string> = {};
      // Check for AI-recommended models from sessionStorage (set by ModelRecommendationModal)
      const recommendedModels = typeof sessionStorage !== 'undefined'
        ? (() => { try { const v = sessionStorage.getItem('__recommended_models'); sessionStorage.removeItem('__recommended_models'); return v ? JSON.parse(v) : null; } catch { return null; } })()
        : null;
      if (recommendedModels) {
        Object.assign(customModelMap, recommendedModels);
        debug.info('TaskManager', `Usando modelos recomendados por IA: ${JSON.stringify(recommendedModels)}`);
      } else {
        if (prefs.stageModels.decomposition !== 'auto') customModelMap.decomposition = prefs.stageModels.decomposition;
        if (prefs.stageModels.evaluation !== 'auto') customModelMap.evaluation = prefs.stageModels.evaluation;
        if (prefs.stageModels.synthesis !== 'auto') customModelMap.synthesis = prefs.stageModels.synthesis;
      }

      const sourceConfig = prefs.sourceConfig?.mode === 'manual' ? prefs.sourceConfig : undefined;

      // Auto-save prompt to history
      const promptEntry: StoredPrompt = {
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        prompt: query,
        type: 'research',
        model: prefs.modelPreference,
        depth,
        domainPreset,
        timestamp: new Date().toISOString(),
      };
      savePrompt(promptEntry).catch((e) => debug.warn('TaskManager', `Falha ao salvar prompt: ${e}`));

      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          depth,
          domainPreset,
          modelPreference: prefs.modelPreference,
          customModelMap: Object.keys(customModelMap).length > 0 ? customModelMap : undefined,
          sourceConfig,
          attachments: attachments?.length ? attachments : undefined,
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
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data) as PipelineEvent;
            this._processResearchEvent(event);
          } catch {
            // Skip malformed
          }
        }
      }

      // Remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6);
        if (data !== '[DONE]') {
          try {
            this._processResearchEvent(JSON.parse(data) as PipelineEvent);
          } catch { /* skip */ }
        }
      }

      if (this._research.status === 'running') {
        this._research = { ...this._research, status: 'complete' };
        this._notify();
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      debug.error('TaskManager', `Erro na pesquisa: ${msg}`);
      this._research = { ...this._research, status: 'error', error: msg };
      this._notify();
    }
  }

  private _processResearchEvent(event: PipelineEvent) {
    const r = this._research;

    switch (event.type) {
      case 'stage':
        this._research = {
          ...r,
          currentStage: {
            stage: event.stage,
            status: event.status,
            progress: event.progress,
            message: event.message,
          },
          status: event.stage === 'complete' ? 'complete' : r.status,
        };
        break;

      case 'queries':
        this._research = { ...r, subQueries: event.data };
        break;

      case 'source':
        this._research = { ...r, sourcesFound: r.sourcesFound + 1 };
        break;

      case 'evaluation':
        this._research = { ...r, sourcesKept: event.data.kept };
        break;

      case 'text-delta':
        this._research = { ...r, reportText: r.reportText + event.text };
        break;

      case 'metadata':
        this._research = { ...r, metadata: event.data };
        break;

      case 'cost':
        this._research = { ...r, costUSD: event.data.costUSD };
        break;

      case 'complete':
        this._research = { ...r, response: event.data, status: 'complete' };
        this._autoSaveResearch(event.data);
        break;

      case 'error':
        this._research = {
          ...r,
          error: event.error.message,
          status: event.error.recoverable ? r.status : 'error',
        };
        break;
    }

    this._notify();
  }

  private _autoSaveResearch(data: ResearchResponse) {
    try {
      const stored: StoredResearch = {
        id: data.id,
        query: data.query,
        title: data.metadata.title,
        depth: data.metadata.depth,
        domainPreset: data.metadata.domainPreset,
        modelPreference: data.metadata.modelPreference,
        reportText: data.report.sections.map((s) => s.content).join('\n\n'),
        citations: data.report.citations.map((c) => ({
          index: c.index, url: c.url, title: c.title,
          snippet: c.snippet, domain: c.domain,
          credibilityTier: c.credibilityTier,
        })),
        subQueries: data.subQueries.map((sq) => ({
          id: sq.id, text: sq.text, language: sq.language, resultCount: sq.resultCount ?? 0,
        })),
        metadata: {
          totalSources: data.metadata.totalSources,
          totalSourcesKept: data.metadata.totalSourcesKept,
          modelsUsed: data.metadata.modelsUsed,
          pipelineVersion: data.metadata.pipelineVersion,
        },
        costUSD: data.cost.totalCostUSD,
        confidenceLevel: data.confidence.level,
        favorite: false,
        tags: [],
        createdAt: data.metadata.createdAt,
        completedAt: data.metadata.completedAt,
        durationMs: data.metadata.durationMs,
      };
      saveResearch(stored).catch((e) => debug.error('TaskManager', `Auto-save falhou: ${e}`));
      debug.info('TaskManager', 'Pesquisa salva automaticamente');
    } catch (e) {
      debug.error('TaskManager', `Erro ao auto-salvar: ${e}`);
    }
  }

  // --- Private: Generate ---

  private async _runGenerate(
    prompt: string,
    model: string,
    mode: 'image' | 'video',
    size: string | undefined,
    controller: AbortController
  ) {
    try {
      // Auto-save generation prompt to history
      const genPromptEntry: StoredPrompt = {
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        prompt: prompt.trim(),
        type: mode,
        model,
        timestamp: new Date().toISOString(),
      };
      savePrompt(genPromptEntry).catch((e) => debug.warn('TaskManager', `Falha ao salvar prompt de geração: ${e}`));

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model, size, mode }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Error responses are still JSON
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const details = errData.details ? ` | ${JSON.stringify(errData.details)}` : '';
        throw new Error(`${errData.error || `HTTP ${res.status}`}${details}`);
      }

      // Detect response format: binary (new API) or JSON (legacy/cached)
      const contentType = res.headers.get('Content-Type') || '';
      let resultUrl: string;
      let resultType: 'image' | 'video';

      if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
        // New binary response — create blob URL
        const blob = await res.blob();
        resultUrl = URL.createObjectURL(blob);
        resultType = contentType.startsWith('video/') ? 'video' : 'image';

        // Auto-save generated file to IndexedDB
        const genEntry: StoredGeneration = {
          id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          prompt: prompt.trim(),
          model,
          type: resultType,
          blobData: blob,
          mediaType: contentType,
          sizeBytes: blob.size,
          timestamp: new Date().toISOString(),
        };
        saveGeneration(genEntry).catch((e) => debug.warn('TaskManager', `Falha ao salvar geração: ${e}`));

        debug.info('TaskManager', `Geração concluída (binary): ${resultType}, model=${model}, ${blob.size} bytes, ${contentType}`);
      } else {
        // Legacy JSON response (base64 data URL) or error response that slipped through with 200
        const data = await res.json();
        if (data.error) {
          // Error response disguised as 200 (Gateway SDK bug)
          throw new Error(data.error);
        }
        if (data.type === 'video') {
          resultUrl = data.videoUrl;
          resultType = 'video';
        } else {
          resultUrl = data.imageUrl;
          resultType = 'image';
        }
        debug.info('TaskManager', `Geração concluída (json): ${resultType}, model=${model}, url=${resultUrl ? resultUrl.slice(0, 40) + '...' : 'EMPTY'}`);
      }

      if (!resultUrl) {
        throw new Error('API retornou resposta sem imagem/vídeo');
      }

      this._generate = { ...this._generate, status: 'complete', resultUrl, resultType };
      this._notify();
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      debug.error('TaskManager', `Erro na geração: ${msg}`, { model, mode, prompt: prompt.slice(0, 60) });
      this._generate = { ...this._generate, status: 'error', error: msg };
      this._notify();
    }
  }
}

// Singleton instance
export const taskManager = new TaskManager();
