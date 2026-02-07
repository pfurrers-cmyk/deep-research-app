// config/defaults.ts — TODOS os valores padrão da aplicação
// Nenhum valor numérico/string deve existir hardcoded fora deste arquivo

export const APP_CONFIG = {
  // ============================================================
  // APLICAÇÃO
  // ============================================================
  app: {
    name: 'Deep Research',
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    theme: 'dark' as 'dark' | 'light' | 'system',
  },

  // ============================================================
  // PIPELINE — Valores padrão de cada etapa
  // ============================================================
  pipeline: {
    // Etapa 1: Decomposição
    decomposition: {
      minSubQueries: 2,
      maxSubQueries: 20,
      defaultSubQueries: 6,
      includeJustification: true,
      defaultLanguages: ['pt', 'en'] as string[],
    },

    // Etapa 2: Busca
    search: {
      defaultProvider: 'perplexity' as 'perplexity' | 'parallel' | 'both',
      timeoutPerQueryMs: 30_000,
      globalTimeoutMs: 120_000,
      deduplicateByUrl: true,
      retryAttempts: 2,
      retryDelayMs: 1000,
      perplexity: {
        maxResults: 10,
        maxTokensPerPage: 2048,
        maxTokens: 25000,
        country: 'BR',
        searchRecencyFilter: null as null | 'day' | 'week' | 'month' | 'year',
      },
      parallel: {
        mode: 'agentic' as 'one-shot' | 'agentic',
        maxResults: 5,
        maxCharsPerResult: 5000,
        maxAgeSeconds: null as number | null,
      },
    },

    // Etapa 3: Avaliação
    evaluation: {
      relevanceThreshold: 0.5,
      maxSourcesToKeep: 15,
      evaluationBatchSize: 15,
      weightRelevance: 0.5,
      weightRecency: 0.3,
      weightAuthority: 0.2,
      weightBias: 0.1,
    },

    // Etapa 4: Extração profunda
    extraction: {
      enabled: true,
      maxSourcesForExtraction: 10,
      maxCharsPerSource: 10000,
      generateSummary: true,
      maxSummaryTokens: 500,
    },

    // Etapa 5: Síntese
    synthesis: {
      reportSections: [
        'executive_summary',
        'context',
        'key_findings',
        'analysis',
        'conclusion',
        'sources',
      ] as string[],
      sectionLabels: {
        executive_summary: 'Resumo Executivo',
        context: 'Contexto',
        key_findings: 'Achados Principais',
        analysis: 'Análise',
        conclusion: 'Conclusão',
        sources: 'Fontes',
        counterarguments: 'Contra-argumentos e Limitações',
        deepening: 'Aprofundamento',
        timeline: 'Linha do Tempo',
        comparison_table: 'Tabela Comparativa',
      } as Record<string, string>,
      citationStyle: 'inline_numbered' as 'inline_numbered' | 'footnotes' | 'academic',
      outputLanguage: 'pt-BR',
      maxOutputTokens: 16000,
    },

    // Etapa 6: Pós-processamento
    postProcessing: {
      autoGenerateTitle: true,
      autoSaveToHistory: true,
      autoExtractMetadata: true,
    },
  },

  // ============================================================
  // PROFUNDIDADE — Presets configuráveis
  // ============================================================
  depth: {
    presets: {
      rapida: {
        label: 'Rápida',
        description: 'Pesquisa superficial para respostas rápidas',
        icon: '⚡',
        subQueries: 3,
        maxSources: 8,
        synthesisModel: 'openai/gpt-4.1-mini',
        decompositionModel: 'openai/gpt-4.1-nano',
        evaluationModel: 'openai/gpt-4.1-nano',
        extractionEnabled: false,
        researchLoopEnabled: false,
        estimatedTimeSeconds: 30,
        estimatedCostUSD: 0.05,
      },
      normal: {
        label: 'Normal',
        description: 'Pesquisa equilibrada entre custo e profundidade',
        icon: '🔍',
        subQueries: 6,
        maxSources: 15,
        synthesisModel: 'anthropic/claude-sonnet-4.5',
        decompositionModel: 'openai/gpt-4.1-mini',
        evaluationModel: 'openai/gpt-4.1-nano',
        extractionEnabled: true,
        researchLoopEnabled: false,
        estimatedTimeSeconds: 90,
        estimatedCostUSD: 0.25,
      },
      profunda: {
        label: 'Profunda',
        description: 'Pesquisa extensiva com análise detalhada',
        icon: '🔬',
        subQueries: 12,
        maxSources: 30,
        synthesisModel: 'anthropic/claude-opus-4.6',
        decompositionModel: 'openai/gpt-4.1-mini',
        evaluationModel: 'openai/gpt-4.1-mini',
        extractionEnabled: true,
        researchLoopEnabled: false,
        estimatedTimeSeconds: 240,
        estimatedCostUSD: 1.0,
      },
      exaustiva: {
        label: 'Exaustiva',
        description: 'Pesquisa completa com loops iterativos de aprofundamento',
        icon: '🏛️',
        subQueries: 15,
        maxSources: 50,
        synthesisModel: 'anthropic/claude-opus-4.6',
        decompositionModel: 'openai/gpt-4.1-mini',
        evaluationModel: 'openai/gpt-4.1-mini',
        extractionEnabled: true,
        researchLoopEnabled: true,
        estimatedTimeSeconds: 600,
        estimatedCostUSD: 3.0,
      },
    },
    allowCustomPresets: true,
  },

  // ============================================================
  // MODEL ROUTER — Preferências de modelo por etapa
  // ============================================================
  modelRouter: {
    preferences: {
      auto: {
        label: 'Automático',
        description: 'App escolhe o melhor modelo por etapa (custo/benefício)',
      },
      economy: {
        label: 'Econômico',
        description: 'Tier 3 em todas as etapas',
        decomposition: 'openai/gpt-4.1-nano',
        evaluation: 'openai/gpt-5-nano',
        extraction: 'google/gemini-2.5-flash-lite',
        synthesis: 'openai/gpt-4.1-mini',
        followup: 'openai/gpt-4.1-mini',
        devilsAdvocate: 'openai/gpt-4.1-mini',
      },
      premium: {
        label: 'Premium',
        description: 'Tier 1 em todas as etapas',
        decomposition: 'anthropic/claude-sonnet-4.5',
        evaluation: 'openai/gpt-4.1-mini',
        extraction: 'openai/gpt-4.1-mini',
        synthesis: 'anthropic/claude-opus-4.6',
        followup: 'anthropic/claude-sonnet-4.5',
        devilsAdvocate: 'anthropic/claude-sonnet-4.5',
      },
      custom: {
        label: 'Personalizado',
        description: 'Selecione o modelo para cada etapa',
      },
    },
    fallbackChains: {
      tier1: [
        'anthropic/claude-sonnet-4.5',
        'openai/gpt-5.2',
        'google/gemini-2.5-pro',
      ],
      tier2: [
        'openai/gpt-4.1-mini',
        'google/gemini-2.5-flash',
        'anthropic/claude-haiku-4.5',
      ],
      tier3: [
        'openai/gpt-4.1-nano',
        'openai/gpt-5-nano',
        'google/gemini-2.5-flash-lite',
      ],
    },
  },

  // ============================================================
  // DOMAIN PRESETS — Presets de domínio configuráveis
  // ============================================================
  domainPresets: {
    academico: {
      label: 'Acadêmico',
      icon: '🎓',
      description: 'Papers, journals e publicações científicas',
      searchDomainFilter: [
        'arxiv.org',
        'scholar.google.com',
        'nature.com',
        'science.org',
        'pubmed.ncbi.nlm.nih.gov',
        'ieee.org',
        'scielo.br',
        'periodicos.capes.gov.br',
      ],
      searchLanguageFilter: ['en', 'pt'],
      searchRecencyFilter: null as null | 'day' | 'week' | 'month' | 'year',
    },
    juridico: {
      label: 'Jurídico',
      icon: '⚖️',
      description: 'Legislação, jurisprudência e doutrina',
      searchDomainFilter: [
        'planalto.gov.br',
        'stf.jus.br',
        'stj.jus.br',
        'conjur.com.br',
        'jus.com.br',
        'migalhas.com.br',
        'jusbrasil.com.br',
        'dizerodireito.com.br',
        'senado.leg.br',
        'camara.leg.br',
      ],
      searchLanguageFilter: ['pt'],
      searchRecencyFilter: null as null | 'day' | 'week' | 'month' | 'year',
    },
    tecnologia: {
      label: 'Tecnologia',
      icon: '💻',
      description: 'Documentação técnica, blogs e repositórios',
      searchDomainFilter: [
        'github.com',
        'stackoverflow.com',
        'dev.to',
        'medium.com',
        'hackernews.com',
        'arxiv.org',
        'huggingface.co',
        'docs.google.com',
      ],
      searchLanguageFilter: ['en'],
      searchRecencyFilter: 'month' as null | 'day' | 'week' | 'month' | 'year',
    },
    noticias: {
      label: 'Notícias',
      icon: '📰',
      description: 'Agências de notícias e veículos de imprensa',
      searchDomainFilter: [
        'reuters.com',
        'bbc.com',
        'apnews.com',
        'folha.uol.com.br',
        'g1.globo.com',
        'oglobo.globo.com',
        'estadao.com.br',
        'valor.globo.com',
      ],
      searchLanguageFilter: ['pt', 'en'],
      searchRecencyFilter: 'week' as null | 'day' | 'week' | 'month' | 'year',
    },
    concursos: {
      label: 'Concursos',
      icon: '📝',
      description: 'Material para concursos públicos',
      searchDomainFilter: [
        'qconcursos.com',
        'estrategiaconcursos.com.br',
        'grancursosonline.com.br',
        'dizerodireito.com.br',
        'planalto.gov.br',
        'stf.jus.br',
      ],
      searchLanguageFilter: ['pt'],
      searchRecencyFilter: null as null | 'day' | 'week' | 'month' | 'year',
    },
    _custom: [] as Array<{
      id: string;
      label: string;
      icon: string;
      description: string;
      searchDomainFilter: string[];
      searchLanguageFilter: string[];
      searchRecencyFilter: null | 'day' | 'week' | 'month' | 'year';
    }>,
  },

  // ============================================================
  // RESEARCH LOOP — Configuração do loop iterativo
  // ============================================================
  researchLoop: {
    maxIterations: 3,
    gapDetectionPrompt: 'auto' as 'auto' | string,
    minConfidenceToStop: 0.8,
    addSectionPerIteration: true,
  },

  // ============================================================
  // DEVIL'S ADVOCATE — Modo adversarial
  // ============================================================
  devilsAdvocate: {
    enabled: false,
    model: 'anthropic/claude-sonnet-4.5',
    focusAreas: [
      'logical_fallacies',
      'missing_evidence',
      'conflicting_sources',
      'temporal_bias',
      'geographic_bias',
    ] as string[],
    maxCounterarguments: 5,
    sectionLabel: 'Contra-argumentos e Limitações',
  },

  // ============================================================
  // CONFIDENCE METER — Scores de confiança
  // ============================================================
  confidenceMeter: {
    enabled: true,
    weights: {
      sourceCount: 0.3,
      sourceAgreement: 0.35,
      sourceRecency: 0.2,
      sourceCredibility: 0.15,
    },
    thresholds: {
      high: 0.75,
      medium: 0.5,
    },
    showSuggestions: true,
  },

  // ============================================================
  // SOURCE CREDIBILITY — Score de credibilidade de fontes
  // ============================================================
  sourceCredibility: {
    enabled: true,
    domainTiers: {
      high: ['.gov', '.gov.br', '.edu', '.edu.br', '.jus.br', '.leg.br', '.mil.br'],
      medium: ['.org', '.org.br', 'nature.com', 'science.org', 'arxiv.org', 'ieee.org'],
      low: [] as string[],
    },
    bonuses: {
      hasIdentifiableAuthor: 0.1,
      publishedDatePresent: 0.05,
      recentPublication: 0.1,
      crossCitedByOtherSources: 0.15,
    },
    flagBelowThreshold: 0.3,
  },

  // ============================================================
  // SMART PROMPT REFINEMENT
  // ============================================================
  promptRefinement: {
    enabled: true,
    model: 'openai/gpt-4.1-nano',
    maxSuggestions: 3,
    showCostEstimate: true,
    showTimeEstimate: true,
    allowManualSubQueryEdit: true,
  },

  // ============================================================
  // MULTI-LANGUAGE SYNTHESIS
  // ============================================================
  multiLanguage: {
    enabled: true,
    searchLanguages: ['pt', 'en', 'es'] as string[],
    outputLanguage: 'pt-BR',
    preserveOriginalLanguageSources: true,
    translateSourceSnippets: false,
  },

  // ============================================================
  // TIME MACHINE / PESQUISA TEMPORAL
  // ============================================================
  timeMachine: {
    enabled: true,
    defaultPeriods: [
      { label: 'Última semana', filter: 'week' as const },
      { label: 'Último mês', filter: 'month' as const },
      { label: 'Último ano', filter: 'year' as const },
    ],
    allowCustomDateRange: true,
    generateTimeline: true,
    timelineGranularity: 'month' as 'day' | 'week' | 'month' | 'year',
  },

  // ============================================================
  // RESEARCH DIFF
  // ============================================================
  researchDiff: {
    enabled: true,
    highlightNewSources: true,
    highlightUpdatedInfo: true,
    showSideBySide: true,
  },

  // ============================================================
  // RESEARCH GRAPH VISUAL
  // ============================================================
  researchGraph: {
    enabled: true,
    library: 'd3' as 'd3' | 'vis',
    colorScheme: {
      highRelevance: '#22c55e',
      mediumRelevance: '#eab308',
      lowRelevance: '#ef4444',
      queryNode: '#3b82f6',
      subQueryNode: '#8b5cf6',
    },
    layout: 'force' as 'force' | 'radial' | 'tree',
    interactive: true,
    showRelevanceScore: true,
  },

  // ============================================================
  // MODO COMPARATIVO
  // ============================================================
  comparativeMode: {
    enabled: true,
    maxTopics: 3,
    parallelExecution: true,
    generateComparisonTable: true,
    generateDifferenceAnalysis: true,
  },

  // ============================================================
  // TEMPLATES DE PESQUISA
  // ============================================================
  templates: {
    builtIn: [
      {
        id: 'jurisprudence_analysis',
        label: 'Análise de Jurisprudência',
        template: 'Análise de jurisprudência sobre {tema}',
        depth: 'profunda' as const,
        domainPreset: 'juridico' as const,
        reportSections: [
          'executive_summary',
          'context',
          'key_findings',
          'analysis',
          'conclusion',
          'sources',
        ],
      },
      {
        id: 'state_of_art',
        label: 'Estado da Arte',
        template: 'Estado da arte em {tecnologia}',
        depth: 'profunda' as const,
        domainPreset: 'tecnologia' as const,
        reportSections: [
          'executive_summary',
          'context',
          'key_findings',
          'analysis',
          'conclusion',
          'sources',
        ],
      },
      {
        id: 'comparison',
        label: 'Comparação',
        template: 'Comparação entre {A} vs {B} vs {C}',
        depth: 'normal' as const,
        domainPreset: null,
        reportSections: [
          'executive_summary',
          'comparison_table',
          'analysis',
          'conclusion',
          'sources',
        ],
      },
      {
        id: 'weekly_news',
        label: 'Resumo Semanal',
        template: 'Resumo de notícias sobre {tema} na última semana',
        depth: 'rapida' as const,
        domainPreset: 'noticias' as const,
        reportSections: ['executive_summary', 'key_findings', 'timeline', 'sources'],
      },
    ],
    allowCustomTemplates: true,
  },

  // ============================================================
  // EXPORTAÇÃO
  // ============================================================
  export: {
    formats: ['markdown', 'pdf', 'docx', 'clipboard', 'notion'] as const,
    defaultFormat: 'markdown' as const,
    markdown: {
      includeMetadata: true,
      includeSources: true,
      frontmatter: true,
    },
    pdf: {
      paperSize: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      headerText: 'Deep Research Report',
      footerText: 'Gerado automaticamente',
      includeTableOfContents: true,
    },
  },

  // ============================================================
  // CUSTO TRACKER
  // ============================================================
  costTracker: {
    enabled: true,
    alertThresholdUSD: 5.0,
    showWidgetAlways: true,
    trackingGranularity: 'per_stage' as 'per_stage' | 'per_model' | 'per_request',
    historyRetentionDays: 90,
  },

  // ============================================================
  // FOLLOW-UP QUESTIONS
  // ============================================================
  followUp: {
    enabled: true,
    maxContextTokens: 32000,
    model: 'anthropic/claude-sonnet-4.5',
    includeSourcesInContext: true,
    includeReportInContext: true,
    maxConversationTurns: 20,
  },

  // ============================================================
  // PERSISTÊNCIA & HISTÓRICO
  // ============================================================
  storage: {
    indexedDB: {
      dbName: 'deep-research',
      version: 1,
      maxHistoryItems: 500,
      autoDeleteAfterDays: null as number | null,
    },
    vercelKV: {
      cacheTTLSeconds: 86400,
      cachePrefix: 'dr:',
    },
    vercelBlob: {
      maxBlobSizeMB: 10,
    },
  },

  // ============================================================
  // UX & UI
  // ============================================================
  ui: {
    defaultTheme: 'dark' as 'dark' | 'light' | 'system',
    animations: true,
    streamingTextEffect: true,
    progressIndicators: true,
    responsiveBreakpoints: {
      mobile: 640,
      tablet: 768,
      desktop: 1024,
      wide: 1280,
    },
    keyboardShortcuts: {
      newResearch: 'mod+n',
      executeResearch: 'mod+enter',
      exportMarkdown: 'mod+e',
      exportPDF: 'mod+shift+e',
      toggleTheme: 'mod+shift+t',
      focusSearch: '/',
      openHistory: 'mod+h',
      openSettings: 'mod+,',
    },
    toast: {
      durationMs: 4000,
      position: 'bottom-right' as
        | 'top-right'
        | 'top-left'
        | 'bottom-right'
        | 'bottom-left',
    },
  },

  // ============================================================
  // RESILIÊNCIA
  // ============================================================
  resilience: {
    maxRetries: 3,
    retryBaseDelayMs: 1000,
    retryMaxDelayMs: 10000,
    timeoutPerStageMs: {
      decomposition: 15000,
      search: 60000,
      evaluation: 30000,
      extraction: 45000,
      synthesis: 120000,
      postProcessing: 10000,
    },
    fallbackEnabled: true,
    gatewayProviderOptions: {
      order: ['anthropic', 'openai', 'google'] as string[],
    },
  },

  // ============================================================
  // PERFORMANCE TARGETS
  // ============================================================
  performance: {
    ttfbMaxMs: 2000,
    rapidMaxSeconds: 45,
    normalMaxSeconds: 120,
    fluidComputeMaxDuration: 300,
  },

  // ============================================================
  // STRINGS / I18N (todas as strings exibidas ao usuário)
  // ============================================================
  strings: {
    stages: {
      'query-planning': 'Planejando pesquisa...',
      decomposing: 'Decompondo query em sub-perguntas...',
      searching: 'Buscando fontes na web...',
      evaluating: 'Avaliando relevância das fontes...',
      extracting: 'Extraindo conteúdo das fontes...',
      synthesizing: 'Sintetizando relatório...',
      'post-processing': 'Finalizando...',
      'research-loop': 'Aprofundando pesquisa (iteração {n}/{max})...',
      'devils-advocate': 'Analisando contra-argumentos...',
      complete: 'Pesquisa concluída!',
      error: 'Erro durante a pesquisa',
    } as Record<string, string>,
    buttons: {
      startResearch: 'Pesquisar',
      cancel: 'Cancelar',
      export: 'Exportar',
      copy: 'Copiar',
      favorite: 'Favoritar',
      rerun: 'Re-executar',
      settings: 'Configurações',
      newResearch: 'Nova Pesquisa',
    },
    placeholders: {
      queryInput: 'O que você quer pesquisar?',
      followUpInput: 'Faça uma pergunta sobre este relatório...',
    },
    labels: {
      depth: 'Profundidade',
      model: 'Modelo',
      domain: 'Domínio',
      sources: 'fontes',
      estimatedTime: 'Tempo estimado',
      estimatedCost: 'Custo estimado',
      actualCost: 'Custo real',
      confidence: 'Confiança',
    },
    errors: {
      networkError: 'Erro de conexão. Verifique sua internet.',
      rateLimitError: 'Limite de requisições atingido. Aguarde um momento.',
      modelUnavailable:
        'Modelo {model} indisponível. Usando fallback: {fallback}.',
      searchFailed:
        'Busca falhou para {n} sub-queries. Resultados parciais disponíveis.',
      timeoutError: 'A pesquisa excedeu o tempo limite de {seconds}s.',
      generic: 'Ocorreu um erro inesperado. Tente novamente.',
    },
  },
};

// Tipo derivado para type-safety total
export type AppConfig = typeof APP_CONFIG;
export type DepthPreset = keyof typeof APP_CONFIG.depth.presets;
export type DomainPreset = keyof Omit<typeof APP_CONFIG.domainPresets, '_custom'>;
export type ExportFormat = (typeof APP_CONFIG.export.formats)[number];
export type PipelineStage = keyof typeof APP_CONFIG.strings.stages;
export type ModelPreference = keyof typeof APP_CONFIG.modelRouter.preferences;
export type DepthPresetConfig = (typeof APP_CONFIG.depth.presets)[DepthPreset];
