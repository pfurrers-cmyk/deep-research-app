import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement, type ReactNode, useReducer } from 'react'
import { AppContext, appReducer, DEFAULT_APP_STATE } from '@/lib/store/app-store'

function AllProviders({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_APP_STATE)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export { screen, waitFor, within, act } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
