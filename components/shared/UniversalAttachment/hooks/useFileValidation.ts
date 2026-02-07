// hooks/useFileValidation.ts — Validate files before processing

import { useCallback } from 'react';
import type { AttachmentConfig, AttachmentFile } from '../types';
import { isAllowedMimeType, formatFileSize } from '../utils/mimeTypes';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function useFileValidation(config: AttachmentConfig) {
  const validateFile = useCallback(
    (file: File, existingAttachments: AttachmentFile[]): ValidationResult => {
      const errors: string[] = [];

      // 1. Check MIME type
      if (!isAllowedMimeType(file.type, config.acceptedTypes)) {
        errors.push(`Tipo não suportado: ${file.type || 'desconhecido'}`);
      }

      // 2. Check file size
      if (file.size > config.maxFileSize) {
        errors.push(`Arquivo muito grande: ${formatFileSize(file.size)}. Máx: ${formatFileSize(config.maxFileSize)}`);
      }

      // 3. Check max files
      if (existingAttachments.length >= config.maxFiles) {
        errors.push(`Máximo de ${config.maxFiles} arquivos atingido`);
      }

      // 4. Check total size
      const totalSize = existingAttachments.reduce((sum, a) => sum + a.size, 0) + file.size;
      if (totalSize > config.maxTotalSize) {
        errors.push(`Tamanho total excede ${formatFileSize(config.maxTotalSize)}`);
      }

      // 5. Check for duplicates
      if (existingAttachments.some((a) => a.name === file.name && a.size === file.size)) {
        errors.push('Arquivo já anexado');
      }

      return { valid: errors.length === 0, errors };
    },
    [config]
  );

  const validateFiles = useCallback(
    (files: File[], existingAttachments: AttachmentFile[]): { valid: File[]; rejected: Array<{ file: File; errors: string[] }> } => {
      const valid: File[] = [];
      const rejected: Array<{ file: File; errors: string[] }> = [];

      for (const file of files) {
        const result = validateFile(file, [...existingAttachments, ...valid.map((f) => ({ size: f.size, name: f.name } as AttachmentFile))]);
        if (result.valid) {
          valid.push(file);
        } else {
          rejected.push({ file, errors: result.errors });
        }
      }

      return { valid, rejected };
    },
    [validateFile]
  );

  return { validateFile, validateFiles };
}
