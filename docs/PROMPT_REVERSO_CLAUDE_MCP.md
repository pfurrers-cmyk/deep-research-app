# PROMPT REVERSO — Diagnóstico e Correção do Modo TCC (Âmago.AI)

**Para uso com:** Claude.ai via MCP Server (`Âmago.AI`)
**Data:** 2026-02-08
**Contexto:** O app Âmago.AI é um deep research assistant (Next.js 15 + Vercel) com modo TCC que deveria gerar trabalhos acadêmicos em formato ABNT. Todo o código foi escrito, mas NENHUMA funcionalidade TCC opera em produção.

---

## CONEXÃO MCP

Você tem acesso ao projeto via MCP Server remoto. Use as ferramentas:
- `get_server_logs` — logs do servidor com filtros
- `get_app_status` — status do app, modo TCC, configuração
- `get_divergence_report` — relatório completo de divergências (este documento resumido)
- `read_source_file` — lê qualquer arquivo-fonte do projeto
- `list_key_files` — lista arquivos-chave para diagnóstico

**URL do MCP:** `https://deep-research-app-mauve.vercel.app/api/mcp`

---

## PROBLEMA CENTRAL

O modo TCC do Âmago.AI foi completamente implementado (código existe em 6+ arquivos), mas **nunca é ativado em produção**. A pesquisa gera um relatório padrão em vez de um TCC ABNT.

### Evidência empírica (log de 08/02/2026, 09:36)

O **cliente** envia corretamente:
```json
{
  "researchMode": "tcc",
  "hasProSettings": true,
  "hasTccSettings": true,
  "proResearchMode": "tcc",
  "proCitationFormat": "abnt",
  "tccTitulo": "Causas para a ascensão do STF no desenho institucional brasileiro",
  "tccAutor": "Pedro Furrer",
  "tccMinFontes": 80,
  "tccMinPaginas": 45,
  "enabledSections": ["capa","folha_rosto","resumo","abstract","sumario","introducao","referencial_teorico","metodologia","resultados","conclusao","referencias"]
}
```

O **servidor** ignora tudo isso e gera um relatório padrão com:
- Seções genéricas: "Resumo Executivo", "Contexto", "Achados Principais", "Análise"
- Citações numéricas `[1][2][3]` em vez de ABNT autor-data `(SILVA, 2020)`
- Apenas 15 fontes (usuário pediu mínimo 80)
- Nenhuma seção ABNT (capa, folha de rosto, introdução, referencial teórico, etc.)

### Documento gerado (para comparação)
O arquivo `research-causas-para-a-ascensao-do-stf-no-desenho-instituci (1).md` é um relatório de pesquisa padrão, NÃO um TCC. Comprova que o sintetizador TCC nunca foi chamado.

---

## CAUSA RAIZ — CADEIA DE FALHA DETALHADA

### Diagrama de fluxo do problema

```
CLIENTE (browser)                         SERVIDOR (Vercel)
─────────────────                         ─────────────────
localStorage                              
  researchMode: "tcc" ✅                  
       │                                  
task-manager.ts                           
  fetch('/api/research', {                
    body: {                               
      query, depth,                       
      proSettings: { researchMode: "tcc" }, ✅
      tccSettings: { titulo, autor, ... }, ✅
    }                                     
  })                                      
       │                                  
       └──────── HTTP POST ───────────────►  app/api/research/route.ts
                                              request.proSettings ✅ (recebido)
                                              request.tccSettings ✅ (recebido)
                                                    │
                                              executePipeline(request)
                                                    │
                                              pipeline.ts (runPipeline)
                                              ┌─ ETAPA 2: Busca ─────────────┐
                                              │ pipelinePrefs = loadPreferences() ← ❌ USA DEFAULTS!
                                              │ pipelinePrefs.pro.researchMode = "standard" ← ❌
                                              │ → NÃO injeta domínios acadêmicos
                                              └───────────────────────────────┘
                                                    │
                                              ┌─ ETAPA 6: Síntese ───────────┐
                                              │ synthesizeReport(              │
                                              │   query, sources, depth,       │
                                              │   config, onTextDelta,         │
                                              │   attachments, onProgress      │
                                              │ ) ← ❌ NÃO PASSA proSettings! │
                                              └───────────────────────────────┘
                                                    │
                                              synthesizer.ts
                                              ┌─────────────────────────────────┐
                                              │ prefs = loadPreferences() ← ❌  │
                                              │ prefs.pro.researchMode = "standard"  │
                                              │                                 │
                                              │ if (researchMode === 'tcc')     │
                                              │   → NUNCA TRUE no servidor      │
                                              │                                 │
                                              │ → Usa sintetizador padrão       │
                                              │ → buildSynthesisPrompt() com    │
                                              │   prefs.pro (defaults) ← ❌     │
                                              └─────────────────────────────────┘
```

### Resumo: o que está quebrado e por quê

| # | Arquivo | Linha | Problema | Como corrigir |
|---|---------|-------|----------|---------------|
| 1 | `lib/research/pipeline.ts` | ~216 | `loadPreferences()` para decidir injeção de domínios acadêmicos | Usar `request.proSettings?.researchMode` em vez de `loadPreferences()` |
| 2 | `lib/research/pipeline.ts` | ~416 | `synthesizeReport()` chamado SEM `proSettings`/`tccSettings` | Passar `request.proSettings` e `request.tccSettings` como parâmetros |
| 3 | `lib/research/synthesizer.ts` | ~14-23 | `synthesizeReport()` não aceita `proSettings`/`tccSettings` como parâmetros | Adicionar parâmetros à assinatura da função |
| 4 | `lib/research/synthesizer.ts` | ~23 | `loadPreferences()` retorna defaults no servidor | Usar os proSettings/tccSettings recebidos como parâmetro, com fallback para loadPreferences() |
| 5 | `lib/research/synthesizer.ts` | ~39 | Routing TCC baseado em `prefs.pro.researchMode` que é sempre "standard" | Usar `proSettings.researchMode` recebido do pipeline |
| 6 | `lib/research/synthesizer.ts` | ~54 | `buildSynthesisPrompt()` recebe `prefs.pro`/`prefs.tcc` de defaults | Passar os proSettings/tccSettings reais da request |
| 7 | `config/defaults.ts` | ~781-789 | `exportFormats.options` não inclui `docx` | Adicionar entrada `docx` com label, icon, description, color |
| 8 | `lib/export/converters.ts` | ~479 | `loadPreferences()` para decidir rota ABNT no export | Receber researchMode como parâmetro ou do contexto de export |

---

## ARQUIVOS-CHAVE PARA INVESTIGAÇÃO

Use `read_source_file` via MCP para ler estes arquivos:

### Pipeline e Roteamento (onde o bug está)
- `lib/research/pipeline.ts` — Orquestra todo o pipeline. **Linhas 195-235** (busca acadêmica) e **linhas 400-430** (chamada ao synthesizer)
- `lib/research/synthesizer.ts` — Routing entre sintetizador padrão e TCC. **TODO o arquivo (138 linhas)**
- `lib/research/tcc-synthesizer.ts` — Sintetizador TCC dedicado (nunca chamado). **TODO o arquivo**
- `app/api/research/route.ts` — API route que recebe a request. **TODO o arquivo (69 linhas)**

### Tipos e Configuração
- `lib/research/types.ts` — `ResearchRequest` com `proSettings` e `tccSettings`. **Linhas 67-106**
- `lib/config/settings-store.ts` — `loadPreferences()` (causa raiz). **Linhas 155-175**
- `config/defaults.ts` — Configuração do app. **Linhas 778-792** (exportFormats)

### Prompts e Síntese TCC
- `lib/ai/prompts/tcc-sections.ts` — Prompts por seção TCC ABNT (nunca usado)
- `lib/ai/prompts/synthesis.ts` — Prompt builder principal
- `lib/research/section-synthesizer.ts` — Multi-section synthesizer

### Exportação
- `lib/export/converters.ts` — Roteamento de exportação. **Linhas 470-500**
- `lib/export/docx-abnt.ts` — Exportador DOCX ABNT (existe mas inacessível)

### Frontend (já funciona)
- `components/research/ResearchInput.tsx` — Formulário TCC (funciona)
- `lib/store/task-manager.ts` — Envia proSettings/tccSettings (funciona)
- `components/export/ExportModal.tsx` — Modal de exportação (falta DOCX)

### Documentação
- `docs/DIVERGENCIAS_TCC.md` — Relatório completo de divergências

---

## O QUE PRECISA SER CORRIGIDO (PLANO DE AÇÃO)

### CORREÇÃO 1: Pipeline — usar request.proSettings para domínios acadêmicos
**Arquivo:** `lib/research/pipeline.ts` (~linha 216)
**Atual:** `const pipelinePrefs = loadPreferences();`
**Correto:** Usar `request.proSettings?.researchMode === 'tcc'` diretamente

### CORREÇÃO 2: Pipeline — passar proSettings/tccSettings ao synthesizer
**Arquivo:** `lib/research/pipeline.ts` (~linha 416)
**Atual:** `synthesizeReport(query, sources, depth, config, onDelta, attachments, onProgress)`
**Correto:** Adicionar `request.proSettings` e `request.tccSettings` como parâmetros

### CORREÇÃO 3: Synthesizer — aceitar e usar proSettings/tccSettings
**Arquivo:** `lib/research/synthesizer.ts` (~linha 14-54)
**Atual:** `const prefs = loadPreferences();` (retorna defaults no servidor)
**Correto:** Receber `proSettings?` e `tccSettings?` como parâmetros opcionais. Merge com loadPreferences() para fallback:
```typescript
export async function synthesizeReport(
  query: string,
  sources: EvaluatedSource[],
  depth: DepthPreset,
  config: AppConfig,
  onTextDelta?: (delta: string) => void,
  attachments?: ResearchAttachment[],
  onSectionProgress?: (progress: SectionProgress) => void,
  proSettings?: ResearchRequest['proSettings'],   // ← NOVO
  tccSettings?: ResearchRequest['tccSettings'],   // ← NOVO
): Promise<string> {
  const defaultPrefs = loadPreferences();
  // Merge: request settings override server defaults
  const pro = proSettings ?? defaultPrefs.pro;
  const tcc = tccSettings ? { ...defaultPrefs.tcc, ...tccSettings } : defaultPrefs.tcc;
  
  // Use pro.researchMode for routing (now "tcc" when client sends it)
  if (pro.researchMode === 'tcc') {
    return synthesizeTcc(query, sources, depth, config, onTextDelta, onSectionProgress, attachments);
  }
  // ...
}
```

### CORREÇÃO 4: DOCX no modal de exportação
**Arquivo:** `config/defaults.ts` (~linha 788)
**Adicionar** entrada `docx` em `exportFormats.options`:
```typescript
docx: { label: 'DOCX', icon: '📝', description: 'Documento Word formatado (ABNT para TCC)', color: 'text-blue-500' },
```

### CORREÇÃO 5: Export DOCX — routing correto
**Arquivo:** `lib/export/converters.ts` (~linha 479)
**Atual:** Usa `loadPreferences()` para decidir rota ABNT
**Correto:** O `ExportModal` deve passar `researchMode` para o conversor, ou ler de `task-manager` state

### CORREÇÃO 6: TCC Synthesizer — receber proSettings/tccSettings
**Arquivo:** `lib/research/tcc-synthesizer.ts`
A função `synthesizeTcc()` precisa receber e usar os `tccSettings` (título, autor, instituição, etc.) para gerar a capa, folha de rosto, e demais seções ABNT com os dados do aluno.

---

## CONTEXTO TÉCNICO DO PROJETO

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Deploy:** Vercel (Fluid Compute, maxDuration=300s)
- **AI SDK:** Vercel AI SDK (`ai` package) com `streamText` + `@ai-sdk/gateway`
- **Modelos:** Claude Opus 4.6, Gemini 2.5 Flash Preview, etc. via AI Gateway
- **Testes:** Vitest (138 testes passando)
- **Build:** TypeScript strict mode, `tsc --noEmit` sem erros
- **Deploy script:** `.\smart-deploy.ps1` (commit → PR → checks → merge)

### Padrão de tipos relevante
```typescript
// lib/research/types.ts
interface ResearchRequest {
  query: string;
  depth: DepthPreset;
  // ...
  proSettings?: {
    researchMode: string;      // 'standard' | 'tcc' | 'deep' | ...
    writingStyle: string;      // 'academic'
    citationFormat: string;    // 'abnt'
    detailLevel: string;       // 'exhaustive'
    exportFormat: string;
  };
  tccSettings?: {
    titulo: string;
    autor: string;
    instituicao: string;
    curso: string;
    orientador: string;
    cidade: string;
    ano: string;
    minFontes: number;         // 80
    minPaginas: number;        // 45
    nivelAcademico: string;
    tipoPesquisa: string;
    areaConhecimento: string;
    abordagem: string;
    dedicatoria: string;
    agradecimentos: string;
    epigrafe: string;
    epigrafeAutor: string;
    enabledSections: string[];
  };
}
```

### Padrão loadPreferences() (a causa raiz)
```typescript
// lib/config/settings-store.ts
export function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };
  // ↑↑↑ NO SERVIDOR, SEMPRE RETORNA DEFAULTS (researchMode: 'standard')
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const saved = JSON.parse(raw) as Partial<UserPreferences>;
    return { ...DEFAULT_PREFERENCES, ...saved };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}
```

---

## RESULTADO ESPERADO APÓS CORREÇÕES

1. **Documento TCC ABNT** com seções: Capa, Folha de Rosto, Resumo, Abstract, Sumário, Introdução, Referencial Teórico, Metodologia, Resultados, Conclusão, Referências
2. **Citações ABNT autor-data**: `(SILVA, 2020)` em vez de `[1]`
3. **Referências ABNT NBR 6023** no final do documento
4. **Busca acadêmica** com domínios SciELO, CAPES, BDTD, repositórios injetados
5. **DOCX disponível** no modal de exportação com formatação ABNT (margens 3/2/3/2cm, Times New Roman 12pt, espaçamento 1.5)
6. **Dados do aluno** (título, autor, instituição, orientador) aparecendo na capa/folha de rosto

---

## RESTRIÇÕES IMPORTANTES

1. **NÃO alterar** funcionalidade do modo standard — só corrigir o routing para TCC
2. **NÃO remover** logging existente — os logs são essenciais para diagnóstico
3. **Manter** compatibilidade com todos os 138 testes existentes
4. **Manter** TypeScript strict mode (`tsc --noEmit` sem erros)
5. As correções devem ser **mínimas e cirúrgicas** — alterar apenas o necessário
6. **Preservar** a assinatura existente de funções quando possível (usar parâmetros opcionais)

---

## COMO VERIFICAR

Após as correções:
1. `npx tsc --noEmit --pretty` — sem erros de tipo
2. `npx vitest run` — 138+ testes passando
3. Deploy via `.\smart-deploy.ps1`
4. Gerar pesquisa em modo TCC e verificar:
   - Log mostra "ROTA TCC ATIVADA"
   - Documento tem estrutura ABNT
   - Citações em formato autor-data
   - DOCX disponível no modal
