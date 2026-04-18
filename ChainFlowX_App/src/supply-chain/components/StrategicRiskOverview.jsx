import React, { useMemo, useEffect, useState } from 'react';

/** Share of feed mentioning major chokepoint zones (clustering / maritime stress zones). */
const CHOKE_ZONE_HINT =
  /red sea|bab el|suez|panama|malacca|hormuz|strait of hormuz|strait of malacca|houthi|aden\b/i;

function tierWeight(tier) {
  const m = { critical: 3, high: 2, medium: 1.5, low: 1, info: 0 };
  return m[tier] ?? 0;
}

function stressVisual(score01) {
  const pct = Math.round(Math.min(1, Math.max(0, score01)) * 100);
  let color = '#22c55e';
  if (score01 >= 0.72) color = '#ef4444';
  else if (score01 >= 0.52) color = '#f97316';
  else if (score01 >= 0.36) color = '#f59e0b';
  else if (score01 >= 0.2) color = '#eab308';
  return { text: `${pct}`, color };
}

export default function StrategicRiskOverview({ eventState, articles = [], feedUpdatedAt = 0 }) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setPulse((p) => p + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const metrics = useMemo(() => {
    const n = Math.max(1, articles.length);
    const convergenceHits = articles.filter((a) => a.chokepointConvergence).length;
    const zoneHits = articles.filter((a) =>
      CHOKE_ZONE_HINT.test(`${a.headline || ''} ${a.description || ''}`),
    ).length;
    const clusterFactor = Math.min(
      1,
      convergenceHits / 6 + (convergenceHits > 0 ? 0.12 : 0) + (zoneHits / n) * 0.35,
    );

    const typeSet = new Set();
    let conflict = 0;
    let sanction = 0;
    let weather = 0;
    let port = 0;

    for (const a of articles) {
      const kw = a.keyword;
      const t = kw?.type;
      if (t) typeSet.add(String(t));
      const piece = `${a.headline || ''} ${a.description || ''}`.toLowerCase();
      const tier = { critical: 1, high: 0.75, medium: 0.5, low: 0.25, info: 0.1 }[kw?.tier] ?? 0.2;
      if (t === 'conflict' || /attack|missile|war|military|strike\b|blockade/i.test(piece)) conflict += tier;
      if (t === 'sanctions' || /sanction|embargo|export control/i.test(piece)) sanction += tier;
      if (t === 'cyclone' || t === 'earthquake' || /typhoon|hurricane|flood|storm|seismic/i.test(piece))
        weather += tier;
      if (/port|congestion|backlog|container|berth|queue/i.test(piece)) port += tier * 0.6;
    }

    const typeSpread = Math.min(1, typeSet.size / 5.5);
    const heavyArticles = articles.filter((a) => tierWeight(a.keyword?.tier) >= 2).length;
    const density = Math.min(1, heavyArticles / Math.min(14, n));
    const sev = typeof eventState?.classified?.severity === 'number' ? eventState.classified.severity : 0.35;

    const geopolitical = Math.min(
      1,
      0.12 + conflict / n + density * 0.32 + sev * 0.28 + clusterFactor * 0.22 + typeSpread * 0.08,
    );
    const sanctionsExposure = Math.min(1, 0.1 + sanction / n + sev * 0.22 + clusterFactor * 0.1);
    const weatherRisk = Math.min(1, 0.08 + weather / n + typeSpread * 0.05);
    const portCongestion = Math.min(1, 0.12 + port / n + density * 0.22 + clusterFactor * 0.12);
    const spillover = Math.min(
      1,
      0.1 +
        (conflict + sanction) / (2 * n) +
        clusterFactor * 0.28 +
        typeSpread * 0.1 +
        (eventState?.cascadeAlerts?.length ? 0.22 : 0),
    );

    return [
      { key: 'geo', label: 'Geopolitical Risk', ...stressVisual(geopolitical) },
      { key: 'port', label: 'Port Congestion Risk', ...stressVisual(portCongestion) },
      { key: 'wx', label: 'Weather Risk', ...stressVisual(weatherRisk) },
      { key: 'san', label: 'Sanctions Exposure', ...stressVisual(sanctionsExposure) },
      { key: 'spill', label: 'Conflict Spillover', ...stressVisual(spillover) },
    ];
  }, [
    articles,
    eventState?.classified?.severity,
    eventState?.cascadeAlerts?.length,
    feedUpdatedAt,
    pulse,
  ]);

  return (
    <div className="panel sro-panel">
      <div className="sro-header flex items-center justify-between mb-2">
        <h2 className="panel-title mb-0">STRATEGIC RISK OVERVIEW</h2>
        <span className="text-[9px] font-mono text-gray-500">DERIVED</span>
      </div>
      <div
        className="sro-body space-y-2 p-2 font-mono text-[10px]"
        style={{
          background: 'rgba(11,17,24,0.6)',
          border: '1px solid rgba(0,212,255,0.12)',
          borderRadius: 2,
        }}
      >
        {metrics.map((r) => (
          <div key={r.key} className="flex justify-between items-center gap-2">
            <span style={{ color: '#8ba3b8' }}>{r.label}</span>
            <span style={{ color: r.color, fontWeight: 600 }}>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
