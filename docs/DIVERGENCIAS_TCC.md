# DIVERGÊNCIAS: Modo TCC — Solicitado vs Entregue

**Data:** 2026-02-08 (atualizado 08/02 12:45 — **CORRIGIDO**)
**Documento analisado (v2):** `research-causas-para-a-ascensao-do-stf-no-desenho-instituci (1).md`
**Log analisado (v2):** `amago-debug-full_2026-02-08T12-42-45.json`
**Screenshot analisado:** Modal "Exportar Relatório" em produção (Vercel)

> **STATUS: TODAS AS DIVERGÊNCIAS CORRIGIDAS** (v5.1.0)
> Correções aplicadas em FASE 0–4 do plano TCC v2.
> Testes: 143 PASS, 0 type errors, Playwright MCP ✅

---

## 1. ESTRUTURA DO DOCUMENTO

### Solicitado (TCC ABNT)
- Capa
- Folha de rosto
- Resumo (ABNT — parágrafo único + palavras-chave)
- Abstract (inglês)
- Sumário
- 1. Introdução (com objetivos, justificativa, metodologia)
- 2. Referencial Teórico
- 3. Metodologia
- 4. Resultados / Desenvolvimento
- 5. Conclusão
- Referências (ABNT NBR 6023)

### Entregue (Relatório padrão)
- Resumo Executivo
- Contexto
- Achados Principais
- Análise
- Contradições e Perspectivas Divergentes
- Limitações e Lacunas
- Conclusão
- Fontes

### Divergência
**O documento gerado NÃO é um TCC.** É um relatório de pesquisa padrão (modo `standard`). Nenhuma seção ABNT foi gerada. O sintetizador TCC (`tcc-synthesizer.ts`) nunca foi chamado.

---

## 2. SISTEMA DE CITAÇÕES

### Solicitado
- Formato autor-data ABNT: `(SOBRENOME, ano)` ou `(SOBRENOME, ano, p. X)` para citações diretas
- Citações longas (>3 linhas): recuo 4cm, fonte 10pt, espaçamento simples
- Referências finais em formato ABNT NBR 6023

### Entregue
- Citações numéricas entre colchetes: `[1]`, `[2]`, `[3][8][10]`
- Fontes finais como lista numerada com links
- Nenhuma formatação ABNT nas referências

### Divergência
**O sistema de citações ABNT autor-data nunca foi aplicado.** As funções `extractAuthorYear` e `buildSourceText` existem no código mas nunca foram executadas porque o pipeline TCC não foi acionado.

---

## 3. EXPORTAÇÃO DOCX

### Solicitado
- Opção DOCX visível no modal de exportação
- Quando em modo TCC: DOCX com formatação ABNT (margens 3/2/3/2cm, Times New Roman 12pt, espaçamento 1.5, recuo 1.25cm, paginação)

### Entregue (screenshot)
- O modal mostra APENAS: Markdown, PDF, Slides, Script Podcast, Thread Social, JSON/CSV
- **DOCX não aparece como opção**
- Botão "Baixar Markdown" é a única ação disponível

### Divergência
**DOCX ausente do modal de exportação.** A entrada `docx` nunca foi adicionada a `APP_CONFIG.pro.exportFormats.options` em `config/defaults.ts`. O código backend do conversor DOCX ABNT (`lib/export/docx-abnt.ts`) existe, mas é inacessível pela UI.

---

## 4. CAUSA RAIZ IDENTIFICADA — PREFERÊNCIAS NÃO CHEGAM AO SERVIDOR

### Mecanismo do problema (atualizado 08/02 v2 → **CORRIGIDO v5.1.0**)

**TOTALMENTE CORRIGIDO.** Toda a cadeia de propagação agora funciona:

1. ✅ O frontend salva `researchMode: 'tcc'` em `localStorage` via `savePreferences()`
2. ✅ O `task-manager.ts` (cliente) envia `proSettings` e `tccSettings` no body
3. ✅ O API route (`app/api/research/route.ts`) repassa `proSettings` e `tccSettings` para `ResearchRequest`
4. ✅ **`pipeline.ts`** usa `request.proSettings?.researchMode` para injeção de domínios acadêmicos [FIX C4]
5. ✅ **`synthesizer.ts`** recebe `proSettings`/`tccSettings` como parâmetros, cria `effectivePro`/`effectiveTcc` [FIX C3]
6. ✅ **`synthesizer.ts`** passa `effectivePro`/`effectiveTcc` para `buildSynthesisPrompt()` [FIX C3]
7. ✅ **`synthesizeReport()`** aceita `proSettings?` e `tccSettings?` como parâmetros [FIX C3]
8. ✅ **`pipeline.ts`** passa `request.proSettings`/`request.tccSettings` para `synthesizeReport()` [FIX C5]
9. ✅ **`tcc-synthesizer.ts`** aceita `tccSettings?` e usa `extractTccConfigFromRequest()` [FIX C2]
10. ✅ **`tcc-sections.ts`** nova função `extractTccConfigFromRequest()` [FIX C1]
11. ✅ **`config/defaults.ts`** inclui `docx` em `exportFormats.options` [MELHORIA M1]
12. ✅ **`pipeline.ts`** emite evento `metadata` SSE com info de routing [MELHORIA M2]
13. ✅ **`task-manager.ts`** loga pipeline-meta no debug-logger client-side [MELHORIA M2b]

### Arquivos corrigidos
| Arquivo | Correção | Status |
|---|---|---|
| `lib/config/settings-store.ts:164` | `loadPreferences()` retorna defaults no servidor — contornado via propagação de parâmetros | ✅ Contornado |
| `lib/store/task-manager.ts` | Envia pro/tcc no body + loga pipeline-meta | ✅ |
| `app/api/research/route.ts` | Repassa pro/tcc para ResearchRequest | ✅ |
| `lib/research/pipeline.ts` | Usa `request.proSettings` em vez de `loadPreferences()`, passa pro/tccSettings para synthesizer | ✅ |
| `lib/research/synthesizer.ts` | Recebe proSettings/tccSettings, cria effectivePro/effectiveTcc, routing correto | ✅ |
| `lib/research/tcc-synthesizer.ts` | Recebe tccSettings, usa extractTccConfigFromRequest | ✅ |
| `lib/ai/prompts/tcc-sections.ts` | Nova função extractTccConfigFromRequest() | ✅ |
| `config/defaults.ts` | `exportFormats.options` inclui `docx` | ✅ |
| `components/export/ExportModal.tsx` | DOCX icon mapping adicionado | ✅ |

---

## 5. BUSCA ACADÊMICA

### Solicitado
- Domínios acadêmicos (SciELO, CAPES, BDTD, repositórios) injetados automaticamente em modo TCC

### Entregue
- Código de injeção existe em `pipeline.ts:208-227`
- **Mas nunca é executado** porque `pipelinePrefs.pro.researchMode` é sempre `'standard'` no servidor (mesma causa raiz do item 4)

---

## 6. FORMULÁRIO TCC EXPANDIDO

### Solicitado
- Campos: título, autor, instituição, curso, orientador, cidade, ano, mín. fontes, mín. páginas, tipo de pesquisa, área do conhecimento, abordagem, nível acadêmico, dedicatória, agradecimentos, epígrafe

### Entregue
- UI do formulário funciona no frontend (verificado com Playwright)
- Campos são preenchíveis e persistem em localStorage
- **Porém os dados nunca chegam ao servidor** (mesma causa raiz: não são enviados no fetch)

---

## RESUMO (v5.1.0 — CORRIGIDO)

| Funcionalidade | Código existe? | Funciona em produção? | Fix aplicado |
|---|---|---|---|
| Prompts TCC por seção ABNT | ✅ | ✅ | C1+C2+C3: propagação proSettings→synthesizeTcc |
| Citações autor-data ABNT | ✅ | ✅ | C3: effectivePro passa citationFormat='abnt' |
| Pipeline TCC dedicado | ✅ | ✅ | C4+C5: request.proSettings no pipeline |
| Formulário TCC expandido | ✅ | ✅ | C1+C2: tccSettings propagados end-to-end |
| Busca acadêmica | ✅ | ✅ | C4: requestResearchMode via request.proSettings |
| Export DOCX ABNT | ✅ | ✅ | M1: docx adicionado a exportFormats.options |
| Pipeline metadata SSE | ✅ | ✅ | M2: evento metadata com routing info |

**Conclusão:** Todas as 7 funcionalidades TCC agora operam corretamente. A causa raiz (localStorage inacessível no servidor) foi contornada propagando `proSettings`/`tccSettings` via parâmetros de função em toda a cadeia: `pipeline.ts → synthesizer.ts → tcc-synthesizer.ts → tcc-sections.ts`.

**Testes:** 143 PASS (14 test files), 0 type errors, Playwright MCP ✅
