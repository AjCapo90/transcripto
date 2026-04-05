export interface TranscriptLine {
  time: string;
  text: string;
}

export interface TranscriptResult {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  channel_thumbnail: string;
  language: string;
  is_generated: boolean;
  duration: string;
  lines: TranscriptLine[];
}

export interface Paragraph {
  time: string;
  text: string;
}

export interface QueueItem {
  id: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  result: TranscriptResult | null;
  error: string;
}
