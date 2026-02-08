# AUDITORIA COMPLETA DO MODO TCC v1.0
## Relatório Comparativo + Plano Técnico de Melhorias

**Data:** 2026-02-08
**Versão auditada:** v5.0.0
**Arquivo analisado:** `research-gere-um-tcc-completo-com-no-minimo-40-paginas-em-p (1).md`
**Tema:** Causas para a ascensão do STF no desenho institucional brasileiro
**Configuração:** TCC Ativo · ABNT · Exaustiva · Acadêmico · 80 fontes mín. · Claude Opus 4.6

---

# PARTE 1: RELATÓRIO COMPARATIVO EXAUSTIVO

## Legenda
- ✅ Presente e adequado
- ⚠️ Presente, mas insuficiente ou incorreto
- ❌ Completamente ausente

---

## 1. FORMATAÇÃO E NORMAS ABNT (NBR 14724:2011 e correlatas)

| # | Item | Status | Diagnóstico detalhado |
|---|---|---|---|
| 1.1 | Configuração de página (A4, margens 3/2/3/2) | ❌ | Output é Markdown puro. Nenhuma instrução de formatação de página é emitida. O export DOCX atual usa margens de 1 polegada (1440 twips) uniformes, não ABNT. |
| 1.2 | Tipografia (Times New Roman/Arial 12, citações longas 10pt, espaçamento 1,5) | ❌ | Markdown não carrega informação tipográfica. O export DOCX não define fonte como Times New Roman 12 nem espaçamento 1,5. |
| 1.3 | Paginação (arábicos a partir da Introdução, canto superior direito) | ❌ | Nenhum sistema de paginação. O DOCX exportado não configura paginação ABNT. |
| 1.4 | Títulos e seções conforme NBR 6024 (MAIÚSCULAS/negrito por nível) | ❌ | Usa formatação Markdown genérica (## e ###). Não segue hierarquia ABNT de caixa alta/negrito por nível. |
| 1.5 | Numeração progressiva (seções numeradas 1, 1.1, 1.1.1) | ❌ | Seções usam títulos descritivos sem numeração progressiva. |
| 1.6 | Recuo de parágrafo 1,25 cm na primeira linha | ❌ | Markdown não suporta recuo. DOCX exportado não aplica recuo. |

**Resumo Seção 1:** 0/6 itens atendidos. A formatação ABNT é completamente ignorada na geração e no export.

---

## 2. ELEMENTOS PRÉ-TEXTUAIS

| # | Item | Obrigatório? | Status | Diagnóstico |
|---|---|---|---|---|
| 2.1 | Capa (instituição, autor, título, local, ano) | Sim | ❌ | Não há capa. Os metadados TCC (UNIFESP, Pedro Furrer, São Paulo, 2026) foram preenchidos pelo usuário mas NÃO aparecem no output. |
| 2.2 | Lombada | Não | ❌ | N/A para digital, mas poderia ser template DOCX. |
| 2.3 | Folha de rosto (natureza do trabalho, orientador, titulação) | Sim | ❌ | Ausente. O campo "Orientador: Julio Cesar" foi preenchido mas não é usado. |
| 2.4 | Errata | Não | ❌ | Não aplicável para geração automática. |
| 2.5 | Folha de aprovação | Sim (pós-defesa) | ❌ | Ausente. Poderia gerar template em branco. |
| 2.6 | Dedicatória | Não | ❌ | Ausente. Poderia ser campo opcional no formulário. |
| 2.7 | Agradecimentos | Não | ❌ | Ausente. Poderia ser campo opcional. |
| 2.8 | Epígrafe | Não | ❌ | Ausente. |
| 2.9 | Resumo em português (NBR 6028: 150-500 palavras, parágrafo único, voz ativa 3ª pessoa, palavras-chave) | Sim | ⚠️ | Existe "Resumo Executivo" mas: (a) nome incorreto — deveria ser apenas "RESUMO"; (b) não é parágrafo único — é um bloco denso mas não formatado como parágrafo contínuo; (c) excede 500 palavras (~280 palavras, OK); (d) palavras-chave presentes mas com 8 termos (ABNT recomenda 3-5); (e) usa ponto como separador (correto). |
| 2.10 | Abstract em inglês + Keywords | Sim | ❌ | Completamente ausente. Nenhuma versão em inglês do resumo. |
| 2.11 | Listas (ilustrações, tabelas, siglas) | Quando necessário | ❌ | Ausentes. Não há lista de abreviaturas (STF, CF, ADI, ADPF, etc. são usadas sem lista). |
| 2.12 | Sumário (NBR 6027) | Sim | ❌ | Ausente. Não há sumário com indicativo numérico e páginas. |

**Resumo Seção 2:** 0/5 obrigatórios atendidos, 1 parcial (resumo). Nenhum metadado do formulário TCC é utilizado no output.

---

## 3. ELEMENTOS TEXTUAIS

### 3.1 Introdução

| Item | Status | Diagnóstico |
|---|---|---|
| Contextualização temática | ⚠️ | Existe seção "Contexto" mas não é nomeada "Introdução". Contextualiza historicamente o STF. |
| Problematização (lacuna/contradição) | ⚠️ | Implícita, nunca formulada como pergunta explícita de pesquisa. |
| Pergunta de pesquisa clara e delimitada | ❌ | Não há pergunta de pesquisa formulada explicitamente em nenhum ponto do texto. |
| Justificativa (relevância acadêmica/social) | ❌ | Não há seção de justificativa. |
| Objetivos (geral + 3-5 específicos, verbos Bloom) | ❌ | Nenhum objetivo é declarado em todo o documento. |
| Delimitação (temporal, espacial, temática) | ⚠️ | Menção ao período pós-1988 mas sem delimitação formal. |
| Descrição da estrutura do trabalho | ❌ | Não há roteiro dos capítulos. |
| Extensão adequada (2-5 páginas) | ❌ | A seção "Contexto" tem ~2 páginas, mas não funciona como Introdução. |

**Diagnóstico:** O que existe é uma seção "Contexto" que mistura contextualização com início da revisão. Não há uma Introdução formal com os elementos obrigatórios de um TCC.

### 3.2 Referencial Teórico / Revisão de Literatura

| Item | Status | Diagnóstico |
|---|---|---|
| Mapeamento do estado da arte | ⚠️ | Há discussão de vertentes teóricas, mas não é organizada como revisão de literatura sistemática. |
| Organização lógica (por temas/cronológica/correntes) | ⚠️ | Organiza por eixos temáticos (5), o que é positivo, mas a estrutura é de "achados" e não de "revisão". |
| Diálogo entre autores | ⚠️ | Existe confronto de posições (3 vertentes na Análise), mas os autores são referenciados por [N] e não por nome, dificultando o diálogo explícito. Poucos autores são nomeados (Barroso, Costa 2023, Bastiat). |
| Conceitos-chave operacionalizados | ⚠️ | Termos como "judicialização", "ativismo judicial", "neoconstitucionalismo" são usados mas não formalmente definidos/operacionalizados. |
| Posicionamento do autor | ❌ | O texto se posiciona como "síntese neutra" — não há voz autoral clara. |
| Marco teórico explícito | ❌ | Não há declaração de marco teórico. |
| Articulação com problema de pesquisa | ❌ | Como não há pergunta de pesquisa, não há articulação. |
| Fontes prioritárias (Qualis A1/A2, livros seminais) | ❌ | Das 15 fontes: ~4 blogs jurídicos (legale.com.br), 1 instituto ideológico, 1 portal governamental, 1 editora comercial. Nenhum artigo Qualis A1/A2 identificável. Nenhum livro seminal citado diretamente (Barroso, Mendes, Streck, etc. mencionados mas não referenciados). |
| Extensão adequada (15-30 páginas) | ❌ | As seções "Achados Principais" + "Análise" somam ~6 páginas estimadas. Muito aquém do esperado. |

**Diagnóstico:** A revisão existe em forma embrionária (boa organização por eixos, algum diálogo entre posições), mas é superficial, curta, e usa fontes de baixa qualidade acadêmica. A estrutura "Achados Principais" é de relatório de pesquisa, não de TCC.

### 3.3 Metodologia

| Item | Status | Diagnóstico |
|---|---|---|
| Seção de Metodologia | ❌ | **Completamente ausente.** Não há seção metodológica em todo o documento. |
| Eixo 1 — Abordagem (quali/quanti/mista) | ❌ | Não declarada. |
| Eixo 2 — Objetivos (exploratória/descritiva/explicativa) | ❌ | Não classificada. |
| Eixo 3 — Procedimentos técnicos | ❌ | Não descrito (seria revisão bibliográfica). |
| Eixo 4 — Métodos de análise | ❌ | Não especificado. |
| Eixo 5 — Instrumentos de coleta | ❌ | N/A para revisão bibliográfica, mas deveria declarar bases consultadas, strings de busca, critérios de seleção. |
| Eixo 6 — Universo/amostra | ❌ | Não há descrição do corpus bibliográfico. |
| Eixo 7 — Questões éticas | ❌ | N/A para revisão bibliográfica pura. |
| Eixo 8 — Limitações metodológicas | ⚠️ | Existe seção "Limitações e Lacunas" mas é sobre as fontes, não sobre a metodologia do trabalho. |
| Quadro-síntese do desenho metodológico | ❌ | Ausente. |

**Diagnóstico:** A ausência total de Metodologia é a falha mais grave do documento como TCC. Nenhum TCC, mesmo de revisão bibliográfica, pode prescindir da descrição do método.

### 3.4 Resultados / Análise e Discussão

| Item | Status | Diagnóstico |
|---|---|---|
| Apresentação organizada dos dados | ⚠️ | Os "achados" são organizados em 5 eixos temáticos — estrutura razoável, mas sem quadros, tabelas ou trechos de obras. |
| Interpretação à luz do referencial | ⚠️ | Há interpretação, mas sem referencial teórico explícito declarado. |
| Diálogo com a literatura | ⚠️ | Existe, mas superficial. Apenas Costa (2023) e uma "obra coletiva" são citados nominalmente. |
| Categorias de análise | ⚠️ | 5 eixos temáticos funcionam como categorias implícitas, mas não são formalizadas como tal. |
| Evidências sustentando cada argumento | ⚠️ | Citações [N] presentes, mas com fontes de qualidade discutível. |
| Voz do pesquisador presente | ❌ | O texto mantém tom de relatório automatizado. |
| Extensão adequada (15-25 páginas) | ❌ | ~4 páginas estimadas. |

### 3.5 Considerações Finais / Conclusão

| Item | Status | Diagnóstico |
|---|---|---|
| Síntese dos principais achados | ⚠️ | Existe, bem estruturada em 3 planos (normativo, institucional, político). |
| Resposta explícita à pergunta de pesquisa | ⚠️ | Há "A resposta dos autores ao problema de pesquisa", mas como não há pergunta formal, é uma resposta a algo não formulado. |
| Contribuição do trabalho | ❌ | Não menciona contribuição acadêmica. |
| Limitações do estudo | ⚠️ | Existe seção anterior de limitações, mas não na conclusão. |
| Sugestões para pesquisas futuras | ❌ | Ausente. |
| Reflexão final de maturidade intelectual | ⚠️ | Último parágrafo tem tom conclusivo adequado. |
| Não introduzir dados novos | ✅ | Respeitado. |
| Extensão adequada (2-4 páginas) | ⚠️ | ~2 páginas, no limite inferior. |

---

## 4. ELEMENTOS PÓS-TEXTUAIS

| # | Item | Obrigatório? | Status | Diagnóstico |
|---|---|---|---|---|
| 4.1 | Referências (NBR 6023:2018) | Sim | ❌ | O que existe é "Fontes" com 15 links numerados. **Nenhuma referência está em formato ABNT.** Faltam: autor, título do artigo vs. título do periódico, volume, número, páginas, DOI, data de acesso. Exemplo do que tem: `[DIREITO CONSTITUCIONAL: EVOLUÇÕES...](url)`. Exemplo do que deveria ter: `SILVA, J. A. Direito Constitucional: evoluções... **Revista JNT**, v. X, n. Y, p. Z-W, 2024. Disponível em: <url>. Acesso em: 08 fev. 2026.` |
| 4.2 | Glossário | Não | ❌ | Ausente. |
| 4.3 | Apêndices | Não | ❌ | N/A para revisão bibliográfica automatizada. |
| 4.4 | Anexos | Não | ❌ | N/A. |
| 4.5 | Índice | Não | ❌ | N/A para TCC. |

**Resumo Seção 4:** A seção de Referências é a mais crítica — está em formato completamente errado (links numerados em vez de ABNT 6023).

---

## 5. SISTEMA DE CITAÇÕES (NBR 10520:2002)

| # | Item | Status | Diagnóstico |
|---|---|---|---|
| 5.1 | Citação direta curta (entre aspas, autor-data-página) | ⚠️ | Há 2-3 citações diretas com aspas, mas usam formato [N] em vez de (SOBRENOME, ano, p. X). Sem indicação de página. |
| 5.2 | Citação direta longa (recuo 4cm, fonte 10, sem aspas) | ❌ | Nenhuma citação longa formatada como bloco recuado. |
| 5.3 | Citação indireta (paráfrase com autor-data) | ❌ | Todas as paráfrases usam [N] numérico. Nenhuma usa formato ABNT autor-data. |
| 5.4 | Citação de citação (apud) | ❌ | Nenhum uso de apud. |
| 5.5 | Sistema de chamada autor-data | ❌ | **O sistema inteiro usa numeração [1][2][3], que é um sistema de referência numérico (IEEE/Vancouver), não o autor-data da ABNT.** Esta é uma falha fundamental. |
| 5.6 | Boas práticas de citação | ❌ | Predomínio absoluto de paráfrases com citação numérica. Não há equilíbrio direta/indireta. |

**Resumo Seção 5:** O sistema de citações está fundamentalmente errado. ABNT usa autor-data (SOBRENOME, ano), mas o sistema gerado usa [N] numérico. Nenhuma citação tem número de página.

---

## 6. QUALIDADE DO CONTEÚDO E FUNDAMENTAÇÃO

| Item | Status | Diagnóstico |
|---|---|---|
| Quantidade de referências (ideal 40-60) | ❌ | Apenas **15 fontes**, sendo que o usuário pediu mínimo 80. A maioria são blogs e portais, não periódicos acadêmicos. |
| % artigos científicos ≥ 50% | ❌ | Estimativa: 2-3 artigos científicos (~15-20%). Maioria são blogs jurídicos (legale.com.br = 4 fontes). |
| % fontes últimos 5 anos ≥ 40% | ⚠️ | Impossível avaliar pois as referências não incluem datas de publicação. |
| Obras clássicas/seminais da área | ❌ | Nenhum livro seminal citado (faltam: BARROSO, MENDES, STRECK, SARLET, BONAVIDES, SILVA, MORAES). Barroso é mencionado no texto mas não tem referência. |
| Fontes internacionais | ❌ | Nenhuma fonte em inglês/espanhol/francês. |
| Consistência epistemológica | ❌ | Não há declaração de paradigma epistemológico. |
| Originalidade/contribuição | ❌ | Não há indicação de lacuna preenchida nem contribuição original. |

---

## 7. QUALIDADE DA ESCRITA ACADÊMICA

| Item | Status | Diagnóstico |
|---|---|---|
| Norma culta e correção gramatical | ✅ | Texto sem erros gramaticais visíveis. Português correto e fluente. |
| Impessoalidade | ⚠️ | Usa "o presente trabalho", "as fontes analisadas" — correto. Mas às vezes parece relatório de IA, não trabalho acadêmico. |
| Objetividade | ✅ | Mantém tom objetivo. |
| Clareza | ✅ | Frases claras, bem construídas. |
| Precisão terminológica | ✅ | Termos jurídicos usados corretamente. |
| Modéstia epistêmica | ✅ | Usa "sugere", "evidencia", "indica". |
| Coesão e coerência | ✅ | Boa progressão argumentativa, conectivos adequados. |
| Estrutura argumentativa | ⚠️ | Argumentação existe, mas em tom de relatório, não de TCC. Falta tese central defendida pelo autor. |

**Resumo Seção 7:** A qualidade da escrita é o ponto forte. O Claude produz texto acadêmico fluente e correto. O problema é estrutural, não estilístico.

---

## 8. ELEMENTOS VISUAIS E NÃO TEXTUAIS

| Item | Status | Diagnóstico |
|---|---|---|
| Figuras com título superior e fonte inferior | ❌ | Nenhuma figura. |
| Tabelas IBGE (abertas nas laterais) | ❌ | Nenhuma tabela de dados. |
| Quadros (fechados, dados qualitativos) | ❌ | Nenhum quadro comparativo. |
| Gráficos | ❌ | Nenhum gráfico. |
| Siglas na primeira ocorrência por extenso | ⚠️ | STF é expandido no início; ADI, ADC, ADPF são expandidas. Mas CF, STJ, CNJ são usadas sem expansão completa em primeira ocorrência. |

---

## 9. DIMENSIONAMENTO E PROPORÇÃO

| Critério | Esperado | Obtido | Status |
|---|---|---|---|
| Páginas textuais | 40-70 (pedido: mín. 40) | **~8-10 páginas estimadas** | ❌ |
| Introdução | 5-8% (2-5 pág.) | ~2 pág. (sem ser Introdução formal) | ❌ |
| Referencial teórico | 30-40% (15-30 pág.) | ~4 pág. misturadas em "Achados" | ❌ |
| Metodologia | 8-12% (5-10 pág.) | **0 páginas** | ❌ |
| Análise/Resultados | 30-40% (15-25 pág.) | ~3 pág. em "Análise" + "Contradições" | ❌ |
| Conclusão | 5-8% (2-4 pág.) | ~2 pág. | ⚠️ |
| Referências | 40-60 entradas | **15 links** | ❌ |

**Diagnóstico:** O documento tem cerca de 20-25% do tamanho mínimo solicitado. A proporção interna está completamente distorcida pela ausência de Metodologia e pela superficialidade da Revisão.

---

## 10. ESTRUTURA DO DOCUMENTO: ESPERADO vs. OBTIDO

### Estrutura esperada para um TCC ABNT:
```
CAPA
FOLHA DE ROSTO
FOLHA DE APROVAÇÃO (template)
DEDICATÓRIA (opcional)
AGRADECIMENTOS (opcional)
EPÍGRAFE (opcional)
RESUMO + Palavras-chave
ABSTRACT + Keywords
LISTA DE SIGLAS
SUMÁRIO
1 INTRODUÇÃO
  1.1 Contextualização
  1.2 Problema de pesquisa
  1.3 Justificativa
  1.4 Objetivos (geral e específicos)
  1.5 Delimitação
  1.6 Estrutura do trabalho
2 REFERENCIAL TEÓRICO
  2.1 [Subtema 1]
  2.2 [Subtema 2]
  2.3 [Subtema 3]
3 METODOLOGIA
  3.1 Abordagem
  3.2 Tipo de pesquisa
  3.3 Procedimentos técnicos
  3.4 Coleta e análise de dados
  3.5 Limitações
4 ANÁLISE E DISCUSSÃO
  4.1 [Categoria 1]
  4.2 [Categoria 2]
  4.3 [Categoria 3]
5 CONSIDERAÇÕES FINAIS
REFERÊNCIAS
APÊNDICES (opcional)
ANEXOS (opcional)
```

### Estrutura obtida:
```
[frontmatter YAML]
# TÍTULO
---
## Resumo Executivo (com palavras-chave)
---
## Contexto
  ### Trajetória histórica
  ### Contexto comparado
---
## Achados Principais
  ### 1. Constituição de 1988
  ### 2. Controle de constitucionalidade
  ### 3. Transição hermenêutica
  ### 4. STF como mediador político
  ### 5. Judicialização e retroalimentação
---
## Análise
  ### Construção multifatorial
  ### Dialética protagonismo/autocontenção
  ### Redesenho freios e contrapesos
  ### Dimensão comparada
---
## Contradições e Perspectivas Divergentes
  ### Protagonismo vs. hipertrofia
  ### Mediação vs. autocontenção
  ### Avanço vs. déficit democrático
  ### Avaliação de credibilidade
---
## Limitações e Lacunas
---
## Conclusão
---
## Fontes (15 links)
```

**Diagnóstico estrutural:** O output segue o template de "Relatório de Pesquisa Profunda" do Âmago.AI, **não** o template de TCC ABNT. As seções são as do pipeline padrão (Resumo Executivo, Contexto, Achados Principais, Análise, Contradições, Limitações, Conclusão, Fontes) — renomeadas mas não reestruturadas.

---

## SÍNTESE QUANTITATIVA DO DIAGNÓSTICO

| Categoria | Itens avaliados | ✅ Adequados | ⚠️ Parciais | ❌ Ausentes | Score |
|---|---|---|---|---|---|
| 1. Formatação ABNT | 6 | 0 | 0 | 6 | 0% |
| 2. Pré-textuais | 12 | 0 | 1 | 11 | 4% |
| 3. Textuais | 30 | 1 | 12 | 17 | 23% |
| 4. Pós-textuais | 5 | 0 | 0 | 5 | 0% |
| 5. Citações ABNT | 6 | 0 | 1 | 5 | 8% |
| 6. Qualidade conteúdo | 7 | 0 | 1 | 6 | 7% |
| 7. Escrita acadêmica | 8 | 5 | 2 | 1 | 75% |
| 8. Visuais | 5 | 0 | 1 | 4 | 10% |
| 9. Dimensionamento | 7 | 0 | 1 | 6 | 7% |
| **TOTAL** | **86** | **6** | **19** | **61** | **18%** |

**Score geral: 18% de conformidade com o checklist de TCC nota 10.**

A escrita é boa (75%), mas a estrutura, formatação, citações e dimensionamento estão muito aquém.

---

# PARTE 2: DIAGNÓSTICO DAS CAUSAS-RAIZ

## Por que o output ficou assim?

### Causa 1: O pipeline não foi modificado — apenas o prompt
O modo TCC atual apenas injeta instruções ABNT no prompt de síntese, mas o **pipeline inteiro** (decomposição → busca → avaliação → síntese) continua sendo o mesmo de um relatório de pesquisa genérico. O resultado é um relatório de pesquisa com vocabulário acadêmico, não um TCC.

### Causa 2: Síntese em passo único (ou poucos passos)
Mesmo com multi-section, a geração atual tenta produzir o TCC inteiro em uma chamada LLM (ou poucas). Um TCC de 40+ páginas exige dezenas de milhares de tokens de output. Modelos como Claude Opus, mesmo sem limites artificiais, produzem ~4000-8000 tokens por chamada, resultando em ~8-10 páginas.

### Causa 3: Metadados TCC não são injetados no output
Os campos preenchidos pelo usuário (título, autor, instituição, orientador, cidade, ano) ficam armazenados no formulário mas NÃO são passados ao prompt de síntese e NÃO aparecem no documento gerado.

### Causa 4: Fontes de baixa qualidade acadêmica
O pipeline de busca não filtra por qualidade acadêmica. Para um TCC, deveria priorizar: SciELO, Google Scholar, CAPES Periódicos, repositórios de universidades. Em vez disso, indexa blogs jurídicos genéricos.

### Causa 5: Sistema de citações hardcoded como [N]
O pipeline inteiro usa citações numéricas [1][2][3]. Para ABNT, deveria usar autor-data (SOBRENOME, ano). Essa mudança exige reformulação do sistema de citações desde a avaliação de fontes.

### Causa 6: Template de output fixo
O prompt de síntese gera sempre a mesma estrutura: Resumo Executivo → Contexto → Achados → Análise → Contradições → Limitações → Conclusão → Fontes. Essa estrutura NÃO é a de um TCC.

### Causa 7: Export DOCX genérico
O exportador DOCX atual faz parsing de Markdown genérico. Não aplica formatação ABNT (margens, tipografia, espaçamento, paginação, capa).

---

# PARTE 3: PLANO TÉCNICO DE MELHORIAS

## Arquitetura proposta: TCC como pipeline especializado

Em vez de "adicionar instruções ao prompt", o Modo TCC precisa ser um **pipeline paralelo completo**, com etapas específicas.

```
┌─────────────────────────────────────────────────────────┐
│                    TCC PIPELINE v2.0                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. CONFIGURAÇÃO (Frontend)                             │
│     └─ Formulário TCC expandido                         │
│        ├─ Metadados (capa, folha de rosto)              │
│        ├─ Tipo de pesquisa (revisão bib., campo, etc.)  │
│        ├─ Área do conhecimento                          │
│        ├─ Número mín. de páginas                        │
│        ├─ Nº mín. de referências                        │
│        ├─ Estilo de citação (ABNT/APA/etc.)             │
│        ├─ Seções opcionais (dedicatória, epígrafe)      │
│        ├─ Parâmetros de qualidade de fontes             │
│        └─ Upload de arquivos (PDFs do orientador, etc.) │
│                                                         │
│  2. BUSCA ACADÊMICA ESPECIALIZADA (Backend)             │
│     ├─ Google Scholar API / Serpapi                      │
│     ├─ SciELO API                                       │
│     ├─ CrossRef (já implementado)                       │
│     ├─ Repositórios institucionais (.edu.br)            │
│     ├─ CAPES Periódicos                                 │
│     └─ Filtros: Qualis, data, tipo, idioma              │
│                                                         │
│  3. OUTLINE ESTRUTURADO (LLM)                           │
│     └─ Gera outline completo de TCC com:                │
│        ├─ Todas as seções ABNT obrigatórias             │
│        ├─ Subseções numeradas (1, 1.1, 1.1.1)          │
│        ├─ Estimativa de páginas por seção               │
│        ├─ Distribuição de fontes por seção              │
│        └─ Aprovação do outline pelo usuário             │
│                                                         │
│  4. GERAÇÃO SEÇÃO-POR-SEÇÃO (LLM)                      │
│     ├─ Cada seção é gerada individualmente              │
│     ├─ Contexto acumulado entre seções                  │
│     ├─ Citações autor-data (SOBRENOME, ano, p. X)       │
│     ├─ Controle de extensão por seção                   │
│     ├─ SSE progress events por seção                    │
│     └─ Validação de citações em tempo real              │
│                                                         │
│  5. PÓS-PROCESSAMENTO (Backend)                         │
│     ├─ Montagem do documento completo                   │
│     ├─ Geração de Resumo + Abstract                     │
│     ├─ Geração de Sumário com páginas                   │
│     ├─ Formatação de Referências ABNT 6023              │
│     ├─ Verificação cruzada citações ↔ referências       │
│     ├─ Métricas de legibilidade                         │
│     ├─ Verificação CrossRef                             │
│     └─ Contagem de páginas e proporções                 │
│                                                         │
│  6. EXPORT ABNT (Backend/Frontend)                      │
│     ├─ DOCX com formatação ABNT completa                │
│     │   ├─ Capa com dados do formulário                 │
│     │   ├─ Folha de rosto                               │
│     │   ├─ Margens 3/2/3/2, Times 12, espaço 1,5       │
│     │   ├─ Paginação (arábicos a partir da Introdução)  │
│     │   ├─ Títulos conforme NBR 6024                    │
│     │   ├─ Citações longas (recuo 4cm, fonte 10)        │
│     │   ├─ Referências alinhadas à esquerda             │
│     │   └─ Numeração progressiva                        │
│     └─ PDF via DOCX → PDF (ou LaTeX)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## DETALHAMENTO TÉCNICO POR ÁREA

### A. MELHORIAS DE PROMPT

| # | Melhoria | Arquivo(s) afetado(s) | Complexidade |
|---|---|---|---|
| A1 | **Prompt de outline TCC** — Novo prompt que gera outline completo de TCC com todas as seções ABNT, subseções numeradas, estimativa de páginas e distribuição de fontes. Deve receber: área do conhecimento, tipo de pesquisa, tema, delimitação. | `lib/ai/prompts/tcc-outline.ts` (novo) | Alta |
| A2 | **Prompt de seção individual** — Prompt específico para gerar CADA seção do TCC individualmente. Inclui: instrução de tamanho mínimo, citações autor-data, tom acadêmico, conexão com seção anterior/posterior, lista de fontes a usar naquela seção. | `lib/ai/prompts/tcc-section.ts` (novo) | Alta |
| A3 | **Prompt de Introdução** — Prompt especializado que garante: contextualização, problema, pergunta, justificativa, objetivos (geral + específicos com verbos Bloom), delimitação, estrutura do trabalho. | `lib/ai/prompts/tcc-section.ts` | Alta |
| A4 | **Prompt de Metodologia** — Prompt que classifica a pesquisa em TODOS os 8 eixos metodológicos, com tabelas comparativas e quadro-síntese. Recebe como input: tipo de pesquisa escolhido pelo usuário. | `lib/ai/prompts/tcc-section.ts` | Alta |
| A5 | **Prompt de Referências ABNT** — Prompt que converte a lista de fontes em formato ABNT 6023:2018 completo (autor, título, periódico, vol, nº, pp, ano, DOI, URL, data de acesso). | `lib/ai/prompts/tcc-references.ts` (novo) | Média |
| A6 | **Prompt de Resumo/Abstract** — Prompt que gera resumo ABNT (150-500 palavras, parágrafo único, 3ª pessoa, voz ativa) + tradução para Abstract com Keywords. | `lib/ai/prompts/tcc-section.ts` | Média |
| A7 | **Sistema de citações autor-data** — Alterar TODA a cadeia de prompts para usar (SOBRENOME, ano) em vez de [N]. Isso afeta: decomposição, avaliação, síntese. As fontes precisam ser identificadas por autor+ano desde a coleta. | `lib/ai/prompts/synthesis.ts`, `lib/ai/prompts/tcc-section.ts` | Alta |
| A8 | **Prompts de pré-textuais** — Prompts para gerar: Dedicatória, Agradecimentos, Epígrafe (quando habilitados pelo usuário). Recebem inputs do formulário. | `lib/ai/prompts/tcc-pretextual.ts` (novo) | Baixa |

### B. MELHORIAS DE BACKEND (Pipeline)

| # | Melhoria | Arquivo(s) | Complexidade |
|---|---|---|---|
| B1 | **Pipeline TCC dedicado** — Novo pipeline que orquestra a geração de TCC como sequência de etapas especializadas, distinto do pipeline de pesquisa genérica. | `lib/research/tcc-pipeline.ts` (novo) | Alta |
| B2 | **Busca acadêmica especializada** — Integrar Google Scholar (via SerpAPI ou Scholarly), SciELO API, filtros por Qualis, repositórios .edu.br. Priorizar fontes acadêmicas sobre blogs. | `lib/research/academic-search.ts` (novo) | Alta |
| B3 | **Gerador de outline estruturado** — Usar `generateObject` com Zod schema para produzir outline validado com seções, subseções, páginas estimadas, fontes alocadas. | `lib/research/tcc-outline-generator.ts` (novo) | Média |
| B4 | **Sintetizador TCC seção-por-seção** — Reformular `section-synthesizer.ts` para gerar cada seção com prompt especializado, controle de tamanho, citações autor-data e contexto acumulado. | `lib/research/tcc-section-synthesizer.ts` (novo) | Alta |
| B5 | **Montador de documento** — Módulo que junta todas as seções geradas em um documento único, na ordem ABNT, com numeração progressiva. | `lib/research/tcc-assembler.ts` (novo) | Média |
| B6 | **Formatador de referências ABNT** — Módulo que converte metadados de fontes (título, autor, URL, data) em formato ABNT 6023:2018 automaticamente. Usar CrossRef para enriquecer metadados. | `lib/research/abnt-references.ts` (novo) | Média |
| B7 | **Verificador de consistência citações ↔ referências** — Módulo que verifica: toda citação (AUTOR, ano) no texto tem referência correspondente; toda referência tem pelo menos uma citação. | `lib/research/citation-checker.ts` (novo) | Média |
| B8 | **Controlador de extensão** — Módulo que monitora a contagem de tokens/palavras por seção e solicita expansão quando abaixo do mínimo configurado. | `lib/research/length-controller.ts` (novo) | Média |
| B9 | **Extrator de metadados de fontes** — Enriquecer cada fonte com: autor(es), ano de publicação, tipo (artigo, livro, tese), periódico, DOI. Usar CrossRef + parsing de páginas. | `lib/research/source-metadata.ts` (novo) | Média |

### C. MELHORIAS DE FRONTEND (UI/UX)

| # | Melhoria | Arquivo(s) | Complexidade |
|---|---|---|---|
| C1 | **Formulário TCC expandido** — Campos adicionais: tipo de pesquisa (dropdown com todas as opções), área do conhecimento, nº mín de páginas, nº mín de referências, seções opcionais (checkboxes para dedicatória, agradecimentos, epígrafe, lista de siglas), texto da dedicatória, texto dos agradecimentos, epígrafe (citação + autor). | `components/research/ResearchInput.tsx` | Alta |
| C2 | **Configuração metodológica** — Formulário guiado para o usuário definir: abordagem (quali/quanti/mista), tipo de pesquisa (exploratória/descritiva/explicativa), procedimentos técnicos (revisão bib., estudo de caso, pesquisa de campo, etc.), método de análise. Cada seleção gera prompts específicos. | `components/research/TccMethodologyForm.tsx` (novo) | Alta |
| C3 | **Preview e aprovação do outline** — Após geração do outline, mostrar para o usuário aprovar/editar antes de gerar o conteúdo. Interface com drag-and-drop para reordenar seções, editar títulos, ajustar estimativas de páginas. | `components/research/TccOutlinePreview.tsx` (novo) | Alta |
| C4 | **Progresso detalhado por seção** — Expandir o componente de progresso para mostrar: seção sendo gerada, % do total, páginas geradas vs. esperadas, fontes usadas vs. alocadas. | `components/research/ResearchProgress.tsx` | Média |
| C5 | **Configuração de qualidade de fontes** — Sliders/toggles para: % mínimo de artigos científicos, idade máxima das fontes, idiomas aceitos, bases de dados a consultar, Qualis mínimo. | `components/research/TccSourceConfig.tsx` (novo) | Média |
| C6 | **Export DOCX ABNT** — Botão de export que gera DOCX com formatação ABNT completa (capa, folha de rosto, margens, tipografia, paginação, títulos, citações longas recuadas, referências formatadas). | `lib/export/docx-abnt.ts` (novo) | Alta |
| C7 | **Painel de métricas TCC** — Após geração, mostrar: nº de páginas, nº de referências, % artigos científicos, % fontes recentes, proporção por seção, score de conformidade ABNT, métricas de legibilidade. | `components/research/TccMetricsPanel.tsx` (novo) | Média |

### D. PERSONALIZAÇÃO DOS PROMPTS

| # | Melhoria | Descrição |
|---|---|---|
| D1 | **Área do conhecimento → tom e vocabulário** — Cada área (Direito, Educação, Psicologia, Sociologia, etc.) tem vocabulário, convenções e expectativas distintas. O prompt deve adaptar tom, terminologia e estrutura à área selecionada. |
| D2 | **Tipo de pesquisa → seções e método** — Seleção de "Revisão bibliográfica" gera Metodologia com bases consultadas, strings de busca, critérios de inclusão/exclusão. "Estudo de caso" gera template com protocolo Yin. "Pesquisa de campo" gera template com instrumentos de coleta. |
| D3 | **Nível acadêmico → profundidade** — Graduação, Especialização, Mestrado, Doutorado. Cada nível tem expectativas diferentes de profundidade, extensão e sofisticação teórica. |
| D4 | **Instituição → manual específico** — Algumas universidades têm manuais que sobrepõem/complementam ABNT. Campo para upload do manual institucional ou seleção de preset por universidade. |
| D5 | **Orientador → estilo de escrita** — Campo opcional para informar preferências do orientador (ex: "prefere citações indiretas", "exige mínimo 60 referências", "quer tabelas comparativas"). |

### E. DIVISÃO POR ETAPAS (Pipeline Multi-Step)

| Etapa | Input | Output | LLM calls |
|---|---|---|---|
| **E1. Análise do tema** | Query + config TCC | Análise de viabilidade, sugestão de delimitação, palavras-chave | 1 |
| **E2. Busca acadêmica** | Palavras-chave + config fontes | Lista de 60-100 fontes acadêmicas com metadados | 0 (API) |
| **E3. Avaliação de fontes** | Lista de fontes + critérios | Fontes ranqueadas, seleção final (40-60) com Qualis, tipo, ano | 1-2 |
| **E4. Outline estruturado** | Tema + fontes + config método | Outline completo com seções, subseções, páginas, fontes por seção | 1 |
| **E5. Aprovação do outline** | Outline gerado | Outline aprovado/editado pelo usuário | 0 (UI) |
| **E6. Geração de pré-textuais** | Config TCC + metadados | Capa, folha de rosto, resumo, abstract, sumário | 2-3 |
| **E7. Geração da Introdução** | Outline + fontes + config | Introdução completa (2-5 pág) | 1 |
| **E8. Geração do Ref. Teórico** | Outline + fontes alocadas + Introdução | Referencial teórico (15-30 pág) — gerado em 3-5 sub-chamadas | 3-5 |
| **E9. Geração da Metodologia** | Config método + área | Metodologia completa (5-10 pág) | 1 |
| **E10. Geração de Análise** | Outline + fontes + ref. teórico | Análise e discussão (15-25 pág) — 3-5 sub-chamadas | 3-5 |
| **E11. Geração da Conclusão** | Introdução + Análise + outline | Considerações finais (2-4 pág) | 1 |
| **E12. Geração de Referências** | Lista final de fontes usadas | Referências ABNT 6023:2018 formatadas | 1 |
| **E13. Pós-processamento** | Documento completo | Verificações, métricas, sumário, listas | 1 |
| **E14. Montagem final** | Todas as partes | Documento TCC completo montado | 0 |
| **E15. Export ABNT** | Documento montado + metadados | DOCX formatado ABNT | 0 |
| **TOTAL** | | | **~15-22 chamadas LLM** |

### F. RECURSOS/BIBLIOTECAS/EXTENSÕES

| # | Recurso | Propósito | Já instalado? |
|---|---|---|---|
| F1 | `docx` (npm) | Geração de DOCX com formatação completa | ✅ Sim |
| F2 | `serpapi` ou `scholarly` | Busca no Google Scholar | ❌ Não |
| F3 | CrossRef API | Verificação e enriquecimento de citações | ✅ Sim (parcial) |
| F4 | SciELO API | Busca em periódicos brasileiros | ❌ Não |
| F5 | `text-readability-ts` | Métricas de legibilidade | ✅ Sim |
| F6 | `mammoth` ou `libreoffice-convert` | Conversão DOCX → PDF | ❌ Não |
| F7 | Zod schemas | Validação de outline e seções | ✅ Sim |
| F8 | `pdf-parse` / `pdf-lib` | Extração de texto de PDFs do usuário | ❌ Não (para upload de papers) |

### G. CONFIGURAÇÕES DO USUÁRIO → COMO SE CONVERTEM EM AJUSTES DA IA

| Configuração do usuário | Como a IA processa |
|---|---|
| **Título do TCC** | Injetado na Capa, Folha de Rosto, cabeçalho de cada prompt de seção como contexto |
| **Autor** | Inserido na Capa, Folha de Rosto; no prompt de Resumo para gerar em 3ª pessoa |
| **Instituição + Curso** | Na Capa, Folha de Rosto; no prompt para calibrar vocabulário da área |
| **Orientador** | Folha de Rosto; mencionado em Agradecimentos se habilitado |
| **Cidade + Ano** | Capa, Folha de Rosto |
| **Mín. de fontes** | Controla: quantas fontes buscar (2x o mínimo), quantas selecionar, quantas citar |
| **Mín. de páginas** | Calcula proporções internas → distribui mín. de tokens por seção → length-controller |
| **Tipo de pesquisa** | Determina: template da Metodologia, prompt de Análise, seções disponíveis |
| **Área do conhecimento** | Ajusta: vocabulário, convenções de citação, profundidade teórica, autores seminais |
| **Abordagem (quali/quanti)** | Define: template de Metodologia, tipo de dados esperados na Análise |
| **Seções opcionais** | Habilita/desabilita: Dedicatória, Agradecimentos, Epígrafe, Lista de siglas |
| **Estilo de citação** | ABNT autor-data, ABNT numérico, APA 7, Vancouver — altera prompts de síntese |
| **Nível acadêmico** | Graduação/Especialização/Mestrado/Doutorado — calibra profundidade e extensão |
| **Qualis mínimo** | Filtra fontes na busca acadêmica (A1, A2, B1, etc.) |
| **% mín. artigos científicos** | Controla proporção de fontes por tipo na seleção |
| **Idade máxima das fontes** | Filtra por ano de publicação (últimos 5, 10, 15 anos) |
| **Idiomas das fontes** | Habilita/desabilita busca em PT, EN, ES, FR |

---

# PARTE 4: PLANO DE MELHORIA COMPLETO — FASES DE IMPLEMENTAÇÃO

## Visão geral: 6 fases, ordenadas por impacto e dependência

| Fase | Nome | Descrição | Impacto | Esforço |
|---|---|---|---|---|
| **F1** | Estrutura TCC no prompt | Reformular prompts para gerar estrutura ABNT real (não relatório) | 🔴 Crítico | Médio |
| **F2** | Sistema de citações autor-data | Substituir [N] por (SOBRENOME, ano) em toda a cadeia | 🔴 Crítico | Alto |
| **F3** | Pipeline TCC multi-step | Gerar cada seção individualmente com controle de extensão | 🔴 Crítico | Alto |
| **F4** | Formulário TCC expandido + Outline interativo | UI para configurar todos os aspectos + aprovar outline | 🟡 Alto | Alto |
| **F5** | Busca acadêmica + qualidade de fontes | Google Scholar, SciELO, filtros de qualidade | 🟡 Alto | Alto |
| **F6** | Export DOCX ABNT completo | Capa, folha de rosto, margens, tipografia, paginação | 🟡 Alto | Alto |

---

### FASE 1: Estrutura TCC no prompt (PRIORIDADE MÁXIMA)

**Objetivo:** Quando o modo TCC está ativo, o output deve seguir a estrutura de um TCC ABNT real, não a de um relatório de pesquisa.

**Tarefas:**
1. Criar `lib/ai/prompts/tcc-outline.ts` — prompt para gerar outline TCC com Zod schema
2. Criar `lib/ai/prompts/tcc-section.ts` — prompts especializados por seção:
   - Introdução (com 7 elementos obrigatórios)
   - Referencial Teórico (por subtemas, com diálogo entre autores)
   - Metodologia (classificação em 8 eixos)
   - Análise/Discussão (com categorias, evidências, interpretação)
   - Considerações Finais (síntese, contribuição, limitações, sugestões)
3. Criar `lib/ai/prompts/tcc-references.ts` — prompt para formatar referências ABNT
4. Criar `lib/ai/prompts/tcc-pretextual.ts` — prompts para Resumo, Abstract, Dedicatória, etc.
5. Injetar metadados TCC (título, autor, instituição, etc.) em TODOS os prompts
6. Remover/bypasear o template padrão (Resumo Executivo/Contexto/Achados/etc.) quando TCC ativo

**Critério de sucesso:** O output gerado segue a estrutura CAPA → RESUMO → ABSTRACT → SUMÁRIO → INTRODUÇÃO → REFERENCIAL → METODOLOGIA → ANÁLISE → CONCLUSÃO → REFERÊNCIAS.

---

### FASE 2: Sistema de citações autor-data

**Objetivo:** Substituir citações [1][2][3] por (SOBRENOME, ano) ou (SOBRENOME, ano, p. X) em todo o pipeline.

**Tarefas:**
1. Modificar `lib/research/source-metadata.ts` — extrair autor(es) e ano de cada fonte
2. Modificar prompts de avaliação e síntese — instruir o LLM a citar como (SOBRENOME, ano)
3. Criar mapeamento fonte → autor-data para referência cruzada
4. Implementar formatação de referências ABNT 6023:2018 (`lib/research/abnt-references.ts`)
5. Implementar verificador de consistência citação ↔ referência (`lib/research/citation-checker.ts`)
6. Suportar citação direta curta (aspas + autor, ano, p.) e longa (bloco recuado)

**Critério de sucesso:** Todas as citações no texto usam formato ABNT autor-data; seção de Referências em ABNT 6023:2018; 100% de correspondência citações ↔ referências.

---

### FASE 3: Pipeline TCC multi-step

**Objetivo:** Gerar o TCC seção por seção, com controle de extensão e contexto acumulado.

**Tarefas:**
1. Criar `lib/research/tcc-pipeline.ts` — orquestrador do pipeline TCC completo (15 etapas)
2. Criar `lib/research/tcc-outline-generator.ts` — gera outline validado via generateObject
3. Reformular `lib/research/tcc-section-synthesizer.ts` — gera cada seção com:
   - Prompt especializado por tipo de seção
   - Mín. de tokens por seção (baseado na config de páginas)
   - Fontes alocadas por seção
   - Contexto das seções anteriores
   - Expansão automática se abaixo do mínimo
4. Criar `lib/research/tcc-assembler.ts` — monta documento completo com numeração progressiva
5. Criar `lib/research/length-controller.ts` — monitora e corrige extensão
6. Atualizar SSE events para emitir progresso detalhado (seção atual, páginas geradas, % total)

**Critério de sucesso:** TCC gerado com 40+ páginas textuais, proporções internas corretas, cada seção com extensão adequada.

---

### FASE 4: Formulário TCC expandido + Outline interativo

**Objetivo:** O usuário pode configurar TODOS os aspectos do TCC e aprovar o outline antes da geração.

**Tarefas:**
1. Expandir formulário TCC em `ResearchInput.tsx` com:
   - Dropdown: tipo de pesquisa (revisão bib., estudo de caso, pesquisa de campo, etc.)
   - Dropdown: área do conhecimento (Direito, Educação, Psicologia, etc.)
   - Dropdown: nível acadêmico (graduação, especialização, mestrado, doutorado)
   - Input: nº mínimo de páginas (default 50)
   - Input: nº mínimo de referências (default 40)
   - Checkboxes: seções opcionais (dedicatória, agradecimentos, epígrafe, lista de siglas)
   - Textareas: texto da dedicatória, agradecimentos, epígrafe
   - Sub-formulário de Metodologia guiado (abordagem, tipo, procedimentos, análise)
   - Config fontes: Qualis mínimo, % artigos, idade máxima, idiomas
2. Criar `TccOutlinePreview.tsx` — componente modal/página para:
   - Visualizar outline gerado
   - Editar títulos de seções
   - Reordenar seções (drag-and-drop)
   - Ajustar estimativas de páginas
   - Aprovar ou regenerar
3. Criar `TccMetricsPanel.tsx` — painel pós-geração com score de conformidade

**Critério de sucesso:** O usuário tem controle total sobre a estrutura, método e parâmetros do TCC antes da geração.

---

### FASE 5: Busca acadêmica + qualidade de fontes

**Objetivo:** As fontes do TCC devem ser prioritariamente acadêmicas (artigos de periódicos, livros, teses).

**Tarefas:**
1. Criar `lib/research/academic-search.ts` com integrações:
   - Google Scholar (via SerpAPI — requer API key)
   - SciELO API (gratuita, periódicos brasileiros)
   - CrossRef (já implementado, expandir para busca por tema)
   - Repositórios .edu.br (scraping de repositórios institucionais)
2. Implementar filtros de qualidade:
   - Classificação Qualis (via lista CAPES)
   - Tipo de fonte (artigo, livro, tese, dissertação, anais)
   - Ano de publicação
   - Idioma
3. Enriquecer metadados de cada fonte (autor, título, periódico, vol., nº, pp., DOI, ano)
4. Priorizar fontes acadêmicas sobre blogs/portais genéricos na seleção

**Critério de sucesso:** ≥50% das fontes são artigos de periódicos; ≥40% publicadas nos últimos 5 anos; inclui obras seminais da área.

---

### FASE 6: Export DOCX ABNT completo

**Objetivo:** O export DOCX deve gerar um documento 100% formatado ABNT, pronto para entrega.

**Tarefas:**
1. Criar `lib/export/docx-abnt.ts` (separado do DOCX genérico) com:
   - **Capa**: dados do formulário TCC (instituição hierárquica, autor, título, local, ano)
   - **Folha de rosto**: com natureza do trabalho, orientador
   - **Folha de aprovação**: template em branco
   - **Margens**: 3cm superior, 2cm inferior, 3cm esquerda, 2cm direita
   - **Tipografia**: Times New Roman 12pt corpo, 10pt citações longas/notas
   - **Espaçamento**: 1,5 entrelinhas corpo, simples em citações/notas/referências
   - **Recuo**: 1,25cm primeira linha de parágrafo
   - **Paginação**: arábicos a partir da Introdução, canto superior direito
   - **Títulos NBR 6024**: MAIÚSCULAS negrito (nível 1), MAIÚSCULAS sem negrito (nível 2), etc.
   - **Citações longas**: recuo 4cm, fonte 10, espaçamento simples, sem aspas
   - **Referências**: alinhadas à esquerda, espaço simples interno, linha branca entre entradas
   - **Sumário automático**: com números de página calculados
   - **Numeração progressiva**: 1, 1.1, 1.1.1
2. Testar com documento gerado e validar contra checklist ABNT
3. Implementar botão "Exportar DOCX ABNT" específico no ExportModal

**Critério de sucesso:** O DOCX exportado está 100% em conformidade ABNT, pronto para impressão e entrega.

---

## CRONOGRAMA ESTIMADO

| Fase | Duração estimada | Dependências |
|---|---|---|
| F1. Estrutura TCC no prompt | 1-2 sessões | Nenhuma |
| F2. Citações autor-data | 1-2 sessões | F1 |
| F3. Pipeline multi-step | 2-3 sessões | F1, F2 |
| F4. Formulário expandido + Outline | 1-2 sessões | F1, F3 |
| F5. Busca acadêmica | 1-2 sessões | F2 |
| F6. Export DOCX ABNT | 1-2 sessões | F1, F2, F3 |
| **TOTAL** | **~7-13 sessões** | |

---

## RESULTADO ESPERADO APÓS TODAS AS FASES

| Critério | Antes (v1.0) | Depois (v2.0) |
|---|---|---|
| Estrutura ABNT | Relatório de pesquisa | TCC completo com todos os elementos |
| Páginas textuais | ~8-10 | 40-70 (configurável) |
| Referências | 15 links | 40-60 em ABNT 6023 |
| Sistema de citações | [N] numérico | (SOBRENOME, ano) autor-data |
| Capa e folha de rosto | Ausentes | Geradas automaticamente |
| Resumo + Abstract | Resumo Executivo | Resumo NBR 6028 + Abstract |
| Metodologia | Ausente | Completa (8 eixos) |
| Introdução formal | Ausente | Com 7 elementos obrigatórios |
| Metadados TCC no output | Não usados | Em capa, rosto, cabeçalhos |
| Qualidade das fontes | Blogs genéricos | Periódicos, livros, teses |
| Export DOCX | Genérico | ABNT completo (margens, fonte, paginação) |
| Score conformidade | 18% | ≥85% |

---

**Este plano está aguardando sua aprovação para início da implementação.**
