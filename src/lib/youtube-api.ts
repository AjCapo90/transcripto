const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

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

export async function fetchSubscriptions(accessToken: string): Promise<YouTubeChannel[]> {
  const channels: YouTubeChannel[] = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      mine: 'true',
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/subscriptions?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

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
  maxResults = 20,
): Promise<YouTubeVideo[]> {
  // Get uploads playlist ID
  const channelParams = new URLSearchParams({
    part: 'contentDetails',
    id: channelId,
  });

  const channelRes = await fetch(`${YOUTUBE_API_BASE}/channels?${channelParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!channelRes.ok) throw new Error(`YouTube API error: ${channelRes.status}`);

  const channelData = await channelRes.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) return [];

  // Get videos from uploads playlist
  const playlistParams = new URLSearchParams({
    part: 'snippet',
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
  });

  const playlistRes = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${playlistParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!playlistRes.ok) throw new Error(`YouTube API error: ${playlistRes.status}`);

  const playlistData = await playlistRes.json();

  return (playlistData.items ?? []).map((item: Record<string, unknown>) => {
    const snippet = item.snippet as Record<string, unknown>;
    const resourceId = snippet.resourceId as Record<string, string>;
    const thumbnails = snippet.thumbnails as Record<string, { url: string }>;

    return {
      id: resourceId.videoId,
      title: snippet.title as string,
      thumbnail: thumbnails?.medium?.url ?? thumbnails?.default?.url ?? '',
      duration: '',
      publishedAt: snippet.publishedAt as string,
    };
  });
}
