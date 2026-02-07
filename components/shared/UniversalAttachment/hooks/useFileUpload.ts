// hooks/useFileUpload.ts — Manage attachment state: add, remove, process files

import { useState, useCallback, useRef } from 'react';
import type { AttachmentFile, AttachmentConfig, AttachmentPurpose } from '../types';
import { DEFAULT_ATTACHMENT_CONFIG } from '../types';
import { createAttachmentFile, processFile } from '../utils/fileProcessors';
import { useFileValidation } from './useFileValidation';
import { toast } from 'sonner';

export function useFileUpload(configOverrides?: Partial<AttachmentConfig>) {
  const config: AttachmentConfig = { ...DEFAULT_ATTACHMENT_CONFIG, ...configOverrides };
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateFiles } = useFileValidation(config);

  const addFiles = useCallback(
    async (files: File[], purpose?: AttachmentPurpose) => {
      const { valid, rejected } = validateFiles(files, attachments);

      // Show errors for rejected files
      for (const r of rejected) {
        toast.error(`${r.file.name}: ${r.errors[0]}`);
      }

      if (valid.length === 0) return;

      // Create attachment objects
      const newAtts = valid.map((f) => createAttachmentFile(f, purpose));
      setAttachments((prev) => [...prev, ...newAtts]);
      setIsProcessing(true);

      // Process each file
      for (const att of newAtts) {
        try {
          const processed = await processFile(att, {
            maxDim: config.imageMaxDimension,
            quality: config.imageQuality,
          });
          setAttachments((prev) =>
            prev.map((a) => (a.id === processed.id ? { ...processed } : a))
          );
        } catch {
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === att.id ? { ...a, status: 'error', error: 'Falha no processamento' } : a
            )
          );
        }
      }

      setIsProcessing(false);
    },
    [attachments, config, validateFiles]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.thumbnailUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(att.thumbnailUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    attachments.forEach((att) => {
      if (att.thumbnailUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(att.thumbnailUrl);
      }
    });
    setAttachments([]);
  }, [attachments]);

  const updatePurpose = useCallback((id: string, purpose: AttachmentPurpose) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, purpose } : a))
    );
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) addFiles(files);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addFiles]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent | React.ClipboardEvent) => {
      if (!config.enablePaste) return;
      const items = Array.from(e.clipboardData?.items ?? []);
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        toast.info(`${files.length} arquivo${files.length > 1 ? 's' : ''} colado${files.length > 1 ? 's' : ''}`);
        addFiles(files);
      }
    },
    [addFiles, config.enablePaste]
  );

  // Build accept string for file input
  const acceptString = config.acceptedTypes.join(',');

  return {
    attachments,
    setAttachments,
    isProcessing,
    addFiles,
    removeAttachment,
    clearAttachments,
    updatePurpose,
    openFilePicker,
    handleFileInputChange,
    handlePaste,
    fileInputRef,
    acceptString,
    config,
  };
}
