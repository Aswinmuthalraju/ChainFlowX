import React, { useEffect, useState, useRef } from 'react';

function getConfidenceStyle(confidence) {
  const c = confidence?.toLowerCase() ?? '';
  if (c.includes('high'))   return 'border-cfx-safe   text-cfx-safe   shadow-[0_0_8px_rgba(16,185,129,0.3)]';
  if (c.includes('medium')) return 'border-cfx-warn   text-cfx-warn   shadow-[0_0_8px_rgba(245,158,11,0.3)]';
  if (c.includes('low'))    return 'border-cfx-critical text-cfx-critical shadow-[0_0_8px_rgba(239,68,68,0.3)]';
  return 'border-gray-600 text-gray-500';
}

function getPanelBorderStyle(similarity) {
  if (similarity == null) return '';
  if (similarity >= 80)
    return 'border-cfx-safe shadow-[0_0_20px_rgba(16,185,129,0.1)]';
  if (similarity >= 60)
    return 'border-cfx-warn shadow-[0_0_20px_rgba(245,158,11,0.08)]';
  return '';
}

// DNA helix: two offset dotted rows
function DNAHelix() {
  const dots = 12;
  return (
    <div className="flex flex-col gap-1 my-3 opacity-30">
      <div className="flex justify-center gap-2">
        {[...Array(dots)].map((_, i) => (
          <div
            key={`a${i}`}
            className="w-1.5 h-1.5 rounded-full bg-cfx-accent"
            style={{ opacity: 0.4 + Math.abs(Math.sin((i / dots) * Math.PI)) * 0.6 }}
          />
        ))}
      </div>
      <div className="flex justify-center gap-2" style={{ marginLeft: '6px' }}>
        {[...Array(dots)].map((_, i) => (
          <div
            key={`b${i}`}
            className="w-1.5 h-1.5 rounded-full bg-cfx-border"
            style={{ opacity: 0.4 + Math.abs(Math.cos((i / dots) * Math.PI)) * 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-4 gap-2 opacity-50">
      <DNAHelix />
      <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest text-center leading-relaxed animate-pulse">
        No pattern match<br />Awaiting classification
      </div>
    </div>
  );
}

export default function DNAMatchPanel({ dnaMatch }) {
  const [displaySim, setDisplaySim] = useState(0);
  const [barReady, setBarReady]     = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setBarReady(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!dnaMatch) {
      setDisplaySim(0);
      return;
    }

    const target = dnaMatch.similarity;
    let current  = 0;
    const frames = 30;
    const step   = target / frames;

    timerRef.current = setInterval(() => {
      current += step;
      if (current >= target) {
        setDisplaySim(target);
        clearInterval(timerRef.current);
        timerRef.current = null;
        setTimeout(() => setBarReady(true), 80);
      } else {
        setDisplaySim(Math.round(current));
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dnaMatch]);

  const panelBorder     = getPanelBorderStyle(dnaMatch?.similarity);
  const confidenceStyle = getConfidenceStyle(dnaMatch?.confidence);

  return (
    <div
      className={`panel transition-all duration-500 ${panelBorder}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="panel-title panel-title--compact mb-0">DISRUPTION DNA™</h2>
        {dnaMatch && (
          <span
            className={`text-[9px] font-mono px-2 py-0.5 border rounded transition-all duration-500 ${confidenceStyle}`}
          >
            {dnaMatch.confidence.toUpperCase()}
          </span>
        )}
      </div>

      {!dnaMatch ? (
        <EmptyState />
      ) : (
        <>
          {/* Similarity meter row */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="text-4xl font-bold font-display text-cfx-accent tabular-nums leading-none"
              style={{ textShadow: '0 0 25px rgba(0,212,255,0.45)' }}
            >
              {displaySim}%
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500 mb-0.5 font-mono">Pattern match to:</div>
              <div className="text-sm font-semibold text-white truncate leading-snug">
                {dnaMatch.name}
              </div>
              <div className="mt-2 w-full h-1 bg-cfx-dark rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cfx-accent to-cfx-safe rounded transition-all duration-1000"
                  style={{ width: barReady ? `${dnaMatch.similarity}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Type pill + source */}
          <div className="flex items-center gap-2 mb-4">
            {dnaMatch.type && (
              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-cfx-dark border border-cfx-border rounded text-gray-500">
                {dnaMatch.type}
              </span>
            )}
            <div className="text-[9px] font-mono text-gray-600 bg-cfx-dark px-2 py-1 rounded truncate flex-1">
              Source: {dnaMatch.source}
            </div>
          </div>

          {/* Outcome timeline */}
          <div className="mb-4 border-l-2 border-cfx-border pl-4 space-y-3">
            {dnaMatch.outcomes?.map((outcome, idx) => {
              const isLast = idx === dnaMatch.outcomes.length - 1;
              return (
                <div key={idx} className="relative">
                  {/* timeline dot */}
                  <div
                    className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border ${
                      isLast
                        ? 'bg-cfx-accent border-cfx-accent shadow-[0_0_6px_rgba(0,212,255,0.6)]'
                        : 'bg-cfx-panel border-cfx-accent'
                    }`}
                  />

                  <span
                    className={`text-[9px] font-mono ${
                      isLast ? 'text-cfx-safe' : 'text-cfx-accent'
                    }`}
                  >
                    D+{outcome.day}
                  </span>
                  <p
                    className={`text-xs mt-0.5 leading-relaxed ${
                      isLast ? 'text-white font-medium' : 'text-gray-300'
                    }`}
                  >
                    {outcome.event}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Impact metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-cfx-dark border border-cfx-border rounded p-2">
              <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-1">
                Freight Impact
              </div>
              <div className="text-xs font-mono text-cfx-critical font-bold">
                {dnaMatch.freightRateImpact}
              </div>
            </div>
            <div className="bg-cfx-dark border border-cfx-border rounded p-2">
              <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-1">
                Trade Impact
              </div>
              <div className="text-xs font-mono text-cfx-warn font-bold">
                {dnaMatch.tradeVolumeImpact}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
