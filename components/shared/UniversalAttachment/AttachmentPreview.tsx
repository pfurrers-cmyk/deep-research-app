// AttachmentPreview.tsx — Preview bar showing all attached files as chips
'use client';

import type { AttachmentFile } from './types';
import { AttachmentThumbnail } from './AttachmentThumbnail';

interface AttachmentPreviewProps {
  attachments: AttachmentFile[];
  onRemove: (id: string) => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
  compact?: boolean;
}

export function AttachmentPreview({
  attachments,
  onRemove,
  layout = 'horizontal',
  compact = false,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  const layoutClass = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-1.5',
    grid: 'grid grid-cols-2 gap-2 sm:grid-cols-3',
  }[layout];

  return (
    <div className={layoutClass} role="list" aria-label={`${attachments.length} arquivo(s) anexado(s)`}>
      {attachments.map((att) => (
        <AttachmentThumbnail
          key={att.id}
          attachment={att}
          onRemove={onRemove}
          compact={compact}
        />
      ))}
    </div>
  );
}
