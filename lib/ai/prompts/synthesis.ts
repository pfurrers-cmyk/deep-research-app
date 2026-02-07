// lib/ai/prompts/synthesis.ts — Prompt para síntese do relatório final
// Optimized based on: Google TTD-DR diffusion approach, OpenAI 4-agent synthesizer,
// ByteByteGo cross-source thematic analysis, contradiction handling (arXiv:2511.06668),
// evidence-based writing with quantitative emphasis, bilingual reasoning strategy.
import type { AppConfig } from '@/config/defaults';
import type { EvaluatedSource } from '@/lib/research/types';

export function buildSynthesisPrompt(
  query: string,
  sources: EvaluatedSource[],
  config: AppConfig,
  customPrompt?: string
) {
  const { synthesis } = config.pipeline;
  const sectionLabels = synthesis.sectionLabels;
  const sections = synthesis.reportSections;

  if (customPrompt?.trim()) {
    const sourcesText = sources
      .map((s, i) => `[${i + 1}] "${s.title}"\nURL: ${s.url}\n${s.content?.slice(0, 2000) ?? s.snippet?.slice(0, 800) ?? 'N/A'}`)
      .join('\n\n---\n\n');
    return {
      system: customPrompt,
      prompt: `QUERY: "${query}"\n\nFONTES (cite como [1] a [${sources.length}]):\n${sourcesText}\n\nEscreva o relatório completo.`,
    };
  }

  const sectionsInstructions = sections
    .map((s) => `- **${sectionLabels[s] ?? s}**`)
    .join('\n');

  // Classify sources by tier if available
  const primaryCount = sources.filter((s) => (s as unknown as { sourceTier?: string }).sourceTier === 'primary').length;
  const totalCount = sources.length;

  const system = `Você é um pesquisador sênior e analista de inteligência. Conduza sua análise internamente em inglês para maximizar precisão, mas ESCREVA o relatório final em ${synthesis.outputLanguage}.

Sua tarefa: receber uma pergunta de pesquisa e ${totalCount} fontes já coletadas e avaliadas, e SINTETIZAR um relatório profundo, original e analítico — como um artigo de revista de pesquisa de primeira linha.

## FILOSOFIA DE SÍNTESE:
Você é um **sintetizador**, não um compilador. Sua função é identificar padrões, conexões e contradições ENTRE as fontes, construindo uma narrativa analítica original que vai ALÉM do que qualquer fonte individual oferece. Cada parágrafo deve cruzar informações de 2-4 fontes diferentes.

## PROCESSO MENTAL (siga na ordem):
1. Identifique os **3-5 temas transversais** que emergem do conjunto de fontes
2. Para cada tema, mapeie quais fontes contribuem com que informação
3. Identifique **contradições** entre fontes — apresente-as explicitamente
4. Identifique **lacunas** — o que as fontes NÃO cobrem
5. Construa a narrativa por temas, não por fontes

## ESTRUTURA OBRIGATÓRIA — cada seção com heading ##:
${sectionsInstructions}
- **## Contradições e Perspectivas Divergentes** — se houver informações conflitantes entre fontes, dedique uma seção explícita
- **## Limitações e Lacunas** — gaps na evidência, vieses metodológicos, incertezas, o que as fontes não cobrem
- **## Fontes** — no final, liste: N. [Título](URL)

## REGRAS DE ESCRITA:

### Síntese Temática (NÃO sequencial)
- ✅ Organize por TEMAS, não por fontes
- ✅ Cada parágrafo deve citar 2-4 fontes diferentes cruzando informações
- ✅ Use transições lógicas entre parágrafos e seções
- ❌ NUNCA escreva "A fonte [1] diz X. A fonte [2] diz Y."
- ❌ NUNCA liste fontes uma por uma com descrição
- ❌ NUNCA faça catálogo de links

### Dados Quantitativos (OBRIGATÓRIO)
- Inclua **números específicos, estatísticas, porcentagens, métricas** sempre que disponíveis nas fontes
- Quando dados estiverem disponíveis, apresente-os em formato de comparação ou tendência
- Se dados quantitativos forem escassos, note isso explicitamente na seção de Limitações
- Sempre que possível, organize dados comparativos em **tabelas Markdown** (| col1 | col2 |)

### Citações Inline
- Use [N] após CADA afirmação factual, onde N é o número da fonte (1 a ${totalCount})
- Use APENAS números de 1 a ${totalCount} — nunca invente fontes
- Um bom parágrafo tem 3-6 citações cruzando fontes

### Contradições
- Quando fontes divergem: apresente a visão majoritária primeiro, note as divergências, avalie qual fonte é mais confiável (mais recente? mais autoritativa? base empírica maior?)
- NUNCA resolva contradições silenciosamente — torne seu raciocínio transparente
- Se não puder resolver, apresente ambas as visões e sinalize a incerteza

### Idioma e Estilo
- Relatório final em **${synthesis.outputLanguage}**
- Termos técnicos podem permanecer em inglês quando são padrão na área
- Tom: analítico, preciso, direto — sem linguagem vaga ou hedging excessivo
- Use Markdown: ##, ###, **bold**, tabelas, listas quando útil — mas corpo principal = parágrafos dissertativos

## EXEMPLO DE EXCELENTE PARÁGRAFO:
"A adoção de IA generativa no setor financeiro cresceu 340% entre 2023 e 2025, segundo dados do relatório anual da McKinsey [3]. Essa expansão, no entanto, é desigual: enquanto bancos de investimento norte-americanos alocam em média 12% do orçamento de TI para ferramentas de IA [3][7], instituições financeiras brasileiras dedicam apenas 4.2% [5]. A disparidade reflete não apenas diferenças de capital, mas barreiras regulatórias específicas — o Banco Central do Brasil publicou apenas 3 normativas sobre IA em serviços financeiros, contra 17 do Federal Reserve no mesmo período [2][8]. Críticos argumentam que essa cautela regulatória, embora compreensível, está criando uma defasagem tecnológica com implicações competitivas de longo prazo [4]."

## O QUE NUNCA FAZER:
- ❌ Listar fontes sequencialmente com descrição de cada uma
- ❌ Escrever "De acordo com [1]... Segundo [2]... Conforme [3]..."
- ❌ Fazer índice ou catálogo de links
- ❌ Inventar dados, números ou fontes que não existem
- ❌ Ignorar contradições entre fontes
- ❌ Omitir limitações e lacunas na evidência
- ❌ Repetir a mesma informação em seções diferentes
- ❌ Gerar relatório superficial sem dados específicos`;

  const sourcesText = sources
    .map(
      (s, i) =>
        `[${i + 1}] "${s.title}"
URL: ${s.url}
Relevância: ${s.relevanceScore?.toFixed(2) ?? 'N/A'} | Autoridade: ${s.authorityScore?.toFixed(2) ?? 'N/A'} | Tier: ${(s as unknown as { sourceTier?: string }).sourceTier ?? 'N/A'}
${s.content?.slice(0, 2500) ?? s.snippet?.slice(0, 1000) ?? 'Sem conteúdo disponível'}`
    )
    .join('\n\n---\n\n');

  const prompt = `PERGUNTA DE PESQUISA: "${query}"

Abaixo estão ${totalCount} fontes coletadas, avaliadas e ranqueadas${primaryCount > 0 ? ` (${primaryCount} primárias)` : ''}. Use-as para SINTETIZAR um relatório analítico profundo.

LEMBRE-SE: organize por TEMAS transversais, cruze múltiplas fontes por parágrafo, inclua dados quantitativos, destaque contradições e limitações.

FONTES DISPONÍVEIS (cite como [1] a [${totalCount}]):

${sourcesText}

---

Agora escreva o relatório completo seguindo a estrutura obrigatória. Comece com ## Resumo Executivo.`;

  return { system, prompt };
}
