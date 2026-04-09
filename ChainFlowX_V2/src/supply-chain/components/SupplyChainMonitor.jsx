import React, { useMemo } from 'react';

const CORRIDORS = [
  { key: 'red_sea', name: 'Red Sea', match: [/red sea/i, /bab el/i, /houthi/i, /aden/i] },
  { key: 'suez', name: 'Suez Canal', match: [/suez/i] },
  { key: 'panama', name: 'Panama Canal', match: [/panama canal/i, /\bpanama\b/i] },
  { key: 'malacca', name: 'Malacca Strait', match: [/malacca/i, /strait of malacca/i] },
  { key: 'hormuz', name: 'Hormuz', match: [/hormuz/i, /strait of hormuz/i] },
];

function tierWeight(tier) {
  const m = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  return m[tier] ?? 0;
}

function cpToRowKey(cpId) {
  if (!cpId) return null;
  const u = String(cpId).toUpperCase();
  if (u.includes('BAB') || u.includes('RED')) return 'red_sea';
  if (u.includes('SUEZ')) return 'suez';
  if (u.includes('PANAMA')) return 'panama';
  if (u.includes('MALACCA')) return 'malacca';
  if (u.includes('HORMUZ')) return 'hormuz';
  return null;
}

function statusFromHeat(heat, pipelineActiveHere) {
  if (pipelineActiveHere) {
    if (heat >= 2) return { text: 'HIGH RISK', color: '#ef4444' };
    return { text: 'ELEVATED', color: '#f59e0b' };
  }
  if (heat >= 5) return { text: 'HIGH RISK', color: '#ef4444' };
  if (heat >= 3) return { text: 'DELAYED', color: '#f97316' };
  if (heat >= 2) return { text: 'MODERATE', color: '#f59e0b' };
  if (heat >= 1) return { text: 'ELEVATED', color: '#22c55e' };
  return { text: 'STABLE', color: '#5a7a8a' };
}

export default function SupplyChainMonitor({ eventState, articles = [] }) {
  const rows = useMemo(() => {
    const heat = Object.fromEntries(CORRIDORS.map((c) => [c.key, 0]));

    for (const a of articles) {
      const w = Math.max(1, tierWeight(a.keyword?.tier));
      const blob = `${a.headline || ''} ${a.description || ''}`;
      for (const c of CORRIDORS) {
        if (c.match.some((re) => re.test(blob))) heat[c.key] += w;
      }
    }

    const activeKey = cpToRowKey(eventState?.classified?.nearestChokepoint);

    return CORRIDORS.map((c) => {
      const h = heat[c.key];
      const pipelineHere = activeKey === c.key;
      const st = statusFromHeat(h, pipelineHere);
      return { key: c.key, name: c.name, status: st.text, color: st.color };
    });
  }, [articles, eventState?.classified?.nearestChokepoint]);

  return (
    <div className="panel" style={{ marginTop: 8 }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="panel-title mb-0">SUPPLY CHAIN MONITOR</h2>
        <span className="text-[9px] font-mono text-gray-500">LIVE</span>
      </div>
      <div
        className="space-y-2 p-2 font-mono text-[10px]"
        style={{
          background: 'rgba(11,17,24,0.6)',
          border: '1px solid rgba(0,212,255,0.12)',
          borderRadius: 2,
        }}
      >
        {rows.map((r) => (
          <div key={r.key} className="flex justify-between items-center gap-2">
            <span style={{ color: '#8ba3b8' }}>{r.name}</span>
            <span style={{ color: r.color, fontWeight: 600 }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
