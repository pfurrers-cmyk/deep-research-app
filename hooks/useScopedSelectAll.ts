// hooks/useScopedSelectAll.ts — Ctrl+A selects text only within the nearest [data-select-scope] container
'use client';

import { useEffect } from 'react';

/**
 * Intercepts Ctrl+A (or Cmd+A) globally. If the active element or cursor
 * is inside a container marked with `data-select-scope`, the browser's
 * default "select all" is replaced with a scoped selection that only
 * highlights text inside that container.
 *
 * Containers opt in by adding the attribute:  data-select-scope
 * Optionally, data-select-scope="logs" for labeling purposes.
 *
 * Native <textarea> and <input> elements are excluded — Ctrl+A
 * already selects only their own text natively.
 */
export function useScopedSelectAll() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.key === 'a' && (e.ctrlKey || e.metaKey))) return;
      if (e.shiftKey || e.altKey) return;

      const target = (document.activeElement ?? e.target) as HTMLElement;

      // Native inputs already scope Ctrl+A to their own text
      if (
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'INPUT' ||
        target.isContentEditable
      ) {
        return; // let browser handle
      }

      // Walk up from activeElement first, then event target, to find nearest scope
      let scope = findScope(target);
      if (!scope) scope = findScope(e.target as HTMLElement);
      if (!scope) return; // no scope → let browser do default (select all page)

      e.preventDefault();

      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();
      range.selectNodeContents(scope);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    window.addEventListener('keydown', handler, true); // capture phase
    return () => window.removeEventListener('keydown', handler, true);
  }, []);
}

function findScope(el: HTMLElement | null): HTMLElement | null {
  while (el && el !== document.body) {
    if (el.hasAttribute('data-select-scope')) return el;
    el = el.parentElement;
  }
  return null;
}
