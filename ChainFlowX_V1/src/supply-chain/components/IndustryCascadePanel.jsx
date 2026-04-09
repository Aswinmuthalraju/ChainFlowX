import React from 'react';

export default function IndustryCascadePanel({ industryCascade }) {
  if (!industryCascade?.length) {
    return (
      <div className="panel bg-[#0d1321] border border-[#1e2d4a] rounded-lg p-4">
        <h2 className="text-[#64748b] text-[10px] uppercase font-mono tracking-widest mb-3">Industry Cascade</h2>
        <div className="text-sm text-gray-500">No industries at risk at current cascade depth.</div>
      </div>
    );
  }

  return (
    <div className="panel bg-[#0d1321] border border-[#1e2d4a] rounded-lg p-4">
      <h2 className="text-[#64748b] text-[10px] uppercase font-mono tracking-widest mb-3">Industry Cascade</h2>
      
      <div className="space-y-3">
        {industryCascade.map((ind, idx) => {
          let badgeColor = 'bg-green-900/50 text-green-400 border-green-800';
          if (ind.riskLevel === 'CRITICAL') badgeColor = 'bg-red-900/50 text-red-400 border-red-800';
          else if (ind.riskLevel === 'HIGH') badgeColor = 'bg-amber-900/50 text-amber-400 border-amber-800';

          return (
            <div key={idx} className="bg-[#060912] border border-[#1e2d4a] rounded p-3 animate-[fadeIn_0.5s_ease-in-out_forwards]" style={{ animationDelay: \`\${idx * 0.1}s\` }}>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-sm tracking-wide">{ind.sector}</div>
                <div className={`text-[10px] px-2 py-0.5 rounded border ${badgeColor} font-mono`}>{ind.riskLevel}</div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {ind.companies.map((c, i) => (
                  <span key={i} className="text-[10px] bg-[#1e2d4a] px-1.5 py-0.5 rounded text-gray-300">{c}</span>
                ))}
              </div>
              <div className="text-xs text-gray-400">
                Supply risk window: <span className="text-[#00d4ff] font-mono">D+{ind.daysToRisk}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 text-center text-[10px] text-gray-600 font-mono">Cascade-depth gated — no false alarms</div>
    </div>
  );
}
