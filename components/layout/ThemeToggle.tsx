'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const themes = [
  { value: 'light', icon: Sun, label: 'Claro' },
  { value: 'dark', icon: Moon, label: 'Escuro' },
  { value: 'system', icon: Monitor, label: 'Sistema' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const currentIndex = themes.findIndex((t) => t.value === theme);
  const next = themes[(currentIndex + 1) % themes.length];

  const CurrentIcon =
    themes.find((t) => t.value === theme)?.icon ?? Monitor;

  return (
    <button
      onClick={() => setTheme(next.value)}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title={`Tema: ${themes.find((t) => t.value === theme)?.label ?? 'Sistema'}`}
    >
      <CurrentIcon className="h-4 w-4" />
    </button>
  );
}
