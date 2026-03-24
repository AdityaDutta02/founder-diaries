import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { logger } from '@/lib/logger';
import type { LocalDiaryEntry } from '@/types/diary';

export interface ExportOptions {
  title?: string;
  authorName?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const MOOD_EMOJI_MAP: Record<string, string> = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  bad: '😔',
  terrible: '😢',
};

function getMoodEmoji(mood: string | null): string {
  if (!mood) return '';
  return MOOD_EMOJI_MAP[mood.toLowerCase()] ?? mood;
}

function filterAndSort(entries: LocalDiaryEntry[], options: ExportOptions): LocalDiaryEntry[] {
  let filtered = [...entries];

  if (options.dateFrom) {
    const from = options.dateFrom.toISOString().slice(0, 10);
    filtered = filtered.filter((e) => e.entry_date >= from);
  }

  if (options.dateTo) {
    const to = options.dateTo.toISOString().slice(0, 10);
    filtered = filtered.filter((e) => e.entry_date <= to);
  }

  return filtered.sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function buildHtml(entries: LocalDiaryEntry[], options: ExportOptions): string {
  const title = options.title ?? 'My Founder Diary';
  const author = options.authorName ?? '';
  const totalEntries = entries.length;

  const dateRangeLabel =
    entries.length > 0
      ? `${formatDisplayDate(entries[0].entry_date)} — ${formatDisplayDate(entries[entries.length - 1].entry_date)}`
      : 'No entries';

  let lastMonthKey = '';

  const entrySections = entries
    .map((entry) => {
      const currentMonthKey = getMonthKey(entry.entry_date);
      const pageBreak =
        lastMonthKey && currentMonthKey !== lastMonthKey
          ? '<div style="page-break-before: always;"></div>'
          : '';
      lastMonthKey = currentMonthKey;

      const moodEmoji = getMoodEmoji(entry.mood);
      const moodHtml = moodEmoji
        ? `<span style="font-size: 20px; margin-left: 8px;">${moodEmoji}</span>`
        : '';

      const bodyText = (entry.text_content ?? '').replace(/\n/g, '<br>');

      return `${pageBreak}
      <div style="margin-bottom: 40px;">
        <h2 style="
          color: #6366f1;
          font-family: Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        ">
          ${formatDisplayDate(entry.entry_date)}${moodHtml}
        </h2>
        <p style="
          font-family: Georgia, serif;
          font-size: 15px;
          line-height: 1.8;
          color: #374151;
          margin: 0;
          white-space: pre-wrap;
        ">${bodyText || '<em style="color: #9ca3af;">No text recorded.</em>'}</p>
      </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="
  background: #fafaf9;
  margin: 0;
  padding: 40px;
  font-family: Georgia, serif;
  color: #374151;
">
  <div style="
    max-width: 680px;
    margin: 0 auto;
  ">
    <!-- Cover -->
    <div style="
      text-align: center;
      padding: 60px 0 80px;
      border-bottom: 2px solid #6366f1;
      margin-bottom: 60px;
    ">
      <h1 style="
        font-size: 36px;
        color: #6366f1;
        margin: 0 0 16px;
        font-weight: 700;
      ">${title}</h1>
      ${author ? `<p style="font-size: 16px; color: #6b7280; margin: 0 0 8px;">by ${author}</p>` : ''}
      <p style="font-size: 14px; color: #9ca3af; margin: 0 0 8px;">${dateRangeLabel}</p>
      <p style="font-size: 13px; color: #d1d5db; margin: 0;">${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'}</p>
    </div>

    <!-- Entries -->
    ${entrySections}
  </div>
</body>
</html>`;
}

function buildPlainText(entries: LocalDiaryEntry[], options: ExportOptions): string {
  const title = options.title ?? 'My Founder Diary';
  const author = options.authorName ?? '';
  const lines: string[] = [];

  lines.push(title.toUpperCase());
  if (author) lines.push(`by ${author}`);
  lines.push(`${entries.length} entries`);
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('');

  for (const entry of entries) {
    lines.push(formatDisplayDate(entry.entry_date));
    if (entry.mood) lines.push(`Mood: ${getMoodEmoji(entry.mood) || entry.mood}`);
    lines.push('');
    lines.push(entry.text_content ?? '(No text recorded)');
    lines.push('');
    lines.push('-'.repeat(40));
    lines.push('');
  }

  return lines.join('\n');
}

export async function exportDiaryAsPDF(
  entries: LocalDiaryEntry[],
  options: ExportOptions,
): Promise<void> {
  try {
    const sorted = filterAndSort(entries, options);
    const html = buildHtml(sorted, options);

    logger.info('Generating PDF export', { entryCount: sorted.length });

    const { uri } = await Print.printToFileAsync({ html });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Diary',
    });

    logger.info('PDF export shared successfully');
  } catch (error) {
    logger.error('exportDiaryAsPDF failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function exportDiaryAsText(
  entries: LocalDiaryEntry[],
  options: ExportOptions,
): Promise<void> {
  try {
    const sorted = filterAndSort(entries, options);
    const text = buildPlainText(sorted, options);

    const filename = `diary-export-${Date.now()}.txt`;
    const file = new File(Paths.cache, filename);

    logger.info('Writing text export', { entryCount: sorted.length, fileUri: file.uri });

    file.write(text);

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/plain',
      dialogTitle: 'Export Diary',
    });

    logger.info('Text export shared successfully');
  } catch (error) {
    logger.error('exportDiaryAsText failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
