import React from 'react';

export default function RouteDetailPanel({ route, altRoute, onClose }) {
  const riskValue = route.currentRisk ?? route.baseRisk;
  const hasChokepoints = Array.isArray(route.chokepoints) && route.chokepoints.length > 0;
  const hasVessels = Array.isArray(route.vesselNames) && route.vesselNames.length > 0;
  const transitLabel =
    route.normalTransitHours != null
      ? route.normalTransitHours < 24
        ? `${route.normalTransitHours}h`
        : `${Math.round(route.normalTransitHours / 24)}d`
      : `${route.normalTransitDays || '-'}d`;

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
            onClick={onClose}
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
          <span className="text-cfx-warn font-mono">${route.tradeVolumeM}B/year</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-mono">NORMAL TRANSIT</span>
          <span className="text-gray-300 font-mono">{transitLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-mono">PORT ABSORPTION</span>
          <span className="text-gray-300 font-mono">
            {route.portAbsorptionCapacity != null ? `${Math.round(route.portAbsorptionCapacity * 100)}%` : 'N/A'}
          </span>
        </div>
        {route.chokepoint && (
          <div className="flex justify-between">
            <span className="text-gray-500 font-mono">CHOKEPOINT</span>
            <span className="text-cfx-accent font-mono text-[10px]">
              {route.chokepoint}
            </span>
          </div>
        )}
        {route.currentPosition && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cfx-border/40">
            <div>
              <div className="text-[9px] text-gray-600 font-mono">LIVE POSITION</div>
              <div className="text-[10px] text-cfx-accent font-mono">
                {route.currentPosition.lat?.toFixed?.(2)}, {route.currentPosition.lng?.toFixed?.(2)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600 font-mono">JOURNEY COMPLETE</div>
              <div className="text-[10px] text-gray-300 font-mono">
                {Math.round((route.currentPosition.fraction || 0) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {hasChokepoints && (
        <div className="mb-4 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
          <div className="text-[9px] font-mono text-red-300 uppercase tracking-widest mb-2">
            Critical Chokepoints
          </div>
          <div className="flex flex-wrap gap-2">
            {route.chokepoints.map((cp) => (
              <span key={`${route.id}-${cp}`} className="text-[10px] text-red-200 bg-red-900/30 border border-red-800/50 rounded px-2 py-1">
                {cp}
              </span>
            ))}
          </div>
        </div>
      )}

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

      {hasVessels && (
        <div className="bg-cfx-dark border border-cfx-border rounded-lg p-3 mt-3">
          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-2">
            Active Vessels
          </div>
          <ul className="space-y-1">
            {route.vesselNames.map((vessel) => (
              <li key={`${route.id}-${vessel}`} className="text-[10px] font-mono text-cfx-accent">
                {vessel}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          className="px-3 py-2 rounded border border-cfx-accent/40 text-cfx-accent text-[10px] font-mono hover:bg-cfx-accent/10 transition-colors"
        >
          Trigger Alert
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded border border-cfx-border text-gray-300 text-[10px] font-mono hover:bg-cfx-dark transition-colors"
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
