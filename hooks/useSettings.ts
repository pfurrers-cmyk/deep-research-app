// hooks/useSettings.ts — Hook reativo para preferências do usuário
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadPreferences,
  savePreferences,
  clearPreferences,
  DEFAULT_PREFERENCES,
  type UserPreferences,
} from '@/lib/config/settings-store';

export function useSettings() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
    setLoaded(true);
  }, []);

  const update = useCallback((partial: Partial<UserPreferences>) => {
    const merged = savePreferences(partial);
    setPrefs(merged);
    return merged;
  }, []);

  const reset = useCallback(() => {
    clearPreferences();
    setPrefs({ ...DEFAULT_PREFERENCES });
  }, []);

  return { prefs, loaded, update, reset };
}
