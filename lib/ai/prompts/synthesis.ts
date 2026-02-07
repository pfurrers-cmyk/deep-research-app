// lib/ai/prompts/synthesis.ts — Prompt para síntese do relatório final
// Optimized based on: Google TTD-DR diffusion approach, OpenAI 4-agent synthesizer,
// ByteByteGo cross-source thematic analysis, contradiction handling (arXiv:2511.06668),
// evidence-based writing with quantitative emphasis, bilingual reasoning strategy.
import type { AppConfig } from '@/config/defaults';
import type { EvaluatedSource } from '@/lib/research/types';
import type { UserPreferences } from '@/lib/config/settings-store';

export function buildSynthesisPrompt(
  query: string,
  sources: EvaluatedSource[],
  config: AppConfig,
  customPrompt?: string,
  proSettings?: UserPreferences['pro']
) {
  const { synthesis } = config.pipeline;
  const sectionLabels = synthesis.sectionLabels;
  // Use PRO sections if available, otherwise fallback to pipeline config
  const sections = proSettings?.enabledSections?.length
    ? proSettings.sectionOrder.filter((s) => proSettings.enabledSections.includes(s))
    : synthesis.reportSections;

  // PRO settings with defaults
  const writingStyle = proSettings?.writingStyle ?? 'academic';
  const detailLevel = proSettings?.detailLevel ?? 'standard';
  const reasoningLang = proSettings?.reasoningLanguage ?? 'auto';
  const citationFmt = proSettings?.citationFormat ?? 'inline_numbered';
  const researchMode = proSettings?.researchMode ?? 'standard';

  const detailOpts = config.pro?.detailLevel?.options?.[detailLevel];
  const maxTokens = detailOpts?.maxTokens ?? synthesis.maxOutputTokens;

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

  // Build reasoning language instruction
  const reasoningInstruction = {
    pt: `Conduza sua análise internamente em português e ESCREVA o relatório final em ${synthesis.outputLanguage}.`,
    en: `Conduza sua análise internamente em inglês para maximizar precisão, mas ESCREVA o relatório final em ${synthesis.outputLanguage}.`,
    auto: `Conduza sua análise internamente em inglês para maximizar precisão, mas ESCREVA o relatório final em ${synthesis.outputLanguage}.`,
    bilingual: `Conduza sua análise usando raciocínio bilíngue (inglês para análise técnica, português para contexto cultural) e ESCREVA o relatório final em ${synthesis.outputLanguage}.`,
  }[reasoningLang] ?? `Conduza sua análise internamente em inglês para maximizar precisão, mas ESCREVA o relatório final em ${synthesis.outputLanguage}.`;

  // Build writing style instruction
  const styleInstruction = {
    academic: 'Tom: acadêmico, formal, com linguagem técnica precisa e citações rigorosas.',
    journalistic: 'Tom: jornalístico, com lead informativo, pirâmide invertida, linguagem clara e acessível.',
    technical: 'Tom: técnico, com terminologia especializada, dados quantitativos e descrições precisas.',
    casual: 'Tom: conversacional, acessível, com exemplos práticos e linguagem informal mas informativa.',
    executive: 'Tom: executivo, direto ao ponto, com bullet points, métricas-chave e recomendações acionáveis.',
  }[writingStyle] ?? 'Tom: analítico, preciso, direto.';

  // Build citation format instruction
  const citationInstruction = {
    inline_numbered: 'Use [N] após CADA afirmação factual, onde N é o número da fonte (1 a ' + totalCount + ').',
    footnotes: 'Use notas de rodapé numeradas¹²³ após afirmações factuais, listando referências no final de cada seção.',
    apa7: 'Use citações no formato APA 7ª ed. (Autor, Ano) após afirmações factuais.',
    abnt: 'Use citações no formato ABNT (AUTOR, ano) após afirmações factuais.',
    ieee: 'Use citações no formato IEEE [N] com numeração sequencial entre colchetes.',
    vancouver: 'Use citações no formato Vancouver com numeração sequencial em superscript.',
  }[citationFmt] ?? 'Use [N] após CADA afirmação factual.';

  // Build research mode instruction
  const modeInstruction = {
    standard: '',
    comparative: '\n\n## MODO COMPARATIVO:\n- Organize a análise em formato de comparação lado a lado\n- Use tabelas comparativas quando possível\n- Destaque diferenças e similaridades entre os itens comparados\n- Apresente vantagens e desvantagens de cada opção',
    temporal: '\n\n## MODO TEMPORAL:\n- Organize a análise cronologicamente\n- Identifique tendências, evoluções e pontos de inflexão\n- Use uma seção de Linha do Tempo\n- Destaque mudanças significativas entre períodos',
    contrarian: '\n\n## MODO CONTRÁRIO:\n- Apresente a visão majoritária E os contrapontos com peso igual\n- Estruture como "Ponto" e "Contraponto" em cada tópico\n- Não tome partido — apresente evidências para ambos os lados\n- Avalie a força da evidência para cada posição',
    meta_analysis: '\n\n## MODO META-ANÁLISE:\n- Trate as fontes como estudos individuais a serem sintetizados\n- Apresente métricas agregadas quando possível\n- Classifique fontes por qualidade metodológica\n- Identifique padrões e outliers\n- Inclua contagem de estudos que suportam cada conclusão',
    fact_check: '\n\n## MODO FACT-CHECK:\n- Para cada afirmação principal, emita um VEREDITO: ✅ Confirmado, ⚠️ Parcialmente verdadeiro, ❌ Falso, ❓ Não verificável\n- Cite as evidências específicas para cada veredito\n- Avalie a confiabilidade de cada fonte utilizada\n- Destaque contexto ausente ou distorcido',
  }[researchMode] ?? '';

  const system = `Você é um pesquisador sênior e analista de inteligência. ${reasoningInstruction}

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

### Citações
- ${citationInstruction}
- Use APENAS números de 1 a ${totalCount} — nunca invente fontes
- Um bom parágrafo tem 3-6 citações cruzando fontes

### Contradições
- Quando fontes divergem: apresente a visão majoritária primeiro, note as divergências, avalie qual fonte é mais confiável (mais recente? mais autoritativa? base empírica maior?)
- NUNCA resolva contradições silenciosamente — torne seu raciocínio transparente
- Se não puder resolver, apresente ambas as visões e sinalize a incerteza

### Idioma e Estilo
- Relatório final em **${synthesis.outputLanguage}**
- Termos técnicos podem permanecer em inglês quando são padrão na área
- ${styleInstruction}
- Use Markdown: ##, ###, **bold**, tabelas, listas quando útil — mas corpo principal = parágrafos dissertativos
- **Tamanho alvo**: aproximadamente ${maxTokens} tokens (${detailOpts?.pages ?? '~3 páginas'})

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
- ❌ Copiar ou adaptar os exemplos deste prompt — use-os apenas como referência de ESTILO${modeInstruction}`;

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
