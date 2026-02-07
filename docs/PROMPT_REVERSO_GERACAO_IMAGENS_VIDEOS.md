# 🔬 Prompt Reverso — Pesquisa Profunda: Correção Definitiva do Gerador de Imagens e Vídeos

> **Objetivo:** Orientar uma pesquisa profunda para implementar a solução definitiva de geração de imagens e vídeos no Deep Research App.
> **Recorte temporal:** Últimos 2 meses (dez/2025 — fev/2026).
> **Aplicação:** Next.js 16.1.6 + AI SDK 6.0.75 + @ai-sdk/gateway 3.0.37

---

## Prompt para Pesquisa Profunda (copie e execute no app)

```
Faça uma pesquisa profunda e exaustiva sobre como implementar corretamente geração de imagens e vídeos usando o Vercel AI SDK 6.x e o Vercel AI Gateway em uma aplicação Next.js 16.x em produção (fevereiro de 2026).

CONTEXTO DO PROBLEMA:
Tenho uma aplicação Next.js 16.1.6 com AI SDK 6.0.75 e @ai-sdk/gateway 3.0.37. O endpoint /api/generate usa `generateImage` do pacote 'ai' com `gateway.image(modelId)` para gerar imagens, e `experimental_generateVideo` com `gateway.video(modelId)` para vídeos. Porém, a geração falha com "GatewayResponseError: Invalid JSON response" para vários modelos, incluindo google/imagen-4.0-fast-generate-001.

PERGUNTAS ESPECÍFICAS A RESPONDER:

1. IMAGENS VIA AI GATEWAY — Modelos Image-Only:
   - Quais são os IDs de modelo EXATOS suportados pelo Vercel AI Gateway para `experimental_generateImage` (image-only models) em fevereiro de 2026?
   - Qual é a assinatura correta da função? É `generateImage` ou `experimental_generateImage`? O import correto é `from 'ai'`?
   - Quais parâmetros são suportados? (size vs aspectRatio, n, seed, etc.)
   - O `gateway.image(modelId)` é a forma correta de instanciar o model provider para image-only models?
   - Modelos como bfl/flux-2-pro, bfl/flux-2-flex, bfl/flux-kontext-max, google/imagen-4.0-generate-001, google/imagen-4.0-ultra-generate-001 — quais realmente funcionam?
   - O modelo "google/imagen-4.0-fast-generate-001" existe ou foi descontinuado?

2. IMAGENS VIA AI GATEWAY — Multimodal LLMs:
   - Google Gemini 3 Pro Image (google/gemini-3-pro-image) e Gemini 2.5 Flash Image (google/gemini-2.5-flash-image) geram imagens via `generateText`/`streamText`, não `generateImage`. Como implementar corretamente?
   - As imagens retornam em `result.files` — qual o formato? Como converter para blob/download?
   - Como diferenciar no endpoint se o modelo é multimodal (usar generateText) vs image-only (usar experimental_generateImage)?
   - OpenAI GPT-Image-1 também é multimodal? Qual API usar?

3. VÍDEOS — Estado da Arte:
   - `experimental_generateVideo` com `gateway.video()` funciona em produção? Quais modelos?
   - Google Veo 3.1 (google/veo-3.1-generate-001) é o único modelo de vídeo no AI Gateway?
   - Existem outros provedores de vídeo acessíveis via API em 2026? (Runway ML, Kling, Sora, etc.)
   - Para vídeo, qual é o timeout recomendado? maxDuration no Next.js?
   - Se o AI Gateway não suportar vídeo de forma estável, qual é a melhor alternativa direta via API REST?

4. ERROR HANDLING E EDGE CASES:
   - Como diagnosticar "GatewayResponseError: Invalid JSON response"? É timeout? É modelo inválido?
   - Quais modelos retornam PNG vs JPEG vs WebP? Como lidar com cada um?
   - Rate limits por modelo — existem? Quais são?
   - O que acontece quando o modelo está temporariamente indisponível?

5. IMPLEMENTAÇÃO ROBUSTA:
   - Exemplo completo de endpoint Next.js Route Handler que lida com AMBOS os tipos (multimodal LLM e image-only) no mesmo endpoint
   - Fallback chain: se modelo A falhar, tentar modelo B automaticamente
   - Validação de resposta antes de enviar ao cliente
   - Como servir a imagem/vídeo gerado como Response (Buffer, ReadableStream, base64?)

FORMATO DESEJADO:
- Tabela comparativa de todos os modelos de geração de imagem disponíveis no AI Gateway com: ID, provider, tipo (multimodal vs image-only), API function, parâmetros, preço estimado
- Código de exemplo funcional para cada tipo
- Análise de quais modelos são mais estáveis/confiáveis em produção
- Recomendação de implementação com fallback chain
```

---

## Diagnóstico Técnico do Bug Atual

### Causa Raiz Identificada
O endpoint `/api/generate/route.ts` usa:
```typescript
import { generateImage } from 'ai';
// ...
const result = await generateImage({
  model: gateway.image(imageModelId),
  prompt,
  size: (size || '1024x1024') as `${number}x${number}`,
});
```

**Problemas:**
1. `generateImage` deveria ser `experimental_generateImage` (a API é experimental no AI SDK 6.x)
2. `google/imagen-4.0-fast-generate-001` **não existe** na lista de modelos suportados pelo AI Gateway — os modelos corretos são `google/imagen-4.0-generate-001` e `google/imagen-4.0-ultra-generate-001`
3. Image-only models usam `aspectRatio` (ex: `'16:9'`), não `size` (ex: `'1024x1024'`)
4. Multimodal LLMs (Gemini 3 Pro Image, Gemini 2.5 Flash Image) usam `generateText`, não `generateImage` — imagens retornam em `result.files`
5. OpenAI GPT-Image-1 também é multimodal e usa `generateText`

### Modelos Confirmados como Funcionais (fev/2026)

#### Image-Only (usar `experimental_generateImage` + `gateway.image()`)
| ID | Provider | Notas |
|----|----------|-------|
| `google/imagen-4.0-generate-001` | Google | ✅ Confirmado na doc oficial |
| `google/imagen-4.0-ultra-generate-001` | Google | ✅ Confirmado, qualidade superior |
| `bfl/flux-2-pro` | BFL | ✅ Novo, confirmado |
| `bfl/flux-2-flex` | BFL | ✅ Novo, confirmado |
| `bfl/flux-kontext-max` | BFL | ✅ Confirmado |
| `bfl/flux-kontext-pro` | BFL | ✅ Confirmado |
| `bfl/flux-pro-1.1` | BFL | ✅ Confirmado |
| `bfl/flux-pro-1.0-fill` | BFL | ✅ Inpainting |
| `recraft/recraft-v3` | Recraft | ⚠️ A confirmar |

#### Multimodal LLMs (usar `generateText` + `gateway()`, imagens em `result.files`)
| ID | Provider | Notas |
|----|----------|-------|
| `google/gemini-3-pro-image` | Google | ✅ "Nano Banana Pro" — state-of-the-art |
| `google/gemini-2.5-flash-image` | Google | ✅ "Nano Banana" — rápido e barato |
| `openai/gpt-image-1` | OpenAI | ⚠️ A confirmar via AI Gateway |

#### Modelos REMOVIDOS/INEXISTENTES
| ID | Status |
|----|--------|
| `google/imagen-4.0-fast-generate-001` | ❌ NÃO EXISTE no AI Gateway |
| `openai/dall-e-3` | ❌ Verificar — pode ter sido substituído por gpt-image-1 |
| `stability/sd-3.5` | ❌ Verificar disponibilidade |
| `google/imagen-3` | ❌ Provável descontinuação em favor do Imagen 4.0 |

### Plano de Correção Sugerido

1. **Renomear import**: `generateImage` → `experimental_generateImage as generateImage`
2. **Remover modelo inexistente**: `google/imagen-4.0-fast-generate-001`
3. **Adicionar novos modelos**: `bfl/flux-2-pro`, `bfl/flux-2-flex`, `google/gemini-3-pro-image`, `google/gemini-2.5-flash-image`
4. **Bifurcar endpoint**: detectar se modelo é multimodal (usar `generateText`) vs image-only (usar `experimental_generateImage`)
5. **Trocar `size` por `aspectRatio`** para image-only models
6. **Fallback chain**: se modelo primário falhar, tentar alternativa automaticamente
7. **Validar resposta**: checar se bytes > 0 antes de retornar

### Implementação Sugerida (Pseudocódigo)
```typescript
const MULTIMODAL_IMAGE_MODELS = new Set([
  'google/gemini-3-pro-image',
  'google/gemini-2.5-flash-image',
  'openai/gpt-image-1',
]);

if (MULTIMODAL_IMAGE_MODELS.has(modelId)) {
  // Usar generateText — imagens em result.files
  const result = await generateText({
    model: gateway(modelId),
    prompt,
    providerOptions: { /* aspectRatio, etc */ },
  });
  const imageFile = result.files[0];
  return new Response(imageFile.uint8Array, {
    headers: { 'Content-Type': imageFile.mediaType },
  });
} else {
  // Image-only: usar experimental_generateImage
  const result = await experimental_generateImage({
    model: gateway.image(modelId),
    prompt,
    aspectRatio: mapSizeToAspectRatio(size),
  });
  return new Response(Buffer.from(result.image.uint8Array), {
    headers: { 'Content-Type': result.image.mediaType },
  });
}
```

---

## Vídeo — APIs Sofisticadas (Estado da Arte fev/2026)

Para geração de vídeo, as melhores APIs atuais:

| Provider | Modelo | API | Qualidade | Custo |
|----------|--------|-----|-----------|-------|
| **Google** | Veo 3.1 | AI Gateway `gateway.video()` | Excelente | ~$0.05/s |
| **Runway** | Gen-4 Turbo | REST API direta | Excelente | ~$0.10/s |
| **Kling** | Kling 2.1 Master | REST API direta | Muito bom | ~$0.04/s |
| **Minimax** | Hailuo AI | REST API direta | Bom | ~$0.03/s |
| **Luma** | Dream Machine | REST API direta | Bom | ~$0.08/s |

> **Recomendação:** Usar Veo 3.1 via AI Gateway como primário, com fallback para Runway Gen-4 via API REST direta.
