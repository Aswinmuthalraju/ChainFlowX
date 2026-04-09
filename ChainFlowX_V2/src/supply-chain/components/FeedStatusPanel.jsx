import React, { useState, useEffect } from 'react';
import { getFeedStatus } from '../data/liveEventFeed.js';

function formatAgo(ms) {
  if (!ms) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}hr ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const DOT = {
  fresh: { c: '#22c55e', pulse: true },
  stale: { c: '#f59e0b', pulse: false },
  very_stale: { c: '#ef4444', pulse: false },
  error: { c: '#ef4444', blink: true },
  disabled: { c: '#6b7280', pulse: false },
  unknown: { c: '#6b7280', pulse: false },
  pending: { c: '#6b7280', pulse: false },
};

export default function FeedStatusPanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = () => setRows(getFeedStatus());
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const visible = open ? rows : rows.slice(0, 4);

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 44,
        zIndex: 90,
        width: open ? 320 : 260,
        maxHeight: open ? '42vh' : 200,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(11,17,24,0.94)',
        border: '1px solid var(--border)',
        borderRadius: 2,
        fontFamily: 'var(--mono)',
        fontSize: '0.6rem',
        color: 'var(--muted)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: 'transparent',
          border: 'none',
          borderBottom: open ? '1px solid var(--border)' : 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontFamily: 'var(--mono)',
          fontSize: '0.6rem',
        }}
      >
        <span>FEED STATUS {open ? '▼' : '▶'}</span>
        <span style={{ color: 'var(--muted)' }}>{rows.length} src</span>
      </button>

      <div style={{ overflowY: 'auto', padding: '6px 8px 10px' }}>
        {visible.map((r) => {
          const spec = DOT[r.status] || DOT.unknown;
          const line2 =
            r.status === 'error' || r.status === 'disabled'
              ? r.nextRetry > 0
                ? `retry ${Math.ceil(r.nextRetry / 60000)}m · n=${r.articleCount}`
                : `err · n=${r.articleCount}`
              : `${r.status.toUpperCase().replace('_', ' ')} · ${formatAgo(r.lastUpdated)} · n=${r.articleCount}`;

          return (
            <div
              key={r.sourceId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '5px 0',
                borderBottom: '1px solid rgba(30,45,61,0.5)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  marginTop: 3,
                  flexShrink: 0,
                  background: spec.c,
                  animation: spec.pulse
                    ? 'cfxPulse 1.6s ease-in-out infinite'
                    : spec.blink
                      ? 'cfxBlink 1.1s step-end infinite'
                      : 'none',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text)', fontWeight: 600 }}>{r.name}</div>
                <div style={{ opacity: 0.85 }}>{line2}</div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes cfxPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        @keyframes cfxBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
