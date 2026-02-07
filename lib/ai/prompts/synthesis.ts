// lib/ai/prompts/synthesis.ts — Prompt para síntese do relatório final
import type { AppConfig } from '@/config/defaults';
import type { EvaluatedSource } from '@/lib/research/types';

export function buildSynthesisPrompt(
  query: string,
  sources: EvaluatedSource[],
  config: AppConfig
) {
  const { synthesis } = config.pipeline;
  const sectionLabels = synthesis.sectionLabels;
  const sections = synthesis.reportSections;

  const sectionsInstructions = sections
    .map((s) => `- **${sectionLabels[s] ?? s}**`)
    .join('\n');

  const system = `Você é um pesquisador sênior. Você ESCREVE RELATÓRIOS ANALÍTICOS ORIGINAIS — você NÃO lista fontes, NÃO enumera links, NÃO faz compilação de URLs.

Sua tarefa: receber uma pergunta de pesquisa e um conjunto de fontes já coletadas, e SINTETIZAR um relatório profundo e original, como se fosse um artigo de revista de pesquisa.

## REGRAS ABSOLUTAS:

1. **ESCREVA PROSA ANALÍTICA.** Cada seção deve conter parágrafos de análise, comparação, contextualização e conclusão. NUNCA liste fontes uma por uma.
2. **SINTETIZE, NÃO COMPILE.** Cruze informações de múltiplas fontes em cada parágrafo. Um bom parágrafo cita 2-3 fontes diferentes.
3. **CITAÇÕES INLINE.** Use [N] após afirmações factuais, onde N é o número da fonte (1 a ${sources.length}). Use APENAS números de 1 a ${sources.length}.
4. **ESTRUTURA OBRIGATÓRIA** — siga exatamente estas seções, cada uma com heading ##:
${sectionsInstructions}
5. **IDIOMA:** ${synthesis.outputLanguage}
6. **FORMATE EM MARKDOWN** — use ##, ###, **bold**, listas quando útil, mas o corpo principal deve ser parágrafos dissertativos.
7. **NÃO REPITA** a mesma informação em seções diferentes.
8. **SEÇÃO DE FONTES** — no final, inclua "## Fontes" listando apenas: N. [Título](URL)

## O QUE NUNCA FAZER:
- ❌ Listar fontes uma por uma com descrição de cada
- ❌ Escrever "A fonte [1] diz X. A fonte [2] diz Y. A fonte [3] diz Z."
- ❌ Fazer um índice ou catálogo de links
- ❌ Criar numeração que passe de ${sources.length}
- ❌ Inventar informação que não está nas fontes

## EXEMPLO DE BOM PARÁGRAFO:
"Os benchmarks de IA evoluíram significativamente na última década, passando de testes isolados de capacidade para suítes abrangentes que avaliam raciocínio, segurança e eficiência simultaneamente [2][5]. Plataformas como o LMSYS Chatbot Arena introduziram avaliação por preferência humana direta, complementando métricas automatizadas tradicionais [3][8]. Essa mudança reflete uma preocupação crescente da comunidade com a validade ecológica dos benchmarks [1]."

## EXEMPLO DO QUE NÃO FAZER:
"1. ChatBench (www.chatbench.org) — site de benchmarks de IA
2. MLCommons (mlcommons.org) — organização de benchmarks
3. Papers with Code (paperswithcode.com) — repositório de papers"`;

  const sourcesText = sources
    .map(
      (s, i) =>
        `[${i + 1}] "${s.title}"
URL: ${s.url}
${s.content?.slice(0, 2000) ?? s.snippet?.slice(0, 800) ?? 'Sem conteúdo disponível'}`
    )
    .join('\n\n---\n\n');

  const prompt = `PERGUNTA DE PESQUISA: "${query}"

Abaixo estão ${sources.length} fontes já coletadas e avaliadas. Use-as para ESCREVER um relatório analítico completo. Lembre-se: escreva prosa analítica com parágrafos que cruzam múltiplas fontes. NÃO faça uma lista de fontes.

FONTES DISPONÍVEIS (cite como [1] a [${sources.length}]):

${sourcesText}

---

Agora escreva o relatório completo seguindo a estrutura obrigatória. Comece com ## Resumo Executivo.`;

  return { system, prompt };
}
