import React, { useMemo } from 'react';

function bucketLabel(score) {
  if (score >= 0.72) return { text: 'HIGH', color: '#ef4444' };
  if (score >= 0.48) return { text: 'ELEVATED', color: '#f59e0b' };
  if (score >= 0.28) return { text: 'MODERATE', color: '#fbbf24' };
  return { text: 'LOW', color: '#22c55e' };
}

export default function StrategicRiskOverview({ eventState, articles = [] }) {
  const metrics = useMemo(() => {
    const blob = articles.map((a) => `${a.headline || ''} ${a.description || ''}`).join(' \n ');
    const lower = blob.toLowerCase();
    const n = Math.max(1, articles.length);

    let conflict = 0;
    let sanction = 0;
    let weather = 0;
    let port = 0;
    for (const a of articles) {
      const kw = a.keyword;
      const t = kw?.type;
      const tier = { critical: 1, high: 0.75, medium: 0.5, low: 0.25, info: 0.1 }[kw?.tier] ?? 0.2;
      if (t === 'conflict' || /attack|missile|war|military|strike\b|blockade/i.test(lower)) conflict += tier;
      if (t === 'sanctions' || /sanction|embargo|export control/i.test(lower)) sanction += tier;
      if (t === 'cyclone' || t === 'earthquake' || /typhoon|hurricane|flood|storm|seismic/i.test(lower))
        weather += tier;
      if (/port|congestion|backlog|container|berth|queue/i.test(`${a.headline} ${a.description || ''}`.toLowerCase()))
        port += tier * 0.6;
    }

    const density = Math.min(1, articles.filter((a) => tierWeight(a.keyword?.tier) >= 2).length / Math.min(12, n));
    const sev = typeof eventState?.classified?.severity === 'number' ? eventState.classified.severity : 0.35;

    const geopolitical = Math.min(1, 0.25 + conflict / n + density * 0.35 + sev * 0.25);
    const sanctionsExposure = Math.min(1, 0.2 + sanction / n + sev * 0.2);
    const weatherRisk = Math.min(1, 0.15 + weather / n);
    const portCongestion = Math.min(1, 0.2 + port / n + density * 0.2);
    const spillover = Math.min(
      1,
      0.2 + (conflict + sanction) / (2 * n) + (eventState?.cascadeAlerts?.length ? 0.25 : 0),
    );

    const rows = [
      { key: 'geo', label: 'Geopolitical Risk', ...bucketLabel(geopolitical) },
      { key: 'port', label: 'Port Congestion', ...bucketLabel(portCongestion) },
      { key: 'wx', label: 'Weather Risk', ...bucketLabel(weatherRisk) },
      { key: 'san', label: 'Sanctions Exposure', ...bucketLabel(sanctionsExposure) },
      { key: 'spill', label: 'Conflict Spillover', ...bucketLabel(spillover) },
    ];
    return rows;
  }, [articles, eventState?.classified?.severity, eventState?.cascadeAlerts?.length]);

  return (
    <div className="panel" style={{ marginTop: 8 }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="panel-title mb-0">STRATEGIC RISK OVERVIEW</h2>
        <span className="text-[9px] font-mono text-gray-500">DERIVED</span>
      </div>
      <div
        className="space-y-2 p-2 font-mono text-[10px]"
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

function tierWeight(tier) {
  const m = { critical: 3, high: 2, medium: 1.5, low: 1, info: 0 };
  return m[tier] ?? 0;
}
