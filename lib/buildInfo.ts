// lib/buildInfo.ts — Atualizado automaticamente pelo smart-deploy.ps1
export const BUILD_INFO = {
  version: '0.6.0',
  buildTimestamp: '2026-02-07T13:09:58.275Z',
  commitHash: '7440b66',
  branch: 'master',
  changelog: [
    'Sistema completo de testagem automatizada: Vitest + Playwright + LLM Evals',
    '44 unit tests passando: pricing, cost-estimator, settings-store, model-router, streaming, ai-sdk, utils',
    'Test helpers: ai-mocks (MockLanguageModelV3), render-with-providers, msw-handlers, fixtures',
    'E2E: Playwright com Page Objects (ResearchPage, LibraryPage, SettingsPage, GeneratePage)',
    'LLM Evals: decomposition + synthesis quality scoring via LLM-as-Judge',
    'CI/CD: GitHub Actions workflow (unit → e2e → evals)',
    'Scripts: test, test:run, test:coverage, test:browser, test:e2e, test:evals, test:all',
  ],
  previousVersion: '0.5.1',
};