// tests/unit/lib/attachment-system.test.ts — Tests for the universal attachment system
import { describe, it, expect } from 'vitest'
import {
  detectCategory,
  isAllowedMimeType,
  formatFileSize,
  sanitizeFilename,
} from '@/components/shared/UniversalAttachment/utils/mimeTypes'
import {
  createAttachmentFile,
} from '@/components/shared/UniversalAttachment/utils/fileProcessors'
import {
  buildAttachmentContext,
  getImageAttachmentsForMultimodal,
} from '@/components/shared/UniversalAttachment/utils/contextBuilder'
import {
  DEFAULT_ATTACHMENT_CONFIG,
  ATTACHMENT_CONFIGS,
  PURPOSE_LABELS,
} from '@/components/shared/UniversalAttachment/types'
import type { AttachmentFile } from '@/components/shared/UniversalAttachment/types'

// ============================================================
// MIME TYPES
// ============================================================

describe('mimeTypes', () => {
  describe('detectCategory', () => {
    it('detecta imagens', () => {
      expect(detectCategory('image/jpeg')).toBe('image')
      expect(detectCategory('image/png')).toBe('image')
      expect(detectCategory('image/webp')).toBe('image')
    })

    it('detecta documentos', () => {
      expect(detectCategory('application/pdf')).toBe('document')
      expect(detectCategory('text/plain')).toBe('document')
      expect(detectCategory('text/markdown')).toBe('document')
    })

    it('detecta dados', () => {
      expect(detectCategory('text/csv')).toBe('data')
      expect(detectCategory('application/json')).toBe('data')
    })

    it('detecta vídeo e áudio', () => {
      expect(detectCategory('video/mp4')).toBe('video')
      expect(detectCategory('audio/mpeg')).toBe('audio')
    })

    it('fallback para document em tipo desconhecido', () => {
      expect(detectCategory('application/octet-stream')).toBe('document')
    })
  })

  describe('isAllowedMimeType', () => {
    it('aceita tipos exatos', () => {
      expect(isAllowedMimeType('image/png', ['image/png'])).toBe(true)
    })

    it('aceita wildcards', () => {
      expect(isAllowedMimeType('image/jpeg', ['image/*'])).toBe(true)
      expect(isAllowedMimeType('image/webp', ['image/*'])).toBe(true)
      expect(isAllowedMimeType('video/mp4', ['image/*'])).toBe(false)
    })

    it('aceita extensões', () => {
      expect(isAllowedMimeType('application/pdf', ['.pdf'])).toBe(true)
      expect(isAllowedMimeType('text/csv', ['.csv'])).toBe(true)
    })

    it('rejeita tipos não listados', () => {
      expect(isAllowedMimeType('application/zip', ['image/*', '.pdf'])).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('formata bytes', () => {
      expect(formatFileSize(512)).toBe('512 B')
    })
    it('formata KB', () => {
      expect(formatFileSize(5 * 1024)).toBe('5.0 KB')
    })
    it('formata MB', () => {
      expect(formatFileSize(3.5 * 1024 * 1024)).toBe('3.5 MB')
    })
  })

  describe('sanitizeFilename', () => {
    it('remove caracteres especiais', () => {
      const result = sanitizeFilename('relat<ório>.pdf')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result.endsWith('.pdf')).toBe(true)
    })
    it('preserva caracteres válidos', () => {
      expect(sanitizeFilename('report-2024_final (v2).pdf')).toBe('report-2024_final (v2).pdf')
    })
    it('trunca nomes longos', () => {
      const long = 'a'.repeat(300) + '.pdf'
      expect(sanitizeFilename(long).length).toBeLessThanOrEqual(255)
    })
  })
})

// ============================================================
// FILE PROCESSORS
// ============================================================

describe('fileProcessors', () => {
  describe('createAttachmentFile', () => {
    it('cria attachment com categoria correta para imagem', () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' })
      const att = createAttachmentFile(file)
      expect(att.id).toMatch(/^att_/)
      expect(att.category).toBe('image')
      expect(att.name).toBe('photo.png')
      expect(att.mimeType).toBe('image/png')
      expect(att.status).toBe('pending')
      expect(att.progress).toBe(0)
    })

    it('cria attachment com categoria correta para PDF', () => {
      const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' })
      const att = createAttachmentFile(file)
      expect(att.category).toBe('document')
      expect(att.purpose).toBe('analyze')
    })

    it('cria attachment com categoria correta para CSV', () => {
      const file = new File(['a,b,c'], 'data.csv', { type: 'text/csv' })
      const att = createAttachmentFile(file)
      expect(att.category).toBe('data')
      expect(att.purpose).toBe('data-source')
    })

    it('aceita purpose customizado', () => {
      const file = new File(['test'], 'ref.png', { type: 'image/png' })
      const att = createAttachmentFile(file, 'reference')
      expect(att.purpose).toBe('reference')
    })
  })
})

// ============================================================
// CONTEXT BUILDER
// ============================================================

describe('contextBuilder', () => {
  const mockAttachments: AttachmentFile[] = [
    {
      id: 'att_1',
      file: new File([''], 'report.pdf'),
      name: 'report.pdf',
      size: 50000,
      mimeType: 'application/pdf',
      category: 'document',
      purpose: 'analyze',
      status: 'ready',
      progress: 100,
      extractedText: 'Relatório sobre inteligência artificial com dados de 2024. Crescimento de 45% no setor.',
      metadata: { pages: 5, wordCount: 1200 },
    },
    {
      id: 'att_2',
      file: new File([''], 'data.csv'),
      name: 'dados.csv',
      size: 2000,
      mimeType: 'text/csv',
      category: 'data',
      purpose: 'data-source',
      status: 'ready',
      progress: 100,
      extractedData: {
        columns: ['ano', 'valor', 'crescimento'],
        preview: [{ ano: '2023', valor: '100', crescimento: '10%' }],
        totalRows: 50,
      },
    },
  ]

  describe('buildAttachmentContext', () => {
    it('retorna string vazia sem attachments', () => {
      expect(buildAttachmentContext([], 'research')).toBe('')
    })

    it('gera contexto com texto extraído de documento', () => {
      const ctx = buildAttachmentContext(mockAttachments, 'research')
      expect(ctx).toContain('report.pdf')
      expect(ctx).toContain('Relatório sobre inteligência artificial')
      expect(ctx).toContain('ARQUIVOS ANEXADOS')
    })

    it('gera contexto com dados estruturados de CSV', () => {
      const ctx = buildAttachmentContext(mockAttachments, 'research')
      expect(ctx).toContain('dados.csv')
      expect(ctx).toContain('ano')
      expect(ctx).toContain('valor')
      expect(ctx).toContain('Total de registros: 50')
    })

    it('inclui instruções específicas por feature', () => {
      const resCtx = buildAttachmentContext(mockAttachments, 'research')
      expect(resCtx).toContain('Contextualizar a pesquisa')

      const imgCtx = buildAttachmentContext(mockAttachments, 'imageGen')
      expect(imgCtx).toContain('referência')
    })

    it('ignora attachments não-ready', () => {
      const pending: AttachmentFile[] = [{
        id: 'att_x',
        file: new File([''], 'loading.pdf'),
        name: 'loading.pdf',
        size: 1000,
        mimeType: 'application/pdf',
        category: 'document',
        purpose: 'analyze',
        status: 'processing',
        progress: 50,
      }]
      expect(buildAttachmentContext(pending, 'research')).toBe('')
    })
  })

  describe('getImageAttachmentsForMultimodal', () => {
    it('filtra apenas imagens ready com base64', () => {
      const atts: AttachmentFile[] = [
        {
          id: 'img1', file: new File([''], 'a.png'), name: 'a.png', size: 100,
          mimeType: 'image/png', category: 'image', purpose: 'context',
          status: 'ready', progress: 100, base64: 'data:image/png;base64,abc123',
        },
        {
          id: 'doc1', file: new File([''], 'b.pdf'), name: 'b.pdf', size: 100,
          mimeType: 'application/pdf', category: 'document', purpose: 'analyze',
          status: 'ready', progress: 100,
        },
      ]
      const result = getImageAttachmentsForMultimodal(atts)
      expect(result).toHaveLength(1)
      expect(result[0].base64).toBe('abc123')
      expect(result[0].mimeType).toBe('image/png')
    })

    it('retorna array vazio sem imagens', () => {
      expect(getImageAttachmentsForMultimodal([])).toEqual([])
    })
  })
})

// ============================================================
// CONFIG
// ============================================================

describe('AttachmentConfig', () => {
  it('DEFAULT_ATTACHMENT_CONFIG tem valores razoáveis', () => {
    expect(DEFAULT_ATTACHMENT_CONFIG.maxFiles).toBeGreaterThan(0)
    expect(DEFAULT_ATTACHMENT_CONFIG.maxFileSize).toBeGreaterThan(0)
    expect(DEFAULT_ATTACHMENT_CONFIG.acceptedTypes.length).toBeGreaterThan(0)
    expect(DEFAULT_ATTACHMENT_CONFIG.enablePaste).toBe(true)
    expect(DEFAULT_ATTACHMENT_CONFIG.enableDragDrop).toBe(true)
  })

  it('ATTACHMENT_CONFIGS tem configs para todos os features', () => {
    expect(ATTACHMENT_CONFIGS.research).toBeDefined()
    expect(ATTACHMENT_CONFIGS.imageGeneration).toBeDefined()
    expect(ATTACHMENT_CONFIGS.videoGeneration).toBeDefined()
    expect(ATTACHMENT_CONFIGS.textGeneration).toBeDefined()
  })

  it('research config aceita PDF e imagens', () => {
    const types = ATTACHMENT_CONFIGS.research.acceptedTypes!
    expect(types).toContain('image/*')
    expect(types).toContain('application/pdf')
  })

  it('imageGeneration config aceita apenas imagens', () => {
    const types = ATTACHMENT_CONFIGS.imageGeneration.acceptedTypes!
    expect(types).toContain('image/*')
    expect(types).not.toContain('application/pdf')
  })

  it('PURPOSE_LABELS tem todos os propósitos', () => {
    expect(PURPOSE_LABELS.context).toBeTruthy()
    expect(PURPOSE_LABELS.analyze).toBeTruthy()
    expect(PURPOSE_LABELS.transform).toBeTruthy()
    expect(PURPOSE_LABELS.reference).toBeTruthy()
    expect(PURPOSE_LABELS['data-source']).toBeTruthy()
    expect(PURPOSE_LABELS.ocr).toBeTruthy()
  })
})
