import React from 'react';

export default function DNAMatchPanel({ dnaMatch }) {
  if (!dnaMatch) {
    return (
      <div className="panel opacity-50">
        <h2 className="panel-title">Disruption DNA™</h2>
        <div className="text-sm">Awaiting event classification...</div>
      </div>
    );
  }

  const simColor = dnaMatch.similarity >= 80 ? 'border-cfx-safe text-cfx-safe shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 
                   dnaMatch.similarity >= 60 ? 'border-cfx-warn text-cfx-warn' : 'border-gray-500 text-gray-400';

  return (
    <div className={`panel border-2 ${simColor} transition-all duration-500`}>
      <h2 className="panel-title text-gray-300">Disruption DNA™ Match</h2>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-bold font-display">{dnaMatch.similarity}%</div>
          <div className="text-xs uppercase">{dnaMatch.confidence}</div>
        </div>
      </div>

      <div className="text-lg font-semibold mb-2">{dnaMatch.name}</div>
      <div className="text-xs text-gray-400 mb-4 bg-black/30 p-2 rounded">Source: {dnaMatch.source}</div>

      <div className="space-y-2 mb-4">
        {dnaMatch.outcomes?.map((outcome, idx) => (
          <div key={idx} className="flex gap-2 text-sm">
            <span className="font-mono text-cfx-accent w-10 shrink-0">D+{outcome.day}</span>
            <span className="text-gray-300">{outcome.event}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-cfx-dark p-2 border border-cfx-border rounded">
          <div className="text-gray-500 uppercase mb-1">Freight Impact</div>
          <div className="text-cfx-critical font-mono">{dnaMatch.freightRateImpact}</div>
        </div>
        <div className="bg-cfx-dark p-2 border border-cfx-border rounded">
          <div className="text-gray-500 uppercase mb-1">Trade Impact</div>
          <div className="text-cfx-warn font-mono">{dnaMatch.tradeVolumeImpact}</div>
        </div>
      </div>
    </div>
  );
}
