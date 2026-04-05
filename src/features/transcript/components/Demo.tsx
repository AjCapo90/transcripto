import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Button } from '../../../components/ui/Button';
import { PlayIcon } from '../../../components/ui/Icons';
import { extractVideoId } from '../../../lib/transcript-utils';
import { MAX_BATCH, TRANSCRIPT_API_PATH } from '../../../lib/constants';
import { TranscriptCard } from './TranscriptCard';
import type { QueueItem } from '../../../types/transcript';
import './Demo.scss';

export function Demo() {
  const [inputUrl, setInputUrl] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef<boolean>(false);
  const shouldProcessRef = useRef<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd = queue.length < MAX_BATCH;

  const pendingCount = useMemo(
    () => queue.filter((q) => q.status === 'pending').length,
    [queue],
  );

  const completedCount = useMemo(
    () => queue.filter((q) => q.status === 'success' || q.status === 'error').length,
    [queue],
  );

  const totalCount = queue.length;

  const addToQueue = useCallback((url: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) return;
    setQueue((prev) => {
      if (prev.some((item) => item.id === videoId)) return prev;
      if (prev.length >= MAX_BATCH) return prev;
      return [...prev, { id: videoId, url, status: 'pending', result: null, error: '' }];
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleAddUrl = useCallback(() => {
    if (!inputUrl.trim()) return;
    addToQueue(inputUrl.trim());
    setInputUrl('');
  }, [inputUrl, addToQueue]);

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  };

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    // Auto-scroll to results after a short delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);

    const pending = queue.filter((item) => item.status === 'pending');
    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'loading' } : q)),
      );

      try {
        const response = await fetch(TRANSCRIPT_API_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.detail ?? `Server error (${response.status})`);
        }

        const result = await response.json();
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success', result } : q)),
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to extract transcript';
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: errorMsg } : q)),
        );
      }
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [queue]);

  const handleExtractAll = useCallback(() => {
    if (inputUrl.trim()) {
      addToQueue(inputUrl.trim());
      setInputUrl('');
    }
    shouldProcessRef.current = true;
  }, [inputUrl, addToQueue]);

  useEffect(() => {
    if (shouldProcessRef.current && queue.some((q) => q.status === 'pending')) {
      shouldProcessRef.current = false;
      processQueue();
    }
  }, [queue, processQueue]);

  // Listen for video selection from Subscriptions
  useEffect(() => {
    const handleVideoSelect = (e: Event) => {
      const { videoId } = (e as CustomEvent<{ videoId: string }>).detail;
      setInputUrl(`https://www.youtube.com/watch?v=${videoId}`);
      inputRef.current?.focus();
    };

    window.addEventListener('transcripto:select-video', handleVideoSelect);
    return () => window.removeEventListener('transcripto:select-video', handleVideoSelect);
  }, []);

  return (
    <section className="demo" id="demo">
      <div className="demo__container">
        <SectionHeader label="Try it" title="Paste a YouTube link" />

        <motion.div
          className="demo__input-wrapper"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="demo__input-container">
            <div className="demo__input-row">
              <PlayIcon size={20} />
              <input
                ref={inputRef}
                type="url"
                className="demo__input"
                placeholder={pendingCount > 0 ? 'Add another URL...' : 'https://www.youtube.com/watch?v=...'}
                aria-label="YouTube video URL"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={handleUrlKeyDown}
              />
            </div>
            <div className="demo__input-actions">
              {canAdd && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddUrl}
                  disabled={!inputUrl.trim()}
                >
                  + Add
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleExtractAll}
                disabled={!inputUrl.trim() && pendingCount === 0}
              >
                {pendingCount > 1 ? `Extract ${pendingCount} videos` : 'Extract'}
              </Button>
            </div>
          </div>

          {/* Queue tags */}
          <AnimatePresence>
            {pendingCount > 0 && (
              <motion.div
                className="demo__queue"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="demo__queue-label">
                  {pendingCount} video{pendingCount > 1 ? 's' : ''} in queue
                  <span className="demo__queue-hint">(max {MAX_BATCH})</span>
                </p>
                <div className="demo__queue-tags">
                  {queue.filter((q) => q.status === 'pending').map((item) => (
                    <span key={item.id} className="demo__queue-tag">
                      <img
                        src={`https://img.youtube.com/vi/${item.id}/default.jpg`}
                        alt=""
                        width={40}
                        height={30}
                        className="demo__queue-tag-thumb"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="demo__queue-tag-id">{item.id}</span>
                      <button
                        className="demo__queue-tag-remove"
                        onClick={() => removeFromQueue(item.id)}
                        aria-label={`Remove ${item.id}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Batch progress — shown inside input wrapper for immediate visibility */}
          <AnimatePresence>
            {(isProcessing || (completedCount > 0 && completedCount < totalCount)) && (
              <motion.div
                className="demo__batch-progress"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="demo__batch-bar">
                  <div
                    className="demo__batch-bar-fill"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="demo__batch-count">
                  {completedCount}/{totalCount} completed
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <div
          className="demo__results"
          ref={resultsRef}
          aria-live="polite"
          aria-busy={isProcessing}
        >
          <AnimatePresence>
            {queue.map((item, queueIndex) => (
              <TranscriptCard
                key={item.id}
                item={item}
                index={queueIndex}
                total={totalCount}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
