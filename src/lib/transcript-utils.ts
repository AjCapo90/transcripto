import type { TranscriptLine, Paragraph } from '../types/transcript';

export function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

export function mergeIntoParagraphs(lines: TranscriptLine[]): Paragraph[] {
  if (lines.length === 0) return [];

  const paragraphs: Paragraph[] = [];
  let currentText = '';
  let currentTime = lines[0].time;

  for (const line of lines) {
    if (!currentText) currentTime = line.time;
    currentText += (currentText ? ' ' : '') + line.text.trim();

    if (/[.!?]\s*$/.test(currentText) || currentText.length > 200) {
      paragraphs.push({ time: currentTime, text: currentText });
      currentText = '';
    }
  }

  if (currentText.trim()) {
    paragraphs.push({ time: currentTime, text: currentText });
  }

  return paragraphs;
}
