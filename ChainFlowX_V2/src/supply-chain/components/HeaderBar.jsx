import React from 'react';

export default function HeaderBar({
  routeCount = 0,
  rippleIndex = null,
  alertCount = 0,
  isLive = true,
  graphValid = true,
  intelligenceOn = true,
  onIntelligenceToggle,
  mapMode = '3d',
  onMapModeToggle,
  isLoading = false,
  eventHeadline = '',
}) {
  const rippleDisplay =
    rippleIndex != null && Number.isFinite(rippleIndex) ? rippleIndex.toFixed(1) : '—';

  return (
    <header className="wm-header-bar">
      <div className="wm-header-brand">
        <span className="wm-header-icon">⬡</span>
        <div>
          <div className="wm-header-title">CHAINFLOWX</div>
          <div className="wm-header-sub">SUPPLY CHAIN CONTAGION INTELLIGENCE</div>
        </div>
      </div>

      <div className="wm-header-stats">
        <span>
          {routeCount} ROUTES · RIPPLE INDEX: <strong>{rippleDisplay}</strong> · {alertCount} ALERTS
        </span>
        {eventHeadline ? (
          <span className="wm-header-event-hint" title={eventHeadline}>
            {eventHeadline.length > 70 ? `${eventHeadline.slice(0, 70)}…` : eventHeadline}
          </span>
        ) : null}
      </div>

      <div className="wm-header-live">
        {isLive && (
          <span className="wm-live-pill">
            <span className="wm-live-dot" /> LIVE
          </span>
        )}

        <label className="intelligence-toggle" title="Toggle supply chain intelligence">
          <input
            type="checkbox"
            checked={intelligenceOn}
            onChange={(e) => onIntelligenceToggle?.(e.target.checked)}
            className="sr-only"
          />
          <span className={`toggle-track ${intelligenceOn ? 'toggle-on' : ''}`}>
            <span className="toggle-thumb" />
          </span>
          <span className={`toggle-label ${intelligenceOn ? 'text-cfx-accent' : 'text-gray-600'}`}>Intel</span>
        </label>

        <button type="button" className="map-mode-toggle" onClick={() => onMapModeToggle?.()}>
          <span className={mapMode === '3d' ? 'map-mode-active' : ''}>3D</span>
          <span className="map-mode-sep">/</span>
          <span className={mapMode === '2d' ? 'map-mode-active' : ''}>2D</span>
        </button>

        <span className={`status-dot ${graphValid ? 'online' : 'error'}`} />
        {isLoading && <span className="processing-badge">ANALYZING</span>}
      </div>
    </header>
  );
}
