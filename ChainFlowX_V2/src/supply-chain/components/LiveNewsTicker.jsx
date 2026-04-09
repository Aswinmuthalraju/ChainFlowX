import React, { useRef, useEffect, useState, useCallback } from 'react';
import { liveArticleToPipelineEvent } from '../data/liveEventFeed.js';

function timeAgo(ms) {
  if (!ms) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}hr ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TIER_BADGE = {
  critical: { bg: 'rgba(255,34,34,0.15)', fg: '#ff2222', label: 'CRITICAL', pulse: true },
  high: { bg: 'rgba(255,136,0,0.15)', fg: '#ff8800', label: 'HIGH', pulse: false },
  medium: { bg: 'rgba(255,221,0,0.15)', fg: '#ffdd00', label: 'MEDIUM', pulse: false },
  low: { bg: 'rgba(68,136,255,0.15)', fg: '#4488ff', label: 'LOW', pulse: false },
  info: { bg: 'rgba(136,136,136,0.12)', fg: '#888888', label: 'INFO', pulse: false },
};

const BORDER_BY_TIER = {
  critical: '#ff2222',
  high: '#ff8800',
  medium: '#ffdd00',
  low: '#4488ff',
  info: '#888888',
};

const TYPE_LABEL = {
  conflict: 'CONFLICT',
  cyclone: 'CYCLONE',
  earthquake: 'EARTHQUAKE',
  strike: 'STRIKE',
  sanctions: 'SANCTIONS',
  maritime: 'MARITIME',
  blockage: 'MARITIME',
  other: 'OTHER',
};

function scRelLabel(v) {
  if (v >= 0.75) return { t: 'SC: HIGH', c: '#22c55e' };
  if (v >= 0.45) return { t: 'SC: MED', c: '#f59e0b' };
  return { t: 'SC: LOW', c: '#6b7280' };
}

function dnaSnippet(dnaMatch) {
  if (!dnaMatch?.name) return null;
  const pct = dnaMatch.similarity != null ? Math.round(dnaMatch.similarity) : null;
  const tail = dnaMatch.name;
  if (pct != null) return `${pct}% ${tail}`;
  return tail;
}

function headlineType(article) {
  const llm = article.llmClassification;
  const kc = article.keyword?.confidence ?? 0;
  if (llm && typeof llm.confidence === 'number' && llm.confidence > kc) {
    const t = String(llm.eventType || 'other').toLowerCase();
    if (TYPE_LABEL[t]) return t;
  }
  const t2 = String(article.keyword?.type || 'other').toLowerCase();
  return TYPE_LABEL[t2] ? t2 : 'other';
}

export default function LiveNewsTicker({
  articles = [],
  onEventSelect,
  onGlobeFocus,
  maxItems = 50,
  feedUpdatedAt = 0,
  activeDnaMatch = null,
  variant = 'sidebar',
}) {
  const list = articles.slice(0, maxItems);
  const scrollRef = useRef(null);
  const userScrollPausedRef = useRef(false);
  const scrollPauseTimerRef = useRef(null);
  const prevUrlsRef = useRef(new Set());
  const [flashUrls, setFlashUrls] = useState(() => new Set());

  useEffect(() => {
    const urls = list.map((a) => a.url).filter(Boolean);
    const nextFlash = new Set();
    for (const u of urls) {
      if (!prevUrlsRef.current.has(u)) nextFlash.add(u);
    }
    prevUrlsRef.current = new Set(urls);
    if (nextFlash.size) {
      setFlashUrls(nextFlash);
      const t = window.setTimeout(() => setFlashUrls(new Set()), 700);
      return () => clearTimeout(t);
    }
  }, [list]);

  const onScrollUser = useCallback(() => {
    userScrollPausedRef.current = true;
    if (scrollPauseTimerRef.current) clearTimeout(scrollPauseTimerRef.current);
    scrollPauseTimerRef.current = window.setTimeout(() => {
      userScrollPausedRef.current = false;
    }, 5000);
  }, []);

  useEffect(() => {
    if (userScrollPausedRef.current || !scrollRef.current || !list.length) return;
    scrollRef.current.scrollTop = 0;
  }, [feedUpdatedAt, list.length]);

  const handleItemClick = (a) => {
    const ev = liveArticleToPipelineEvent(a);
    if (ev.lat != null && ev.lng != null && !(ev.lat === 0 && ev.lng === 0)) {
      onGlobeFocus?.(ev.lat, ev.lng, ev.severity ?? 0.6);
    }
    onEventSelect?.(ev);
  };

  const shellClass = variant === 'sidebar' ? 'wm-live-news wm-live-news--sidebar' : 'wm-live-news';

  return (
    <div className={shellClass}>
      <div className="wm-live-news-header">
        <span className="wm-live-news-dot" />
        <span className="wm-live-news-live">LIVE</span>
        <span className="wm-live-news-title">INTELLIGENCE FEED</span>
        <span className="wm-live-news-count">
          [{articles.length}]
        </span>
        <div className="wm-live-news-sub">
          Supply Chain · Updated {articles.length ? timeAgo(feedUpdatedAt || Date.now()) : '—'}
        </div>
      </div>

      <div className="wm-live-news-scroll" ref={scrollRef} onScroll={onScrollUser}>
        {!list.length && (
          <div className="wm-live-news-empty">Monitoring global feeds…</div>
        )}

        {list.map((a) => {
          const tierKey = a.keyword?.tier || 'info';
          const tb = TIER_BADGE[tierKey] || TIER_BADGE.info;
          const border = BORDER_BY_TIER[tierKey] || BORDER_BY_TIER.info;
          const rel = a.displayRelevance ?? a.keyword?.supplyChainRelevance ?? 0;
          const sc = scRelLabel(rel);
          const evType = headlineType(a);
          const typeBadge = TYPE_LABEL[evType] || 'OTHER';
          const title = (a.headline || '—').slice(0, 120);
          const dna =
            activeDnaMatch && a.url && a.url === activeDnaMatch.articleUrl
              ? dnaSnippet(activeDnaMatch.dna)
              : null;
          const isFlash = a.url && flashUrls.has(a.url);

          return (
            <button
              key={a.url}
              type="button"
              className={`wm-live-news-item${isFlash ? ' wm-live-news-item--enter' : ''}`}
              style={{
                borderLeftColor: border,
                boxShadow:
                  tierKey === 'critical'
                    ? `0 0 12px ${border}44, inset 0 0 20px ${border}08`
                    : undefined,
              }}
              onClick={() => handleItemClick(a)}
            >
              <div className="wm-live-news-item-top">
                <span
                  className={`wm-live-tier ${tb.pulse ? 'wm-live-tier--pulse' : ''}`}
                  style={{ color: tb.fg, background: tb.bg }}
                >
                  {tb.label}
                </span>
              </div>
              <div className="wm-live-headline">{title}</div>
              <div className="wm-live-meta">
                <span>{a.source || '—'}</span>
                <span>·</span>
                <span>Tier {a.sourceTier ?? '—'}</span>
                <span>·</span>
                <span>{typeBadge}</span>
                <span>·</span>
                <span>{timeAgo(a.publishedAt)}</span>
                <span className="wm-live-sc" style={{ borderColor: `${sc.c}66`, color: sc.c }}>
                  {sc.t}
                </span>
                {a.chokepointConvergence && <span className="wm-live-conv">CONVERGENCE</span>}
                {dna && <span className="wm-live-dna">DNA: {dna}</span>}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes cfxSevPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
        .wm-live-tier--pulse {
          animation: cfxSevPulse 2s ease-in-out infinite;
        }
        @keyframes wmNewsEnter {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .wm-live-news-item--enter {
          animation: wmNewsEnter 0.45s ease-out;
        }
      `}</style>
    </div>
  );
}
