// AttachmentThumbnail.tsx — Individual attachment chip with thumbnail, name, size, remove
'use client';

import { X, Loader2, AlertCircle } from 'lucide-react';
import type { AttachmentFile } from './types';
import { FileTypeIcon } from './FileTypeIcon';
import { formatFileSize } from './utils/mimeTypes';
import { cn } from '@/lib/utils';

interface AttachmentThumbnailProps {
  attachment: AttachmentFile;
  onRemove: (id: string) => void;
  compact?: boolean;
}

export function AttachmentThumbnail({ attachment: att, onRemove, compact = false }: AttachmentThumbnailProps) {
  const isError = att.status === 'error';
  const isProcessing = att.status === 'processing' || att.status === 'uploading';
  const truncatedName = att.name.length > 20 ? att.name.slice(0, 17) + '...' : att.name;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all',
        isError
          ? 'border-red-500/50 bg-red-500/5'
          : isProcessing
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-card hover:border-primary/30',
        compact ? 'text-xs' : 'text-sm'
      )}
      role="listitem"
      aria-label={`Anexo: ${att.name}, ${formatFileSize(att.size)}`}
    >
      {/* Thumbnail or icon */}
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
        {att.thumbnailUrl ? (
          <img
            src={att.thumbnailUrl}
            alt={att.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            <FileTypeIcon category={att.category} mimeType={att.mimeType} />
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight" title={att.name}>
          {truncatedName}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {isProcessing
            ? `Processando... ${att.progress}%`
            : isError
              ? att.error ?? 'Erro'
              : formatFileSize(att.size)}
        </p>
      </div>

      {/* Error icon */}
      {isError && (
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" aria-label="Erro no arquivo" />
      )}

      {/* Remove button */}
      <button
        onClick={() => onRemove(att.id)}
        className="shrink-0 rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        aria-label={`Remover arquivo ${att.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
