// lib/ai/prompts/relevance-evaluation.ts — Prompt + schema para avaliação de fontes
// Optimized based on: CRAAP framework, RAGAS, WebTrust, MEGA-RAG composite scoring,
// Rubrics-as-Rewards anti-inflation, SourceCheckup, diversity-aware selection.
import { z } from 'zod';
import type { AppConfig } from '@/config/defaults';
import type { SearchResult } from '@/lib/research/types';

export const evaluationSchema = z.object({
  diversityWarning: z.string().optional().describe(
    'Se mais de 60% das fontes compartilham o mesmo domínio, tipo de publicação ou viés editorial, descreva o problema aqui. Caso contrário, deixe vazio.'
  ),
  evaluations: z.array(
    z.object({
      url: z.string().describe('URL da fonte avaliada'),
      rationale: z.string().describe(
        'OBRIGATÓRIO: Justificativa de 2-3 frases ANTES dos scores. Explique por que a fonte merece os scores atribuídos, citando evidências do snippet.'
      ),
      relevanceScore: z
        .number()
        .min(0)
        .max(1)
        .describe('Quão diretamente a fonte responde à query. Calibração: 0.9+ = responde diretamente com dados, 0.7-0.89 = relevante mas tangencial, 0.5-0.69 = parcialmente relevante, <0.5 = irrelevante'),
      recencyScore: z
        .number()
        .min(0)
        .max(1)
        .describe('Recência: 1.0 = publicado em 2025-2026, 0.8 = 2024, 0.6 = 2023, 0.4 = 2022, 0.2 = 2020-2021, 0.1 = antes de 2020. Se sem data, usar 0.3'),
      authorityScore: z
        .number()
        .min(0)
        .max(1)
        .describe('Autoridade do domínio/autor. Calibração: 0.9+ = peer-reviewed/gov, 0.7-0.89 = org reconhecida, 0.5-0.69 = mídia mainstream, 0.3-0.49 = blog especializado, <0.3 = fórum/wiki/anônimo'),
      biasScore: z
        .number()
        .min(0)
        .max(1)
        .describe('Neutralidade/objetividade: 1.0 = dados brutos/peer-reviewed, 0.7 = reportagem factual, 0.5 = análise com viés leve, 0.3 = opinião declarada, 0.1 = propaganda/marketing'),
      sourceTier: z
        .enum(['primary', 'secondary', 'tertiary'])
        .describe('primary = peer-reviewed papers, gov docs, documentação oficial, dados brutos; secondary = expert blogs, jornalismo investigativo, tutoriais detalhados; tertiary = wikis, listicles, Q&A, agregadores'),
      contradicts: z
        .string()
        .optional()
        .describe('Se esta fonte contradiz OUTRA fonte da lista, identifique a URL da fonte contraditória e descreva a contradição em 1 frase. Deixe vazio se não há contradição.'),
    })
  ),
});

export type EvaluationResult = z.infer<typeof evaluationSchema>;

export function buildEvaluationPrompt(
  query: string,
  sources: SearchResult[],
  config: AppConfig,
  customPrompt?: string
) {
  const { evaluation } = config.pipeline;

  if (customPrompt?.trim()) {
    const sourcesText = sources
      .map((s, i) => `[${i + 1}] URL: ${s.url}\nTítulo: ${s.title}\nSnippet: ${s.snippet?.slice(0, 500) ?? 'N/A'}`)
      .join('\n\n');
    return {
      system: customPrompt,
      prompt: `Query: "${query}"\n\nFontes (${sources.length}):\n${sourcesText}`,
    };
  }

  const system = `Você é um avaliador rigoroso e calibrado de fontes de pesquisa, treinado nos frameworks CRAAP (Currency, Relevance, Authority, Accuracy, Purpose) e MEGA-RAG. Sua tarefa é avaliar cada fonte em múltiplas dimensões usando uma rubrica objetiva.

## PROCESSO OBRIGATÓRIO (para cada fonte):
1. Leia o snippet e a URL com atenção
2. Escreva uma JUSTIFICATIVA (rationale) de 2-3 frases explicando sua avaliação — ANTES de atribuir scores
3. Atribua os scores numéricos com base na rubrica abaixo
4. Classifique o tier da fonte (primary/secondary/tertiary)
5. Identifique contradições com outras fontes da lista

## RUBRICA DE CALIBRAÇÃO (SIGA ESTRITAMENTE):

### relevanceScore — Quanto a fonte responde à query
| Score | Significado | Exemplo |
|-------|-------------|---------|
| 0.90-1.00 | Resposta direta com dados específicos | Paper sobre exatamente o tema, com métricas |
| 0.70-0.89 | Relevante mas não foca exclusivamente no tema | Artigo que aborda o tema como parte de análise maior |
| 0.50-0.69 | Parcialmente relevante, tangencial | Menciona o tema mas foca em assunto adjacente |
| 0.30-0.49 | Pouco relevante | Mesmo campo, mas tema diferente |
| 0.00-0.29 | Irrelevante | Sem relação com a query |

### recencyScore — Quão atual é a informação
| Score | Ano de publicação |
|-------|-------------------|
| 1.00 | 2025-2026 |
| 0.80 | 2024 |
| 0.60 | 2023 |
| 0.40 | 2022 |
| 0.20 | 2020-2021 |
| 0.10 | Antes de 2020 |
| 0.30 | Sem data identificável |

### authorityScore — Credibilidade do domínio/autor
| Score | Tipo de fonte |
|-------|---------------|
| 0.95 | Peer-reviewed journal (Nature, Science, IEEE, ACM) |
| 0.90 | Governo (.gov, .gov.br, .jus.br), padrões oficiais |
| 0.80 | Universidades (.edu), organizações reconhecidas (.org bem estabelecida) |
| 0.70 | Mídia tech de referência (Ars Technica, The Verge, Reuters) |
| 0.60 | Mídia mainstream (BBC, Folha, CNN), blogs corporativos de empresas líderes |
| 0.50 | Blogs técnicos especializados com autor identificado |
| 0.35 | Blogs pessoais, médias pequenas |
| 0.20 | Fóruns (Reddit, Stack Overflow), plataformas de Q&A |
| 0.10 | Wikis editáveis, listicles sem fonte, conteúdo anônimo |

### biasScore — Neutralidade e objetividade
| Score | Nível de viés |
|-------|---------------|
| 1.00 | Dados brutos, datasets, documentação técnica |
| 0.80 | Peer-reviewed, reportagem factual investigativa |
| 0.60 | Análise fundamentada com leve viés editorial |
| 0.40 | Opinião declarada de especialista |
| 0.20 | Marketing, auto-promoção, vendedor avaliando próprio produto |
| 0.10 | Propaganda, desinformação, clickbait |

### sourceTier — Classificação da fonte
- **primary**: Peer-reviewed papers, gov docs, documentação oficial, dados brutos, relatórios anuais
- **secondary**: Jornalismo investigativo, blogs de especialistas, tutoriais detalhados, análises de mercado
- **tertiary**: Wikis, listicles, Q&A threads, agregadores de notícias, posts de redes sociais

## ANTI-INFLAÇÃO (REGRAS CRÍTICAS):
- A MÉDIA dos relevanceScores deve ficar entre 0.45 e 0.70. Se todas as fontes recebem >0.8, seus scores estão inflados.
- Fontes tertiary NUNCA devem receber authorityScore > 0.5
- Se o snippet é vago e genérico, relevanceScore MÁXIMO é 0.6
- Um relevanceScore de 0.9+ exige que o snippet contenha informação ESPECÍFICA e DIRETAMENTE relevante à query
- Blogs que vendem produto/serviço relacionado: biasScore ≤ 0.3

## DIVERSIDADE:
- Se >60% das fontes são do mesmo domínio, tipo ou viés: preencha o campo diversityWarning
- Valorize fontes que trazem perspectivas diferentes (mesmo com authority menor)

Threshold de corte: ${evaluation.relevanceThreshold} — fontes abaixo serão descartadas.
Máximo a manter: ${evaluation.maxSourcesToKeep}`;

  const sourcesText = sources
    .map(
      (s, i) =>
        `[${i + 1}] URL: ${s.url}\nTítulo: ${s.title}\nData: ${s.publishedDate ?? 'N/D'}\nAutor: ${s.author ?? 'N/D'}\nSnippet: ${s.snippet?.slice(0, 600) ?? 'N/A'}`
    )
    .join('\n\n---\n\n');

  const prompt = `Query de pesquisa original: "${query}"

Avalie rigorosamente as seguintes ${sources.length} fontes. Lembre-se: escreva a justificativa (rationale) ANTES de atribuir cada score.

${sourcesText}`;

  return { system, prompt };
}
