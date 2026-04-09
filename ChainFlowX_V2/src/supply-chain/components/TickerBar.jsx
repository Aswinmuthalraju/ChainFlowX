import React, { useMemo } from 'react';

export default function TickerBar({ articles = [] }) {
  const text = useMemo(() => {
    const parts = articles
      .slice(0, 40)
      .map((a) => (a.headline || '').trim())
      .filter(Boolean);
    const core = parts.length ? parts.join(' · ') : 'Monitoring global feeds…';
    return `[CHAINFLOWX LIVE] · ${core}`;
  }, [articles]);

  return (
    <div className="wm-ticker-bar" aria-live="polite">
      <div className="wm-ticker-track">
        <span className="wm-ticker-content">{text}</span>
        <span className="wm-ticker-content" aria-hidden>
          {text}
        </span>
      </div>
    </div>
  );
}
