// components/providers/app-provider.tsx — Global state provider
'use client';

import { useReducer, type ReactNode } from 'react';
import { AppContext, appReducer, DEFAULT_APP_STATE } from '@/lib/store/app-store';
import { useScopedSelectAll } from '@/hooks/useScopedSelectAll';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_APP_STATE);
  useScopedSelectAll();

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
