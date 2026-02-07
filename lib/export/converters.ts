// lib/export/converters.ts — Export converters for multiple output formats
import { debug } from '@/lib/utils/debug-logger';

export interface ExportInput {
  reportText: string;
  query: string;
  citations?: Array<{ index: number; title: string; url: string; domain: string }>;
  metadata?: { generatedAt?: string; model?: string; depth?: string; costUSD?: number };
}

export interface ExportResult {
  content: string;
  mimeType: string;
  filename: string;
  blob?: Blob;
}

// ============================================================
// MARKDOWN
// ============================================================
export function exportToMarkdown(input: ExportInput): ExportResult {
  const { reportText, query, metadata } = input;
  const frontmatter = `---
title: "${query}"
date: "${metadata?.generatedAt ?? new Date().toISOString()}"
model: "${metadata?.model ?? 'N/A'}"
depth: "${metadata?.depth ?? 'N/A'}"
cost: "${metadata?.costUSD?.toFixed(4) ?? 'N/A'}"
generator: "Deep Research App"
---

`;
  const content = frontmatter + reportText;
  return {
    content,
    mimeType: 'text/markdown',
    filename: `research-${slugify(query)}.md`,
  };
}

// ============================================================
// PDF (HTML-based, rendered client-side)
// ============================================================
export function exportToPDFHtml(input: ExportInput): ExportResult {
  const { reportText, query, metadata } = input;
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(query)}</title>
<style>
  body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.8; }
  h1 { font-size: 1.8em; border-bottom: 2px solid #333; padding-bottom: 8px; }
  h2 { font-size: 1.4em; color: #2c3e50; margin-top: 2em; }
  h3 { font-size: 1.1em; color: #34495e; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; font-weight: bold; }
  blockquote { border-left: 3px solid #3498db; margin: 1em 0; padding: 0.5em 1em; background: #f8f9fa; }
  code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
  .meta { color: #666; font-size: 0.85em; margin-bottom: 2em; }
  .footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid #ddd; font-size: 0.8em; color: #999; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style>
</head>
<body>
<h1>${escapeHtml(query)}</h1>
<div class="meta">
  Gerado em: ${metadata?.generatedAt ?? new Date().toLocaleString('pt-BR')} | Modelo: ${metadata?.model ?? 'N/A'} | Deep Research App
</div>
${markdownToHtml(reportText)}
<div class="footer">Relatório gerado automaticamente pelo Deep Research App</div>
</body>
</html>`;

  return {
    content: htmlContent,
    mimeType: 'text/html',
    filename: `research-${slugify(query)}.html`,
    blob: new Blob([htmlContent], { type: 'text/html' }),
  };
}

// ============================================================
// SLIDES (HTML presentation)
// ============================================================
export function exportToSlides(input: ExportInput): ExportResult {
  const { reportText, query } = input;
  const sections = reportText.split(/^## /m).filter(Boolean);

  const slides = sections.map((section, i) => {
    const lines = section.trim().split('\n');
    const title = lines[0]?.replace(/^#+\s*/, '').trim() || `Slide ${i + 1}`;
    const body = lines.slice(1).join('\n').trim();
    const bullets = extractBulletPoints(body, 5);
    return { title, bullets };
  });

  // Add title slide
  slides.unshift({ title: query, bullets: ['Deep Research App', `${slides.length} seções`, new Date().toLocaleDateString('pt-BR')] });

  const slidesHtml = slides.map((s, i) => `
    <div class="slide" id="slide-${i}">
      <h2>${escapeHtml(s.title)}</h2>
      <ul>${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      <div class="slide-num">${i + 1} / ${slides.length}</div>
    </div>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><title>${escapeHtml(query)} - Slides</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #eee; }
  .slide { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 60px 80px; page-break-after: always; }
  h2 { font-size: 2.5em; margin-bottom: 1em; color: #e94560; }
  ul { list-style: none; font-size: 1.4em; line-height: 2; }
  li::before { content: "▸ "; color: #e94560; }
  .slide-num { position: absolute; bottom: 20px; right: 40px; font-size: 0.8em; color: #666; }
  .slide { position: relative; }
  @media print { .slide { page-break-after: always; } }
</style>
</head>
<body>${slidesHtml}</body>
</html>`;

  return {
    content: html,
    mimeType: 'text/html',
    filename: `slides-${slugify(query)}.html`,
    blob: new Blob([html], { type: 'text/html' }),
  };
}

// ============================================================
// PODCAST SCRIPT
// ============================================================
export function exportToPodcastScript(input: ExportInput): ExportResult {
  const { reportText, query, citations } = input;
  const sections = reportText.split(/^## /m).filter(Boolean);

  let script = `# 🎙️ SCRIPT DE PODCAST\n# Tema: ${query}\n# Duração estimada: ${Math.ceil(reportText.length / 1500)} minutos\n\n`;
  script += `---\n\n## ABERTURA\n\n`;
  script += `**HOST:** Olá, bem-vindos a mais um episódio! Hoje vamos explorar um tema fascinante: "${query}". `;
  script += `Fizemos uma pesquisa profunda com ${citations?.length ?? 'várias'} fontes e temos muitas descobertas interessantes para compartilhar.\n\n`;

  sections.forEach((section) => {
    const lines = section.trim().split('\n');
    const title = lines[0]?.replace(/^#+\s*/, '').trim() || '';
    const body = lines.slice(1).join('\n').trim();

    if (title.toLowerCase().includes('fonte') || title.toLowerCase().includes('referência')) return;

    script += `---\n\n## ${title.toUpperCase()}\n\n`;
    script += `**HOST:** Vamos falar sobre ${title.toLowerCase()}.\n\n`;

    const keyPoints = extractBulletPoints(body, 4);
    keyPoints.forEach((point) => {
      script += `**HOST:** ${point}\n\n`;
    });
  });

  script += `---\n\n## ENCERRAMENTO\n\n`;
  script += `**HOST:** E é isso por hoje! Esperamos que tenham gostado dessa análise sobre "${query}". `;
  script += `As fontes completas estão na descrição do episódio. Até a próxima!\n`;

  return {
    content: script,
    mimeType: 'text/markdown',
    filename: `podcast-${slugify(query)}.md`,
  };
}

// ============================================================
// SOCIAL THREAD
// ============================================================
export function exportToSocialThread(input: ExportInput): ExportResult {
  const { reportText, query } = input;
  const sections = reportText.split(/^## /m).filter(Boolean);
  const maxCharsPerPost = 280;

  const posts: string[] = [];

  // Thread opener
  posts.push(`🧵 THREAD: ${query}\n\nUma análise profunda com base em múltiplas fontes. Vamos lá! 👇`);

  sections.forEach((section) => {
    const lines = section.trim().split('\n');
    const title = lines[0]?.replace(/^#+\s*/, '').trim() || '';
    const body = lines.slice(1).join('\n').trim();

    if (title.toLowerCase().includes('fonte') || title.toLowerCase().includes('referência')) return;

    const points = extractBulletPoints(body, 3);
    if (points.length > 0) {
      let post = `📌 ${title}\n\n`;
      points.forEach((p) => {
        const line = `• ${p}\n`;
        if (post.length + line.length <= maxCharsPerPost) {
          post += line;
        } else {
          posts.push(post.trim());
          post = `• ${p}\n`;
        }
      });
      if (post.trim()) posts.push(post.trim());
    }
  });

  // Thread closer
  posts.push(`Gostou? ♻️ Compartilhe!\n\nPesquisa gerada automaticamente pelo Deep Research App 🔬`);

  const content = posts.map((p, i) => `--- Post ${i + 1}/${posts.length} ---\n${p}`).join('\n\n');

  return {
    content,
    mimeType: 'text/plain',
    filename: `thread-${slugify(query)}.txt`,
  };
}

// ============================================================
// JSON / CSV
// ============================================================
export function exportToJSON(input: ExportInput): ExportResult {
  const { reportText, query, citations, metadata } = input;
  const data = {
    query,
    metadata: {
      ...metadata,
      exportedAt: new Date().toISOString(),
      generator: 'Deep Research App',
    },
    report: reportText,
    citations: citations ?? [],
    sections: reportText.split(/^## /m).filter(Boolean).map((s) => {
      const lines = s.trim().split('\n');
      return { title: lines[0]?.replace(/^#+\s*/, '').trim(), content: lines.slice(1).join('\n').trim() };
    }),
  };

  return {
    content: JSON.stringify(data, null, 2),
    mimeType: 'application/json',
    filename: `research-${slugify(query)}.json`,
  };
}

// ============================================================
// MASTER EXPORT FUNCTION
// ============================================================
export function exportReport(format: string, input: ExportInput): ExportResult {
  debug.info('Export', `Exportando relatório como ${format}`, { query: input.query.slice(0, 50) });

  switch (format) {
    case 'markdown': return exportToMarkdown(input);
    case 'pdf': return exportToPDFHtml(input);
    case 'slides': return exportToSlides(input);
    case 'podcast': return exportToPodcastScript(input);
    case 'social': return exportToSocialThread(input);
    case 'json': return exportToJSON(input);
    default: return exportToMarkdown(input);
  }
}

// ============================================================
// HELPERS
// ============================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[hulo])/gm, '<p>')
    .replace(/(?<![>])$/gm, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[hulo])/g, '$1')
    .replace(/(<\/[hulo][^>]*>)<\/p>/g, '$1');
}

function extractBulletPoints(text: string, max: number): string[] {
  const sentences = text
    .replace(/\[[\d,\s]+\]/g, '')
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 200);
  return sentences.slice(0, max);
}
