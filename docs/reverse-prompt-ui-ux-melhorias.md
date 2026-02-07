# Reverse Prompt — Deep Research App: Melhorias Gerais de UI/UX/Design

> **Instrução:** Cole este prompt integralmente em um modelo de IA avançado (Claude Opus 4.6, GPT-5.2, Gemini 2.5 Pro, DeepSeek R1) e peça melhorias. O prompt contém o contexto técnico completo da aplicação, o estado atual de cada componente de UI, e direcionamentos para que a IA produza sugestões concretas, implementáveis e baseadas em tendências recentes (jul/2025–fev/2026).

---

## CONTEXTO DO PROJETO

### O que é
**Deep Research** é uma ferramenta pessoal de pesquisa profunda automatizada. O usuário insere uma pergunta, o sistema decompõe em sub-queries, busca fontes na web, avalia relevância/credibilidade com framework CRAAP, e sintetiza um relatório analítico com citações inline — tudo via streaming em tempo real.

### Stack Técnica (fev/2026)
- **Framework:** Next.js 16.1.6 (App Router, Turbopack, React 19.2.3)
- **AI:** Vercel AI SDK 6.0.75 + AI Gateway 3.0.37 (181+ modelos cross-provider)
- **Schemas:** Zod 4.3.6 para structured output em generateObject
- **Styling:** Tailwind CSS 4.x (CSS-first com @theme + OKLCH), next-themes 0.4.6
- **Components:** Componentes custom + alguns shadcn/ui (button, card, badge, select, switch)
- **Icons:** lucide-react
- **Fonts:** Geist Sans + Geist Mono (via next/font/google)
- **Persistência:** IndexedDB via Dexie.js + localStorage para preferências
- **Streaming:** Server-Sent Events (SSE) custom para pipeline
- **Deploy:** Vercel com Fluid Compute (maxDuration: 300s)

### Páginas da Aplicação (5 + 1 dinâmica)

1. **`/` — Pesquisa Principal** (página mais importante)
2. **`/generate` — Geração de Imagens** (secundária)
3. **`/arena` — Arena de IAs** (comparação de até 3 configs)
4. **`/library` — Biblioteca** (histórico de pesquisas salvas)
5. **`/settings` — Configurações** (preferências + modelos + prompts custom)
6. **`/research/[id]` — Pesquisa Individual** (visualização de pesquisa salva)

---

## ESTADO ATUAL DA UI — DESCRIÇÃO COMPONENTE A COMPONENTE

### 1. Layout Global (`app/layout.tsx`)
- HTML com `lang="pt-BR"`, `suppressHydrationWarning`
- Body com classes Geist Sans/Mono + `antialiased`
- Hierarquia de providers: `ThemeProvider` → `AppProvider`
- `<Header />` sticky no topo
- `<main>` com `mx-auto max-w-5xl` (conteúdo centralizado, 80rem máx)
- `<ArtifactsPanel />` fixed à direita (side panel, 560px)

### 2. Header (`components/layout/Header.tsx`)
- **Sticky** top-0, z-50, backdrop-blur-md, border-b
- Logo: ícone Search dentro de div 7x7 com bg-primary/10 + rounded-lg, nome do app em text-sm font-bold
- **Navegação desktop (5 links):** Pesquisa, Imagens, Arena, Biblioteca, Config — cada um com ícone lucide 3.5x3.5 + label
- Active state: bg-accent + font-medium; Hover: bg-accent
- **Mobile:** Hamburger menu (Menu/X toggle), nav vertical que aparece abaixo do header
- ThemeToggle no canto direito: botão 9x9 que cicla light→dark→system com ícones Sun/Moon/Monitor
- **Max-width:** max-w-5xl (mesmo que o main)
- **Altura:** h-14

### 3. Página Principal — Pesquisa (`app/page.tsx`)
- **Hero (idle state):** Ícone Search 8x8 em container 16x16 rounded-2xl bg-primary/10, título h1 text-4xl font-bold tracking-tight, descrição em text-muted-foreground, atalhos de teclado com `<kbd>`
- **ResearchInput:** Campo input h-14 rounded-xl com ícone Search à esquerda, botão Pesquisar/Cancelar à direita dentro do input. Abaixo: grid 2x4 de depth presets (⚡Rápida, 🔍Normal, 🔬Profunda, 🏛️Exaustiva) como cards selecionáveis com tempo e custo estimado. Abaixo: domain pills (🌐Geral, 🎓Acadêmico, ⚖️Jurídico, 💻Tecnologia, 📰Notícias, 📝Concursos) como rounded-full chips. Seção de templates colapsável.
- **ResearchProgress (running state):** Card rounded-xl com progress bar animada (h-2, bg-primary, transition-all duration-500), lista de pipeline stages com ícones (CheckCircle2/Loader2/XCircle/Circle), stats (sub-queries, fontes encontradas, fontes selecionadas, custo real), lista de sub-queries geradas com marker "›" em text-primary
- **ReportViewer (streaming/complete):** Toolbar com título + badge "Gerando..." animado (pulse), botões Copiar e Download .md. Conteúdo em div max-h-[70vh] overflow-y-auto rounded-xl com padding p-6/p-8. MarkdownRenderer com citações clicáveis [N] que scrollam para a fonte. Metadata bar com Clock, Database, DollarSign. Lista de citações com badges numéricas clicáveis.
- **Follow-up Chat:** Card com mensagens user (bg-primary/10, ml-8) e assistant (bg-muted, mr-8), input h-10 com botão Send
- **Reset Confirmation Modal:** Fixed inset-0 z-50 com backdrop bg-black/60 backdrop-blur-sm. Card max-w-md com 3 botões: Cancelar, Descartar (text-destructive), Salvar e Nova
- **Botão "Nova Pesquisa":** Aparece quando complete/error, variant outline com ícone RotateCcw

### 4. Geração de Imagens (`/generate`)
- Header com ícone ImageIcon em container 12x12 rounded-2xl bg-primary/10
- Card com textarea 4 rows, grid 2 colunas (modelo + tamanho), botões Gerar/Download/Reset
- Preview de imagem em Card com img rounded-lg
- Seletor de modelos: Select básico com 5 modelos de imagem
- **Problema visual:** Layout muito simples, sem galeria, sem histórico de gerações

### 5. Arena (`/arena`)
- Header com ícone Swords em container 12x12
- Card de query com textarea 3 rows
- Grid responsivo sm:2 lg:3 de cards de configuração, cada um com: Select de profundidade, 3x ModelSelector (Decomposição/Avaliação/Síntese), CostEstimator
- Status durante execução: badge com Loader2 spin + mensagem de stage
- Winner highlight: border-green-500/50 + ring-1 ring-green-500/30 + emoji 🏆
- Tabela comparativa: Config, Duração, Fontes, Custo, Tamanho, Status
- Tabs de relatórios: border-b-2 tabs manuais

### 6. Biblioteca (`/library`)
- Empty state: ícone BookOpen 8x8 em container muted, CTA "Nova Pesquisa"
- Header com contagem de pesquisas e custo total
- Filtros: input de busca com ícone Search, Select de profundidade, botão Favoritas com Star
- Cards de pesquisa: título truncado + query truncada, badges de depth/duração/custo/fontes/confiança, data, botões favorite/delete inline
- Confidence level: pills coloridas (green/yellow/red com opacity 20%)

### 7. Configurações (`/settings`)
- Header com ícone Settings, botões Restaurar + Salvar com feedback "Salvo!" animado
- 5 Cards verticais: Pesquisa (depth, model preference, output language), Modelos por Fase (3x ModelSelector + CostEstimator), Prompts Customizáveis (3x textarea), Aparência (tema), Sobre (info técnica)
- **ModelSelector** (componente complexo): Search input, filtros por provider/tier, sort (preço/contexto/latência/TPS), agrupamento por provider com badges coloridas, seção de recomendações (4 categorias), métricas inline (context, max output, latency, TPS, preço)

### 8. ArtifactsPanel (side panel)
- Fixed right-0 top-0, z-40, 560px, border-l, shadow-2xl
- Header com título truncado + versioning badge (v1/3)
- Tab bar para múltiplos artifacts (scroll horizontal)
- Toolbar: Code/Preview toggle (toggle group estilizado), version nav (←→), Copy, Download, Delete
- Content area: Code view (pre/code com font-mono), HTML preview (iframe sandbox), React preview (iframe com babel), Markdown preview (dangerouslySetInnerHTML)
- Footer com language, char count, timestamp

### 9. Design System Atual
- **Cores:** OKLCH color space, esquema neutro azulado. Dark mode: background oklch(0.141), card oklch(0.176), border oklch(0.293), muted-foreground oklch(0.711). Primary é tom claro em dark mode.
- **Tipografia:** Geist Sans para UI, Geist Mono para código. text-sm predominante, text-xs para metadata.
- **Espaçamento:** gap-2 a gap-6, padding p-3 a p-8, margin via space-y-*
- **Borders:** border border-border em quase tudo, rounded-lg a rounded-2xl
- **Cards:** bg-card com border, sem sombra na maioria
- **Botões:** Primários bg-primary text-primary-foreground; Outline com border-border; Destructive em vermelho
- **Ícones:** Todos lucide-react, tamanhos h-3 a h-8 dependendo do contexto
- **Animações:** animate-spin no loader, animate-pulse no streaming indicator, transition-all/transition-colors nos hovers
- **Responsividade:** Grid breakpoints sm: e lg:, mobile hamburger menu
- **Dark-first:** Design pensado para dark mode, light mode funcional mas menos polido

---

## O QUE EU PRECISO DE VOCÊ

Analise o estado atual descrito acima e produza um documento técnico de melhorias com as seguintes seções. Use exclusivamente referências e tendências de **julho 2025 a fevereiro 2026**. Priorize inovação e modernidade.

### SEÇÃO 1: Análise Crítica da UI Atual
Identifique:
- Problemas de usabilidade (UX friction points)
- Inconsistências visuais
- Oportunidades perdidas de feedback visual
- Problemas de hierarquia de informação
- Gaps de acessibilidade (a11y)
- Problemas de responsividade mobile
- Onde o design system está fraco ou inconsistente

### SEÇÃO 2: Melhorias de Design System
Proponha melhorias no design system base, incluindo:
- **Paleta de cores:** Considere as tendências 2025-2026 (neo-brutalism decay? glassmorphism evolution? OKLCH-native tokens?)
- **Tipografia:** O Geist é ideal? Alternativas? Escala tipográfica?
- **Espaçamento e grid:** O layout max-w-5xl é adequado? Quando expandir?
- **Componentes base:** Quais shadcn/ui faltantes são críticos? (dialog, tooltip, skeleton, toast, sheet, command palette)
- **Micro-interações:** Onde adicionar Framer Motion, View Transitions API, spring animations?
- **Motion design:** Referências a Apple Human Interface Guidelines 2025, Material Design 3 Expressive

### SEÇÃO 3: Melhorias por Página/Componente
Para cada página e componente, sugira melhorias concretas e implementáveis:
- `/` — Pesquisa principal (hero, input, progress, report, follow-up)
- `/arena` — Arena (layout, comparação visual, diff de relatórios)
- `/library` — Biblioteca (cards, filtros, visualização rápida)
- `/settings` — Configurações (formulários, preview, validação)
- `/generate` — Imagens (galeria, prompt builder, aspect ratio visual)
- Header — Navegação (breadcrumbs? command palette? search global?)
- ArtifactsPanel — Side panel (drag, resize, split view)

### SEÇÃO 4: Tendências Técnicas 2025-2026 Aplicáveis
Pesquise e incorpore as seguintes tendências recentes:
- **React 19 View Transitions** (`<ViewTransition>`, `useSwipeTransition`) — como aplicar para navegação entre páginas
- **Next.js 16 Cache Components** — onde usar para otimizar re-renders pesados (ModelSelector, Library)
- **CSS Anchor Positioning** (baseline 2025) — tooltips, popovers sem JS
- **Scroll-driven Animations** (CSS) — progress bars, parallax no hero, reveal animations
- **Container Queries** (@container) — componentes responsivos por container, não viewport
- **Popover API** nativo — substituir sheets/modals custom
- **`<search>` element** HTML — semântica para o input de pesquisa
- **Speculation Rules API** — prefetch inteligente entre páginas
- **OKLCH-native design tokens** — paleta mais perceptualmente uniforme
- **AI-native UX patterns** — streaming indicators modernos (skeleton → shimmer → content), confidence meters visuais, source credibility badges com tooltip contextuais
- **Spatial UI** — layouts que respondem ao conteúdo (report longo expande, short compacta)
- **Bento Grid layouts** — para dashboards e comparações (Arena, Library)
- **Glassmorphism 2.0** — backdrop-blur com gradientes OKLCH e noise textures
- **Sonner** (toast library) — substituto moderno do toast system
- **cmdk** (command palette) — ⌘K para navegação, busca global, ações rápidas
- **Vaul** (drawer) — mobile-first drawer para painéis
- **nuqs** — type-safe URL state para filtros (Library, Arena)
- **Framer Motion 12** — layout animations, shared layout, exit animations
- **Recharts / Nivo** — gráficos para custo acumulado, timeline de pesquisas
- **react-resizable-panels** — para o ArtifactsPanel com drag-to-resize

### SEÇÃO 5: Performance e Perceived Performance
- Onde usar `loading.tsx` e `Suspense` boundaries
- Skeleton screens vs shimmer vs content placeholder
- Optimistic UI para save/delete/favorite
- Progressive disclosure patterns
- `startTransition` para atualizações non-blocking (ModelSelector filter/sort)

### SEÇÃO 6: Acessibilidade (a11y)
- ARIA roles faltantes
- Keyboard navigation gaps
- Focus management
- Screen reader considerations
- Contrast ratios (especialmente no dark mode com muted-foreground)
- Reduced motion preferences

### SEÇÃO 7: Plano de Implementação Priorizado
Organize todas as melhorias em uma tabela:
| # | Melhoria | Impacto UX | Esforço Dev | Dependências | Prioridade |
Com categorias: Quick Wins (< 1h), Medium (1-4h), Large (4-16h), Epic (16h+)

---

## RESTRIÇÕES E PREFERÊNCIAS

1. **Idioma do app:** Português Brasileiro (strings, labels, placeholders)
2. **Idioma do código:** Inglês (nomes de variáveis, componentes, types)
3. **Dark-first:** O modo escuro é o padrão e deve ser o mais polido
4. **Minimalismo funcional:** Não adicionar elementos decorativos sem função. Cada pixel deve informar ou facilitar ação.
5. **Sem bibliotecas pesadas** de componentes (Material UI, Chakra, Ant Design). Manter shadcn/ui + custom.
6. **Mobile é secundário** mas deve funcionar. O público principal usa desktop/laptop.
7. **Performance é prioridade:** TTFB < 2s, LCP < 2.5s, CLS < 0.1
8. **Todas as cores devem usar OKLCH** (Tailwind 4.x nativo)
9. **Streaming-first:** O app exibe dados em tempo real via SSE. Toda UI deve suportar estados parciais/streaming.
10. **Solo developer** — o plano deve ser implementável por 1 pessoa

---

## FORMATO DE SAÍDA ESPERADO

Para cada melhoria sugerida, forneça:
1. **Problema atual** (1-2 frases)
2. **Solução proposta** (descrição + referência visual se possível)
3. **Tecnologia/lib** específica a usar
4. **Snippet de exemplo** (código TSX/CSS quando aplicável, 5-15 linhas)
5. **Referência** de onde tirou a ideia (link, paper, design system, artigo jul/2025-fev/2026)

Não produza respostas genéricas como "melhore o contraste" ou "adicione animações". Seja específico: qual componente, qual propriedade CSS, qual hook React, qual biblioteca na versão exata.
