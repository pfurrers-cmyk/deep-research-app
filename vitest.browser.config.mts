import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    include: ['tests/browser/**/*.spec.{ts,tsx}'],
    browser: {
      enabled: true,
      provider: 'playwright' as any,
      instances: [
        { browser: 'chromium' as const },
      ],
    },
  },
})
