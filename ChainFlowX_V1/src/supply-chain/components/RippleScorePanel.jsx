import React, { useEffect, useState } from 'react';

export default function RippleScorePanel({ rippleScore }) {
  const [displayScore, setDisplayScore] = useState("0.0");

  useEffect(() => {
    if (rippleScore) {
      // simple animation
      let current = 0;
      const target = rippleScore.raw;
      const step = target / 30; // 30 frames
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          setDisplayScore(rippleScore.score);
          clearInterval(timer);
        } else {
          setDisplayScore(current.toFixed(1));
        }
      }, 50); // 1.5s total roughly
      return () => clearInterval(timer);
    } else {
      setDisplayScore("0.0");
    }
  }, [rippleScore]);

  const colorClass = !rippleScore ? 'text-cfx-safe' : rippleScore.raw >= 8 ? 'text-cfx-critical' : rippleScore.raw >= 6 ? 'text-cfx-warn' : rippleScore.raw >= 4 ? 'text-cfx-warn' : 'text-cfx-safe';

  return (
    <div className="panel">
      <h2 className="panel-title">Ripple Score™</h2>
      <div className="mb-4">
        <span className={`text-6xl font-bold font-display ${colorClass}`}>
          {displayScore}
        </span>
        <span className="text-xs ml-2 uppercase font-mono text-gray-400 border border-gray-600 px-2 py-1 rounded">
          {rippleScore?.label || 'MODERATE'}
        </span>
      </div>

      <div className="mt-4 border-t border-cfx-border pt-4 text-xs font-mono">
        <div className="grid grid-cols-3 gap-2 text-gray-500 mb-2">
          <div>Component</div>
          <div>Formula</div>
          <div className="text-right">Value</div>
        </div>
        {rippleScore?.derivation && Object.entries(rippleScore.derivation).map(([key, data]) => (
          <div key={key} className="grid grid-cols-3 gap-2 mb-1">
            <div className="capitalize">{key}</div>
            <div className="text-gray-400">{data.formula}</div>
            <div className="text-right text-cfx-accent">{data.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-[0.6rem] text-gray-500 uppercase tracking-widest">
        "Every digit is derivable"
      </div>
    </div>
  );
}
