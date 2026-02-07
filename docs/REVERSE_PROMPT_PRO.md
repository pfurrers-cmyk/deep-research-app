# 🔄 Prompt Reverso PRO — Sugestões de Personalização

> Documento gerado automaticamente com sugestões de incrementos para usuários PRO.
> Acesso via botão na barra de pesquisa principal.

---

## 1. Estilo de Escrita do Relatório

| Opção | Descrição | Impacto no Prompt de Síntese |
|-------|-----------|------------------------------|
| **Acadêmico** | Formal, com metodologia explícita, linguagem técnica | Adiciona instruções de rigor acadêmico, citações ABNT/APA |
| **Jornalístico** | Narrativo, pirâmide invertida, linguagem acessível | Prioriza lead forte, quotes, contextualização |
| **Técnico** | Focado em dados, tabelas, métricas, sem opinião | Ênfase em quantificação, benchmarks, comparações |
| **Casual/Blog** | Conversacional, exemplos práticos, sem jargão | Tom leve, analogias, listas de dicas |
| **Executivo** | Resumo executivo, bullet points, decisão-orientado | Key findings primeiro, recomendações claras |

**Implementação sugerida:** Dropdown no painel de configuração avançada do `ResearchInput`.

---

## 2. Nível de Detalhe

| Opção | Tokens de Saída | Caso de Uso |
|-------|----------------|-------------|
| **Resumido** | ~1.000 | Visão geral rápida, triagem de temas |
| **Padrão** | ~3.000 | Pesquisa cotidiana, relatórios internos |
| **Detalhado** | ~6.000 | Análise profunda, trabalhos acadêmicos |
| **Exaustivo** | ~12.000 | Revisões de literatura, due diligence |

**Implementação sugerida:** Slider com preview de tamanho estimado.

---

## 3. Idioma de Raciocínio Interno

| Opção | Descrição |
|-------|-----------|
| **Português** | Raciocínio e output em PT-BR |
| **Inglês** | Raciocínio em EN (melhor para fontes internacionais), output em PT-BR |
| **Auto** | Modelo decide baseado nas fontes encontradas |
| **Bilíngue** | Seções técnicas em EN, explicações em PT-BR |

**Implementação sugerida:** Toggle no painel avançado.

---

## 4. Framework de Avaliação de Fontes

| Framework | Descrição | Melhor para |
|-----------|-----------|-------------|
| **CRAAP** (atual) | Currency, Relevance, Authority, Accuracy, Purpose | Pesquisa geral |
| **SIFT** | Stop, Investigate, Find, Trace | Fact-checking, desinformação |
| **RADAR** | Rationale, Authority, Date, Accuracy, Relevance | Pesquisa acadêmica |
| **Custom** | Critérios definidos pelo usuário | Domínios específicos |

**Implementação sugerida:** Seletor no card "Avaliação de Fontes" nas configurações.

---

## 5. Formato de Citação

| Formato | Exemplo |
|---------|---------|
| **Inline [N]** (atual) | "segundo estudo [3]..." |
| **Footnotes** | "segundo estudo¹..." com notas de rodapé |
| **APA 7** | "(Autor, 2025)" |
| **ABNT** | "(AUTOR, 2025, p. X)" |
| **IEEE** | "[3] no estilo numérico IEEE" |
| **Vancouver** | Estilo médico/biomédico |

**Implementação sugerida:** Dropdown nas configurações de síntese.

---

## 6. Seções Customizáveis do Relatório

O usuário PRO pode ativar/desativar seções do relatório:

- [ ] **Resumo Executivo** — TL;DR em 3 frases
- [x] **Introdução e Contexto** — Sempre ativo
- [x] **Análise Principal** — Sempre ativo
- [ ] **Contradições e Divergências** — Toggle
- [ ] **Limitações e Lacunas** — Toggle
- [ ] **Tabelas Comparativas** — Toggle
- [ ] **Linha do Tempo** — Toggle (quando relevante)
- [ ] **Recomendações/Próximos Passos** — Toggle
- [ ] **Glossário de Termos** — Toggle
- [x] **Referências/Citações** — Sempre ativo

**Implementação sugerida:** Checklist drag-and-drop nas configurações de síntese.

---

## 7. Filtros de Fonte Avançados

| Filtro | Descrição |
|--------|-----------|
| **Recência** | Apenas fontes dos últimos N dias/meses/anos |
| **Idioma da fonte** | Filtrar por idioma (PT, EN, ES, etc.) |
| **Tipo de fonte** | Acadêmico, notícia, blog, governo, etc. |
| **Excluir domínios** | Lista negra de sites |
| **Incluir domínios** | Lista branca prioritária |
| **País de origem** | Fontes de países específicos |

**Implementação sugerida:** Painel expansível no card de Fontes nas configurações.

---

## 8. Modos de Pesquisa Especializados

| Modo | Descrição | Pipeline Modifications |
|------|-----------|----------------------|
| **Comparativo** | Compara 2+ tópicos lado a lado | Decomposição gera sub-queries para cada tópico |
| **Temporal** | Evolução de um tema ao longo do tempo | Filtros de data por período, timeline no output |
| **Contrarian** | Busca propositalmente visões contrárias | Bias de busca invertido, prioriza contradições |
| **Meta-análise** | Análise de análises existentes | Foco em revisões sistemáticas e meta-estudos |
| **Fact-check** | Verificação de claims específicos | Framework SIFT, fontes primárias, rating de veracidade |

**Implementação sugerida:** Seletor de modo no `ResearchInput`, ao lado do depth selector.

---

## 9. Output Alternativo

| Formato | Descrição |
|---------|-----------|
| **Markdown** (atual) | Relatório em Markdown renderizado |
| **PDF Export** | Download em PDF formatado |
| **Slides** | Geração automática de slides (5-10) |
| **Podcast Script** | Roteiro para narração |
| **Thread/Posts** | Formatado para redes sociais |
| **Dados Estruturados** | JSON/CSV com dados extraídos |

**Implementação sugerida:** Selector de formato de saída no painel avançado.

---

## 10. Automações PRO

| Automação | Descrição |
|-----------|-----------|
| **Pesquisa Agendada** | Re-executar pesquisa periodicamente |
| **Alertas de Novidade** | Notificar quando há novas fontes relevantes |
| **Comparação Temporal** | Diff entre pesquisas do mesmo tema |
| **Batch Research** | Múltiplas pesquisas em fila |
| **Templates Salvos** | Configurações pré-salvas por tipo de pesquisa |

---

## Como usar este documento

1. Escolha as personalizações que fazem sentido para seu caso de uso
2. Implemente gradualmente via o painel de configurações avançadas
3. Os prompts de decomposição, avaliação e síntese em `/settings` aceitam instruções customizadas — use as sugestões acima como base para personalizar

> **Dica:** Envie os prompts padrão do sistema a uma IA externa (Claude, GPT) pedindo versões otimizadas para seu domínio específico, depois cole o resultado nas configurações de prompts customizáveis.
