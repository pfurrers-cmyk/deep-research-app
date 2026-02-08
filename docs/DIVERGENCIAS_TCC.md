# DIVERGÊNCIAS: Modo TCC — Solicitado vs Entregue

**Data:** 2026-02-08
**Documento analisado:** `research-causas-para-a-ascensao-do-stf-no-desenho-instituci.md`
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

### Mecanismo do problema
1. O frontend salva `researchMode: 'tcc'` em `localStorage` via `savePreferences()`
2. O `task-manager.ts` (cliente) chama `fetch('/api/research', { body: { query, depth, domainPreset, ... } })` — **NÃO envia `pro` nem `tcc` settings**
3. O API route (`app/api/research/route.ts`) monta `ResearchRequest` SEM nenhuma informação de modo TCC
4. O pipeline (`lib/research/pipeline.ts`) chama `loadPreferences()` no servidor
5. `loadPreferences()` no servidor: `if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES }` → retorna SEMPRE `researchMode: 'standard'`
6. O sintetizador TCC **nunca é chamado**

### Arquivos envolvidos
| Arquivo | Problema |
|---|---|
| `lib/config/settings-store.ts:164` | `loadPreferences()` retorna defaults no servidor (sem `window`) |
| `lib/store/task-manager.ts:225-237` | Não envia `pro` nem `tcc` no body da request |
| `app/api/research/route.ts:15-25` | Não recebe `pro` nem `tcc` do body |
| `lib/research/pipeline.ts:209` | `loadPreferences()` no servidor retorna `researchMode: 'standard'` |
| `lib/research/synthesizer.ts:22-27` | Routing para TCC depende de `prefs.pro.researchMode === 'tcc'` que nunca é true no servidor |
| `config/defaults.ts:781-789` | `exportFormats.options` não inclui `docx` |

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
