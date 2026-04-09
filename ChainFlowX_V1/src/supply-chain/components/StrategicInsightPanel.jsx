import React from 'react';

export default function StrategicInsightPanel({ eventState, onGenerateInsight, insightLoading }) {
  const insight = eventState?.strategicInsight;

  if (!eventState?.classified) return null;

  if (!insight) {
    return (
      <div className="panel border-t-2 border-cfx-accent">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-cfx-accent animate-pulse" />
          <h2 className="panel-title mb-0">STRATEGIC INTELLIGENCE</h2>
        </div>

        <div className="bg-cfx-dark border border-cfx-border p-4 text-center" style={{ borderRadius: 2 }}>
          <div className="text-xs text-gray-500 font-mono mb-3">
            Qwen3:8B on-device reasoning ready
          </div>
          <div className="text-[10px] text-gray-600 font-mono mb-4 leading-relaxed">
            Deep analysis grounded in supply chain data.<br />
            7-day forecast · Cost impact · Rerouting advice
          </div>
          <button
            onClick={onGenerateInsight}
            disabled={insightLoading}
            className="w-full disabled:opacity-50 font-mono text-xs py-2.5 px-4
                       transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.5)',
              color: '#00d4ff',
              borderRadius: 2,
              letterSpacing: '0.08em',
            }}
            onMouseEnter={e => { if (!insightLoading) e.target.style.background = 'rgba(0,212,255,0.08)'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; }}
          >
            {insightLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
                <span>Qwen3 reasoning...</span>
              </span>
            ) : (
              'Generate Strategic Insight'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel border-t-2 border-cfx-accent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cfx-accent" />
          <h2 className="panel-title mb-0">STRATEGIC INTELLIGENCE</h2>
        </div>
        <span
          className={`text-[9px] font-mono px-2 py-0.5 border rounded ${
            insight.urgency === 'IMMEDIATE'
              ? 'border-cfx-critical text-cfx-critical animate-pulse'
              : 'border-cfx-warn text-cfx-warn'
          }`}
        >
          {insight.urgency}
        </span>
      </div>

      {/* Strategic analysis */}
      <div className="border-l-2 border-cfx-accent pl-3 mb-4">
        <div className="text-xs text-gray-300 leading-relaxed">
          {insight.strategicAnalysis}
        </div>
      </div>

      {/* Forecast timeline */}
      <div className="bg-cfx-dark border border-cfx-border p-3 mb-3" style={{ borderRadius: 2 }}>
        <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-2">
          7-Day Forecast
        </div>
        <div className="space-y-2">
          {[
            { day: 'D+1', text: insight.forecast?.day1 },
            { day: 'D+3', text: insight.forecast?.day3 },
            { day: 'D+7', text: insight.forecast?.day7 },
          ].map(({ day, text }) => (
            <div key={day} className="flex gap-3 text-xs">
              <span className="font-mono text-cfx-accent w-8 shrink-0">{day}</span>
              <span className="text-gray-400 leading-relaxed">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rerouting + cost */}
      <div className="text-xs mb-3">
        <div className="text-[9px] font-mono text-gray-600 uppercase mb-1">
          Rerouting Impact
        </div>
        <div className="text-gray-300 leading-relaxed">{insight.reroutingAdvice}</div>
        <div className="mt-2 font-mono text-cfx-warn text-xs">
          Financial: {insight.costImpact}
        </div>
      </div>

      <div className="text-[9px] font-mono text-gray-700 text-center pt-2 border-t border-cfx-border">
        Qwen3:8B · On-device · Zero data egress
      </div>
    </div>
  );
}
