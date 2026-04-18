import React, { useMemo, useEffect, useState } from 'react';

const CORRIDORS = [
  { key: 'red_sea', name: 'Red Sea', match: [/red sea/i, /bab el/i, /houthi/i, /aden/i] },
  { key: 'suez', name: 'Suez Canal', match: [/suez/i] },
  { key: 'panama', name: 'Panama Canal', match: [/panama canal/i, /\bpanama\b/i] },
  { key: 'malacca', name: 'Malacca Strait', match: [/malacca/i, /strait of malacca/i] },
  { key: 'hormuz', name: 'Hormuz', match: [/hormuz/i, /strait of hormuz/i] },
];

/** Severity weight scale aligned to 0–50+ riskScore bands (live keyword tiers). */
function severityWeight(tier) {
  const m = { critical: 50, high: 35, medium: 22, low: 12, info: 5 };
  return m[tier] ?? 8;
}

function recencyFactor(publishedAt) {
  if (!publishedAt) return 0.35;
  const ageH = (Date.now() - publishedAt) / 3600000;
  if (ageH <= 6) return 1;
  if (ageH <= 48) return 0.88;
  if (ageH <= 168) return 0.62;
  return 0.35;
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

/**
 * riskScore ≈ Σ (severityWeight × recencyFactor × clusterBoost) per matching article;
 * clusterBoost from live chokepoint convergence / multi-signal clustering.
 */
function corridorRiskScore(articlesForCorridor, pipelineHere) {
  let sum = 0;
  for (const a of articlesForCorridor) {
    const sw = severityWeight(a.keyword?.tier);
    const rf = recencyFactor(a.publishedAt);
    const clusterBoost = a.chokepointConvergence ? 1.22 : 1;
    sum += sw * rf * clusterBoost;
  }
  if (pipelineHere) sum += 18;
  return sum;
}

/** Bands from live riskScore (no static corridor labels). */
function statusFromRiskScore(riskScore) {
  if (riskScore <= 10) return { text: 'stable', color: '#5a7a8a' };
  if (riskScore <= 20) return { text: 'moderate', color: '#38bdf8' };
  if (riskScore <= 35) return { text: 'elevated', color: '#f59e0b' };
  if (riskScore <= 50) return { text: 'delayed', color: '#f97316' };
  return { text: 'critical', color: '#ef4444' };
}

export default function SupplyChainMonitor({ eventState, articles = [], feedUpdatedAt = 0 }) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setPulse((p) => p + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    const byCorridor = Object.fromEntries(CORRIDORS.map((c) => [c.key, []]));

    for (const a of articles) {
      const blob = `${a.headline || ''} ${a.description || ''}`;
      for (const c of CORRIDORS) {
        if (c.match.some((re) => re.test(blob))) byCorridor[c.key].push(a);
      }
    }

    const activeKey = cpToRowKey(eventState?.classified?.nearestChokepoint);

    return CORRIDORS.map((c) => {
      const list = byCorridor[c.key];
      const pipelineHere = activeKey === c.key;
      const riskScore = corridorRiskScore(list, pipelineHere);
      const st = statusFromRiskScore(riskScore);
      return {
        key: c.key,
        name: c.name,
        status: st.text,
        color: st.color,
        n: list.length,
        riskScore,
      };
    });
  }, [articles, eventState?.classified?.nearestChokepoint, feedUpdatedAt, pulse]);

  return (
    <div className="panel" style={{ marginTop: 0 }}>
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
          <div key={r.key} className="flex justify-between items-start gap-2">
            <span style={{ color: '#8ba3b8' }}>{r.name}</span>
            <span style={{ textAlign: 'right' }}>
              <span style={{ color: r.color, fontWeight: 600 }}>{r.status}</span>
              <span style={{ color: '#5a6b7a', fontWeight: 400, marginLeft: 6 }}>
                R {Math.round(r.riskScore)} · {r.n} evt
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
