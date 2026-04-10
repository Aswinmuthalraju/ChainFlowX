import React from 'react';

export default function RouteDetailPanel({ route, altRoute, onClose }) {
  const riskValue = route.currentRisk ?? route.baseRisk;

  const riskColor =
    riskValue >= 86
      ? '#ef4444'
      : riskValue >= 61
      ? '#f97316'
      : riskValue >= 31
      ? '#f59e0b'
      : '#10b981';

  const riskTextClass =
    riskValue >= 86
      ? 'text-cfx-critical'
      : riskValue >= 61
      ? 'text-orange-400'
      : riskValue >= 31
      ? 'text-cfx-warn'
      : 'text-cfx-safe';

  return (
    <div className="panel border border-cfx-accent/30 bg-cfx-panel">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="panel-title mb-1">ROUTE DETAIL</h2>
          <div className="text-[9px] font-mono text-gray-600">{route.id}</div>
        </div>
        {onClose && (
          <button
            onClick={() => {
              try {
                onClose();
              } catch (err) {
                console.error('[ChainFlowX] Route detail close failed:', err);
              }
            }}
            className="text-gray-600 hover:text-gray-400 text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-cfx-dark transition-colors cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* Route path visualization */}
      <div className="flex items-center gap-2 mb-4 bg-cfx-dark border border-cfx-border rounded-lg p-3">
        <div className="flex-1 text-center">
          <div className="text-xs font-bold text-white">{route.from?.name}</div>
          <div className="text-[9px] text-gray-600 font-mono mt-0.5">ORIGIN</div>
        </div>
        <div className="flex-1 flex items-center gap-1">
          <div
            className="flex-1 h-px relative overflow-hidden"
            style={{
              background: 'linear-gradient(to right, rgba(0,212,255,0.4), #00d4ff)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, transparent, #00d4ff, transparent)',
                animation: 'shimmer 2s ease-in-out infinite',
              }}
            />
          </div>
          <div className="text-[8px] font-mono text-cfx-accent">&#9654;</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-xs font-bold text-white">{route.to?.name}</div>
          <div className="text-[9px] text-gray-600 font-mono mt-0.5">DESTINATION</div>
        </div>
      </div>

      {/* Risk score */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-mono text-gray-500 uppercase">
            Current Risk
          </span>
          <span className={`text-sm font-bold font-mono ${riskTextClass}`}>
            {riskValue.toFixed(0)}/100
          </span>
        </div>
        <div className="w-full h-1.5 bg-cfx-dark rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${riskValue}%`,
              background: riskColor,
            }}
          />
        </div>
      </div>

      {/* Route meta */}
      <div className="space-y-1.5 text-xs mb-4">
        <div className="flex justify-between">
          <span className="text-gray-500 font-mono">COMMODITY</span>
          <span className="capitalize text-gray-300">
            {route.commodity?.replace('_', ' ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-mono">VOLUME AT RISK</span>
          <span className="text-cfx-warn font-mono">${route.tradeVolumeM}M/day</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-mono">NORMAL TRANSIT</span>
          <span className="text-gray-300 font-mono">{route.normalTransitDays}d</span>
        </div>
        {route.chokepoint && (
          <div className="flex justify-between">
            <span className="text-gray-500 font-mono">CHOKEPOINT</span>
            <span className="text-cfx-accent font-mono text-[10px]">
              {route.chokepoint}
            </span>
          </div>
        )}
      </div>

      {/* Alt route recommendation */}
      {altRoute && (
        <div className="bg-cfx-dark border border-cfx-border rounded-lg p-3">
          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-2">
            Alternative Route
          </div>
          <div className="text-sm font-semibold text-cfx-accent mb-2">
            {altRoute.recommended}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
            <div>
              <div className="text-gray-600 text-[9px]">DELAY</div>
              <div className="text-cfx-warn">+{altRoute.delayDays}d</div>
            </div>
            <div>
              <div className="text-gray-600 text-[9px]">EXTRA COST</div>
              <div className="text-cfx-warn">+${altRoute.costDelta}/ctr</div>
            </div>
          </div>
          {altRoute.congestionNote && (
            <div className="text-[10px] font-mono text-amber-500/80 bg-amber-900/20 border border-amber-900/40 rounded px-2 py-1">
              {altRoute.congestionNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
