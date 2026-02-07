# Deep Research App — Ações Proibidas

## NUNCA fazer

### 1. Importação direta de providers
```typescript
// ❌ PROIBIDO
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// ✅ SEMPRE via Gateway
import { gateway } from '@ai-sdk/gateway';
const model = gateway('openai/gpt-4.1-mini');
// ou string direta (Gateway automático desde AI SDK 5.0.36+)
const result = await streamText({ model: 'anthropic/claude-sonnet-4.5', ... });
```

### 2. Magic numbers / strings hardcoded
```typescript
// ❌ PROIBIDO
if (score < 0.5) { ... }
const maxRetries = 3;
const message = 'Pesquisando...';

// ✅ SEMPRE via config
if (score < config.pipeline.evaluation.relevanceThreshold) { ... }
const maxRetries = config.resilience.maxRetries;
const message = config.strings.stages.searching;
```

### 3. generateText onde streamText é possível
```typescript
// ❌ PROIBIDO para output visível ao usuário
const { text } = await generateText({ model: '...', prompt: '...' });

// ✅ streamText para todo texto visível ao usuário
const result = streamText({ model: '...', prompt: '...' });
```

### 4. Ignorar fallback chains
```typescript
// ❌ PROIBIDO — chamada sem tratamento de falha
const result = await streamText({ model: 'anthropic/claude-opus-4.6', ... });

// ✅ SEMPRE com fallback
try {
  const result = await streamText({ model: primaryModel, ... });
} catch (error) {
  // Tentar próximo modelo na fallback chain
  const result = await streamText({ model: fallbackChain[0], ... });
}
```

### 5. Instalar providers como dependência
```bash
# ❌ PROIBIDO
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

# ✅ APENAS o gateway
npm install @ai-sdk/gateway
```

### 6. Versões antigas de dependências
- Não usar Next.js < 16.1
- Não usar React < 19.2
- Não usar AI SDK < 6.0
- Não usar Tailwind < 4.1
- Não usar Node.js < 22

### 7. Criar arquivos de config paralelos
Toda configuração centralizada em `config/defaults.ts`. Não criar arquivos de constantes, env-based config, ou hardcoded defaults em outros locais.

### 8. Usar `Promise.all` para buscas paralelas
```typescript
// ❌ Falha de uma query aborta todas
await Promise.all(queries.map(q => search(q)));

// ✅ Resiliência — resultados parciais
await Promise.allSettled(queries.map(q => search(q)));
```
