// lib/config/settings-store.ts — Persistência de preferências do usuário
// Fase 3: migrar para IndexedDB (Dexie.js)

import type { DepthPreset } from '@/config/defaults';

const STORAGE_KEY = 'deep-research-settings';

// ============================================================
// TYPED USER PREFERENCES
// ============================================================

export interface UserPreferences {
  // Pesquisa
  defaultDepth: DepthPreset;
  modelPreference: 'auto' | 'economy' | 'premium' | 'custom';
  outputLanguage: string;

  // Modelos por fase do pipeline
  stageModels: {
    decomposition: string; // model id or 'auto'
    evaluation: string;
    synthesis: string;
  };

  // Prompts customizáveis (vazio = usar padrão do sistema)
  customPrompts: {
    decomposition: string;
    evaluation: string;
    synthesis: string;
  };

  // Aparência
  defaultTheme: 'dark' | 'light' | 'system';

  // Metadata
  updatedAt: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultDepth: 'normal',
  modelPreference: 'auto',
  outputLanguage: 'pt-BR',
  stageModels: {
    decomposition: 'auto',
    evaluation: 'auto',
    synthesis: 'auto',
  },
  customPrompts: {
    decomposition: '',
    evaluation: '',
    synthesis: '',
  },
  defaultTheme: 'dark',
  updatedAt: new Date().toISOString(),
};

// ============================================================
// CRUD
// ============================================================

export function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const saved = JSON.parse(raw) as Partial<UserPreferences>;
    return { ...DEFAULT_PREFERENCES, ...saved };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };

  const current = loadPreferences();
  const merged: UserPreferences = {
    ...current,
    ...prefs,
    stageModels: {
      ...current.stageModels,
      ...(prefs.stageModels ?? {}),
    },
    customPrompts: {
      ...current.customPrompts,
      ...(prefs.customPrompts ?? {}),
    },
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function clearPreferences(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Keep old exports for backward compat during migration
export async function loadSettings() {
  return { overrides: loadPreferences(), updatedAt: loadPreferences().updatedAt };
}
export async function saveSettings(overrides: Record<string, unknown>) {
  savePreferences(overrides as Partial<UserPreferences>);
}
export async function clearSettings() {
  clearPreferences();
}
