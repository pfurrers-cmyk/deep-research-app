// lib/export/docx-abnt.ts — DOCX exporter with full ABNT formatting
// Generates a .docx file with correct margins, typography, pagination,
// section headings per NBR 6024, and citation formatting per NBR 10520.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageNumber,
  Header,
} from 'docx';
import type { UserPreferences } from '@/lib/config/settings-store';

// ============================================================
// CONSTANTS — ABNT NBR 14724
// ============================================================

// Margins in twips (1 cm = 567 twips)
const MARGIN_TOP = 3 * 567;     // 3 cm
const MARGIN_BOTTOM = 2 * 567;  // 2 cm
const MARGIN_LEFT = 3 * 567;    // 3 cm
const MARGIN_RIGHT = 2 * 567;   // 2 cm

// Font
const FONT_NAME = 'Times New Roman';
const FONT_SIZE_BODY = 24;       // 12pt (half-points)
const FONT_SIZE_SMALL = 20;      // 10pt (half-points)
const LINE_SPACING = 360;        // 1.5 line spacing (240 * 1.5)
const LINE_SPACING_SINGLE = 240; // Simple spacing
const PARAGRAPH_INDENT = 709;    // 1.25 cm first line indent (twips)

// ============================================================
// TYPES
// ============================================================

interface AbntExportInput {
  reportText: string;
  query: string;
  tccConfig: UserPreferences['tcc'];
}

// ============================================================
// MARKDOWN PARSER → DOCX PARAGRAPHS
// ============================================================

function parseInlineFormatting(text: string, fontSize: number = FONT_SIZE_BODY, font: string = FONT_NAME): TextRun[] {
  const runs: TextRun[] = [];
  // Simple inline parsing: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|([^*`]+))/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // Bold
      runs.push(new TextRun({ text: match[2], bold: true, font, size: fontSize }));
    } else if (match[3]) {
      // Italic
      runs.push(new TextRun({ text: match[3], italics: true, font, size: fontSize }));
    } else if (match[4]) {
      // Code
      runs.push(new TextRun({ text: match[4], font: 'Courier New', size: fontSize }));
    } else if (match[5]) {
      runs.push(new TextRun({ text: match[5], font, size: fontSize }));
    }
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text, font, size: fontSize }));
  }
  return runs;
}

function isHeading(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,5})\s+(.+)$/);
  if (match) return { level: match[1].length, text: match[2] };
  return null;
}

function createAbntHeading(text: string, level: number): Paragraph {
  // NBR 6024 heading formatting:
  // Level 1 (##): UPPERCASE, bold, size 12
  // Level 2 (###): UPPERCASE, no bold
  // Level 3 (####): Title case, bold
  // Level 4 (#####): Title case, no bold

  let displayText = text;
  let bold = false;
  let allCaps = false;

  switch (level) {
    case 1:
    case 2: // ## = Section primary
      displayText = text.toUpperCase();
      bold = true;
      allCaps = true;
      break;
    case 3: // ### = Section secondary
      displayText = text.toUpperCase();
      bold = false;
      allCaps = true;
      break;
    case 4: // #### = Section tertiary
      bold = true;
      break;
    case 5: // ##### = Section quaternary
      bold = false;
      break;
  }

  // Determine heading level for DOCX
  const headingLevel = level <= 2 ? HeadingLevel.HEADING_1
    : level === 3 ? HeadingLevel.HEADING_2
    : level === 4 ? HeadingLevel.HEADING_3
    : HeadingLevel.HEADING_4;

  // Check if title should be centered (non-numbered titles like RESUMO, ABSTRACT, REFERÊNCIAS)
  const centeredTitles = ['RESUMO', 'ABSTRACT', 'REFERÊNCIAS', 'REFERENCIAS', 'CAPA', 'FOLHA DE ROSTO', 'DEDICATÓRIA', 'DEDICATORIA', 'AGRADECIMENTOS', 'EPÍGRAFE', 'EPIGRAFE', 'SUMÁRIO', 'SUMARIO'];
  const isCentered = centeredTitles.some(t => displayText.toUpperCase().includes(t));

  return new Paragraph({
    heading: headingLevel,
    alignment: isCentered ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: 240, after: 240, line: LINE_SPACING },
    children: [
      new TextRun({
        text: displayText,
        bold,
        allCaps: false, // We already handle case manually
        font: FONT_NAME,
        size: FONT_SIZE_BODY,
      }),
    ],
  });
}

function createBodyParagraph(text: string, indent: boolean = true): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SPACING },
    indent: indent ? { firstLine: PARAGRAPH_INDENT } : undefined,
    children: parseInlineFormatting(text),
  });
}

function createBlockQuote(text: string): Paragraph {
  // ABNT citation block: 4cm indent from left, font 10pt, single spacing
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SPACING_SINGLE, before: 120, after: 120 },
    indent: { left: 4 * 567 }, // 4cm indent
    children: parseInlineFormatting(text, FONT_SIZE_SMALL),
  });
}

function createBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SPACING },
    indent: { left: PARAGRAPH_INDENT, hanging: 360 },
    children: [
      new TextRun({ text: '• ', font: FONT_NAME, size: FONT_SIZE_BODY }),
      ...parseInlineFormatting(text),
    ],
  });
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

export async function exportToDocxAbnt(input: AbntExportInput): Promise<Blob> {
  const { reportText, tccConfig } = input;
  const lines = reportText.split('\n');
  const paragraphs: Paragraph[] = [];

  let inBlockquote = false;
  let blockquoteText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip horizontal rules
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) continue;

    // Skip empty lines
    if (!trimmed) {
      if (inBlockquote) {
        paragraphs.push(createBlockQuote(blockquoteText.trim()));
        inBlockquote = false;
        blockquoteText = '';
      }
      continue;
    }

    // Blockquotes (used for ABNT long citations)
    if (trimmed.startsWith('>')) {
      inBlockquote = true;
      blockquoteText += ' ' + trimmed.replace(/^>\s*/, '');
      continue;
    }
    if (inBlockquote) {
      paragraphs.push(createBlockQuote(blockquoteText.trim()));
      inBlockquote = false;
      blockquoteText = '';
    }

    // Headings
    const heading = isHeading(trimmed);
    if (heading) {
      paragraphs.push(createAbntHeading(heading.text, heading.level));
      continue;
    }

    // Bullet lists
    if (/^[-*]\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*]\s+/, '');
      paragraphs.push(createBulletParagraph(bulletText));
      continue;
    }

    // Numbered lists
    if (/^\d+\.\s+/.test(trimmed)) {
      const listText = trimmed.replace(/^\d+\.\s+/, '');
      paragraphs.push(createBulletParagraph(listText));
      continue;
    }

    // Center-aligned text (HTML <center> tags from TCC prompts)
    if (trimmed.startsWith('<center>') || trimmed === '</center>') continue;
    if (trimmed === '&nbsp;') {
      paragraphs.push(new Paragraph({ spacing: { line: LINE_SPACING } }));
      continue;
    }

    // Regular body paragraph
    paragraphs.push(createBodyParagraph(trimmed));
  }

  // Flush remaining blockquote
  if (inBlockquote && blockquoteText.trim()) {
    paragraphs.push(createBlockQuote(blockquoteText.trim()));
  }

  // Create the Document with ABNT formatting
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_NAME,
            size: FONT_SIZE_BODY,
          },
          paragraph: {
            spacing: { line: LINE_SPACING },
          },
        },
        heading1: {
          run: {
            font: FONT_NAME,
            size: FONT_SIZE_BODY,
            bold: true,
          },
          paragraph: {
            spacing: { before: 360, after: 240, line: LINE_SPACING },
          },
        },
        heading2: {
          run: {
            font: FONT_NAME,
            size: FONT_SIZE_BODY,
            bold: false,
          },
          paragraph: {
            spacing: { before: 240, after: 120, line: LINE_SPACING },
          },
        },
        heading3: {
          run: {
            font: FONT_NAME,
            size: FONT_SIZE_BODY,
            bold: true,
          },
          paragraph: {
            spacing: { before: 240, after: 120, line: LINE_SPACING },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: MARGIN_TOP,
              bottom: MARGIN_BOTTOM,
              left: MARGIN_LEFT,
              right: MARGIN_RIGHT,
            },
            size: {
              width: 11906, // A4 width in twips
              height: 16838, // A4 height in twips
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_NAME,
                    size: FONT_SIZE_SMALL,
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
