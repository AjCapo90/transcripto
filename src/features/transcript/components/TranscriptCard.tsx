import { useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../../components/ui/Button';
import { PlayIcon, CopyIcon, DownloadIcon, SearchIcon } from '../../../components/ui/Icons';
import { mergeIntoParagraphs } from '../../../lib/transcript-utils';
import type { QueueItem } from '../../../types/transcript';
import './TranscriptCard.scss';

interface TranscriptCardProps {
  item: QueueItem;
  index: number;
  total: number;
}

function highlightText(text: string, query: string): ReactNode {
  if (!query) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="transcript-card__highlight">{part}</mark> : part,
  );
}

export function TranscriptCard({ item, index, total }: TranscriptCardProps) {
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
    const lower = searchQuery.toLowerCase();
    return paragraphs.reduce<number[]>((acc, p, i) => {
      if (p.text.toLowerCase().includes(lower)) acc.push(i);
      return acc;
    }, []);
  }, [paragraphs, searchQuery]);

  const fullText = useMemo(
    () => paragraphs.map((p) => p.text).join('\n\n'),
    [paragraphs],
  );

  useEffect(() => {
    const firstRef = matchRefs.current.get(matchIndices[0]);
    if (firstRef) firstRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [matchIndices]);

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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.result.title || 'transcript'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fullText, item.result]);

  const r = item.result;

  return (
    <motion.div
      className="transcript-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {item.status === 'loading' && (
        <div className="transcript-card__loading">
          <div className="transcript-card__spinner" />
          <p>Extracting transcript...</p>
        </div>
      )}

      {item.status === 'error' && (
        <div className="transcript-card__error" role="alert">
          <p>{item.error}</p>
        </div>
      )}

      {item.status === 'success' && r && (
        <>
          <div className="transcript-card__header">
            <div className="transcript-card__video">
              <div className="transcript-card__thumbnail">
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt="" width={160} height={90} loading="lazy" decoding="async" />
                ) : (
                  <div className="transcript-card__play"><PlayIcon size={20} /></div>
                )}
              </div>
              <div className="transcript-card__meta">
                <h3 className="transcript-card__title">{r.title}</h3>
                {r.channel && (
                  <p className="transcript-card__channel">@{r.channel}</p>
                )}
                <p className="transcript-card__info">
                  <span className="transcript-card__tag">{r.language}</span>
                  {r.is_generated && (
                    <span className="transcript-card__tag transcript-card__tag--auto">Auto-generated</span>
                  )}
                  {r.duration && <span>{r.duration}</span>}
                </p>
              </div>
            </div>
            <div className="transcript-card__actions">
              {total > 1 && (
                <span className="transcript-card__badge">{index + 1} / {total}</span>
              )}
              <Button variant="outline" size="sm" icon={<CopyIcon size={16} />} onClick={handleCopy}>
                {copyLabel}
              </Button>
              <Button variant="outline" size="sm" icon={<DownloadIcon size={16} />} onClick={handleDownload}>
                Download
              </Button>
            </div>
          </div>

          <div className="transcript-card__body">
            <div className="transcript-card__search">
              <SearchIcon size={16} />
              <input
                type="search"
                className="transcript-card__search-input"
                placeholder="Search within transcript... (Enter to jump)"
                aria-label="Search transcript"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentMatchIndex(0); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); jumpToNextMatch(); } }}
              />
              {searchQuery && matchIndices.length > 0 && (
                <span className="transcript-card__match-count">
                  {currentMatchIndex + 1}/{matchIndices.length}
                </span>
              )}
            </div>
            <div className="transcript-card__transcript">
              {paragraphs.map((para, pIndex) => {
                const matchPos = matchIndices.indexOf(pIndex);
                const isMatch = matchPos !== -1;
                const isCurrentMatch = matchPos === currentMatchIndex;

                return (
                  <p
                    key={pIndex}
                    ref={(el) => {
                      if (isMatch && el) matchRefs.current.set(pIndex, el);
                      else matchRefs.current.delete(pIndex);
                    }}
                    className={`transcript-card__paragraph${isMatch ? ' transcript-card__paragraph--match' : ''}${isCurrentMatch ? ' transcript-card__paragraph--current' : ''}`}
                  >
                    {para.time && <span className="transcript-card__timestamp">{para.time}</span>}
                    <span className="transcript-card__text">{highlightText(para.text, searchQuery)}</span>
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
