import React, { useEffect, useState, useRef } from 'react';

const DERIVATION_LABELS = {
  cascade:    'Cascade Depth',
  trade:      'Trade Volume',
  absorption: 'Absorption Cap.',
  time:       'Time Decay',
  commodity:  'Commodity Crit.',
};

function getScoreColor(raw) {
  if (raw >= 8) return 'text-cfx-critical';
  if (raw >= 6) return 'text-cfx-warn';
  if (raw >= 4) return 'text-cfx-warn';
  return 'text-cfx-safe';
}

function getScoreGradient(raw) {
  if (raw >= 8) return 'linear-gradient(90deg, #ef4444, #dc2626)';
  if (raw >= 6) return 'linear-gradient(90deg, #f97316, #ef4444)';
  if (raw >= 4) return 'linear-gradient(90deg, #f59e0b, #f97316)';
  return 'linear-gradient(90deg, #10b981, #059669)';
}

function getLabelStyle(label) {
  switch (label) {
    case 'CRITICAL':
      return 'border-cfx-critical text-cfx-critical shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    case 'SEVERE':
      return 'border-orange-500 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.3)]';
    case 'ELEVATED':
      return 'border-cfx-warn text-cfx-warn shadow-[0_0_8px_rgba(245,158,11,0.3)]';
    case 'MODERATE':
      return 'border-cfx-safe text-cfx-safe shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    default:
      return 'border-gray-600 text-gray-500';
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3 opacity-40">
      <div className="flex gap-1 items-center">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-cfx-border"
            style={{ height: `${10 + Math.abs(Math.sin(i) * 18)}px` }}
          />
        ))}
      </div>
      <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">
        Awaiting event data...
      </div>
    </div>
  );
}

export default function RippleScorePanel({ rippleScore }) {
  const [displayScore, setDisplayScore] = useState('—');
  const [barsReady, setBarsReady] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setBarsReady(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!rippleScore) {
      setDisplayScore('—');
      return;
    }

    const target = rippleScore.raw;
    let current = 0;
    const frames = 30;
    const step = target / frames;

    timerRef.current = setInterval(() => {
      current += step;
      if (current >= target) {
        setDisplayScore(rippleScore.score);
        clearInterval(timerRef.current);
        timerRef.current = null;
        // slight delay so bar transitions fire after score lands
        setTimeout(() => setBarsReady(true), 80);
      } else {
        setDisplayScore(current.toFixed(1));
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rippleScore]);

  const scoreColor   = rippleScore ? getScoreColor(rippleScore.raw)   : 'text-gray-700';
  const scoreGradient = rippleScore ? getScoreGradient(rippleScore.raw) : 'linear-gradient(90deg, #1e2d4a, #1e2d4a)';
  const labelStyle   = getLabelStyle(rippleScore?.label);
  const meterWidth   = rippleScore ? `${Math.min(100, rippleScore.raw * 10)}%` : '0%';

  return (
    <div className="panel border-t-2 border-t-cfx-accent">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="panel-title mb-0">RIPPLE SCORE™</h2>
        <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
          Propagation Index
        </div>
      </div>

      {/* Big score */}
      <div className="flex items-end gap-3 mb-4">
        <span
          className={`text-7xl font-bold font-display leading-none transition-colors duration-500 ${scoreColor}`}
          style={{
            textShadow: rippleScore?.raw >= 8
              ? '0 0 30px rgba(239,68,68,0.5)'
              : rippleScore?.raw >= 6
              ? '0 0 30px rgba(245,158,11,0.4)'
              : rippleScore
              ? '0 0 30px rgba(16,185,129,0.4)'
              : 'none',
          }}
        >
          {displayScore}
        </span>

        <div className="pb-2 flex flex-col gap-1">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 border rounded transition-all duration-500 ${
              rippleScore ? labelStyle : 'border-gray-700 text-gray-700'
            }`}
          >
            {rippleScore?.label || 'AWAITING'}
          </span>
          <span className="text-[9px] text-gray-600 font-mono">/ 10.0 MAX</span>
        </div>
      </div>

      {/* Score meter (full width) */}
      <div className="mb-4">
        <div className="w-full h-1.5 bg-cfx-dark rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: meterWidth,
              background: scoreGradient,
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-gray-600 mt-1">
          <span>0 MODERATE</span>
          <span>4 ELEVATED</span>
          <span>6 SEVERE</span>
          <span>8 CRITICAL</span>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="border-t border-cfx-border pt-3">
        <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-3">
          Score Derivation
        </div>

        {!rippleScore ? (
          <EmptyState />
        ) : (
          <div>
            {Object.entries(rippleScore.derivation).filter(([, data]) => data && typeof data === 'object' && 'formula' in data).map(([key, data], idx) => (
              <div key={key} className="mb-3">
                <div className="flex justify-between items-baseline text-[10px] font-mono mb-1">
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-gray-400">
                      {DERIVATION_LABELS[key] || key}
                    </span>
                    <span className="text-[8px] text-gray-600 hidden sm:inline">
                      {data.formula}
                    </span>
                  </div>
                  <span className="text-cfx-accent tabular-nums">{data.value}</span>
                </div>
                <div className="w-full h-0.5 bg-cfx-dark rounded overflow-hidden">
                  <div
                    className="h-full bg-cfx-accent rounded transition-all duration-700"
                    style={{
                      width: barsReady
                        ? `${Math.min(100, (parseFloat(data.value) / 10) * 100)}%`
                        : '0%',
                      transitionDelay: `${idx * 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backtested footnote */}
      <div className="mt-3 pt-3 border-t border-cfx-border text-[9px] font-mono text-gray-600 leading-relaxed">
        <span className="text-gray-700 uppercase tracking-wider">Back-tested: </span>
        Suez 2021 ±18% · Red Sea 2024 ±12% · COVID ±20%
      </div>
    </div>
  );
}
