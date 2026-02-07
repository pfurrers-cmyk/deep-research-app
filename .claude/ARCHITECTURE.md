# Deep Research App — Arquitetura

## Visão Geral

Aplicativo web pessoal de **Deep Research** que executa um pipeline multi-etapa de busca, análise, síntese e geração de relatório estruturado com fontes citadas.

**Single-tenant** — uso pessoal exclusivo, sem autenticação multi-user.

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js LTS | >=22.x |
| Framework | Next.js (App Router) | 16.1.x |
| UI | React | 19.2.x |
| Linguagem | TypeScript | 5.x strict |
| AI SDK | Vercel AI SDK (`ai`) | 6.x |
| AI Gateway | `@ai-sdk/gateway` | latest |
| CSS | Tailwind CSS | 4.1.x (CSS-first) |
| UI Components | shadcn/ui | latest |
| Validation | Zod | latest |
| Deploy | Vercel (Fluid Compute, maxDuration: 300) |

## Pipeline de Pesquisa (6 Etapas)

```
Query do Usuário
    │
    ▼
[1] Decomposição ──────── LLM gera N sub-queries (Tier 2/3)
    │
    ▼
[2] Busca Paralela ────── Perplexity/Parallel Search via Gateway tools
    │                      Promise.allSettled, dedup, retry
    ▼
[3] Avaliação ─────────── LLM avalia relevância (generateObject + Zod)
    │                      Ranking ponderado: relevância × recência × autoridade
    ▼
[4] Extração Profunda ─── Busca conteúdo completo das top-N fontes (opcional)
    │
    ▼
[5] Síntese ───────────── LLM Tier 1 gera relatório (streamText, obrigatório)
    │                      Seções configuráveis, citações inline
    ▼
[6] Pós-processamento ─── Metadados, título, salvar histórico, export
```

## Fluxo de Dados (SSE Streaming)

```
Cliente (React) ◄──── SSE ────► Server (Route Handler)
                                    │
                                    ├── StageEvent { stage, progress, message }
                                    ├── QueriesEvent { subQueries[] }
                                    ├── SourceEvent { url, title, relevance }
                                    ├── EvaluationEvent { totalFound, kept }
                                    ├── TextDeltaEvent { text } ← streaming do relatório
                                    ├── ConfidenceEvent { section, score }
                                    ├── CostEvent { stage, model, cost }
                                    ├── MetadataEvent { totalSources, duration }
                                    └── CompleteEvent { fullResponse }
```

## Hierarquia de Configuração

```
config/defaults.ts (valores padrão, as const)
        ▲
        │  merge
UserSettings (IndexedDB via settings-store.ts)
        ▲
        │  merge
Per-Research Overrides (parâmetros da request)
        │
        ▼
Effective Config (config-resolver.ts → getEffectiveConfig())
```

**Regra:** ZERO magic numbers no código. Todo valor vem de `config/defaults.ts`.

## AI Gateway — Regra Fundamental

Todas as chamadas LLM passam pelo Vercel AI Gateway:

```typescript
// ✅ CORRETO
import { generateText, streamText } from 'ai';
const result = await streamText({ model: 'anthropic/claude-sonnet-4.5', ... });

// ✅ CORRETO
import { gateway } from '@ai-sdk/gateway';
const result = await streamText({ model: gateway('openai/gpt-4.1-mini'), ... });

// ❌ PROIBIDO
import { openai } from '@ai-sdk/openai'; // NUNCA importar providers diretamente
```

**Auth:** API Key local (`AI_GATEWAY_API_KEY`), OIDC automático em produção na Vercel.

## Model Router

Seleção de modelos por etapa baseada em:
1. **Depth Preset** (rapida/normal/profunda/exaustiva) define modelos default
2. **Model Preference** (auto/economy/premium/custom) sobrescreve
3. **Fallback Chains** por tier em caso de falha

## Estrutura de Diretórios

```
config/         → Configuração central (defaults, models, pricing)
app/            → Rotas Next.js (pages + API routes)
lib/ai/         → Gateway config, model router, cost estimator, prompts
lib/research/   → Pipeline, search, evaluator, synthesizer, types
lib/config/     → Config resolver, settings store
lib/storage/    → IndexedDB (Dexie.js), Vercel KV, Vercel Blob
lib/utils/      → Streaming, export, cost tracker
components/     → React components organizados por domínio
hooks/          → Custom hooks (useResearch, useConfig, useCostTracker)
```

## Decisões Arquiteturais

1. **Config-driven**: Toda configuração em `config/defaults.ts`, tipo derivado via `typeof`
2. **Streaming-first**: `streamText` para todo output de texto ao usuário
3. **Type-safe pipeline**: Interfaces TypeScript para todo dado no pipeline
4. **Gateway-only**: Nunca importar providers diretamente
5. **Resilient**: Fallback chains, retries com backoff, timeouts por etapa
6. **Cost-aware**: Estimativa pré-execução, tracking em tempo real, alertas
