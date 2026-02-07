// tests/helpers/msw-handlers.ts — MSW request handlers for API route mocking
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock research API — returns SSE stream
  http.post('/api/research', async ({ request }) => {
    const body = await request.json() as { query: string }
    const encoder = new TextEncoder()

    const events = [
      { type: 'stage', stage: 'decomposing', status: 'running', progress: 0.05, message: 'Decompondo query...' },
      { type: 'queries', data: [{ id: 'sq_0', text: body.query, status: 'pending' }] },
      { type: 'stage', stage: 'decomposing', status: 'completed', progress: 0.15, message: 'Decomposição completa' },
      { type: 'stage', stage: 'searching', status: 'running', progress: 0.2, message: 'Buscando...' },
      { type: 'source', data: { url: 'https://example.com', title: 'Test', relevance: 0.8, credibility: 0.7, subQueryId: 'sq_0' } },
      { type: 'stage', stage: 'searching', status: 'completed', progress: 0.4, message: 'Busca completa' },
      { type: 'text-delta', text: '## Relatório\n\n' },
      { type: 'text-delta', text: 'Conteúdo do relatório de teste.\n' },
      { type: 'stage', stage: 'complete', status: 'completed', progress: 1.0, message: 'Concluído' },
    ]

    const stream = new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new HttpResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })
  }),

  // Mock generate API
  http.post('/api/generate', async () => {
    return HttpResponse.json({
      type: 'image',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      model: 'bfl/flux-pro-1.1',
    })
  }),

  // Mock logs API
  http.get('/api/logs', () => {
    return HttpResponse.json({ logs: [], count: 0 })
  }),

  // Mock models API
  http.get('/api/models', () => {
    return HttpResponse.json({
      models: [
        { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai' },
        { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
      ],
    })
  }),
]
