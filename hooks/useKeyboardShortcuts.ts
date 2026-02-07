// hooks/useKeyboardShortcuts.ts — Global keyboard shortcuts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutMap {
  [key: string]: () => void;
}

function parseShortcut(shortcut: string): { ctrl: boolean; shift: boolean; key: string } {
  const parts = shortcut.toLowerCase().split('+');
  return {
    ctrl: parts.includes('mod') || parts.includes('ctrl'),
    shift: parts.includes('shift'),
    key: parts[parts.length - 1],
  };
}

export function useKeyboardShortcuts(extraShortcuts?: ShortcutMap) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Global shortcuts (work even in inputs if using mod key)
      if (mod && e.key === 'n') {
        e.preventDefault();
        router.push('/');
        return;
      }

      if (mod && e.key === ',') {
        e.preventDefault();
        router.push('/settings');
        return;
      }

      if (mod && e.key === 'h') {
        e.preventDefault();
        router.push('/library');
        return;
      }

      if (mod && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        // Theme toggle handled by ThemeToggle component
        const themeBtn = document.querySelector('[data-theme-toggle]') as HTMLButtonElement;
        themeBtn?.click();
        return;
      }

      // Skip non-mod shortcuts when in an input
      if (isInput) return;

      // Focus search with /
      if (e.key === '/' && !mod) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"], input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      // Extra shortcuts from caller
      if (extraShortcuts) {
        for (const [combo, handler] of Object.entries(extraShortcuts)) {
          const parsed = parseShortcut(combo);
          if (
            parsed.ctrl === mod &&
            parsed.shift === e.shiftKey &&
            e.key.toLowerCase() === parsed.key
          ) {
            e.preventDefault();
            handler();
            return;
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, extraShortcuts]);
}
