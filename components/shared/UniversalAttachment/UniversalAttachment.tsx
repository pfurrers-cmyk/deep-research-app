// UniversalAttachment.tsx — Universal file attachment component with multiple variants
'use client';

import { useCallback } from 'react';
import { Paperclip, Upload, Plus, Camera } from 'lucide-react';
import type { AttachmentFile, AttachmentConfig, AttachmentPurpose } from './types';
import { DEFAULT_ATTACHMENT_CONFIG, PURPOSE_LABELS, PURPOSE_ICONS } from './types';
import { AttachmentPreview } from './AttachmentPreview';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { cn } from '@/lib/utils';

export type AttachmentVariant = 'inline' | 'dropzone' | 'button-only' | 'floating';

interface UniversalAttachmentProps {
  attachments: AttachmentFile[];
  onAddFiles: (files: File[], purpose?: AttachmentPurpose) => void;
  onRemove: (id: string) => void;
  onUpdatePurpose?: (id: string, purpose: AttachmentPurpose) => void;
  config?: Partial<AttachmentConfig>;
  variant?: AttachmentVariant;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  acceptString: string;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openFilePicker: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  showPurposeSelector?: boolean;
}

export function UniversalAttachment({
  attachments,
  onAddFiles,
  onRemove,
  onUpdatePurpose,
  config: configOverrides,
  variant = 'inline',
  fileInputRef,
  acceptString,
  onFileInputChange,
  openFilePicker,
  placeholder,
  className,
  disabled = false,
  showPreview = true,
  showPurposeSelector = false,
}: UniversalAttachmentProps) {
  const config = { ...DEFAULT_ATTACHMENT_CONFIG, ...configOverrides };

  const { isDragging, dropZoneProps } = useDragAndDrop({
    onDrop: (files) => onAddFiles(files),
    disabled: disabled || !config.enableDragDrop,
  });

  const handlePurposeChange = useCallback(
    (id: string, purpose: AttachmentPurpose) => {
      onUpdatePurpose?.(id, purpose);
    },
    [onUpdatePurpose]
  );

  // Hidden file input (shared across all variants)
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept={acceptString}
      onChange={onFileInputChange}
      className="hidden"
      aria-hidden="true"
    />
  );

  // ============================================================
  // VARIANT: INLINE — Clip icon inside existing input
  // ============================================================
  if (variant === 'inline') {
    return (
      <div className={cn('relative', className)}>
        {fileInput}
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled || attachments.length >= config.maxFiles}
          className={cn(
            'relative rounded-lg p-2 transition-colors',
            attachments.length > 0
              ? 'text-primary hover:bg-primary/10'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            disabled && 'cursor-not-allowed opacity-40'
          )}
          aria-label="Anexar arquivo (Ctrl+V para colar)"
          title="Anexar arquivo (Ctrl+V para colar)"
        >
          <Paperclip className="h-4 w-4" />
          {attachments.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {attachments.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  // ============================================================
  // VARIANT: DROPZONE — Full drag-and-drop area
  // ============================================================
  if (variant === 'dropzone') {
    return (
      <div className={cn('space-y-3', className)}>
        {fileInput}
        <div
          {...dropZoneProps}
          onClick={disabled ? undefined : openFilePicker}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/40 hover:bg-muted/20',
            disabled && 'cursor-not-allowed opacity-40'
          )}
          role="region"
          aria-label="Área de upload de arquivos"
        >
          {placeholder?.includes('imagem') || placeholder?.includes('vídeo') ? (
            <Camera className={cn('h-10 w-10', isDragging ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
          ) : (
            <Upload className={cn('h-10 w-10', isDragging ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? 'Solte os arquivos aqui' : placeholder ?? 'Arraste arquivos aqui ou clique para enviar'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Máx {config.maxFiles} arquivos · {Math.round(config.maxFileSize / (1024 * 1024))}MB por arquivo
            </p>
          </div>
        </div>

        {showPreview && attachments.length > 0 && (
          <div className="space-y-2">
            <AttachmentPreview attachments={attachments} onRemove={onRemove} layout="vertical" />
            {showPurposeSelector && (
              <PurposeSelectorList
                attachments={attachments}
                onPurposeChange={handlePurposeChange}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // VARIANT: BUTTON-ONLY — Compact button
  // ============================================================
  if (variant === 'button-only') {
    return (
      <div className={cn('space-y-2', className)}>
        {fileInput}
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled || attachments.length >= config.maxFiles}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
            attachments.length > 0
              ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            disabled && 'cursor-not-allowed opacity-40'
          )}
          aria-label="Anexar arquivo"
        >
          <Plus className="h-3.5 w-3.5" />
          Anexar {attachments.length > 0 ? `(${attachments.length})` : 'arquivo'}
        </button>

        {showPreview && attachments.length > 0 && (
          <AttachmentPreview attachments={attachments} onRemove={onRemove} compact />
        )}
      </div>
    );
  }

  // ============================================================
  // VARIANT: FLOATING — Global dropzone overlay
  // ============================================================
  return (
    <>
      {fileInput}
      {isDragging && (
        <div
          {...dropZoneProps}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-primary bg-primary/5 p-12">
            <Upload className="h-16 w-16 animate-pulse text-primary" />
            <p className="text-lg font-semibold text-primary">Solte os arquivos aqui</p>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// PURPOSE SELECTOR (for image/video generation)
// ============================================================

function PurposeSelectorList({
  attachments,
  onPurposeChange,
}: {
  attachments: AttachmentFile[];
  onPurposeChange: (id: string, purpose: AttachmentPurpose) => void;
}) {
  const purposes: AttachmentPurpose[] = ['reference', 'transform', 'analyze', 'context'];

  return (
    <div className="space-y-1.5">
      {attachments
        .filter((a) => a.category === 'image')
        .map((att) => (
          <div key={att.id} className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2">
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{att.name}</span>
            <span className="text-muted-foreground/30">→</span>
            <div className="flex flex-wrap gap-1">
              {purposes.map((p) => (
                <button
                  key={p}
                  onClick={() => onPurposeChange(att.id, p)}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] transition-all',
                    att.purpose === p
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {PURPOSE_ICONS[p]} {PURPOSE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

export { AttachmentPreview } from './AttachmentPreview';
export { AttachmentThumbnail } from './AttachmentThumbnail';
export { FileTypeIcon } from './FileTypeIcon';
export { useFileUpload } from './hooks/useFileUpload';
export { useDragAndDrop } from './hooks/useDragAndDrop';
export type { AttachmentFile, AttachmentConfig, AttachmentPurpose } from './types';
export { ATTACHMENT_CONFIGS, PURPOSE_LABELS } from './types';
