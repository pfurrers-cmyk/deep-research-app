// components/export/ExportModal.tsx — Modal de exportação com múltiplos formatos
'use client';

import { useState, useCallback } from 'react';
import { X, Download, Loader2, Check, FileText, Presentation, Mic, MessageCircle, Database, FileDown } from 'lucide-react';
import { exportReport, type ExportInput } from '@/lib/export/converters';
import { APP_CONFIG } from '@/config/defaults';
import { loadPreferences } from '@/lib/config/settings-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  reportText: string;
  query: string;
  citations?: Array<{ index: number; title: string; url: string; domain: string }>;
  metadata?: { generatedAt?: string; model?: string; depth?: string; costUSD?: number };
}

const FORMAT_ICONS: Record<string, typeof FileText> = {
  markdown: FileText,
  pdf: FileDown,
  slides: Presentation,
  podcast: Mic,
  social: MessageCircle,
  json: Database,
};

export function ExportModal({ open, onClose, reportText, query, citations, metadata }: ExportModalProps) {
  const prefs = loadPreferences();
  const [selectedFormat, setSelectedFormat] = useState(prefs.pro.exportFormat || 'markdown');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const formats = APP_CONFIG.pro.exportFormats.options;

  const handleExport = useCallback(async () => {
    setExporting(true);
    setDone(null);

    try {
      const input: ExportInput = { reportText, query, citations, metadata };
      const result = exportReport(selectedFormat, input);

      // Download file
      const blob = result.blob ?? new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(selectedFormat);
      toast.success(`Exportado como ${formats[selectedFormat]?.label ?? selectedFormat}`);

      setTimeout(() => {
        setDone(null);
        onClose();
      }, 1500);
    } catch (err) {
      toast.error(`Erro ao exportar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setExporting(false);
    }
  }, [selectedFormat, reportText, query, citations, metadata, formats, onClose]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const input: ExportInput = { reportText, query, citations, metadata };
      const result = exportReport(selectedFormat, input);
      await navigator.clipboard.writeText(result.content);
      toast.success('Copiado para a área de transferência');
    } catch {
      toast.error('Erro ao copiar');
    }
  }, [selectedFormat, reportText, query, citations, metadata]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Exportar relatório"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Exportar Relatório</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format grid */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(formats).map(([key, fmt]) => {
            const Icon = FORMAT_ICONS[key] ?? FileText;
            const isSelected = selectedFormat === key;
            const isDone = done === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedFormat(key)}
                disabled={exporting}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : 'border-border hover:border-primary/40 hover:bg-muted/20',
                  isDone && 'border-green-500 bg-green-500/10'
                )}
                aria-pressed={isSelected}
              >
                {isDone ? (
                  <Check className="h-6 w-6 text-green-500" />
                ) : (
                  <Icon className={cn('h-6 w-6', fmt.color)} />
                )}
                <span className="text-sm font-semibold">{fmt.label}</span>
                <span className="text-center text-[10px] text-muted-foreground leading-tight">{fmt.description}</span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || !reportText}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Baixar {formats[selectedFormat]?.label}
              </>
            )}
          </button>
          <button
            onClick={handleCopyToClipboard}
            disabled={exporting || !reportText}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Copiar
          </button>
        </div>

        {/* Hint */}
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Formato padrão configurável em Prompt Reverso PRO → Formato de Saída
        </p>
      </div>
    </div>
  );
}
