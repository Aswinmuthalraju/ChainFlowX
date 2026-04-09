import React from 'react';

export default function StrategicInsightPanel({ eventState, onGenerateInsight, insightLoading }) {
  const insight = eventState?.strategicInsight;

  if (!eventState?.classified) return null;

  return (
    <div className="panel border-t-4 border-t-indigo-500">
      <h2 className="panel-title flex items-center gap-2">
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
        STRATEGIC INTELLIGENCE
      </h2>

      {!insight ? (
        <div className="text-center py-4">
          <button 
            onClick={onGenerateInsight}
            disabled={insightLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs py-2 px-4 rounded transition-colors"
          >
            {insightLoading ? 'Qwen3 reasoning. . .' : 'Generate Strategic Insight'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-[fadeIn_0.5s_ease-in-out]">
          <div className="flex justify-between items-start">
             <div className={`px-2 py-1 text-[10px] font-mono border rounded ${insight.urgency === 'IMMEDIATE' ? 'border-red-500 text-red-500 animate-pulse' : 'border-amber-500 text-amber-500'}`}>
               URGENCY: {insight.urgency}
             </div>
          </div>
          
          <div className="text-sm text-gray-200 leading-relaxed border-l-2 border-indigo-500 pl-3">
            {insight.strategicAnalysis}
          </div>

          <div className="bg-cfx-dark border border-cfx-border p-3 rounded">
            <div className="text-xs text-gray-500 uppercase mb-2">7-Day Forecast</div>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2"><span className="text-cfx-accent w-8 shrink-0">D+1</span><span className="text-gray-300">{insight.forecast.day1}</span></div>
              <div className="flex gap-2"><span className="text-cfx-accent w-8 shrink-0">D+3</span><span className="text-gray-300">{insight.forecast.day3}</span></div>
              <div className="flex gap-2"><span className="text-cfx-accent w-8 shrink-0">D+7</span><span className="text-gray-300">{insight.forecast.day7}</span></div>
            </div>
          </div>

          <div className="text-xs">
            <span className="text-gray-500 uppercase block mb-1">Rerouting Impact Analysis</span>
            <span className="text-gray-300">{insight.reroutingAdvice}</span>
            <div className="mt-1 font-mono text-cfx-warn">Financial Impact: {insight.costImpact}</div>
          </div>

          <div className="text-[10px] text-center text-gray-600 font-mono mt-4 pt-2 border-t border-cfx-border">
            Powered by Qwen3:8B — On-device AI, Zero data egress
          </div>
        </div>
      )}
    </div>
  );
}
