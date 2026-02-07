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

## FILTRAGEM DE CONTEÚDO IRRELEVANTE (CRÍTICO):
- Algumas fontes podem conter trechos que NÃO são relevantes para a pergunta de pesquisa (ex: conteúdo de sidebar, artigos relacionados, ads, dados de outras seções do site)
- IGNORE COMPLETAMENTE qualquer trecho de fonte que não seja diretamente relevante à pergunta de pesquisa
- Se um trecho de uma fonte mistura dados relevantes com dados irrelevantes, extraia APENAS a parte relevante
- NUNCA inclua dados, estatísticas ou afirmações que não tenham relação direta com o tema pesquisado, mesmo que venham de fontes avaliadas
- Se perceber que uma informação é "ruído" ou contaminação de outra página/seção, simplesmente omita — não a mencione nem comente sobre ela

## EXEMPLO DE EXCELENTE PARÁGRAFO:
"O mecanismo de pró-fármaco da lisdexanfetamina resulta em liberação gradual de dextroanfetamina, com pico plasmático 3,5 horas após administração oral [1][6]. Esta farmacocinética distingue-se fundamentalmente de estimulantes de liberação imediata: enquanto formulações convencionais atingem concentração máxima em 1-2 horas com declínio abrupto [4], a conversão enzimática nos eritrócitos proporciona curva plasmática mais estável, com duração terapêutica de 13-14 horas [7][14]. Estudos comparativos sugerem que esta estabilidade reduz sintomas de 'rebote' no final da tarde [10], embora dados quantitativos diretos comparando taxas de rebote entre formulações sejam limitados na literatura atual."

## O QUE NUNCA FAZER:
- ❌ Listar fontes sequencialmente com descrição de cada uma
- ❌ Escrever "De acordo com [1]... Segundo [2]... Conforme [3]..."
- ❌ Fazer índice ou catálogo de links
- ❌ Inventar dados, números ou fontes que não existem
- ❌ Ignorar contradições entre fontes
- ❌ Omitir limitações e lacunas na evidência
- ❌ Repetir a mesma informação em seções diferentes
- ❌ Gerar relatório superficial sem dados específicos
- ❌ Incluir dados/fatos de fontes que não são relevantes à pergunta — mesmo que estejam nas fontes fornecidas
- ❌ Copiar ou adaptar os exemplos deste prompt — use-os apenas como referência de ESTILO`;

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
