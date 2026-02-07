// lib/config/config-resolver.ts — Merge hierárquico de configurações
// defaults ← userSettings ← perResearchOverrides

import { APP_CONFIG, type AppConfig } from '@/config/defaults';
import type { DeepPartial, UserSettings } from '@/lib/research/types';

export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  ...overrides: (DeepPartial<T> | undefined)[]
): T {
  const result = { ...base };

  for (const override of overrides) {
    if (!override) continue;

    for (const key of Object.keys(override) as (keyof T)[]) {
      const baseVal = result[key];
      const overrideVal = override[key as string] as unknown;

      if (overrideVal === undefined) continue;

      if (
        baseVal !== null &&
        overrideVal !== null &&
        typeof baseVal === 'object' &&
        typeof overrideVal === 'object' &&
        !Array.isArray(baseVal) &&
        !Array.isArray(overrideVal)
      ) {
        result[key] = deepMerge(
          baseVal as Record<string, unknown>,
          overrideVal as Record<string, unknown>
        ) as T[keyof T];
      } else {
        result[key] = overrideVal as T[keyof T];
      }
    }
  }

  return result;
}

export function getEffectiveConfig(
  userSettings?: UserSettings,
  perResearchOverrides?: DeepPartial<AppConfig>
): AppConfig {
  return deepMerge(
    APP_CONFIG as unknown as Record<string, unknown>,
    userSettings?.overrides as Record<string, unknown> | undefined,
    perResearchOverrides as Record<string, unknown> | undefined
  ) as unknown as AppConfig;
}

export function getConfigValue<T>(
  path: string,
  config: AppConfig = APP_CONFIG
): T | undefined {
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
