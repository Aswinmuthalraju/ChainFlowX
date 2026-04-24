import React from 'react';

const URGENCY_STYLES = {
  IMMEDIATE: { border: 'border-red-500', text: 'text-red-400', pulse: true },
  HIGH:      { border: 'border-yellow-500', text: 'text-yellow-400', pulse: false },
  MODERATE:  { border: 'border-blue-400', text: 'text-blue-400', pulse: false },
};

const VIABILITY_COLORS = {
  HIGH:   'text-green-400 border-green-600',
  MEDIUM: 'text-yellow-400 border-yellow-600',
  LOW:    'text-red-400 border-red-600',
};

export default function StrategicInsightPanel({ eventState, onGenerateInsight, insightLoading }) {
  const insight = eventState?.strategicInsight;
  const industryCascade = eventState?.industryCascade || [];

  if (!eventState?.classified) return null;

  if (!insight) {
    return (
      <div className="panel border-t-2 border-cfx-accent">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-cfx-accent animate-pulse" />
          <h2 className="panel-title mb-0">STRATEGIC INTELLIGENCE</h2>
        </div>
        <div className="bg-cfx-dark border border-cfx-border p-4 text-center" style={{ borderRadius: 2 }}>
          <div className="text-xs text-gray-500 font-mono mb-1">LLM on-device reasoning</div>
          <div className="text-[10px] text-gray-600 font-mono mb-4 leading-relaxed">
            Actionable decisions · Alternative routes · Cost impact · 7-day forecast · Industry risk windows
          </div>
          <button
            onClick={onGenerateInsight}
            disabled={insightLoading}
            className="w-full disabled:opacity-50 font-mono text-xs py-2.5 px-4 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
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
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span>LLM reasoning...</span>
              </span>
            ) : 'Generate Strategic Decision Brief'}
          </button>
        </div>
      </div>
    );
  }

  const urg = URGENCY_STYLES[insight.urgency] || URGENCY_STYLES.MODERATE;
  const altRoutes = insight.alternativeRoutes || [];
  const actionItems = insight.actionItems || [];
  const isLLM = insight._source === 'llm_synthesize';

  return (
    <div className="panel border-t-2 border-cfx-accent space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cfx-accent" />
          <h2 className="panel-title mb-0">STRATEGIC INTELLIGENCE</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-mono px-1.5 py-0.5 border rounded ${isLLM ? 'border-green-700 text-green-500' : 'border-gray-700 text-gray-500'}`}>
            {isLLM ? 'LLM LIVE' : 'OFFLINE MODE'}
          </span>
          <span className={`text-[9px] font-mono px-2 py-0.5 border rounded ${urg.border} ${urg.text} ${urg.pulse ? 'animate-pulse' : ''}`}>
            {insight.urgency}
          </span>
        </div>
      </div>

      {/* Strategic analysis */}
      <div className="border-l-2 border-cfx-accent pl-3">
        <div className="text-[9px] font-mono text-gray-600 uppercase mb-1">Situation Assessment</div>
        <div className="text-xs text-gray-300 leading-relaxed">{insight.strategicAnalysis}</div>
      </div>

      {/* Financial impact — PROMINENT */}
      <div className="bg-cfx-dark border border-cfx-warn px-3 py-2" style={{ borderRadius: 2 }}>
        <div className="text-[9px] font-mono text-gray-600 uppercase mb-1">Financial Exposure</div>
        <div className="text-sm font-mono text-cfx-warn font-bold">{insight.costImpact}</div>
      </div>

      {/* Alternative routes — THE SOLUTION */}
      {altRoutes.length > 0 && (
        <div className="bg-cfx-dark border border-cfx-border p-3" style={{ borderRadius: 2 }}>
          <div className="text-[9px] font-mono text-gray-600 uppercase mb-2">Alternative Routes</div>
          <div className="space-y-2">
            {altRoutes.map((r, i) => (
              <div key={i} className="border border-cfx-border p-2" style={{ borderRadius: 2 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-200">{r.route}</span>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 border rounded ${VIABILITY_COLORS[r.viability] || VIABILITY_COLORS.MEDIUM}`}>
                    {r.viability}
                  </span>
                </div>
                <div className="flex gap-3 text-[10px] font-mono text-gray-500">
                  <span className="text-yellow-500">+{r.delayDays}d</span>
                  <span className="text-red-400">+${r.costDelta?.toLocaleString()}/container</span>
                </div>
                {r.note && (
                  <div className="text-[9px] text-gray-600 mt-1 leading-relaxed">{r.note}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback rerouting text if no structured alt routes */}
      {altRoutes.length === 0 && insight.reroutingAdvice && (
        <div className="bg-cfx-dark border border-cfx-border p-3" style={{ borderRadius: 2 }}>
          <div className="text-[9px] font-mono text-gray-600 uppercase mb-1">Rerouting Recommendation</div>
          <div className="text-xs text-gray-300 leading-relaxed">{insight.reroutingAdvice}</div>
        </div>
      )}

      {/* 7-day forecast */}
      <div className="bg-cfx-dark border border-cfx-border p-3" style={{ borderRadius: 2 }}>
        <div className="text-[9px] font-mono text-gray-600 uppercase mb-2">7-Day Operational Forecast</div>
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

      {/* Action items — what to do NOW */}
      {actionItems.length > 0 && (
        <div className="bg-cfx-dark border border-green-900 p-3" style={{ borderRadius: 2 }}>
          <div className="text-[9px] font-mono text-green-700 uppercase mb-2">Action Items</div>
          <div className="space-y-1.5">
            {actionItems.map((item, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="font-mono text-green-600 shrink-0">{i + 1}.</span>
                <span className="text-gray-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry risk countdown (from industryCascade, not from the LLM layer) */}
      {industryCascade.length > 0 && (
        <div className="bg-cfx-dark border border-cfx-border p-3" style={{ borderRadius: 2 }}>
          <div className="text-[9px] font-mono text-gray-600 uppercase mb-2">Industry Risk Windows</div>
          <div className="space-y-1">
            {industryCascade.map((ind, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">{ind.sector}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono ${ind.riskLevel === 'CRITICAL' ? 'text-red-400' : ind.riskLevel === 'HIGH' ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {ind.riskLevel}
                  </span>
                  <span className="font-mono text-gray-600">D+{ind.daysToRisk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[9px] font-mono text-gray-700 text-center pt-1 border-t border-cfx-border">
        {isLLM ? 'LLM live · On-device · Zero data egress' : 'Deterministic fallback · Connect an LLM for live synthesis'}
      </div>
    </div>
  );
}
