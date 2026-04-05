const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const MAX_SUBSCRIPTIONS_PER_PAGE = 50;
const DEFAULT_VIDEO_COUNT = 20;

export interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  videoCount: number;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
}

interface YouTubeApiResponse {
  items?: YouTubeSubscriptionItem[];
  nextPageToken?: string;
}

interface YouTubeSubscriptionItem {
  snippet: {
    resourceId: { channelId: string };
    title: string;
    thumbnails?: { default?: { url: string } };
  };
}

interface YouTubeChannelItem {
  contentDetails?: {
    relatedPlaylists?: { uploads?: string };
  };
}

interface YouTubePlaylistItem {
  snippet: {
    resourceId: { videoId: string };
    title: string;
    thumbnails?: {
      medium?: { url: string };
      default?: { url: string };
    };
    publishedAt: string;
  };
}

export async function fetchSubscriptions(accessToken: string): Promise<YouTubeChannel[]> {
  const channels: YouTubeChannel[] = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      mine: 'true',
      maxResults: String(MAX_SUBSCRIPTIONS_PER_PAGE),
      ...(pageToken ? { pageToken } : {}),
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/subscriptions?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data: YouTubeApiResponse = await response.json();

    for (const item of data.items ?? []) {
      channels.push({
        id: item.snippet.resourceId.channelId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.default?.url ?? '',
        videoCount: 0,
      });
    }

    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return channels;
}

export async function fetchChannelVideos(
  accessToken: string,
  channelId: string,
  maxResults = DEFAULT_VIDEO_COUNT,
): Promise<YouTubeVideo[]> {
  const channelParams = new URLSearchParams({
    part: 'contentDetails',
    id: channelId,
  });

  const channelRes = await fetch(`${YOUTUBE_API_BASE}/channels?${channelParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!channelRes.ok) throw new Error(`YouTube API error: ${channelRes.status}`);

  const channelData: { items?: YouTubeChannelItem[] } = await channelRes.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) return [];

  const playlistParams = new URLSearchParams({
    part: 'snippet',
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
  });

  const playlistRes = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${playlistParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!playlistRes.ok) throw new Error(`YouTube API error: ${playlistRes.status}`);

  const playlistData: { items?: YouTubePlaylistItem[] } = await playlistRes.json();

  return (playlistData.items ?? []).map((item) => ({
    id: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
    duration: '',
    publishedAt: item.snippet.publishedAt,
  }));
}
