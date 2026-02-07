// FileTypeIcon.tsx — Icon component for different file types
'use client';

import { FileText, Image as ImageIcon, FileSpreadsheet, Film, Music, File, FileJson } from 'lucide-react';
import type { FileCategory } from './types';
import { cn } from '@/lib/utils';

interface FileTypeIconProps {
  category: FileCategory;
  mimeType?: string;
  className?: string;
}

const ICON_COLORS: Record<string, string> = {
  'application/pdf': 'text-red-500',
  'text/csv': 'text-green-500',
  'application/json': 'text-yellow-500',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'text-green-600',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text-blue-500',
  'application/msword': 'text-blue-500',
};

export function FileTypeIcon({ category, mimeType, className }: FileTypeIconProps) {
  const color = mimeType ? ICON_COLORS[mimeType] ?? '' : '';

  switch (category) {
    case 'image':
      return <ImageIcon className={cn('h-4 w-4 text-purple-400', className)} />;
    case 'video':
      return <Film className={cn('h-4 w-4 text-pink-400', className)} />;
    case 'audio':
      return <Music className={cn('h-4 w-4 text-orange-400', className)} />;
    case 'data':
      if (mimeType === 'application/json') return <FileJson className={cn('h-4 w-4', color, className)} />;
      return <FileSpreadsheet className={cn('h-4 w-4', color || 'text-green-500', className)} />;
    case 'document':
      return <FileText className={cn('h-4 w-4', color || 'text-blue-400', className)} />;
    default:
      return <File className={cn('h-4 w-4 text-muted-foreground', className)} />;
  }
}
