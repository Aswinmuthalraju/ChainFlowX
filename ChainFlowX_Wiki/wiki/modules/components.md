# Module: Components
_Last updated: 2026-04-19 | Verified against code: 2026-04-19_

## Purpose
React UI components — globe visualization, analysis panels, live news feed, layout controls.

## Location
`src/supply-chain/components/`

## Key files
- `SupplyChainGlobe.jsx` — main 3D/2D globe (`globe.gl`). Props: routes, chokepoints, eventState, liveVessels, liveAircraft, visibleRail, visiblePipelines, airRoutes. Exposes `ref` for `pointOfView()` control. Falls back to 2D on init error.
- `SupplyChainMonitor.jsx` — summary monitor panel in right sidebar
- `HeaderBar.jsx` — top bar with route count, ripple index, alert count, loading indicator, 2D/3D toggle
- `RippleScorePanel.jsx` — displays ripple score + derivation breakdown
- `DNAMatchPanel.jsx` — shows top DNA fingerprint match with similarity %
- `IndustryCascadePanel.jsx` — lists at-risk industries + companies + days-to-risk
- `RouteDetailPanel.jsx` — single route detail: risk score, alt route, cost delta
- `StrategicRiskOverview.jsx` — high-level risk summary when no route selected
- `StrategicInsightPanel.jsx` — renders Qwen3 strategic insight output
- `EventTrigger.jsx` — right sidebar: manual event input + "Generate Insight" button + reset
- `LiveNewsTicker.jsx` — scrollable live news feed; click → triggers pipeline
- `TickerBar.jsx` — bottom scrolling ticker bar with article headlines
- `IntelligenceFeed.jsx` — full-page intelligence tab view
- `RoutesPage.jsx` — full routes list table (Routes tab)
- `LayerControl.jsx` / `LayerToggle.jsx` — toggles for vessels/aircraft/rail/pipeline layers
- `FeedStatusPanel.jsx` — feed health/status indicator
- `PredictionsPanel.jsx` — predictions display panel
- `TransportLayers.jsx` — renders rail/pipeline overlays
- `RouteRiskIndicator.jsx` — per-route risk color indicator

## Patterns used
- Globe `ref` forwarded via `forwardRef` — parent (App.jsx) calls `globeRef.current.pointOfView()` to auto-pan
- `globeUnavailable` fallback: `onGlobeInitError` prop triggers 2D mode automatically
- Layer visibility controlled by `layerVisibility` state in App.jsx, passed as filtered arrays to globe
- `lastGlobeInteractRef` throttle: auto-pan suppressed for 30s after user interaction

## Known gotchas
- Globe requires WebGL — `globeUnavailable` banner shown if init fails
- `SupplyChainGlobe` renders both maritime + air routes; air routes come from `airRoutes` prop (filtered `transportRoutes`)
- `LayerControl` position overlays on top of globe (absolute positioned)
