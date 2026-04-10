import { useState, useEffect, useCallback, useRef } from 'react';
import { buildGraph, validateGraph } from './supply-chain/graph/graphUtils.js';
import { runPipeline } from './supply-chain/state/stateManager.js';
import { synthesizeStrategicInsight } from './supply-chain/ai/qwenAI.js';
import { PORTS } from './supply-chain/data/ports.js';
import { ROUTES } from './supply-chain/data/routes.js';
import { CHOKEPOINTS } from './supply-chain/data/chokepoints.js';
import { DEMO_EVENTS, liveifyDemoEvent } from './supply-chain/data/disruptions.js';

import SupplyChainGlobe from './supply-chain/components/SupplyChainGlobe.jsx';
import RippleScorePanel from './supply-chain/components/RippleScorePanel.jsx';
import DNAMatchPanel from './supply-chain/components/DNAMatchPanel.jsx';
import IndustryCascadePanel from './supply-chain/components/IndustryCascadePanel.jsx';
import RouteDetailPanel from './supply-chain/components/RouteDetailPanel.jsx';
import StrategicInsightPanel from './supply-chain/components/StrategicInsightPanel.jsx';

const findDemoEvent = (id) => DEMO_EVENTS.find(evt => evt.id === id) ?? null;

// Demo event map — stable key → event id mapping
const DEMO_EVENT_MAP = {
  cyclone:    findDemoEvent('evt-cyclone-bay'),
  conflict:   findDemoEvent('evt-conflict-redsea'),
  blockage:   findDemoEvent('evt-blockage-suez'),
  strike:     findDemoEvent('evt-sanctions-hormuz'),
  earthquake: findDemoEvent('evt-earthquake-taiwan'),
};

// 5 demo scenes — left panel buttons
const SCENES = [
  { n: 1, key: 'reset',    label: 'Normal Ops',      meta: 'All routes nominal' },
  { n: 2, key: 'cyclone',  label: 'Cyclone Warning', meta: 'Malacca · Ripple ~7.2' },
  { n: 3, key: 'blockage', label: 'Port Blockage',   meta: 'Suez · DNA match 74%' },
  { n: 4, key: 'strike',   label: 'Sanctions Alert', meta: 'Hormuz · cascade active' },
  { n: 5, key: 'conflict', label: 'Cascade Failure', meta: 'Red Sea · Ripple 9.1' },
];

export default function App() {
  const [graph, setGraph]                   = useState(null);
  const [routes, setRoutes]                 = useState(ROUTES);
  const [eventState, setEventState]         = useState(null);
  const [selectedRoute, setSelectedRoute]   = useState(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [graphValid, setGraphValid]         = useState(false);
  const [mapMode, setMapMode]               = useState('3d');
  const [intelligenceOn, setIntelligenceOn] = useState(true);
  const [activeScene, setActiveScene]       = useState(null);

  // Layout states
  const [sidebarWidth, setSidebarWidth]     = useState(30); // percentage
  const [globeHeight, setGlobeHeight]       = useState(450); // pixels
  const [isResizingH, setIsResizingH]       = useState(false);
  const [isResizingV, setIsResizingV]       = useState(false);

  // Build + validate graph on mount
  useEffect(() => {
    const g = buildGraph(PORTS, ROUTES, CHOKEPOINTS);
    const { valid, errors } = validateGraph(g);
    if (!valid) console.warn('[ChainFlowX] Graph issues:', errors);
    else        console.log('[ChainFlowX] Graph validated — all nodes and edges intact');
    setGraph(g);
    setGraphValid(valid);
  }, []);

  // ── Resizing Logic ──────────────────────────────────────────────────────
  const startResizingH = useCallback((e) => {
    e.preventDefault();
    setIsResizingH(true);
  }, []);

  const startResizingV = useCallback((e) => {
    e.preventDefault();
    setIsResizingV(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizingH(false);
    setIsResizingV(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizingH) {
      const newWidth = 100 - (e.clientX / window.innerWidth) * 100;
      setSidebarWidth(Math.min(Math.max(newWidth, 15), 60));
    }
    if (isResizingV) {
      const globeContainer = document.querySelector('.globe-container');
      if (globeContainer) {
        const top = globeContainer.getBoundingClientRect().top;
        const newHeight = e.clientY - top;
        setGlobeHeight(Math.min(Math.max(newHeight, 200), 1200));
      }
    }
  }, [isResizingH, isResizingV]);

  useEffect(() => {
    if (isResizingH || isResizingV) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      document.body.style.userSelect = 'auto';
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      document.body.style.userSelect = 'auto';
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizingH, isResizingV, resize, stopResizing]);

  // ── Pipeline handler ────────────────────────────────────────────────────
  const handleEventTrigger = async (event) => {
    if (!graph) return;

    if (!event) {
      setEventState(null);
      setRoutes(ROUTES.map(r => ({ ...r, currentRisk: r.baseRisk, status: 'normal' })));
      setSelectedRoute(null);
      return;
    }

    if (!intelligenceOn) return;

    setIsLoading(true);
    try {
      const state = await runPipeline(event, graph);
      setEventState(state);
      setRoutes(prev => prev.map(r => ({
        ...r,
        currentRisk: state.riskScores?.[r.id] ?? r.baseRisk,
        status:      getRiskStatus(state.riskScores?.[r.id] ?? r.baseRisk),
      })));
    } catch (err) {
      console.error('[ChainFlowX] Pipeline error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Scene button handler
  const handleSceneSelect = (scene) => {
    try {
      if (isLoading) return;
      if (!intelligenceOn && scene.key !== 'reset') return;

      if (scene.key === 'reset') {
        setActiveScene(null);
        void handleEventTrigger(null);
      } else {
        setActiveScene(scene.n);
        const evt = DEMO_EVENT_MAP[scene.key];
        if (evt) void handleEventTrigger(liveifyDemoEvent(evt));
      }
    } catch (err) {
      console.error('[ChainFlowX] Scene selection failed:', err);
    }
  };

  // Demo dropdown handler (kept for keyboard shortcut fallback)
  const handleDemoSelect = (e) => {
    try {
      const val = e.target.value;
      e.target.value = '';
      if (!val) return;
      if (val === 'reset') { void handleEventTrigger(null); setActiveScene(null); return; }
      const sceneMap = { cyclone: 2, blockage: 3, strike: 4, conflict: 5, earthquake: null };
      setActiveScene(sceneMap[val] ?? null);
      const evt = DEMO_EVENT_MAP[val];
      if (evt) void handleEventTrigger(liveifyDemoEvent(evt));
    } catch (err) {
      console.error('[ChainFlowX] Demo selection failed:', err);
    }
  };

  const handleGenerateInsight = async () => {
    if (!eventState) return;
    setInsightLoading(true);
    try {
      const insight = await synthesizeStrategicInsight(eventState);
      setEventState(prev => ({ ...prev, strategicInsight: insight }));
    } catch (err) {
      console.error('[ChainFlowX] Insight generation failed:', err);
    } finally {
      setInsightLoading(false);
    }
  };

  const showRouteInRight = !!(eventState && selectedRoute);

  const bannerHeadline = eventState?.raw?.headline ?? '';
  const rippleRaw      = eventState?.rippleScore?.raw ?? null;
  const rippleLabel    = eventState?.rippleScore?.label ?? '';

  return (
    <div className="app-container">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header">

        {/* Brand */}
        <div className="brand">
          <span className="brand-name">ChainFlowX</span>
          <span className="brand-tagline">Contagion Intelligence</span>
        </div>

        {/* Centre: AI stack pills */}
        <div className="header-ai-pills">
          <span className="ai-pill ai-pill--green">
            <span className="pill-dot" style={{ background: '#00ff88' }} />
            GEMMA2·9B
          </span>
          <span className="ai-pill ai-pill--blue">
            <span className="pill-dot" style={{ background: '#00d4ff' }} />
            QWEN3.5·9B
          </span>
          <span className="ai-pill ai-pill--cyan">
            <span className="pill-dot" style={{ background: 'rgba(0,212,255,0.5)' }} />
            6-LAYER PIPELINE
          </span>
        </div>

        {/* Right: controls */}
        <div className="header-meta">

          {/* Intelligence toggle */}
          <label className="intelligence-toggle" title="Toggle supply chain intelligence">
            <input
              type="checkbox"
              checked={intelligenceOn}
              onChange={e => setIntelligenceOn(e.target.checked)}
              className="sr-only"
            />
            <span className={`toggle-track ${intelligenceOn ? 'toggle-on' : ''}`}>
              <span className="toggle-thumb" />
            </span>
            <span className={`toggle-label ${intelligenceOn ? 'text-cfx-accent' : 'text-gray-600'}`}>
              Intel
            </span>
          </label>

          {/* Demo event dropdown */}
          <select
            onChange={handleDemoSelect}
            disabled={!intelligenceOn || isLoading}
            className="demo-dropdown"
            defaultValue=""
          >
            <option value="" disabled>▼ Events</option>
            <option value="reset">— Reset</option>
            <option value="cyclone">Cyclone · Malacca</option>
            <option value="blockage">Blockage · Suez</option>
            <option value="strike">Sanctions · Hormuz</option>
            <option value="conflict">Cascade · Red Sea</option>
            <option value="earthquake">Earthquake · Taiwan</option>
          </select>

          {/* 2D / 3D toggle */}
          <button
            className="map-mode-toggle"
            onClick={() => {
              try {
                setMapMode(p => p === '3d' ? '2d' : '3d');
              } catch (err) {
                console.error('[ChainFlowX] Map mode toggle failed:', err);
              }
            }}
          >
            <span className={mapMode === '3d' ? 'map-mode-active' : ''}>3D</span>
            <span className="map-mode-sep">/</span>
            <span className={mapMode === '2d' ? 'map-mode-active' : ''}>2D</span>
          </button>

          {/* Graph status */}
          <span className={`status-dot ${graphValid ? 'online' : 'error'}`} />
          <span className="header-status-text">
            {graphValid ? 'Graph OK' : 'Graph ERR'}
          </span>

          {isLoading && <span className="processing-badge">ANALYZING</span>}
        </div>
      </header>

      {/* ── Tagline bar ─────────────────────────────────────────────────── */}
      <div className="tagline-bar">
        <span className="tagline-text">
          "We don't show you a risk score — we show you the wave."
        </span>
      </div>

      {/* ── Active event banner ─────────────────────────────────────────── */}
      {eventState && (
        <div className="event-banner">
          <span className="event-banner-label">ACTIVE EVENT</span>
          <span className="event-banner-headline">
            {bannerHeadline.length > 90
              ? bannerHeadline.substring(0, 90) + '…'
              : bannerHeadline}
          </span>
          {rippleRaw != null && (
            <span
              className="event-banner-score"
              style={{
                color: rippleRaw >= 8 ? '#ff3b3b'
                     : rippleRaw >= 6 ? '#ff6b35'
                     : rippleRaw >= 4 ? '#ffb800'
                     : '#00ff88',
              }}
            >
              RIPPLE {eventState.rippleScore?.score} · {rippleLabel}
            </span>
          )}
          {eventState.classified?.eventType && (
            <span className="event-banner-type">
              {eventState.classified.eventType.toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* ── Main dashboard — Grid Layout ─────────────────────────────── */}
      <main className="dashboard-container">

        {/* ── LEFT SECTION (70% variable) ── */}
        <div className="left-section" style={{ flex: 1, minWidth: 0 }}>

          {/* Globe */}
          <div className="globe-container" style={{ flex: `0 0 ${globeHeight}px` }}>
            {graph && (
              <SupplyChainGlobe
                routes={routes}
                chokepoints={CHOKEPOINTS}
                eventState={eventState}
                onRouteSelect={setSelectedRoute}
                mapMode={mapMode}
              />
            )}

            {/* Loading — bottom progress bar */}
            {isLoading && (
              <>
                <div className="pipeline-progress">
                  <div className="pipeline-progress-fill" />
                </div>
                <div className="loading-text-overlay">
                  ANALYZING SUPPLY CHAIN · 6-LAYER PIPELINE
                </div>
              </>
            )}

            {/* Globe status bar */}
            <div className="globe-status-bar">
              <span>GDELT · LIVE</span>
              <span className="status-sep">·</span>
              <span style={{ color: graphValid ? '#00ff88' : '#ff3b3b' }}>
                GRAPH {graphValid ? 'OK' : 'ERR'}
              </span>
              <span className="status-sep">·</span>
              <span style={{ color: eventState ? '#00d4ff' : 'var(--muted)' }}>
                {eventState ? 'PIPELINE ACTIVE' : 'MONITORING'}
              </span>
              <span className="status-sep">·</span>
              <span>{ROUTES.length} ROUTES · {CHOKEPOINTS.length} CHOKEPOINTS · 2 AI</span>
            </div>
          </div>

          {/* Vertical Resizer for Globe */}
          <div className={`resizer-vertical ${isResizingV ? 'resizing' : ''}`} onMouseDown={startResizingV} />

          <div className="bottom-metrics-scroll">
            {/* Metrics Row 1: Ripple Score + Disruption Fingerprint */}
            <div className="metrics-row-1">
            <RippleScorePanel rippleScore={eventState?.rippleScore} />
            <DNAMatchPanel dnaMatch={eventState?.dnaMatch?.[0]} />
          </div>

          {/* Metrics Row 2: Industry Cascade + Strategic Risk Overview */}
          <div className="metrics-row-2">
            <IndustryCascadePanel industryCascade={eventState?.industryCascade} />
            {selectedRoute ? (
              <div className="panel">
                <div className="route-detail-header" style={{ marginBottom: 8 }}>
                  <span className="route-detail-label">Strategic Risk Overview</span>
                  <button
                    className="route-close-btn"
                    onClick={() => {
                      try {
                        setSelectedRoute(null);
                      } catch (err) {
                        console.error('[ChainFlowX] Route close failed:', err);
                      }
                    }}
                  >×</button>
                </div>
                <RouteDetailPanel
                  route={selectedRoute}
                  altRoute={eventState?.altRoutes?.[selectedRoute.id]}
                  onClose={() => setSelectedRoute(null)}
                />
              </div>
            ) : (
              <div className="panel empty-panel-box">
                <h2 className="panel-title">STRATEGIC RISK OVERVIEW</h2>
                <div className="empty-panel-content">
                  <div className="empty-panel-icon">◈</div>
                  <div className="empty-panel-text">Select a route on the globe to view strategic risk analysis</div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Horizontal Resizer for Sidebar */}
        <div className={`resizer-horizontal ${isResizingH ? 'resizing' : ''}`} onMouseDown={startResizingH} />

        {/* ── RIGHT SIDEBAR (30% variable) ── */}
        <div className="right-sidebar" style={{ width: `${sidebarWidth}%`, flex: 'none' }}>

          {/* AI Panel — Strategic Intelligence + Forecasts */}
          <div className="ai-panel">
            <StrategicInsightPanel
              eventState={eventState}
              onGenerateInsight={handleGenerateInsight}
              insightLoading={insightLoading}
            />
            {!eventState?.classified && (
              <div className="panel empty-panel-box">
                <h2 className="panel-title">STRATEGIC AI INTELLIGENCE</h2>
                <div className="empty-panel-content">
                  <div className="empty-panel-icon">⬡</div>
                  <div className="empty-panel-text">Trigger an event to activate Qwen3 strategic reasoning</div>
                </div>
              </div>
            )}
          </div>

          {/* Live Intelligence Feed — Scene Buttons */}
          <div className="live-feed-panel">
            <div className="scene-section-label">Live Intelligence Feed</div>
            <div className="live-feed-content">
              {SCENES.map(scene => (
                <button
                  key={scene.n}
                  className={`trigger-btn ${activeScene === scene.n ? 'trigger-btn--active' : ''}`}
                  onClick={() => handleSceneSelect(scene)}
                  disabled={(!intelligenceOn && scene.key !== 'reset') || isLoading}
                >
                  <span className="scene-num">SCENE 0{scene.n}</span>
                  <span className="scene-label-text">{scene.label}</span>
                  <span className="scene-meta">{scene.meta}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Supply Chain Panel — Stats */}
          <div className="supply-chain-panel">
            <div className="panel">
              <h2 className="panel-title">SUPPLY CHAIN</h2>
              <div className="left-empty-stats">
                <div className="left-stat">
                  <span className="left-stat-num">{ROUTES.length}</span>
                  <span className="left-stat-label">Routes</span>
                </div>
                <div className="left-stat">
                  <span className="left-stat-num">{CHOKEPOINTS.length}</span>
                  <span className="left-stat-label">Choke</span>
                </div>
                <div className="left-stat">
                  <span className="left-stat-num">6</span>
                  <span className="left-stat-label">Layers</span>
                </div>
              </div>
              <div className="left-empty-hint">
                Select a scenario to begin analysis
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getRiskStatus(score) {
  if (score >= 86) return 'critical';
  if (score >= 61) return 'severe';
  if (score >= 31) return 'warning';
  return 'normal';
}
