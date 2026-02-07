// tests/unit/lib/utils.test.ts — Testes para utilitários base
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (className merger)', () => {
  it('combina classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolve conflitos Tailwind', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('ignora valores falsy', () => {
    expect(cn('base', false && 'hidden', null, undefined, 'extra')).toBe('base extra')
  })

  it('aceita array de classes', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('aceita objetos condicionais', () => {
    expect(cn({ active: true, hidden: false })).toBe('active')
  })

  it('retorna string vazia sem argumentos', () => {
    expect(cn()).toBe('')
  })
})
