// tests/unit/lib/streaming.test.ts — Testes para SSE streaming helpers
import { describe, it, expect } from 'vitest'
import { encodeSSE, encodeSSEDone, createSSEStream, createGenericSSEStream, createSSEResponse } from '@/lib/utils/streaming'

describe('encodeSSE', () => {
  it('codifica evento como SSE data line', () => {
    const event = { type: 'stage', stage: 'test', status: 'running', progress: 0.5, message: 'Testing' } as const
    const encoded = encodeSSE(event)
    const text = new TextDecoder().decode(encoded)

    expect(text).toContain('data: ')
    expect(text).toContain('"type":"stage"')
    expect(text.endsWith('\n\n')).toBe(true)
  })

  it('codifica eventos genéricos', () => {
    const event = { foo: 'bar', count: 42 }
    const text = new TextDecoder().decode(encodeSSE(event))
    expect(text).toContain('"foo":"bar"')
    expect(text).toContain('"count":42')
  })
})

describe('encodeSSEDone', () => {
  it('codifica marcador [DONE]', () => {
    const text = new TextDecoder().decode(encodeSSEDone())
    expect(text).toBe('data: [DONE]\n\n')
  })
})

describe('createSSEStream', () => {
  it('cria stream e writer funcionais', async () => {
    const { stream, writer } = createSSEStream()

    writer.writeEvent({ type: 'stage', stage: 'test', status: 'running', progress: 0.5, message: 'Testing' })
    writer.close()

    const reader = stream.getReader()
    const chunks: string[] = []
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(decoder.decode(value))
    }

    const full = chunks.join('')
    expect(full).toContain('"type":"stage"')
    expect(full).toContain('[DONE]')
  })

  it('close após close não lança erro', () => {
    const { writer } = createSSEStream()
    writer.close()
    expect(() => writer.close()).not.toThrow()
  })

  it('writeEvent após close não lança erro', () => {
    const { writer } = createSSEStream()
    writer.close()
    expect(() => writer.writeEvent({ type: 'stage', stage: 'test', status: 'running', progress: 0, message: '' })).not.toThrow()
  })
})

describe('createGenericSSEStream', () => {
  it('aceita objetos genéricos', async () => {
    const { stream, writer } = createGenericSSEStream()

    writer.writeEvent({ custom: 'data', value: 123 })
    writer.close()

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const { value } = await reader.read()
    const text = decoder.decode(value)

    expect(text).toContain('"custom":"data"')
  })
})

describe('createSSEResponse', () => {
  it('retorna Response com headers SSE corretos', () => {
    const { stream } = createSSEStream()
    const response = createSSEResponse(stream)

    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toContain('no-cache')
    expect(response.body).toBeTruthy()
  })
})
