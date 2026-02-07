// lib/store/app-store.ts — Global state that persists across page navigation
'use client';

import { createContext, useContext } from 'react';
import type { ResearchResponse, ResearchMetadata } from '@/lib/research/types';

// ============================================================
// TYPES
// ============================================================

export interface ArtifactVersion {
  id: string;
  content: string;
  language: string;
  title: string;
  timestamp: number;
}

export interface Artifact {
  id: string;
  type: 'code' | 'markdown' | 'html' | 'json' | 'text' | 'react';
  title: string;
  versions: ArtifactVersion[];
  currentVersionIndex: number;
  createdAt: number;
}

export interface ResearchState {
  status: 'idle' | 'running' | 'complete' | 'error';
  reportText: string;
  metadata: ResearchMetadata | null;
  response: ResearchResponse | null;
  error: string | null;
  currentStage: string;
  subQueries: string[];
  sourcesFound: number;
  sourcesKept: number;
  costUSD: number;
  lastQuery: { query: string; depth: string; domain: string | null } | null;
  savedToDb: boolean;
}

export interface AppState {
  research: ResearchState;
  artifacts: Artifact[];
  activeArtifactId: string | null;
  artifactsPanelOpen: boolean;
}

export const DEFAULT_RESEARCH_STATE: ResearchState = {
  status: 'idle',
  reportText: '',
  metadata: null,
  response: null,
  error: null,
  currentStage: '',
  subQueries: [],
  sourcesFound: 0,
  sourcesKept: 0,
  costUSD: 0,
  lastQuery: null,
  savedToDb: false,
};

export const DEFAULT_APP_STATE: AppState = {
  research: DEFAULT_RESEARCH_STATE,
  artifacts: [],
  activeArtifactId: null,
  artifactsPanelOpen: false,
};

// ============================================================
// ACTIONS
// ============================================================

export type AppAction =
  | { type: 'SET_RESEARCH'; payload: Partial<ResearchState> }
  | { type: 'RESET_RESEARCH' }
  | { type: 'MARK_SAVED' }
  | { type: 'ADD_ARTIFACT'; payload: Artifact }
  | { type: 'UPDATE_ARTIFACT_CONTENT'; payload: { id: string; content: string; title?: string } }
  | { type: 'SET_ACTIVE_ARTIFACT'; payload: string | null }
  | { type: 'TOGGLE_ARTIFACTS_PANEL' }
  | { type: 'REMOVE_ARTIFACT'; payload: string }
  | { type: 'SET_ARTIFACT_VERSION'; payload: { id: string; versionIndex: number } };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_RESEARCH':
      return { ...state, research: { ...state.research, ...action.payload } };

    case 'RESET_RESEARCH':
      return { ...state, research: DEFAULT_RESEARCH_STATE };

    case 'MARK_SAVED':
      return { ...state, research: { ...state.research, savedToDb: true } };

    case 'ADD_ARTIFACT': {
      const existing = state.artifacts.find((a) => a.id === action.payload.id);
      if (existing) {
        // Add as new version
        const newVersion: ArtifactVersion = action.payload.versions[0];
        return {
          ...state,
          artifacts: state.artifacts.map((a) =>
            a.id === action.payload.id
              ? { ...a, versions: [...a.versions, newVersion], currentVersionIndex: a.versions.length }
              : a
          ),
          activeArtifactId: action.payload.id,
          artifactsPanelOpen: true,
        };
      }
      return {
        ...state,
        artifacts: [...state.artifacts, action.payload],
        activeArtifactId: action.payload.id,
        artifactsPanelOpen: true,
      };
    }

    case 'UPDATE_ARTIFACT_CONTENT': {
      return {
        ...state,
        artifacts: state.artifacts.map((a) => {
          if (a.id !== action.payload.id) return a;
          const newVersion: ArtifactVersion = {
            id: `v${a.versions.length + 1}`,
            content: action.payload.content,
            language: a.versions[a.currentVersionIndex]?.language ?? 'text',
            title: action.payload.title ?? a.title,
            timestamp: Date.now(),
          };
          return { ...a, versions: [...a.versions, newVersion], currentVersionIndex: a.versions.length, title: action.payload.title ?? a.title };
        }),
      };
    }

    case 'SET_ACTIVE_ARTIFACT':
      return { ...state, activeArtifactId: action.payload, artifactsPanelOpen: action.payload !== null };

    case 'TOGGLE_ARTIFACTS_PANEL':
      return { ...state, artifactsPanelOpen: !state.artifactsPanelOpen };

    case 'REMOVE_ARTIFACT': {
      const filtered = state.artifacts.filter((a) => a.id !== action.payload);
      return {
        ...state,
        artifacts: filtered,
        activeArtifactId: state.activeArtifactId === action.payload ? (filtered[0]?.id ?? null) : state.activeArtifactId,
        artifactsPanelOpen: filtered.length > 0 ? state.artifactsPanelOpen : false,
      };
    }

    case 'SET_ARTIFACT_VERSION':
      return {
        ...state,
        artifacts: state.artifacts.map((a) =>
          a.id === action.payload.id
            ? { ...a, currentVersionIndex: action.payload.versionIndex }
            : a
        ),
      };

    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType>({
  state: DEFAULT_APP_STATE,
  dispatch: () => {},
});

export function useAppStore() {
  return useContext(AppContext);
}
