import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  name?: { simpleText?: string };
}

interface TimedTextLine {
  time: string;
  text: string;
}

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function parseTimedText(xml: string): TimedTextLine[] {
  const lines: TimedTextLine[] = [];
  const regex = /<text start="([^"]*)"[^>]*>([^<]*)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const startSeconds = parseFloat(match[1]);
    const rawText = match[2].trim();
    if (!rawText) continue;

    lines.push({
      time: formatTimestamp(startSeconds),
      text: decodeHtmlEntities(rawText),
    });
  }

  return lines;
}

const WATCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Dest': 'document',
  Cookie: 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk2ODE4MTAyNjQaAmVuIAEaBgiA_LyaBg',
};

const MAX_RETRIES = 2;

async function fetchWatchPage(videoId: string): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: WATCH_HEADERS,
    });

    if (res.ok) return res.text();

    if (res.status === 429 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }

    throw new Error(`YouTube returned ${res.status}`);
  }

  throw new Error('Failed to fetch YouTube page after retries');
}

function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const pattern = /var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s;
  const match = html.match(pattern);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const { url } = req.body ?? {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ detail: 'Missing or invalid "url" field' });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ detail: 'Could not extract video ID from URL' });
  }

  try {
    const html = await fetchWatchPage(videoId);
    const playerData = extractPlayerResponse(html) as Record<string, unknown> | null;

    if (!playerData) {
      return res.status(500).json({ detail: 'Could not extract player data from YouTube page' });
    }

    const videoDetails = playerData.videoDetails as
      | { title?: string; author?: string; lengthSeconds?: string }
      | undefined;

    if (!videoDetails) {
      return res.status(404).json({ detail: 'Video not found or unavailable' });
    }

    // Find caption tracks
    const captions = playerData.captions as
      | { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } }
      | undefined;
    const captionTracks: CaptionTrack[] =
      captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

    if (captionTracks.length === 0) {
      return res.status(404).json({ detail: 'No captions available for this video' });
    }

    // Prefer manual captions, fallback to auto-generated
    const manualTrack = captionTracks.find((t) => !t.kind || t.kind !== 'asr');
    const selectedTrack = manualTrack ?? captionTracks[0];
    const isGenerated = selectedTrack.kind === 'asr';

    // Fetch caption XML
    const captionRes = await fetch(selectedTrack.baseUrl);
    if (!captionRes.ok) {
      throw new Error(`Failed to fetch captions: ${captionRes.status}`);
    }

    const captionXml = await captionRes.text();
    const lines = parseTimedText(captionXml);

    if (lines.length === 0) {
      return res.status(404).json({ detail: 'Captions are empty' });
    }

    const durationSeconds = parseInt(videoDetails.lengthSeconds ?? '0', 10);

    return res.status(200).json({
      video_id: videoId,
      title: videoDetails.title ?? '',
      channel: videoDetails.author ?? '',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      channel_thumbnail: '',
      language: selectedTrack.languageCode ?? 'unknown',
      is_generated: isGenerated,
      duration: formatDuration(durationSeconds),
      lines,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ detail: message });
  }
}
