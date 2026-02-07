# Code Review Guidelines — Deep Research App

## Stack
- Next.js 16.1.6 (App Router)
- React 19
- TypeScript 5 (strict mode)
- Vercel AI SDK 6.0 (com AI Gateway)
- Tailwind CSS 4
- shadcn/ui components

## Architecture
- App Router: todas as rotas em `app/`
- API Routes: `app/api/research/`, `app/api/generate/`, `app/api/logs/`, `app/api/models/`
- Research pipeline: `lib/research/pipeline.ts` (6 etapas: decomposição → busca → avaliação → extração → síntese → pós-processamento)
- State management: TaskManager singleton (`lib/store/task-manager.ts`) — vive fora do React
- Settings: Zustand-like store (`lib/config/settings-store.ts`) com localStorage
- Debug logging: Ring buffer client+server (`lib/utils/debug-logger.ts`)

## Review Priorities
1. **Security**: Nunca expor API keys no client-side. Variáveis sensíveis sempre em `process.env` server-only.
2. **Performance**: Evitar re-renders desnecessários. Usar `useMemo`/`useCallback` em componentes pesados. Evitar `useEffect` em cascata.
3. **Type Safety**: Nunca usar `any`. Preferir tipos inferidos. Todas funções exportadas devem ter tipos explícitos.
4. **Error Handling**: Toda API route deve ter try/catch com error logging via `debug-logger`. Nunca silenciar erros.
5. **SSE/Streaming**: Research pipeline usa Server-Sent Events. Garantir que streams sejam propriamente fechados em caso de erro.

## Conventions
- Imports: Preferir `@/` alias para paths internos
- Components: Functional components com TypeScript interfaces para props
- Naming: camelCase para variáveis/funções, PascalCase para componentes/tipos, kebab-case para arquivos
- Testing: Vitest para unit tests, Playwright para E2E
- Deploy: Sempre via `smart-deploy.ps1` (nunca `vercel --prod` direto)

## Known Patterns
- `TaskManager` é singleton — componentes usam `useSyncExternalStore` para ler estado
- AI Gateway: modelos acessados via `gateway.chat(modelId)`, `gateway.image(modelId)`, `gateway.video(modelId)`
- Cost tracking: `CostTracker` acumula custos por etapa do pipeline
- Versioning: `lib/buildInfo.ts` contém version, changelog, timestamps — atualizado pelo smart-deploy.ps1
