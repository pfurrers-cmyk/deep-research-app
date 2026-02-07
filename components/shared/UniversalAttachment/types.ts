// components/shared/UniversalAttachment/types.ts — Types for the universal attachment system

export type AttachmentPurpose =
  | 'context'
  | 'analyze'
  | 'transform'
  | 'reference'
  | 'data-source'
  | 'ocr';

export type AttachmentStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'error';

export type FileCategory = 'image' | 'document' | 'data' | 'video' | 'audio';

export interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  purpose: AttachmentPurpose;
  status: AttachmentStatus;
  progress: number;
  thumbnailUrl?: string;
  extractedText?: string;
  extractedData?: {
    preview?: Record<string, unknown>[];
    columns?: string[];
    totalRows?: number;
  };
  metadata?: {
    width?: number;
    height?: number;
    pages?: number;
    duration?: number;
    wordCount?: number;
  };
  base64?: string;
  error?: string;
}

export interface AttachmentConfig {
  maxFiles: number;
  maxFileSize: number;
  maxTotalSize: number;
  acceptedTypes: string[];
  enableDragDrop: boolean;
  enablePaste: boolean;
  enableCamera: boolean;
  autoExtractText: boolean;
  autoDetectPurpose: boolean;
  showPurposeSelector: boolean;
  imageMaxDimension: number;
  imageQuality: number;
}

export const DEFAULT_ATTACHMENT_CONFIG: AttachmentConfig = {
  maxFiles: 10,
  maxFileSize: 25 * 1024 * 1024,
  maxTotalSize: 100 * 1024 * 1024,
  acceptedTypes: ['image/*', 'application/pdf', '.docx', '.csv', '.xlsx', '.json', '.txt', '.md'],
  enableDragDrop: true,
  enablePaste: true,
  enableCamera: false,
  autoExtractText: true,
  autoDetectPurpose: true,
  showPurposeSelector: false,
  imageMaxDimension: 2048,
  imageQuality: 0.85,
};

export const ATTACHMENT_CONFIGS: Record<string, Partial<AttachmentConfig>> = {
  research: {
    maxFiles: 10,
    maxFileSize: 25 * 1024 * 1024,
    acceptedTypes: ['image/*', 'application/pdf', '.docx', '.doc', '.csv', '.xlsx', '.json', '.txt', '.md'],
    enablePaste: true,
    autoExtractText: true,
    autoDetectPurpose: true,
    showPurposeSelector: false,
  },
  imageGeneration: {
    maxFiles: 5,
    maxFileSize: 10 * 1024 * 1024,
    acceptedTypes: ['image/*'],
    enablePaste: true,
    enableCamera: true,
    autoDetectPurpose: false,
    showPurposeSelector: true,
    imageMaxDimension: 2048,
  },
  videoGeneration: {
    maxFiles: 5,
    maxFileSize: 50 * 1024 * 1024,
    acceptedTypes: ['image/*', 'video/*'],
    enableCamera: true,
    showPurposeSelector: true,
  },
  textGeneration: {
    maxFiles: 10,
    maxFileSize: 25 * 1024 * 1024,
    acceptedTypes: ['image/*', 'application/pdf', '.docx', '.doc', '.csv', '.xlsx', '.json', '.txt', '.md', '.html'],
    enablePaste: true,
    autoExtractText: true,
  },
};

export const PURPOSE_LABELS: Record<AttachmentPurpose, string> = {
  context: 'Contexto adicional',
  analyze: 'Analisar / Extrair dados',
  transform: 'Modificar / Editar',
  reference: 'Referência visual / estilística',
  'data-source': 'Fonte de dados',
  ocr: 'Extrair texto (OCR)',
};

export const PURPOSE_ICONS: Record<AttachmentPurpose, string> = {
  context: '📋',
  analyze: '🔍',
  transform: '✏️',
  reference: '🖼️',
  'data-source': '📊',
  ocr: '📝',
};
