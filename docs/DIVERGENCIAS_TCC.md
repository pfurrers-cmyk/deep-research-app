# DIVERGÊNCIAS: Modo TCC — Solicitado vs Entregue

**Data:** 2026-02-08 (atualizado 08/02 09:43)
**Documento analisado (v2):** `research-causas-para-a-ascensao-do-stf-no-desenho-instituci (1).md`
**Log analisado (v2):** `amago-debug-full_2026-02-08T12-42-45.json`
**Screenshot analisado:** Modal "Exportar Relatório" em produção (Vercel)

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

### Mecanismo do problema (atualizado 08/02 v2)

**PARCIALMENTE CORRIGIDO:** O task-manager AGORA envia `proSettings` e `tccSettings` no body. A API route AGORA os repassa ao `ResearchRequest`. **MAS** o pipeline e o synthesizer continuam chamando `loadPreferences()` internamente e ignorando os campos da request.

1. ✅ O frontend salva `researchMode: 'tcc'` em `localStorage` via `savePreferences()`
2. ✅ O `task-manager.ts` (cliente) envia `proSettings` e `tccSettings` no body (CORRIGIDO)
3. ✅ O API route (`app/api/research/route.ts`) repassa `proSettings` e `tccSettings` para `ResearchRequest` (CORRIGIDO)
4. ❌ **`pipeline.ts:216`** chama `loadPreferences()` para decidir injeção de domínios acadêmicos → sempre `standard`
5. ❌ **`synthesizer.ts:23`** chama `loadPreferences()` para routing TCC → sempre `standard`
6. ❌ **`synthesizer.ts:54`** chama `buildSynthesisPrompt()` com `prefs.pro` e `prefs.tcc` de `loadPreferences()` → sempre defaults
7. ❌ **`synthesizeReport()` NÃO recebe `request.proSettings`/`request.tccSettings`** como parâmetro
8. ❌ **`pipeline.ts:416`** chama `synthesizeReport(query, sources, depth, config, ...)` sem passar proSettings/tccSettings

### Evidência do log v2 (08/02 09:36)
```
Client envia:  hasProSettings=true, hasTccSettings=true, proResearchMode="tcc"
Servidor log:  serverLogs=[] (vazio — ring buffer não persiste entre requests no Vercel)
Resultado:     Relatório padrão (seções genéricas, citações [1][2][3])
```

### Arquivos envolvidos
| Arquivo | Problema | Status |
|---|---|---|
| `lib/config/settings-store.ts:164` | `loadPreferences()` retorna defaults no servidor (sem `window`) | ⚠️ Causa raiz |
| `lib/store/task-manager.ts` | Não enviava pro/tcc no body → **CORRIGIDO** | ✅ |
| `app/api/research/route.ts` | Não repassava pro/tcc → **CORRIGIDO** | ✅ |
| `lib/research/pipeline.ts:216` | Chama `loadPreferences()` em vez de usar `request.proSettings` | ❌ |
| `lib/research/synthesizer.ts:23` | Chama `loadPreferences()` em vez de receber proSettings como parâmetro | ❌ |
| `lib/research/synthesizer.ts:54` | Passa `prefs.pro`/`prefs.tcc` de loadPreferences para buildSynthesisPrompt | ❌ |
| `lib/research/pipeline.ts:416` | Chama `synthesizeReport()` sem proSettings/tccSettings | ❌ |
| `config/defaults.ts:781-789` | `exportFormats.options` não inclui `docx` | ❌ |

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

## RESUMO

| Funcionalidade | Código existe? | Funciona em produção? | Motivo |
|---|---|---|---|
| Prompts TCC por seção ABNT | ✅ | ❌ | Sintetizador TCC nunca chamado |
| Citações autor-data ABNT | ✅ | ❌ | Sintetizador TCC nunca chamado |
| Pipeline TCC dedicado | ✅ | ❌ | `researchMode` não chega ao servidor |
| Formulário TCC expandido | ✅ | ⚠️ Parcial | UI funciona, dados não chegam ao servidor |
| Busca acadêmica | ✅ | ❌ | Condição TCC nunca verdadeira no servidor |
| Export DOCX ABNT | ✅ | ❌ | DOCX ausente do config de formatos do modal |
| Export DOCX (genérico) | ✅ | ❌ | Idem — não aparece na UI |

**Conclusão:** Todo o código das 6 fases foi escrito mas NENHUMA funcionalidade TCC opera em produção. A causa raiz é que as preferências do usuário (armazenadas em localStorage no cliente) nunca são transmitidas ao servidor via API request.
