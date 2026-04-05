import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Button } from '../../../components/ui/Button';
import { PlayIcon } from '../../../components/ui/Icons';
import type { YouTubeChannel, YouTubeVideo } from '../../../lib/youtube-api';
import { fetchChannelVideos } from '../../../lib/youtube-api';
import './Subscriptions.scss';

interface SubscriptionsProps {
  isVisible: boolean;
  accessToken: string | null;
  channels: YouTubeChannel[];
  isLoading: boolean;
}

export function Subscriptions({ isVisible, accessToken, channels, isLoading }: SubscriptionsProps) {
  const [selectedChannel, setSelectedChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);

  const handleChannelClick = async (channel: YouTubeChannel) => {
    if (!accessToken) return;

    setSelectedChannel(channel);
    setVideosLoading(true);

    try {
      const vids = await fetchChannelVideos(accessToken, channel.id);
      setVideos(vids);
    } catch {
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedChannel(null);
    setVideos([]);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section
          className="subscriptions"
          id="subscriptions"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="subscriptions__container">
            {!selectedChannel ? (
              <>
                <SectionHeader
                  label="Your YouTube"
                  title={<>Your subscriptions.<br />Pick a channel, get transcripts.</>}
                  subtitle="Select a channel to browse its videos and extract transcripts directly."
                />

                {isLoading ? (
                  <div className="subscriptions__loading">
                    <div className="subscriptions__spinner" />
                    <p>Loading your subscriptions...</p>
                  </div>
                ) : (
                  <div className="subscriptions__grid">
                    {channels.map((channel, index) => (
                      <motion.article
                        key={channel.id}
                        className="channel-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => handleChannelClick(channel)}
                      >
                        {channel.thumbnail ? (
                          <img
                            className="channel-card__avatar"
                            src={channel.thumbnail}
                            alt=""
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="channel-card__avatar channel-card__avatar--placeholder" />
                        )}
                        <h3 className="channel-card__name">{channel.title}</h3>
                      </motion.article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="subscriptions__channel-header">
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    &larr; Back to channels
                  </Button>
                  <h2 className="subscriptions__channel-title">{selectedChannel.title}</h2>
                  <p className="subscriptions__channel-hint">Click a video to extract its transcript in the demo section above.</p>
                </div>

                {videosLoading ? (
                  <div className="subscriptions__loading">
                    <div className="subscriptions__spinner" />
                    <p>Loading videos...</p>
                  </div>
                ) : (
                  <div className="subscriptions__videos-grid">
                    {videos.map((video, index) => (
                      <motion.a
                        key={video.id}
                        className="video-card"
                        href="#demo"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('transcripto:select-video', {
                              detail: { videoId: video.id },
                            }),
                          );
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="video-card__thumbnail">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt=""
                              width={320}
                              height={180}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="video-card__thumbnail-placeholder">
                              <PlayIcon size={24} />
                            </div>
                          )}
                        </div>
                        <h3 className="video-card__title">{video.title}</h3>
                        <p className="video-card__date">
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                      </motion.a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
