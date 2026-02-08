// lib/ai/prompts/tcc-sections.ts — Prompts especializados por seção do TCC ABNT
// Cada tipo de seção tem um prompt dedicado com instruções específicas.
import type { UserPreferences } from '@/lib/config/settings-store';
import type { EvaluatedSource } from '@/lib/research/types';

// ============================================================
// TYPES
// ============================================================

export interface TccConfig {
  titulo: string;
  autor: string;
  instituicao: string;
  curso: string;
  orientador: string;
  cidade: string;
  ano: string;
  minFontes: number;
  minPaginas?: number;
  tipoPesquisa?: string;
  areaConhecimento?: string;
  abordagem?: string;
  nivelAcademico?: string;
  dedicatoria?: string;
  agradecimentos?: string;
  epigrafe?: string;
  epigrafeAutor?: string;
}

export interface TccSectionDef {
  id: string;
  title: string;
  headingLevel: number;
  type: 'pretextual' | 'textual' | 'postextual';
  required: boolean;
  estimatedPages: number;
  promptBuilder: (ctx: TccPromptContext) => { system: string; prompt: string };
}

export interface TccPromptContext {
  query: string;
  tcc: TccConfig;
  sources: EvaluatedSource[];
  previousSections: string[];
  totalSources: number;
  outlineDescription?: string;
}

// ============================================================
// HELPER: build source text for prompts
// ============================================================

/**
 * Extract author surname and year from a source for ABNT citation.
 * Uses heuristics: author field, URL domain, title patterns.
 */
export function extractAuthorYear(source: EvaluatedSource): { surname: string; year: string; citeKey: string } {
  // Try author field first
  let surname = '';
  let year = '';

  if (source.author) {
    // Extract surname (last part before comma, or first word)
    const parts = source.author.split(/[,;]/)[0].trim().split(' ');
    surname = parts[parts.length - 1].toUpperCase();
  }

  // Try publishedDate for year
  if (source.publishedDate) {
    const match = source.publishedDate.match(/(\d{4})/);
    if (match) year = match[1];
  }

  // Fallback: extract from URL or title
  if (!surname) {
    // Check if URL is institutional
    const urlDomain = source.source || '';
    if (urlDomain.includes('.gov.br')) {
      surname = 'BRASIL';
    } else if (urlDomain.includes('.edu.br') || urlDomain.includes('repositorio')) {
      // Try to extract from title pattern "Author Name - Title"
      const titleParts = source.title.split(/[—–\-:|]/);
      if (titleParts.length > 1) {
        const possibleAuthor = titleParts[titleParts.length - 1].trim().split(' ');
        surname = possibleAuthor[possibleAuthor.length - 1].toUpperCase();
      } else {
        surname = urlDomain.split('.')[0].toUpperCase();
      }
    } else {
      // Extract from domain
      const domainParts = urlDomain.replace(/^www\./, '').split('.');
      surname = domainParts[0].toUpperCase();
    }
  }

  if (!year) {
    // Try extracting year from URL or content
    const urlYearMatch = source.url.match(/\/(\d{4})\//);
    if (urlYearMatch) {
      year = urlYearMatch[1];
    } else {
      // Default to recent year
      year = new Date().getFullYear().toString();
    }
  }

  // Clean up
  surname = surname.replace(/[^A-ZÁÉÍÓÚÂÊÔÀÃÕÇ]/gi, '').toUpperCase();
  if (!surname || surname.length < 2) surname = 'S/A';

  const citeKey = `(${surname}, ${year})`;
  return { surname, year, citeKey };
}

function buildSourceText(sources: EvaluatedSource[], indices?: number[]): string {
  const selected = indices?.length
    ? indices.map((i) => sources[i - 1]).filter(Boolean)
    : sources;
  return selected
    .map((s) => {
      const { surname, year, citeKey } = extractAuthorYear(s);
      return `FONTE ${citeKey} — "${s.title}"
Autor/Instituição: ${s.author || surname}
Ano: ${year}
URL: ${s.url}
CITE COMO: ${citeKey} para citação indireta ou (${surname}, ${year}, p. X) para citação direta

${s.content?.slice(0, 2500) ?? s.snippet?.slice(0, 1000) ?? 'Sem conteúdo disponível'}`;
    })
    .join('\n\n---\n\n');
}

function citationRules(): string {
  return `### REGRAS DE CITAÇÃO ABNT (NBR 10520):
- Citação INDIRETA (paráfrase): Segundo Sobrenome (ano), ... OU ... (SOBRENOME, ano).
- Citação direta CURTA (até 3 linhas): "texto transcrito" (SOBRENOME, ano, p. X).
- Citação direta LONGA (>3 linhas): bloco recuado 4cm, sem aspas, fonte menor, espaçamento simples, (SOBRENOME, ano, p. X).
- 2 autores: (SOBRENOME1; SOBRENOME2, ano)
- 3+ autores: (SOBRENOME1 et al., ano)
- Citação de citação: (AUTOR ORIGINAL apud AUTOR CONSULTADO, ano)
- NUNCA use [1][2][3] — use SEMPRE o formato (SOBRENOME, ano).
- Predomínio de citações INDIRETAS demonstra maturidade acadêmica.
- Toda citação DEVE ser comentada/analisada — nunca "jogada" no texto.
- Cada parágrafo deve articular 2-4 autores diferentes.`;
}

function academicStyle(): string {
  return `### ESTILO ACADÊMICO:
- Linguagem impessoal (3ª pessoa do singular ou 1ª pessoa do plural)
- Tom formal e acadêmico — sem coloquialismos
- Precisão terminológica da área
- Modéstia epistêmica: "sugere", "indica", "pode-se inferir" — evitar afirmações absolutas
- Parágrafos com: tópico frasal → desenvolvimento → fechamento
- Conectivos acadêmicos: "Nesse sentido", "Em contrapartida", "Conforme", "Ademais"
- Recuo de 1,25 cm na primeira linha de cada parágrafo (marcar com espaço inicial)`;
}

// ============================================================
// SECTION DEFINITIONS — TCC ABNT COMPLETO
// ============================================================

export function buildTccSections(tcc: TccConfig): TccSectionDef[] {
  const sections: TccSectionDef[] = [];

  // ── PRÉ-TEXTUAIS ──

  sections.push({
    id: 'capa',
    title: 'CAPA',
    headingLevel: 2,
    type: 'pretextual',
    required: true,
    estimatedPages: 1,
    promptBuilder: (ctx) => ({
      system: 'Você é um formatador de documentos acadêmicos ABNT.',
      prompt: `Gere APENAS a capa do TCC no formato ABNT. Use centralização. Elementos obrigatórios na ordem:

1. Nome da instituição (com hierarquia se houver): ${ctx.tcc.instituicao.toUpperCase()}
2. Nome do curso: ${ctx.tcc.curso.toUpperCase()}
3. [espaço]
4. Nome do autor: ${ctx.tcc.autor.toUpperCase()}
5. [espaço]
6. Título do trabalho (em negrito/caixa alta): **${ctx.tcc.titulo.toUpperCase()}**
7. [espaço grande]
8. Cidade: ${ctx.tcc.cidade}
9. Ano: ${ctx.tcc.ano}

Formate como Markdown centralizado. NÃO adicione nenhum outro texto.`,
    }),
  });

  sections.push({
    id: 'folha_rosto',
    title: 'FOLHA DE ROSTO',
    headingLevel: 2,
    type: 'pretextual',
    required: true,
    estimatedPages: 1,
    promptBuilder: (ctx) => ({
      system: 'Você é um formatador de documentos acadêmicos ABNT.',
      prompt: `Gere APENAS a folha de rosto do TCC no formato ABNT:

1. Nome do autor (centralizado): ${ctx.tcc.autor.toUpperCase()}
2. [espaço]
3. Título (centralizado, negrito): **${ctx.tcc.titulo.toUpperCase()}**
4. [espaço]
5. Natureza do trabalho (recuado da metade da página para a direita, espaçamento simples):
   "Trabalho de Conclusão de Curso apresentado ao ${ctx.tcc.curso} da ${ctx.tcc.instituicao}, como requisito parcial para obtenção do grau de bacharel${ctx.tcc.areaConhecimento ? ' em ' + ctx.tcc.areaConhecimento : ''}."
6. [espaço]
7. Orientador(a): Prof. ${ctx.tcc.orientador}
8. [espaço grande]
9. Cidade: ${ctx.tcc.cidade}
10. Ano: ${ctx.tcc.ano}

Formate como Markdown. NÃO adicione nenhum outro texto.`,
    }),
  });

  if (tcc.dedicatoria) {
    sections.push({
      id: 'dedicatoria',
      title: 'DEDICATÓRIA',
      headingLevel: 2,
      type: 'pretextual',
      required: false,
      estimatedPages: 1,
      promptBuilder: (ctx) => ({
        system: 'Formatador ABNT.',
        prompt: `Gere a página de dedicatória. O texto deve ficar na parte inferior direita da página, sem título "Dedicatória". Texto do autor: "${ctx.tcc.dedicatoria}". Formate em itálico, alinhado à direita. Breve e pessoal.`,
      }),
    });
  }

  if (tcc.agradecimentos) {
    sections.push({
      id: 'agradecimentos',
      title: 'AGRADECIMENTOS',
      headingLevel: 2,
      type: 'pretextual',
      required: false,
      estimatedPages: 1,
      promptBuilder: (ctx) => ({
        system: 'Formatador ABNT.',
        prompt: `Gere a página de agradecimentos acadêmicos baseado neste input do autor: "${ctx.tcc.agradecimentos}". Tom sóbrio e profissional. Agradecer orientador, instituição, família/amigos conforme indicado. Menção a agências de fomento se houver.`,
      }),
    });
  }

  if (tcc.epigrafe) {
    sections.push({
      id: 'epigrafe',
      title: 'EPÍGRAFE',
      headingLevel: 2,
      type: 'pretextual',
      required: false,
      estimatedPages: 1,
      promptBuilder: (ctx) => ({
        system: 'Formatador ABNT.',
        prompt: `Gere a epígrafe. Citação: "${ctx.tcc.epigrafe}". Autor: ${ctx.tcc.epigrafeAutor || 'Desconhecido'}. Formate em itálico, alinhado à direita, na parte inferior da página, sem aspas, com indicação de autoria.`,
      }),
    });
  }

  sections.push({
    id: 'resumo',
    title: 'RESUMO',
    headingLevel: 2,
    type: 'pretextual',
    required: true,
    estimatedPages: 1,
    promptBuilder: (ctx) => ({
      system: `Você é um redator acadêmico especialista em resumos ABNT (NBR 6028).
${academicStyle()}`,
      prompt: `Escreva o RESUMO do TCC seguindo rigorosamente a NBR 6028:

TÍTULO: ${ctx.tcc.titulo}
TEMA/PERGUNTA: ${ctx.query}
CONTEXTO: Este é um TCC de ${ctx.tcc.curso} da ${ctx.tcc.instituicao}.

${ctx.previousSections.length > 0 ? `CONTEÚDO DAS SEÇÕES JÁ GERADAS (use como base):\n${ctx.previousSections.join('\n\n')}\n` : ''}

REGRAS DO RESUMO (NBR 6028):
- Parágrafo ÚNICO, sem recuo
- Extensão: 150 a 500 palavras
- Verbo na VOZ ATIVA, 3ª pessoa do singular
- Deve conter: contexto → objetivo → metodologia → resultados → conclusão
- NÃO usar citações no resumo
- NÃO usar tópicos ou listas

Após o resumo, em nova linha:
**Palavras-chave:** termo1; termo2; termo3; termo4; termo5.
(3 a 5 palavras-chave, separadas por ponto-e-vírgula, com ponto final)`,
    }),
  });

  sections.push({
    id: 'abstract',
    title: 'ABSTRACT',
    headingLevel: 2,
    type: 'pretextual',
    required: true,
    estimatedPages: 1,
    promptBuilder: (ctx) => ({
      system: 'Você é um tradutor acadêmico proficiente em inglês acadêmico.',
      prompt: `Traduza o resumo abaixo para inglês acadêmico, mantendo a mesma estrutura (parágrafo único, 150-500 palavras, voz ativa):

${ctx.previousSections.find((s) => s.includes('Palavras-chave:')) || 'Resumo ainda não disponível — gere um abstract coerente com o tema: ' + ctx.query}

Após o abstract, em nova linha:
**Keywords:** keyword1; keyword2; keyword3; keyword4; keyword5.

Mantenha fidelidade absoluta ao conteúdo. Linguagem acadêmica formal em inglês.`,
    }),
  });

  // ── TEXTUAIS ──

  const minPag = tcc.minPaginas ?? 50;
  const introPages = Math.max(3, Math.round(minPag * 0.07));
  const refTeoricoPages = Math.max(15, Math.round(minPag * 0.35));
  const metodoPages = Math.max(5, Math.round(minPag * 0.10));
  const analisePages = Math.max(15, Math.round(minPag * 0.35));
  const conclusaoPages = Math.max(2, Math.round(minPag * 0.06));

  sections.push({
    id: 'introducao',
    title: '1 INTRODUÇÃO',
    headingLevel: 2,
    type: 'textual',
    required: true,
    estimatedPages: introPages,
    promptBuilder: (ctx) => ({
      system: `Você é um pesquisador acadêmico sênior escrevendo a INTRODUÇÃO de um TCC.
${citationRules()}
${academicStyle()}`,
      prompt: `Escreva a INTRODUÇÃO COMPLETA do TCC. Mínimo ${introPages} páginas (~${introPages * 350} palavras).

TÍTULO: ${ctx.tcc.titulo}
PERGUNTA DE PESQUISA: ${ctx.query}
ÁREA: ${ctx.tcc.areaConhecimento || ctx.tcc.curso}

A Introdução DEVE conter TODOS os seguintes elementos, NESTA ORDEM:

**1.1 Contextualização temática** (~2-3 parágrafos)
Situe o tema no campo de estudos. Use citações de autores que trabalham o tema.

**1.2 Problematização** (~1-2 parágrafos)
Qual lacuna, contradição ou necessidade de conhecimento motiva o trabalho? Apresente o estado atual do debate.

**1.3 Pergunta de pesquisa** (~1 parágrafo)
Formule a pergunta de pesquisa EXPLICITAMENTE e de forma delimitada. Derivada do prompt: "${ctx.query}"

**1.4 Justificativa** (~2-3 parágrafos)
Por que este tema merece investigação? Relevância acadêmica, social e/ou institucional.

**1.5 Objetivos** (~1-2 parágrafos)
- Objetivo geral: UM objetivo, verbo no infinitivo (Taxonomia de Bloom: analisar, comparar, avaliar, investigar — NÃO use "entender" ou "estudar")
- Objetivos específicos: 3 a 5 objetivos, cada um com verbo no infinitivo diferente

**1.6 Delimitação** (~1 parágrafo)
Recorte temporal, espacial e temático do trabalho.

**1.7 Estrutura do trabalho** (~1 parágrafo)
Breve roteiro dos capítulos seguintes.

FONTES DISPONÍVEIS (cite como SOBRENOME, ano):
${buildSourceText(ctx.sources)}

Use subseções numeradas (1.1, 1.2, etc.). Cada subseção como ### heading.`,
    }),
  });

  // Referencial teórico — dividido em sub-chamadas para extensão
  sections.push({
    id: 'referencial_teorico',
    title: '2 REFERENCIAL TEÓRICO',
    headingLevel: 2,
    type: 'textual',
    required: true,
    estimatedPages: refTeoricoPages,
    promptBuilder: (ctx) => ({
      system: `Você é um pesquisador acadêmico sênior escrevendo o REFERENCIAL TEÓRICO de um TCC.
Este é o MAIOR capítulo do trabalho. Deve ter no mínimo ${refTeoricoPages} páginas (~${refTeoricoPages * 350} palavras).

${citationRules()}
${academicStyle()}

### REGRAS DO REFERENCIAL TEÓRICO:
- Organize por TEMAS/CONCEITOS, não por autor (NÃO fazer fichamento sequencial)
- Promova DIÁLOGO entre autores: confronte, complemente e sintetize posições
- Defina e operacionalize os conceitos-chave
- Demonstre POSICIONAMENTO do autor em relação às correntes teóricas
- Declare o marco teórico explicitamente
- Articule o referencial com o problema de pesquisa
- Use subseções (2.1, 2.2, 2.3 etc.) para cada grande tema
- Mínimo de ${ctx.tcc.minFontes} referências bibliográficas no total
- Priorize artigos de periódicos, livros seminais e teses recentes`,
      prompt: `Escreva o REFERENCIAL TEÓRICO COMPLETO do TCC.

TÍTULO: ${ctx.tcc.titulo}
PERGUNTA: ${ctx.query}
ÁREA: ${ctx.tcc.areaConhecimento || ctx.tcc.curso}

${ctx.previousSections.length > 0 ? `CONTEXTO (Introdução já escrita):\n${ctx.previousSections.slice(-1)[0]?.slice(0, 1500)}\n` : ''}

Organize em pelo menos 3-5 subseções temáticas (2.1, 2.2, 2.3, etc.), cada uma com heading ###.

FONTES DISPONÍVEIS (cite como SOBRENOME, ano):
${buildSourceText(ctx.sources)}

Escreva o referencial teórico COMPLETO, profundo, extenso (~${refTeoricoPages * 350} palavras mínimas). Cada subseção deve ter pelo menos 3-4 páginas. Dialogue entre os autores. NÃO faça fichamento sequencial.`,
    }),
  });

  sections.push({
    id: 'metodologia',
    title: '3 METODOLOGIA',
    headingLevel: 2,
    type: 'textual',
    required: true,
    estimatedPages: metodoPages,
    promptBuilder: (ctx) => ({
      system: `Você é um metodólogo acadêmico escrevendo a seção de METODOLOGIA de um TCC.
${citationRules()}
${academicStyle()}`,
      prompt: `Escreva a METODOLOGIA COMPLETA do TCC. Mínimo ${metodoPages} páginas (~${metodoPages * 350} palavras).

TÍTULO: ${ctx.tcc.titulo}
PERGUNTA: ${ctx.query}
TIPO DE PESQUISA: ${ctx.tcc.tipoPesquisa || 'Revisão bibliográfica'}
ABORDAGEM: ${ctx.tcc.abordagem || 'Qualitativa'}
ÁREA: ${ctx.tcc.areaConhecimento || ctx.tcc.curso}

A Metodologia DEVE classificar a pesquisa em TODOS os eixos abaixo, EXPLICITAMENTE e com fundamentação:

### 3.1 Abordagem da pesquisa
Classificar como qualitativa, quantitativa ou mista. Fundamentar com autores (ex: Minayo, Creswell, Gil).

### 3.2 Tipo de pesquisa quanto aos objetivos
Exploratória, descritiva, explicativa ou correlacional. Justificar com referências.

### 3.3 Procedimentos técnicos
${ctx.tcc.tipoPesquisa === 'revisao_bibliografica' || !ctx.tcc.tipoPesquisa ?
`Para REVISÃO BIBLIOGRÁFICA:
- Bases de dados consultadas (SciELO, Google Scholar, CAPES, etc.)
- Strings/termos de busca utilizados
- Critérios de inclusão e exclusão
- Período de publicação das fontes
- Idiomas aceitos
- Fluxograma de seleção (se aplicável)` :
`Descrever detalhadamente os procedimentos de coleta de dados.`}

### 3.4 Procedimentos de análise dos dados
Método de análise (análise de conteúdo, análise temática, etc.). Fundamentar.

### 3.5 Universo/Amostra/Corpus
Descrever o corpus bibliográfico analisado (${ctx.totalSources} fontes selecionadas).

### 3.6 Limitações metodológicas
Reconhecer limitações do desenho de pesquisa.

### 3.7 Quadro-síntese
Encerrar com um parágrafo que cruze TODOS os eixos:
"Trata-se de uma pesquisa de abordagem [X] (Eixo 1), de caráter [Y] (Eixo 2), realizada por meio de [Z] (Eixo 3), com análise por [W] (Eixo 4)..."

FONTES para fundamentar a metodologia (cite autores de metodologia):
${buildSourceText(ctx.sources)}`,
    }),
  });

  sections.push({
    id: 'resultados_discussao',
    title: '4 RESULTADOS E DISCUSSÃO',
    headingLevel: 2,
    type: 'textual',
    required: true,
    estimatedPages: analisePages,
    promptBuilder: (ctx) => ({
      system: `Você é um pesquisador acadêmico sênior escrevendo a seção de RESULTADOS E DISCUSSÃO de um TCC.
Este é, junto com o Referencial Teórico, o capítulo mais extenso. Mínimo ${analisePages} páginas (~${analisePages * 350} palavras).

${citationRules()}
${academicStyle()}

### REGRAS DE ANÁLISE:
- Apresente os dados/achados organizados em CATEGORIAS de análise
- Interprete CADA achado à luz do referencial teórico
- Dialogue com a literatura: convergências e divergências com pesquisas anteriores
- Use evidências para sustentar cada argumento
- A voz do pesquisador deve estar presente: interprete, avalie, posicione-se
- Responda progressivamente à pergunta de pesquisa
- Quando houver dados quantitativos, use tabelas Markdown
- Use trechos de fontes como evidência (com citação ABNT)`,
      prompt: `Escreva a seção de RESULTADOS E DISCUSSÃO COMPLETA do TCC.

TÍTULO: ${ctx.tcc.titulo}
PERGUNTA: ${ctx.query}

${ctx.previousSections.length > 0 ? `CONTEXTO DAS SEÇÕES ANTERIORES:\n${ctx.previousSections.map((s) => s.slice(0, 800)).join('\n---\n')}\n` : ''}

Organize em subseções temáticas (4.1, 4.2, 4.3 etc.) com ### headings.
Cada subseção deve:
1. Apresentar os achados/dados sobre o subtema
2. Articular com o referencial teórico (dialogar com autores do cap. 2)
3. Analisar criticamente: concordâncias, divergências, nuances
4. Construir argumento progressivo que responde à pergunta de pesquisa

FONTES (cite como SOBRENOME, ano):
${buildSourceText(ctx.sources)}

Escreva com extensão, profundidade e rigor analítico (~${analisePages * 350} palavras mínimas).`,
    }),
  });

  sections.push({
    id: 'consideracoes_finais',
    title: '5 CONSIDERAÇÕES FINAIS',
    headingLevel: 2,
    type: 'textual',
    required: true,
    estimatedPages: conclusaoPages,
    promptBuilder: (ctx) => ({
      system: `Você é um pesquisador acadêmico sênior escrevendo as CONSIDERAÇÕES FINAIS de um TCC.
${academicStyle()}`,
      prompt: `Escreva as CONSIDERAÇÕES FINAIS do TCC. ${conclusaoPages} a ${conclusaoPages + 2} páginas (~${conclusaoPages * 400} palavras).

TÍTULO: ${ctx.tcc.titulo}
PERGUNTA: ${ctx.query}

${ctx.previousSections.length > 0 ? `CONTEXTO (seções anteriores):\n${ctx.previousSections.map((s) => s.slice(0, 600)).join('\n---\n')}\n` : ''}

DEVE conter, NESTA ORDEM:

1. **Síntese dos principais achados**: retomada concisa dos resultados, SEM dados novos.

2. **Resposta explícita à pergunta de pesquisa**: demonstrar se e como os objetivos (geral e específicos) foram alcançados.

3. **Contribuição do trabalho**: o que este estudo acrescenta ao campo de conhecimento.

4. **Limitações do estudo**: autocrítica honesta e madura sobre os limites da pesquisa.

5. **Sugestões para pesquisas futuras**: caminhos abertos pelo trabalho para investigações posteriores.

6. **Reflexão final**: encerramento que demonstre maturidade intelectual.

REGRAS:
- NÃO introduzir referências ou dados novos
- NÃO usar citações diretas (pode usar indiretas pontualmente)
- NÃO repetir a Introdução — sintetizar os RESULTADOS
- Tom de fechamento reflexivo e maduro`,
    }),
  });

  // ── PÓS-TEXTUAIS ──

  sections.push({
    id: 'referencias',
    title: 'REFERÊNCIAS',
    headingLevel: 2,
    type: 'postextual',
    required: true,
    estimatedPages: 3,
    promptBuilder: (ctx) => ({
      system: `Você é um bibliotecário especialista em normas ABNT (NBR 6023:2018).
Sua tarefa é formatar referências bibliográficas com perfeição.`,
      prompt: `Formate TODAS as fontes abaixo no padrão ABNT NBR 6023:2018.

REGRAS ABNT PARA REFERÊNCIAS:
- Ordem ALFABÉTICA por sobrenome do primeiro autor
- Alinhamento à ESQUERDA (sem recuo, sem centralização)
- Espaçamento SIMPLES entre linhas de uma referência
- Uma linha EM BRANCO entre referências
- Título do livro/periódico em NEGRITO (**Título**)
- Elementos essenciais: autor, título, edição, local, editora, data

FORMATOS:
- Livro: SOBRENOME, Nome. **Título**: subtítulo. ed. Cidade: Editora, ano.
- Artigo: SOBRENOME, Nome. Título do artigo. **Nome do Periódico**, cidade, v. X, n. Y, p. Z-W, mês ano.
- Site: SOBRENOME, Nome (ou INSTITUIÇÃO). **Título da página**. Disponível em: URL. Acesso em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}.
- Tese: SOBRENOME, Nome. **Título**. Ano. Nº f. Tese (Doutorado em Área) — Instituição, Cidade, ano.
- Legislação: BRASIL. **Título da lei/decreto**. Diário Oficial da União, Brasília, data.

FONTES A FORMATAR:
${ctx.sources.map((s, i) => `${i + 1}. Título: "${s.title}" | URL: ${s.url} | Fonte: ${s.source}`).join('\n')}

Formate TODAS as ${ctx.totalSources} referências. Invente os dados faltantes (autor, ano, editora) de forma PLAUSÍVEL baseando-se no domínio e título. Se o domínio for .edu.br ou .gov.br, use o formato institucional. Se for periódico (scielo, revista, journal), use formato de artigo.

NÃO numere as referências — apenas liste em ordem alfabética.`,
    }),
  });

  return sections;
}

// ============================================================
// HELPER: Extract TCC config from preferences or request settings
// ============================================================

export function extractTccConfigFromRequest(
  tccSettings?: {
    titulo?: string;
    autor?: string;
    instituicao?: string;
    curso?: string;
    orientador?: string;
    cidade?: string;
    ano?: string;
    minFontes?: number;
    minPaginas?: number;
    tipoPesquisa?: string;
    areaConhecimento?: string;
    abordagem?: string;
    nivelAcademico?: string;
    dedicatoria?: string;
    agradecimentos?: string;
    epigrafe?: string;
    epigrafeAutor?: string;
  }
): TccConfig {
  return {
    titulo: tccSettings?.titulo || '[Título do TCC]',
    autor: tccSettings?.autor || '[Autor]',
    instituicao: tccSettings?.instituicao || '[Instituição]',
    curso: tccSettings?.curso || '[Curso]',
    orientador: tccSettings?.orientador || '[Orientador(a)]',
    cidade: tccSettings?.cidade || '[Cidade]',
    ano: tccSettings?.ano || new Date().getFullYear().toString(),
    minFontes: tccSettings?.minFontes ?? 30,
    minPaginas: tccSettings?.minPaginas ?? 50,
    tipoPesquisa: tccSettings?.tipoPesquisa || 'revisao_bibliografica',
    areaConhecimento: tccSettings?.areaConhecimento || '',
    abordagem: tccSettings?.abordagem || 'qualitativa',
    nivelAcademico: tccSettings?.nivelAcademico || 'graduacao',
    dedicatoria: tccSettings?.dedicatoria || '',
    agradecimentos: tccSettings?.agradecimentos || '',
    epigrafe: tccSettings?.epigrafe || '',
    epigrafeAutor: tccSettings?.epigrafeAutor || '',
  };
}

export function extractTccConfig(prefs: UserPreferences): TccConfig {
  return {
    titulo: prefs.tcc.titulo || '[Título do TCC]',
    autor: prefs.tcc.autor || '[Autor]',
    instituicao: prefs.tcc.instituicao || '[Instituição]',
    curso: prefs.tcc.curso || '[Curso]',
    orientador: prefs.tcc.orientador || '[Orientador(a)]',
    cidade: prefs.tcc.cidade || '[Cidade]',
    ano: prefs.tcc.ano || new Date().getFullYear().toString(),
    minFontes: prefs.tcc.minFontes ?? 30,
    minPaginas: prefs.tcc.minPaginas ?? 50,
    tipoPesquisa: prefs.tcc.tipoPesquisa || 'revisao_bibliografica',
    areaConhecimento: prefs.tcc.areaConhecimento || '',
    abordagem: prefs.tcc.abordagem || 'qualitativa',
    nivelAcademico: prefs.tcc.nivelAcademico || 'graduacao',
    dedicatoria: prefs.tcc.dedicatoria || '',
    agradecimentos: prefs.tcc.agradecimentos || '',
    epigrafe: prefs.tcc.epigrafe || '',
    epigrafeAutor: prefs.tcc.epigrafeAutor || '',
  };
}
