// utils/fileProcessors.ts — Process files by type: thumbnail, text extraction, metadata

import type { AttachmentFile, FileCategory, AttachmentPurpose } from '../types';
import { detectCategory } from './mimeTypes';

function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createAttachmentFile(file: File, purpose?: AttachmentPurpose): AttachmentFile {
  const category = detectCategory(file.type);
  return {
    id: generateId(),
    file,
    name: file.name,
    size: file.size,
    mimeType: file.type,
    category,
    purpose: purpose ?? detectPurpose(category),
    status: 'pending',
    progress: 0,
  };
}

function detectPurpose(category: FileCategory): AttachmentPurpose {
  switch (category) {
    case 'image': return 'context';
    case 'document': return 'analyze';
    case 'data': return 'data-source';
    case 'video': return 'reference';
    case 'audio': return 'context';
    default: return 'context';
  }
}

// ============================================================
// IMAGE PROCESSING
// ============================================================

export async function processImage(att: AttachmentFile, maxDim = 2048, quality = 0.85): Promise<AttachmentFile> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Metadata
        att.metadata = { width: img.naturalWidth, height: img.naturalHeight };

        // Resize if needed
        const canvas = document.createElement('canvas');
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);

        // Thumbnail (200x200 max)
        const thumbCanvas = document.createElement('canvas');
        const thumbSize = 200;
        const thumbRatio = Math.min(thumbSize / img.naturalWidth, thumbSize / img.naturalHeight);
        thumbCanvas.width = Math.round(img.naturalWidth * thumbRatio);
        thumbCanvas.height = Math.round(img.naturalHeight * thumbRatio);
        const thumbCtx = thumbCanvas.getContext('2d')!;
        thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        att.thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

        // Base64 for multimodal API
        att.base64 = canvas.toDataURL('image/jpeg', quality);

        att.status = 'ready';
        att.progress = 100;
        resolve(att);
      };
      img.onerror = () => {
        att.status = 'error';
        att.error = 'Falha ao carregar imagem';
        resolve(att);
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      att.status = 'error';
      att.error = 'Falha ao ler arquivo';
      resolve(att);
    };
    reader.readAsDataURL(att.file);
  });
}

// ============================================================
// TEXT FILE PROCESSING
// ============================================================

export async function processTextFile(att: AttachmentFile): Promise<AttachmentFile> {
  try {
    att.status = 'processing';
    att.progress = 50;
    const text = await att.file.text();
    att.extractedText = text;
    att.metadata = { wordCount: text.split(/\s+/).filter(Boolean).length };
    att.status = 'ready';
    att.progress = 100;
  } catch {
    att.status = 'error';
    att.error = 'Falha ao ler texto do arquivo';
  }
  return att;
}

// ============================================================
// CSV PROCESSING
// ============================================================

export async function processCSV(att: AttachmentFile): Promise<AttachmentFile> {
  try {
    att.status = 'processing';
    att.progress = 30;
    const text = await att.file.text();
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      att.status = 'error';
      att.error = 'CSV vazio';
      return att;
    }

    const separator = detectCSVSeparator(lines[0]);
    const headers = parseCSVLine(lines[0], separator);
    const rows = lines.slice(1, 11).map((line) => {
      const vals = parseCSVLine(line, separator);
      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
      return row;
    });

    att.extractedData = {
      columns: headers,
      preview: rows,
      totalRows: lines.length - 1,
    };
    att.extractedText = `CSV com ${lines.length - 1} linhas e ${headers.length} colunas: ${headers.join(', ')}`;
    att.metadata = { wordCount: lines.length };
    att.status = 'ready';
    att.progress = 100;
  } catch {
    att.status = 'error';
    att.error = 'Falha ao processar CSV';
  }
  return att;
}

function detectCSVSeparator(line: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  for (const ch of line) {
    if (ch in counts) counts[ch]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === sep && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

// ============================================================
// JSON PROCESSING
// ============================================================

export async function processJSON(att: AttachmentFile): Promise<AttachmentFile> {
  try {
    att.status = 'processing';
    att.progress = 50;
    const text = await att.file.text();
    const data = JSON.parse(text);

    if (Array.isArray(data)) {
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      att.extractedData = {
        columns,
        preview: data.slice(0, 10) as Record<string, unknown>[],
        totalRows: data.length,
      };
      att.extractedText = `JSON array com ${data.length} items. Campos: ${columns.join(', ')}`;
    } else {
      att.extractedText = JSON.stringify(data, null, 2).slice(0, 5000);
      att.extractedData = { preview: [data as Record<string, unknown>], totalRows: 1 };
    }
    att.metadata = { wordCount: text.split(/\s+/).length };
    att.status = 'ready';
    att.progress = 100;
  } catch {
    att.status = 'error';
    att.error = 'JSON inválido';
  }
  return att;
}

// ============================================================
// PDF PROCESSING (basic text extraction via browser)
// ============================================================

export async function processPDF(att: AttachmentFile): Promise<AttachmentFile> {
  try {
    att.status = 'processing';
    att.progress = 30;

    // Use pdf.js-like approach: read as array buffer, attempt basic text extraction
    // For a lightweight approach without heavy dependencies, we extract what we can
    const buffer = await att.file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const text = extractTextFromPDFBytes(bytes);

    if (text.length > 10) {
      att.extractedText = text.slice(0, 10000);
      att.metadata = {
        wordCount: text.split(/\s+/).filter(Boolean).length,
        pages: estimatePDFPages(bytes),
      };
    } else {
      att.extractedText = `[PDF: ${att.name} — texto não extraível sem OCR. ${att.size} bytes]`;
      att.metadata = { pages: estimatePDFPages(bytes) };
    }

    // Generate thumbnail from first bytes hint
    att.thumbnailUrl = undefined; // PDF thumbnails need canvas rendering

    att.status = 'ready';
    att.progress = 100;
  } catch {
    att.status = 'error';
    att.error = 'Falha ao processar PDF';
  }
  return att;
}

function extractTextFromPDFBytes(bytes: Uint8Array): string {
  // Lightweight PDF text extraction: scan for text between BT/ET operators
  // This is a heuristic approach — for full fidelity, a library like pdf.js would be needed
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);
  const textChunks: string[] = [];

  // Extract text from stream objects (between parentheses after Tj/TJ operators)
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(raw)) !== null) {
    const cleaned = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
    if (cleaned.length > 1) textChunks.push(cleaned);
  }

  return textChunks.join(' ').replace(/\s+/g, ' ').trim();
}

function estimatePDFPages(bytes: Uint8Array): number {
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);
  const pageMatches = raw.match(/\/Type\s*\/Page[^s]/g);
  return pageMatches?.length ?? 1;
}

// ============================================================
// MASTER PROCESSOR
// ============================================================

export async function processFile(
  att: AttachmentFile,
  config?: { maxDim?: number; quality?: number }
): Promise<AttachmentFile> {
  att.status = 'processing';
  att.progress = 10;

  switch (att.category) {
    case 'image':
      return processImage(att, config?.maxDim ?? 2048, config?.quality ?? 0.85);

    case 'document': {
      const ext = att.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return processPDF(att);
      // txt, md, html, doc, docx — read as text
      return processTextFile(att);
    }

    case 'data': {
      const ext2 = att.name.split('.').pop()?.toLowerCase();
      if (ext2 === 'csv') return processCSV(att);
      if (ext2 === 'json') return processJSON(att);
      // xlsx — read as text fallback
      return processTextFile(att);
    }

    case 'video': {
      // Extract first frame as thumbnail
      att.status = 'ready';
      att.progress = 100;
      att.extractedText = `[Vídeo: ${att.name}, ${(att.size / (1024 * 1024)).toFixed(1)} MB]`;
      return att;
    }

    case 'audio': {
      att.status = 'ready';
      att.progress = 100;
      att.extractedText = `[Áudio: ${att.name}, ${(att.size / (1024 * 1024)).toFixed(1)} MB]`;
      return att;
    }

    default:
      att.status = 'ready';
      att.progress = 100;
      return att;
  }
}
