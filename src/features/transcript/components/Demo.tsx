import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Button } from '../../../components/ui/Button';
import { PlayIcon, CopyIcon, DownloadIcon, SearchIcon } from '../../../components/ui/Icons';
import './Demo.scss';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_BATCH = 5;

interface TranscriptLine {
  time: string;
  text: string;
}

interface TranscriptResult {
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

interface Paragraph {
  time: string;
  text: string;
}

interface QueueItem {
  id: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  result: TranscriptResult | null;
  error: string;
}

type DemoStatus = 'idle' | 'loading' | 'done';

function mergeIntoParagraphs(lines: TranscriptLine[]): Paragraph[] {
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

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="demo__highlight">{part}</mark> : part,
  );
}

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

export function Demo() {
  const [inputUrl, setInputUrl] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [, setBatchStatus] = useState<DemoStatus>('idle');
  const processingRef = useRef(false);

  const queueCount = queue.length;
  const canAdd = queueCount < MAX_BATCH;

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
    setBatchStatus('loading');

    const pending = queue.filter((item) => item.status === 'pending');
    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'loading' } : q)),
      );

      try {
        const response = await fetch(`${API_BASE}/api/transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.detail ?? `Server error (${response.status})`);
        }

        const result: TranscriptResult = await response.json();
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success', result } : q)),
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to extract';
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: errorMsg } : q)),
        );
      }
    }

    processingRef.current = false;
    setBatchStatus('done');
  }, [queue]);

  const handleExtractAll = useCallback(() => {
    if (inputUrl.trim()) {
      addToQueue(inputUrl.trim());
      setInputUrl('');
    }
    setTimeout(() => processQueue(), 100);
  }, [inputUrl, addToQueue, processQueue]);

  const pendingCount = queue.filter((q) => q.status === 'pending').length;
  const completedCount = queue.filter((q) => q.status === 'success' || q.status === 'error').length;
  const totalCount = queue.length;

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
            <PlayIcon size={20} />
            <input
              type="url"
              className="demo__input"
              placeholder={pendingCount > 0 ? 'Add another URL (Shift+Enter)...' : 'https://www.youtube.com/watch?v=...'}
              aria-label="YouTube video URL"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleUrlKeyDown}
            />
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

          {/* Queue tags — shows pending videos before extraction */}
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
        </motion.div>

        {/* Batch progress */}
        {totalCount > 1 && (
          <div className="demo__batch-progress">
            <div className="demo__batch-bar">
              <div
                className="demo__batch-bar-fill"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="demo__batch-count">{completedCount}/{totalCount} completed</span>
          </div>
        )}

        {/* Results */}
        <div className="demo__results">
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

// ============================================
// TRANSCRIPT CARD COMPONENT
// ============================================
interface TranscriptCardProps {
  item: QueueItem;
  index: number;
  total: number;
}

function TranscriptCard({ item, index, total }: TranscriptCardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [copyLabel, setCopyLabel] = useState('Copy');
  const matchRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());

  const paragraphs = useMemo(
    () => (item.result ? mergeIntoParagraphs(item.result.lines) : []),
    [item.result],
  );

  const matchIndices = useMemo(() => {
    if (!searchQuery) return [];
    return paragraphs
      .map((p, i) => (p.text.toLowerCase().includes(searchQuery.toLowerCase()) ? i : -1))
      .filter((i) => i !== -1);
  }, [paragraphs, searchQuery]);

  const fullText = paragraphs.map((p) => p.text).join('\n\n');

  useEffect(() => {
    setCurrentMatchIndex(0);
    const firstRef = matchRefs.current.get(matchIndices[0]);
    if (firstRef) firstRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [searchQuery, matchIndices]);

  const jumpToNextMatch = useCallback(() => {
    if (matchIndices.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matchIndices.length;
    setCurrentMatchIndex(nextIndex);
    const ref = matchRefs.current.get(matchIndices[nextIndex]);
    if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [matchIndices, currentMatchIndex]);

  const handleCopy = useCallback(async () => {
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy'), 2000);
    } catch {
      setCopyLabel('Failed');
      setTimeout(() => setCopyLabel('Copy'), 2000);
    }
  }, [fullText]);

  const handleDownload = useCallback(() => {
    if (!fullText || !item.result) return;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${item.result.title || 'transcript'}.txt`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }, [fullText, item.result]);

  const r = item.result;

  return (
    <motion.div
      className="demo__card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {item.status === 'loading' && (
        <div className="demo__loading">
          <div className="demo__spinner" />
          <p>Extracting transcript...</p>
        </div>
      )}

      {item.status === 'error' && (
        <div className="demo__error" role="alert">
          <p>{item.error}</p>
        </div>
      )}

      {item.status === 'success' && r && (
        <>
          <div className="demo__result-header">
            <div className="demo__result-video">
              <div className="demo__result-thumbnail">
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt="" width={160} height={90} loading="lazy" decoding="async" />
                ) : (
                  <div className="demo__result-play"><PlayIcon size={20} /></div>
                )}
              </div>
              <div className="demo__result-meta">
                <h3 className="demo__result-title">{r.title}</h3>
                {r.channel && (
                  <p className="demo__result-channel">@{r.channel}</p>
                )}
                <p className="demo__result-info">
                  <span className="demo__result-tag">{r.language}</span>
                  {r.is_generated && (
                    <span className="demo__result-tag demo__result-tag--auto">Auto-generated</span>
                  )}
                  {r.duration && <span>{r.duration}</span>}
                </p>
              </div>
            </div>
            <div className="demo__result-actions">
              {total > 1 && (
                <span className="demo__card-badge">{index + 1} / {total}</span>
              )}
              <Button variant="outline" size="sm" icon={<CopyIcon size={16} />} onClick={handleCopy}>
                {copyLabel}
              </Button>
              <Button variant="outline" size="sm" icon={<DownloadIcon size={16} />} onClick={handleDownload}>
                Download
              </Button>
            </div>
          </div>

          <div className="demo__result-body">
            <div className="demo__result-search">
              <SearchIcon size={16} />
              <input
                type="search"
                className="demo__result-search-input"
                placeholder="Search within transcript... (Enter to jump)"
                aria-label="Search transcript"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); jumpToNextMatch(); } }}
              />
              {searchQuery && matchIndices.length > 0 && (
                <span className="demo__result-match-count">
                  {currentMatchIndex + 1}/{matchIndices.length}
                </span>
              )}
            </div>
            <div className="demo__result-transcript">
              {paragraphs.map((para, pIndex) => {
                const matchPos = matchIndices.indexOf(pIndex);
                const isMatch = matchPos !== -1;
                const isCurrentMatch = matchPos === currentMatchIndex;

                return (
                  <p
                    key={`p-${pIndex}`}
                    ref={(el) => {
                      if (isMatch && el) matchRefs.current.set(pIndex, el);
                      else matchRefs.current.delete(pIndex);
                    }}
                    className={`demo__result-paragraph ${isMatch ? 'demo__result-paragraph--match' : ''} ${isCurrentMatch ? 'demo__result-paragraph--current' : ''}`}
                  >
                    {para.time && <span className="demo__result-timestamp">{para.time}</span>}
                    <span className="demo__result-text">{highlightText(para.text, searchQuery)}</span>
                  </p>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
