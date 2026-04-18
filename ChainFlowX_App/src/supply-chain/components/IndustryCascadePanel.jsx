import React, { useEffect } from 'react';

export default function IndustryCascadePanel({ industryCascade }) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('IndustryCascade received props:', { industryCascade });
    }
  }, [industryCascade]);

  if (!industryCascade?.length) {
    return (
      <div className="panel opacity-60 ic-panel-body">
        <h2 className="panel-title ic-panel-header">INDUSTRY CASCADE</h2>
        <div className="ic-panel-scroll flex flex-col items-center justify-start py-4 gap-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
            <div className="w-2 h-2 rounded-sm bg-cfx-border" />
            <div className="w-8 h-px bg-cfx-border" />
            <div className="w-2 h-2 rounded-sm bg-cfx-border" />
            <div className="w-8 h-px bg-cfx-border" />
            <div className="w-2 h-2 rounded-sm bg-cfx-border" />
          </div>
          <div className="text-[10px] font-mono text-gray-600 text-center mt-2">
            No downstream cascade detected<br/>
            <span className="text-[9px] text-gray-700">Trigger a supply-chain event near a major chokepoint</span>
          </div>
        </div>
      </div>
    );
  }

  const colorMap = {
    CRITICAL: {
      border: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      badge: 'bg-red-900/50 text-red-400 border-red-800',
    },
    HIGH: {
      border: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      badge: 'bg-amber-900/50 text-amber-400 border-amber-800',
    },
    MODERATE: {
      border: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
      badge: 'bg-green-900/50 text-green-400 border-green-800',
    },
  };

  return (
    <div className="panel ic-panel-body">
      <div className="flex items-center justify-between mb-2 ic-panel-header">
        <h2 className="panel-title mb-0">INDUSTRY CASCADE</h2>
        <span className="text-[9px] font-mono text-cfx-accent">
          {industryCascade.length} SECTORS AT RISK
        </span>
      </div>

      <div className="space-y-2 ic-panel-scroll">
        {industryCascade.map((industry, idx) => {
          const colors = colorMap[industry.riskLevel] || colorMap.MODERATE;

          return (
            <div
              key={idx}
              className="p-3 border transition-all duration-300"
              style={{
                borderRadius: 2,
                borderColor: colors.border,
                background: colors.bg,
                animationDelay: `${idx * 100}ms`,
                animation: 'fadeIn 0.4s ease-out forwards',
              }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold font-display text-white">
                  {industry.sector}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-gray-500">
                    D+{industry.daysToRisk}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 border rounded ${colors.badge}`}
                  >
                    {industry.riskLevel}
                  </span>
                </div>
              </div>

              {/* Companies */}
              <div className="flex flex-wrap gap-1">
                {industry.companies.map((company, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cfx-dark border border-cfx-border text-gray-400"
                  >
                    {company}
                  </span>
                ))}
              </div>

              {/* Risk progress bar */}
              <div className="mt-2">
                <div className="w-full h-0.5 bg-cfx-dark rounded overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000 rounded"
                    style={{
                      width:
                        industry.riskLevel === 'CRITICAL'
                          ? '92%'
                          : industry.riskLevel === 'HIGH'
                          ? '68%'
                          : '40%',
                      background: colors.border,
                      transitionDelay: `${idx * 150}ms`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ic-panel-footer mt-3 text-[9px] font-mono text-gray-700 text-center pt-2 border-t border-cfx-border">
        Cascade-depth gated · Minifies false alarm rate
      </div>
    </div>
  );
}
