# Prompt Reverso — Melhorias Tecnológicas, Inovações e Adições Fora da Caixa

> **Instrução:** Cole este prompt integralmente em qualquer LLM de raciocínio avançado (Claude Opus, GPT-4.1, Gemini 2.5 Pro, Grok 4, etc.) para obter um plano detalhado de melhorias, inovações e funcionalidades disruptivas para o Âmago.AI.

---

## PROMPT

Você é um arquiteto de software sênior, especialista em aplicações de IA, pesquisa automatizada e UX de produtos de produtividade pessoal. Seu objetivo é analisar a descrição completa do aplicativo **Âmago.AI** abaixo e propor:

1. **Melhorias tecnológicas concretas** (performance, arquitetura, DX, infraestrutura)
2. **Inovações de produto** que diferenciem radicalmente o app de concorrentes como Perplexity, Elicit, Consensus, NotebookLM
3. **Adições fora da caixa** — funcionalidades que o desenvolvedor provavelmente não considerou, cruzando domínios inesperados

**Contexto importante:** Este é um aplicativo de **uso pessoal** de um único desenvolvedor/pesquisador. Não há necessidade de autenticação multi-user, RBAC, billing, ou compliance empresarial. As propostas devem focar em **maximizar a potência e a utilidade para um power-user solo**, sem overhead de features enterprise.

---

### DESCRIÇÃO COMPLETA DO ÂMAGO.AI

#### Identidade
- **Nome:** Âmago.AI
- **Propósito:** Aplicativo web pessoal de pesquisa profunda automatizada, chat conversacional com IA, e geração de conteúdo (imagens/vídeo)
- **Single-tenant:** Um único usuário, sem auth, sem multi-tenancy
- **Hospedagem:** Vercel (Fluid Compute, maxDuration: 300s)

#### Stack Técnica (Fev/2026)
| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | >=22.x |
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Linguagem | TypeScript | 5.x strict |
| AI SDK | Vercel AI SDK (`ai`) | 6.0.75 |
| AI Gateway | `@ai-sdk/gateway` | 3.0.37 |
| CSS | Tailwind CSS (CSS-first) | 4.x |
| Components | shadcn/ui + Radix UI | latest |
| Validation | Zod | 4.3.6 |
| DB Client | Dexie.js (IndexedDB) | 4.3.0 |
| URL State | nuqs | 2.8.8 |
| Markdown | react-markdown + remark-gfm | latest |
| Icons | Lucide React | latest |
| Themes | next-themes | 0.4.6 |
| Toasts | Sonner | latest |
| Testing | Vitest 4 + Playwright 1.58 + MSW 2 | latest |
| Deploy | Vercel + smart-deploy.ps1 (CI custom via GitHub Actions) |

#### Páginas / Rotas
| Rota | Funcionalidade |
|---|---|
| `/` | Pesquisa Profunda — input com progressive disclosure, 4 níveis de profundidade (Rápida/Normal/Profunda/Exaustiva), presets de domínio, anexação de arquivos |
| `/chat` | Chat conversacional com qualquer modelo de IA — sidebar de conversas, seletor de modelo inline, streaming palavra-a-palavra, artifacts (<artifact> tags), persistência IndexedDB |
| `/generate` | Geração de imagens/vídeo — dropzone com seletor de propósito, modelos de imagem (DALL-E, Imagen, Flux, Stable Diffusion) |
| `/arena` | Arena de comparação — até 3 configurações lado a lado (UI pronta, execução paralela pendente) |
| `/library` | Biblioteca — 3 abas (Pesquisas/Imagens/Prompts), auto-save, organização por IA, busca, favoritos, bulk ops, filtros via nuqs |
| `/settings` | Configurações — tema, idioma, profundidade padrão, modelos por etapa (decomposição/avaliação/síntese), modelo de chat, system prompt |
| `/research/[id]` | Visualização de pesquisa salva com follow-up chat |

#### API Routes (11 endpoints)
| Endpoint | Função |
|---|---|
| `POST /api/research` | Executa pipeline de pesquisa completo (SSE streaming) |
| `POST /api/research/[id]/followup` | Chat de follow-up pós-pesquisa (streaming) |
| `POST /api/research/[id]/review` | Revisão de qualidade por IA (generateObject + Zod schema) |
| `POST /api/chat` | Chat conversacional genérico (streaming) |
| `POST /api/generate` | Geração de imagens (retorna binary, não base64) |
| `POST /api/arena` | Execução paralela de múltiplas configs de pesquisa |
| `POST /api/recommend` | Recomendação inteligente de modelos (3 tiers via Gemini) |
| `POST /api/library/organize` | Organização da biblioteca por IA (categorização automática) |
| `GET /api/models` | Lista de modelos disponíveis |
| `GET /api/costs` | Estimativas de custo |
| `GET /api/logs` | Debug logs (ring buffer) |

#### Pipeline de Pesquisa (6 Etapas + 3 Modos)
```
Query do Usuário + Attachments
    │
    ▼
[1] Decomposição ──────── LLM gera N sub-queries com prioridade, ângulo, idioma
    │                      generateObject + Zod schema
    ▼
[2] Busca Paralela ────── Perplexity Sonar / Parallel Search via Gateway tools
    │                      Promise.allSettled, dedup por URL, retry com backoff
    ▼
[3] Avaliação ─────────── LLM avalia relevância (generateObject + Zod)
    │                      Ranking ponderado: relevância × recência × autoridade × viés
    │                      Credibility tiers: high/medium/low por domínio
    ▼
[4] Extração Profunda ─── Busca conteúdo completo das top-N fontes (opcional)
    │
    ▼
[5] Síntese ───────────── streamText com fallback chain de modelos
    │                      Seções configuráveis, citações inline [N]
    │                      Attachment context injection no prompt
    ▼
[6] Pós-processamento ─── Título automático, metadados, save, export
```

**3 Modos de Processamento (resolução automática):**
- **Base** — Single-pass direto (até ~15 fontes)
- **Extended (Map-Reduce)** — MAP paralelo em batches → REDUCE em relatório final (15-50 fontes)
- **Ultra (Iterativo)** — Map-Reduce com 60% fontes → Enriquecimento iterativo com 40% restantes → Verificação cruzada obrigatória (50+ fontes)

#### Catálogo de Modelos
- **181 modelos** do Vercel AI Gateway com metadados completos (context window, maxOutput, latência, TPS, pricing)
- **Tiers:** flagship, workhorse, budget, reasoning, code, search, embedding, image, video
- **Provedores:** OpenAI, Anthropic, Google, Meta, Mistral, xAI, DeepSeek, Cohere, Perplexity, BFL/Flux, Stability
- **Model Router:** Seleção automática por etapa × profundidade × preferência (auto/economy/premium/custom)
- **Fallback chains** por tier em caso de falha

#### Sistema de Configuração PRO (Prompt Reverso)
- Seletor de estilo de escrita (5 estilos: Acadêmico, Jornalístico, Técnico, Executivo, Criativo)
- Controle de nível de detalhe (4 níveis com estimativa de páginas/tempo)
- Idioma de raciocínio interno (PT/EN/Auto/Bilíngue)
- Formato de citação (Inline, Footnotes, APA7, ABNT, IEEE, Vancouver)
- Framework de avaliação de fontes (CRAAP/SIFT/RADAR/Custom)
- 6 modos de pesquisa (Padrão, Comparativo, Temporal, Contrário, Meta-análise, Fact-check)
- Seções customizáveis do relatório (toggle + reordenação + obrigatórias)
- Filtros avançados (recência, tipos de fonte, idiomas, allowlist/blocklist de domínios)
- 6 formatos de exportação (Markdown, PDF, Slides, Podcast Script, Thread Social, JSON)
- Templates salvos com busca, favoritos e categorias

#### Sistema de Anexação Universal
- 4 variantes: inline (clip), dropzone, button-only, floating overlay
- Categorias: image, document, data, video, audio
- Processadores: imagem (thumbnail+resize+base64), PDF (extração texto), CSV (parse+preview), JSON, texto
- Drag-and-drop global + Ctrl+V para imagens
- Validação de MIME, tamanho, anti-duplicatas
- Context builder injeta conteúdo extraído no prompt de síntese

#### Persistência
- **IndexedDB via Dexie.js:** Pesquisas salvas, conversas de chat, imagens geradas, prompts, follow-ups
- **localStorage:** UserPreferences (tema, modelos, profundidade, idioma)
- **sessionStorage:** Modelos recomendados temporários
- **Sem backend persistente** — tudo client-side

#### Safety Settings
- `config/safety-settings.ts` — Configurações permissivas por provedor
- Google: `BLOCK_NONE` em todas as 5 categorias de harm (via `providerOptions`)
- Demais provedores: sem toggles de API documentados (moderação server-side)
- Integrado em todas as 10 chamadas LLM do app

#### State Management
- **TaskManager** — Singleton fora do React (`useSyncExternalStore`)
- **AppStore** — Zustand-like com `useReducer` para UI state
- **useSettings** — Hook reativo lendo de `settings-store.ts`
- **Debug Logger** — Ring buffer (1000 entries) com timestamps GMT-3

#### UI/UX
- Design tokens OKLCH semânticos, glassmorphism
- Command Palette (Ctrl+K) com navegação + pesquisas recentes
- Cadeia de raciocínio colapsável (ReasoningBlock)
- Report Viewer com tipografia otimizada (65ch), citation badges
- Artifacts Panel resizável (320-900px)
- Skeleton shimmer + optimistic UI com undo
- Acessibilidade (skip-to-content, aria-current, reduced-motion)
- VersionStamp com tooltip de changelog completo
- Ctrl+A scoped por container

#### CI/CD
- `smart-deploy.ps1` — Script PowerShell que:
  1. Atualiza buildInfo.ts (timestamp + commitHash)
  2. Roda testes unitários (vitest)
  3. Cria branch + push + PR no GitHub
  4. Aguarda checks (unit-tests, e2e-tests advisory, llm-evals advisory, Vercel preview)
  5. Auto-merge quando todos checks passam
- GitHub Actions: unit-tests (blocking), e2e-tests (advisory), llm-evals (advisory)
- Versionamento SemVer com changelog cumulativo

#### Versão Atual: v4.1.1 (101 changelog entries desde v1.0.0)

---

### O QUE EU PEÇO

Com base nessa descrição completa, produza um documento estruturado com **pelo menos 40 propostas** organizadas nas seguintes categorias:

#### CATEGORIA 1: Melhorias Técnicas de Infraestrutura e Performance (8-10 propostas)
Foque em:
- Otimizações de latência, cache, streaming
- Arquitetura de dados (IndexedDB está limitando? Deveria ter um backend leve?)
- Edge computing, edge functions, middleware inteligente
- Build time, bundle size, code splitting
- Observabilidade, métricas, error tracking
- Resiliência avançada do pipeline

#### CATEGORIA 2: Melhorias de AI/ML e Pipeline de Pesquisa (8-10 propostas)
Foque em:
- Técnicas avançadas de RAG, re-ranking, chunking
- Agentic workflows (multi-step reasoning, tool use, self-correction loops)
- Memória de longo prazo entre pesquisas (knowledge graph pessoal)
- Fine-tuning de prompts com feedback loop
- Modelos especializados por domínio
- Verificação factual automatizada (claim extraction + evidence matching)
- Detecção e handling de contradições entre fontes

#### CATEGORIA 3: Inovações de Produto (8-10 propostas)
Foque em:
- Features que Perplexity/Elicit/NotebookLM NÃO têm
- Workflows de pesquisa que acadêmicos/profissionais sonham
- Automações que economizam horas de trabalho manual
- Integrações com ferramentas do ecossistema pessoal (Notion, Obsidian, Zotero, Mendeley, Google Scholar)
- Monetização de conhecimento acumulado (mesmo sendo pessoal)

#### CATEGORIA 4: Fora da Caixa — Funcionalidades Inesperadas (8-10 propostas)
Aqui quero que você **cruze domínios**. Pense em:
- O que acontece quando deep research encontra visualização de dados?
- E se o app pudesse "pensar" sobre pesquisas anteriores em conjunto?
- E se pudesse gerar não apenas texto, mas diagramas, timelines, mapas mentais, grafos?
- E se pudesse rodar em modo "daemon" fazendo pesquisas periódicas?
- E se tivesse um "segundo cérebro" que conecta todos os relatórios num knowledge base pessoal?
- E se pudesse trabalhar com áudio/vídeo (transcrever, analisar, citar)?
- E se pudesse gerar apresentações completas, não apenas slides em texto?
- E se pudesse fazer "debate" entre modelos diferentes sobre o mesmo tema?
- Qualquer ideia que quebre o paradigma "pesquisa → relatório → fim"

#### CATEGORIA 5: Quick Wins — Melhorias Pequenas de Alto Impacto (6-8 propostas)
Coisas que podem ser implementadas em <1 dia cada, mas que melhoram drasticamente a UX:
- Atalhos de teclado, automações, polish de interface
- Defaults mais inteligentes, onboarding zero-friction
- Easter eggs úteis, power-user features escondidas

### FORMATO DE CADA PROPOSTA

Para cada proposta, forneça:

```
### [Nº] Título da Proposta
**Categoria:** [Infra/AI-ML/Produto/Fora-da-Caixa/Quick-Win]
**Impacto:** [1-5] (5 = transformador)
**Esforço:** [1-5] (5 = semanas de trabalho)
**Prioridade:** Impacto/Esforço ratio

**Problema/Oportunidade:** O que está faltando ou o que poderia ser radicalmente melhor

**Proposta:** Descrição técnica detalhada da implementação, com:
- Arquitetura proposta
- Tecnologias/bibliotecas sugeridas
- Integração com o sistema existente (referencie arquivos/módulos específicos)
- Trade-offs e riscos

**Exemplo de Uso:** Cenário concreto de como o usuário (eu) usaria isso no dia a dia

**Conexões:** Como isso se integra com outras propostas desta lista
```

### RESTRIÇÕES

1. **Sem features enterprise** — nada de RBAC, multi-tenancy, billing, SSO
2. **Mantenha o stack** — Next.js + Vercel + AI SDK. Não sugira reescrever em outro framework
3. **Prático** — cada proposta deve ser implementável, não teórica
4. **Custo-consciente** — lembre que é uso pessoal, o orçamento de API é limitado
5. **Priorize offline-first quando possível** — IndexedDB, service workers, cache
6. **Tudo em português do Brasil** nas interfaces voltadas ao usuário

### BÔNUS

Ao final, inclua uma seção **"Roadmap Sugerido"** organizando as propostas em:
- **Fase Imediata (1-2 semanas):** Quick wins + melhorias críticas
- **Fase Curta (1 mês):** Inovações de produto de maior impacto
- **Fase Média (2-3 meses):** Infraestrutura + AI/ML avançado
- **Fase Longa (3-6 meses):** Fora da caixa + visão de produto diferenciada

E uma seção **"Anti-Padrões a Evitar"** listando 5 armadilhas que power-users solo caem ao expandir apps pessoais (over-engineering, feature creep, etc.).

---

*Âmago.AI v4.1.1 — Fevereiro 2026*
