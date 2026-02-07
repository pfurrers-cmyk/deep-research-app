# Mega Prompt — Resolução do Problema Crítico de Truncamento na Síntese de Relatórios Longos

> **Instrução:** Cole este prompt integralmente em um LLM de raciocínio avançado (Claude Opus, GPT-4.1, Gemini 2.5 Pro) para obter uma solução arquitetural completa para o problema de truncamento de relatórios longos no Âmago.AI.

---

## PROMPT

Você é um arquiteto de software sênior especializado em aplicações de IA generativa, streaming de texto, e design de pipelines LLM. Preciso da sua ajuda para resolver um **problema crítico** no meu aplicativo.

---

### CONTEXTO RÁPIDO DO APP

**Âmago.AI** — Aplicativo web pessoal de pesquisa profunda automatizada.

| Item | Valor |
|---|---|
| Stack | Next.js 16.1.6, React 19, TypeScript strict, Vercel AI SDK 6.0.75 |
| AI Gateway | `@ai-sdk/gateway` 3.0.37 (Vercel AI Gateway) |
| Deploy | Vercel (Fluid Compute, `maxDuration: 300s`) |
| Streaming | Server-Sent Events (SSE) via `streamText` do AI SDK |
| Persistência | IndexedDB (Dexie.js) client-side |
| Uso | Pessoal, single-tenant, sem auth |

O pipeline de pesquisa tem 6 etapas: Decomposição → Busca → Avaliação → Extração → **Síntese** → Pós-processamento. O problema está na **etapa de Síntese**.

---

### O PROBLEMA CRÍTICO

Quando o usuário solicita relatórios longos (ex: "TCC completo de 40 páginas em formato ABNT"), o relatório é **truncado no meio de uma frase**. O texto simplesmente para, sem conclusão, sem lista de fontes completa, sem finalização.

**Caso concreto que demonstra o problema:**
- Prompt: "Gere um TCC completo com no mínimo 40 páginas, em padrão ABNT"
- Modelo: `anthropic/claude-opus-4.6` (maxOutput nativo: 256.000 tokens)
- Profundidade: "exaustiva" (15 sub-queries, até 50 fontes)
- Custo: $0.67
- Resultado: Relatório de ~5.500 palavras (~8 páginas) truncado no meio da Conclusão. A última linha é: "...na proporcionalidade, na razoabilidade e na d" — corte abrupto.

**O usuário pagou $0.67 e recebeu ~20% do que pediu.** Isso é inaceitável.

---

### ANÁLISE DE ROOT CAUSE — OS 5 GARGALOS

Identifiquei 5 gargalos que se compõem para causar o truncamento:

#### Gargalo 1: `maxOutputTokens` configurado muito baixo

```typescript
// config/defaults.ts — linha 95
synthesis: {
  maxOutputTokens: 16000,  // ← DEFAULT: ~10 páginas
}

// config/defaults.ts — linha 590 (nível de detalhe "Exaustivo")
exhaustive: {
  maxTokens: 24000,  // ← MÁXIMO CONFIGURÁVEL: ~16 páginas
  pages: '~16 páginas',
}
```

O nível "Exaustivo" permite no máximo 24.000 tokens ≈ 16 páginas. O usuário pediu 40 páginas ≈ 60.000-80.000 tokens. O modelo Claude Opus 4.6 **suporta** 256.000 tokens de output, mas o config **limita artificialmente** a 24.000.

#### Gargalo 2: Timeout da síntese insuficiente

```typescript
// config/defaults.ts — linha 872
timeoutPerStageMs: {
  synthesis: 120000,  // ← 2 MINUTOS para gerar o relatório inteiro
}
```

Gerar 40 páginas com Claude Opus (latência ~3.6s, TPS ~75) levaria:
- 60.000 tokens ÷ 75 TPS = ~800 segundos ≈ **13 minutos**
- Timeout de 2 minutos aborta MUITO antes

#### Gargalo 3: Vercel `maxDuration: 300s` (5 minutos)

Mesmo aumentando o timeout da síntese, o Vercel Fluid Compute limita a execução total da API route a 300 segundos. Se as etapas anteriores (decomposição + busca + avaliação) consumirem 60-120s, restam apenas 180-240s para síntese.

Para 40 páginas → precisa de ~800s → **impossível em uma única invocação**.

#### Gargalo 4: Abordagem single-pass

```typescript
// lib/research/synthesizer.ts
const result = streamText({
  model: gateway(modelId),
  system,         // ← System prompt de ~3K tokens
  prompt,         // ← Fontes + query = pode ser 30K+ tokens
  maxOutputTokens: config.pipeline.synthesis.maxOutputTokens,  // ← 16K-24K
  abortSignal: AbortSignal.timeout(120000),  // ← 2 min
});
```

Uma ÚNICA chamada `streamText` deve produzir o documento INTEIRO. Isso significa:
- O modelo precisa manter coerência por 40+ páginas em uma única geração
- Qualquer timeout/erro perde TODO o trabalho
- O input (system + prompt + fontes) pode exceder o context window disponível para output
- Não há como o modelo "planejar" a estrutura do documento antes de escrever

#### Gargalo 5: Prompt instrui limite de tamanho

```typescript
// lib/ai/prompts/synthesis.ts — linha 139
`**Tamanho alvo**: aproximadamente ${maxTokens} tokens (${detailOpts?.pages ?? '~3 páginas'})`
```

O próprio prompt diz ao modelo: "escreva ~16 páginas". Mesmo que o maxOutputTokens fosse maior, o modelo seguiria a instrução do prompt e pararia em ~16 páginas.

---

### O QUE EU PRECISO DE VOCÊ

Projete uma **solução arquitetural completa** para permitir geração de relatórios de qualquer tamanho (de 1 a 100+ páginas) sem truncamento. A solução deve:

1. **Ser retrocompatível** — relatórios curtos (3-8 páginas) continuam funcionando como hoje
2. **Escalar para documentos longos** — 40+ páginas sem truncamento
3. **Manter streaming** — o usuário vê o texto aparecendo em tempo real
4. **Respeitar limites do Vercel** — `maxDuration: 300s` por invocação
5. **Ser custo-consciente** — não desperdiçar tokens com overhead desnecessário
6. **Preservar qualidade** — cada seção deve ser tão boa quanto no modo single-pass

---

### RESTRIÇÕES TÉCNICAS

1. **Stack fixo:** Next.js 16 App Router + Vercel AI SDK 6 + Vercel deploy. Não mudar framework.
2. **AI Gateway:** Todas as chamadas LLM via `@ai-sdk/gateway`. Nunca importar providers diretamente.
3. **SSE Streaming:** O pipeline usa SSE customizado (`lib/utils/streaming.ts`). O relatório é streamed via `TextDeltaEvent`.
4. **Modelos disponíveis:** 181 modelos no catálogo, incluindo:
   - Claude Opus 4.6: 256K context, 256K output, $15/1M output tokens
   - Claude Sonnet 4.5: 200K context, 64K output, $15/1M output tokens
   - GPT-4.1: 1M context, 32K output, $8/1M output tokens
   - Gemini 2.5 Pro: 1M context, 66K output, $10/1M output tokens
5. **Config-driven:** Todo valor numérico vive em `config/defaults.ts`. Zero magic numbers.
6. **Resilience:** Fallback chains por tier. Se um modelo falha, tenta o próximo.
7. **Custo pessoal:** O desenvolvedor paga do próprio bolso. Cada dólar conta.

---

### CONTEXTO DETALHADO DO CÓDIGO

#### Synthesizer atual (`lib/research/synthesizer.ts`):
```typescript
export async function synthesizeReport(
  query: string,
  sources: EvaluatedSource[],
  depth: DepthPreset,
  config: AppConfig,
  onTextDelta?: (delta: string) => void,
  attachments?: ResearchAttachment[]
): Promise<string> {
  const prefs = loadPreferences();
  const modelSelection = selectModel('synthesis', 'auto', depth, config);
  const { system, prompt } = buildSynthesisPrompt(query, sources, config, undefined, prefs.pro);

  // ... attachment injection ...

  let fullText = '';
  const fallbackChain = [modelSelection.modelId, ...modelSelection.fallbackChain];

  for (const modelId of fallbackChain) {
    try {
      const result = streamText({
        model: gateway(modelId),
        system,
        prompt,
        maxOutputTokens: config.pipeline.synthesis.maxOutputTokens,
        abortSignal: AbortSignal.timeout(config.resilience.timeoutPerStageMs.synthesis),
        providerOptions: getSafetyProviderOptions(modelId) as never,
      });

      for await (const delta of result.textStream) {
        fullText += delta;
        onTextDelta?.(delta);
      }
      return fullText;
    } catch (error) {
      fullText = '';
      // ... fallback logic ...
    }
  }
  return fullText;
}
```

#### Synthesis prompt builder (`lib/ai/prompts/synthesis.ts`):
- System prompt: ~2500 tokens com instruções de estilo, citação, modo de pesquisa
- User prompt: query + N fontes (cada fonte: título + URL + relevância + 2500 chars de conteúdo)
- Com 50 fontes × 2500 chars ≈ 125K chars ≈ ~35K tokens só de fontes no prompt
- Instrução explícita: "Tamanho alvo: aproximadamente {maxTokens} tokens ({pages})"

#### Pipeline orchestrator (`lib/research/pipeline.ts`):
- Já tem 3 modos de processamento para BUSCA (Base/Extended/Ultra)
- Emite SSE events: `StageEvent`, `TextDeltaEvent`, `CompleteEvent`
- O synthesizer é chamado como último passo antes do pós-processamento
- A stream de texto é emitida diretamente ao cliente via `onTextDelta`

#### Configuração de profundidade (`config/defaults.ts`):
```typescript
exaustiva: {
  subQueries: 15,
  maxSources: 50,
  synthesisModel: 'anthropic/claude-opus-4.6',
  extractionEnabled: true,
  researchLoopEnabled: true,
  estimatedTimeSeconds: 600,
  estimatedCostUSD: 3.0,
}
```

#### Configuração PRO de nível de detalhe:
```typescript
detailLevel: {
  options: {
    summary:    { maxTokens: 2000,  pages: '~1 página' },
    standard:   { maxTokens: 6000,  pages: '~3 páginas' },
    detailed:   { maxTokens: 12000, pages: '~8 páginas' },
    exhaustive: { maxTokens: 24000, pages: '~16 páginas' },
  }
}
```

---

### DIREÇÕES QUE CONSIDEREI (avalie cada uma)

#### Opção A: Simplesmente aumentar maxOutputTokens
- Setar `maxOutputTokens: 128000` para o nível exaustivo
- **Problema:** timeout de 2 min ainda corta. Vercel maxDuration de 5 min também pode cortar.

#### Opção B: Geração seção por seção (multi-pass)
- Primeiro `generateObject` para planejar outline com seções e tamanhos estimados
- Depois `streamText` para cada seção individualmente
- Concatenar no final
- **Vantagem:** cada seção respeita timeouts, pode usar modelos menores para seções simples
- **Problema:** como manter streaming contínuo para o usuário? Como manter coerência entre seções?

#### Opção C: Continuação automática (detect truncation → continue)
- Detectar quando o modelo parou sem terminar (última seção ausente, texto cortado no meio)
- Fazer nova chamada `streamText` com contexto do que já foi gerado
- Append ao texto existente
- **Vantagem:** simples de implementar, mantém streaming
- **Problema:** pode gerar repetição, perda de coerência, e custo dobrado pelo contexto reenviado

#### Opção D: Múltiplas invocações API encadeadas (client-side orchestration)
- O frontend faz N chamadas POST separadas, cada uma gerando uma seção
- Cada chamada respeita o maxDuration de 300s
- **Vantagem:** contorna limite do Vercel
- **Problema:** complexidade de orquestração, UX de múltiplos loadings

#### Opção E: Background job com polling
- A API route inicia um job em Vercel KV/Cron
- O frontend faz polling para buscar progresso
- **Problema:** Vercel não tem background jobs nativos de longa duração. Precisaria de infra externa.

#### Opção F: Híbrida — Planejar + Gerar por seção + Streaming contínuo
- **Fase 1 (Planning):** `generateObject` cria outline detalhado com seções, sub-seções, tamanho alvo por seção
- **Fase 2 (Generation):** Para cada seção, `streamText` com contexto da seção anterior + outline + fontes relevantes para aquela seção
- **Fase 3 (Assembly):** Concatenação em tempo real com streaming contínuo ao usuário
- Cada seção é uma chamada separada, respeitando timeouts
- O contexto enviado para cada seção inclui: (a) o outline completo, (b) o texto das 1-2 seções anteriores como contexto de coerência, (c) apenas as fontes relevantes para aquela seção
- **Vantagem:** Escalável, resiliente, coerente, streaming contínuo
- **Problema:** Mais complexo, overhead de tokens no contexto

---

### O QUE EU PEÇO

Produza um **documento de design técnico completo** com:

#### 1. Análise das Opções
- Avalie cada opção (A-F) com trade-offs de: complexidade, custo, qualidade, UX, resiliência
- Recomende a melhor abordagem (ou combinação)

#### 2. Arquitetura Detalhada da Solução
- Diagrama de fluxo do novo pipeline de síntese
- Interfaces TypeScript para os novos tipos
- Pseudocódigo para cada componente novo
- Como se integra com o código existente (referencie arquivos e funções específicos)

#### 3. Mudanças em `config/defaults.ts`
- Novos valores de configuração necessários
- Novo nível de detalhe "monographic" ou similar para documentos de 40+ páginas
- Timeouts ajustados
- Estimativas de custo realistas

#### 4. Mudanças no Synthesis Prompt
- Como adaptar `lib/ai/prompts/synthesis.ts` para o modo multi-seção
- Prompt para a fase de planning (outline generation)
- Prompt template para geração de cada seção individual
- Como injetar contexto de coerência entre seções sem desperdiçar tokens

#### 5. Mudanças no Synthesizer
- Novo `lib/research/synthesizer.ts` (ou função adicional)
- Como manter a interface `onTextDelta` funcionando para streaming contínuo
- Como lidar com falhas em seções intermediárias (retry? skip? fallback?)
- Como detectar se o modo multi-seção é necessário (threshold de tokens)

#### 6. Mudanças no Pipeline
- Como `lib/research/pipeline.ts` deve chamar o novo synthesizer
- Novos SSE events para feedback de progresso (ex: "Gerando seção 3/8: Análise...")
- Como lidar com o timeout global do Vercel

#### 7. Mudanças no Frontend
- Como `components/research/ReportViewer.tsx` e `components/research/ResearchProgress.tsx` devem exibir progresso por seção
- UX de "seção completa" vs "gerando próxima seção"

#### 8. Estimativas
- Custo estimado para gerar relatório de 40 páginas com Claude Opus
- Tempo estimado de geração
- Token budget breakdown (input vs output por seção)

#### 9. Plano de Implementação
- Ordem de implementação em etapas incrementais
- O que pode ser feito sem quebrar o modo existente (retrocompatibilidade)
- Testes que devem ser escritos

#### 10. Edge Cases e Riscos
- O que acontece se uma seção falhar no meio?
- O que acontece se o outline gerado for ruim?
- Como evitar repetição entre seções?
- Como garantir que citações [N] sejam consistentes entre seções?
- E se o usuário cancelar no meio da geração?
- E se o modelo decidir gerar menos do que o solicitado mesmo com tokens disponíveis?

---

### FORMATO

Use Markdown com:
- Headings hierárquicos (##, ###, ####)
- Blocos de código TypeScript para interfaces, pseudocódigo e configs
- Diagramas ASCII para fluxos
- Tabelas para comparações
- Callouts `> ⚠️` para riscos e `> ✅` para decisões

Seja **extremamente específico e técnico**. Quero código que eu possa adaptar e implementar diretamente, não recomendações genéricas. Referencie os arquivos e funções existentes pelos nomes exatos.

---

*Âmago.AI v4.1.1 — O relatório foi cortado em "na proporcionalidade, na razoabilidade e na d". Isso não pode acontecer nunca mais.*
