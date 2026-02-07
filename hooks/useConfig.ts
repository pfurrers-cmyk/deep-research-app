// hooks/useConfig.ts — Hook React para acessar configuração efetiva
// User preferences are now in useSettings hook; this provides the base APP_CONFIG
'use client';

import { useState, useEffect } from 'react';
import { APP_CONFIG, type AppConfig } from '@/config/defaults';

export function useConfig() {
  const [config] = useState<AppConfig>(APP_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return { config, isLoading };
}

export function useConfigValue<T>(path: string): T | undefined {
  const { config } = useConfig();

  const keys = path.split('.');
  let current: unknown = config;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}
