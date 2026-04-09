import React from 'react';

export default function RouteDetailPanel({ route, altRoute }) {
  const statusColor = route.status === 'critical' ? 'text-cfx-critical' : route.status === 'warning' ? 'text-cfx-warn' : 'text-cfx-safe';
  
  return (
    <div className="panel">
      <h2 className="panel-title">ROUTE DETAIL</h2>
      
      <div className="mb-2">
        <div className="text-lg font-bold">{route.name}</div>
        <div className={`text-sm uppercase ${statusColor} font-mono tracking-wider`}>
          Status: {route.status}
        </div>
      </div>

      <div className="my-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Risk Score</span>
          <span className="font-mono">{route.currentRisk.toFixed(0)}/100</span>
        </div>
        <div className="w-full bg-cfx-dark h-2 rounded overflow-hidden">
          <div 
            className={`h-full ${route.currentRisk > 60 ? 'bg-cfx-critical' : route.currentRisk > 30 ? 'bg-cfx-warn' : 'bg-cfx-safe'}`} 
            style={{ width: \`\${route.currentRisk}%\` }}
          />
        </div>
      </div>

      <div className="space-y-1 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Commodity</span>
          <span className="capitalize">{route.commodity.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Vol at Risk</span>
          <span>${route.tradeVolumeM}M</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Normal Transit</span>
          <span>{route.normalTransitDays} days</span>
        </div>
      </div>

      {altRoute && (
        <div className="bg-cfx-dark p-3 border border-cfx-border rounded">
          <div className="text-xs text-gray-500 uppercase mb-2">Alternative Recommendation</div>
          <div className="font-bold text-cfx-accent mb-1">{altRoute.recommended}</div>
          <div className="text-xs text-gray-300">Delay: +{altRoute.delayDays} days</div>
          <div className="text-xs text-gray-300 mb-2">Cost: +${altRoute.costDelta}/container</div>
          {altRoute.congestionNote && (
            <div className="text-xs text-cfx-warn mt-2 bg-yellow-900/30 p-1 border border-yellow-800/50 rounded">
              ⚠️ {altRoute.congestionNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
