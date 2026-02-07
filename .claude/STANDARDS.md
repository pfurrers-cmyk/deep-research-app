# Âmago.AI — Padrões de Código

## Naming Conventions

- **Arquivos**: kebab-case (`config-resolver.ts`, `cost-estimator.ts`)
- **Componentes React**: PascalCase (`ResearchInput.tsx`, `CostWidget.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useConfig.ts`, `useResearch.ts`)
- **Tipos/Interfaces**: PascalCase (`ResearchRequest`, `EvaluatedSource`)
- **Constantes de config**: SCREAMING_SNAKE para o export top-level (`APP_CONFIG`, `MODELS`)
- **Funções**: camelCase (`getEffectiveConfig`, `selectModel`)

## Import Order

1. React / Next.js
2. Bibliotecas externas (`ai`, `zod`, `lucide-react`)
3. `@/config/*`
4. `@/lib/*`
5. `@/components/*`
6. `@/hooks/*`
7. Tipos (`type` imports por último)

## Config Access

```typescript
// ✅ CORRETO — sempre via config
const threshold = config.pipeline.evaluation.relevanceThreshold;

// ❌ PROIBIDO — magic number
const threshold = 0.5;
```

**Regra absoluta:** Nenhum valor numérico, string, threshold, ou comportamento hardcoded. Tudo vem de `config/defaults.ts` via `getEffectiveConfig()`.

## AI SDK Usage

```typescript
// ✅ streamText para output de texto ao usuário
const result = streamText({ model: 'anthropic/claude-sonnet-4.5', ... });

// ✅ generateObject + Zod para output estruturado
const result = generateObject({ model: '...', schema: z.object({...}), ... });

// ✅ generateText APENAS quando não há streaming (processamento interno)
const result = generateText({ model: '...', ... });
```

## Error Handling

- Erros recuperáveis: retry com fallback chain
- Erros fatais: propagar com `ErrorEvent` via SSE
- Mensagens de erro: sempre do `config.strings.errors`
- Log: `console.error` com contexto (stage, model, attempt)

## TypeScript

- **Strict mode**: sempre
- **Tipos explícitos**: para todas as funções exportadas
- **Zod schemas**: para todo `generateObject` e validação de input de API
- **Union types discriminadas**: para `PipelineEvent` (discriminar por `type`)
- **Utility types**: usar `DeepPartial<T>` para overrides de config

## Component Patterns

- **Server Components**: por default (Next.js 16 App Router)
- **Client Components**: apenas quando necessário (`'use client'` explícito)
- **Props**: interface nomeada `ComponentNameProps`
- **Config access em componentes**: via `useConfig()` hook em client components, import direto em server components
