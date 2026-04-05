import type { VercelRequest, VercelResponse } from '@vercel/node';

const INNERTUBE_API = 'https://www.youtube.com/youtubei/v1/player';
const INNERTUBE_CLIENT = {
  clientName: 'WEB',
  clientVersion: '2.20250401.00.00',
  hl: 'en',
};

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
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
    // 1. Get player data via innertube API
    const playerRes = await fetch(INNERTUBE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        context: { client: INNERTUBE_CLIENT },
      }),
    });

    if (!playerRes.ok) {
      throw new Error(`Innertube API returned ${playerRes.status}`);
    }

    const playerData = await playerRes.json();
    const videoDetails = playerData.videoDetails;

    if (!videoDetails) {
      return res.status(404).json({ detail: 'Video not found or unavailable' });
    }

    // 2. Find caption tracks
    const captionTracks: CaptionTrack[] =
      playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

    if (captionTracks.length === 0) {
      return res.status(404).json({ detail: 'No captions available for this video' });
    }

    // Prefer manual captions, fallback to auto-generated
    const manualTrack = captionTracks.find((t) => !t.kind || t.kind !== 'asr');
    const selectedTrack = manualTrack ?? captionTracks[0];
    const isGenerated = selectedTrack.kind === 'asr';

    // 3. Fetch caption XML
    const captionRes = await fetch(selectedTrack.baseUrl);
    if (!captionRes.ok) {
      throw new Error(`Failed to fetch captions: ${captionRes.status}`);
    }

    const captionXml = await captionRes.text();
    const lines = parseTimedText(captionXml);

    if (lines.length === 0) {
      return res.status(404).json({ detail: 'Captions are empty' });
    }

    // 4. Build response matching frontend interface
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
