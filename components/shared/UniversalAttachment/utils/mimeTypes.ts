// utils/mimeTypes.ts — MIME type detection and validation

import type { FileCategory } from '../types';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain', 'text/markdown', 'text/html',
  'application/json',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav',
] as const;

const CATEGORY_MAP: Record<string, FileCategory> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/gif': 'image',
  'image/webp': 'image', 'image/svg+xml': 'image', 'image/bmp': 'image',
  'application/pdf': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/msword': 'document',
  'text/plain': 'document', 'text/markdown': 'document', 'text/html': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'data',
  'text/csv': 'data',
  'application/json': 'data',
  'video/mp4': 'video', 'video/webm': 'video',
  'audio/mpeg': 'audio', 'audio/wav': 'audio',
};

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv', txt: 'text/plain', md: 'text/markdown', html: 'text/html',
  json: 'application/json',
  mp4: 'video/mp4', webm: 'video/webm',
  mp3: 'audio/mpeg', wav: 'audio/wav',
};

export function detectCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return CATEGORY_MAP[mimeType] ?? 'document';
}

export function isAllowedMimeType(mimeType: string, acceptedTypes: string[]): boolean {
  for (const accepted of acceptedTypes) {
    if (accepted === mimeType) return true;
    if (accepted.endsWith('/*') && mimeType.startsWith(accepted.replace('/*', '/'))) return true;
    if (accepted.startsWith('.')) {
      const ext = accepted.slice(1).toLowerCase();
      const mapped = EXTENSION_TO_MIME[ext];
      if (mapped === mimeType) return true;
    }
  }
  return false;
}

export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

export function getMimeFromExtension(ext: string): string | undefined {
  return EXTENSION_TO_MIME[ext.toLowerCase()];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]/g, '_').slice(0, 255);
}
