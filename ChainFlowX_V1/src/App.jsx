import { useState, useEffect } from 'react';
import { buildGraph, validateGraph } from './supply-chain/graph/graphUtils.js';
import { runPipeline } from './supply-chain/state/stateManager.js';
import { synthesizeStrategicInsight } from './supply-chain/ai/qwenAI.js';
import { PORTS } from './supply-chain/data/ports.js';
import { ROUTES } from './supply-chain/data/routes.js';
import { CHOKEPOINTS } from './supply-chain/data/chokepoints.js';
import { DEMO_EVENTS } from './supply-chain/data/disruptions.js';

import SupplyChainGlobe from './supply-chain/components/SupplyChainGlobe.jsx';
import RippleScorePanel from './supply-chain/components/RippleScorePanel.jsx';
import DNAMatchPanel from './supply-chain/components/DNAMatchPanel.jsx';
import IndustryCascadePanel from './supply-chain/components/IndustryCascadePanel.jsx';
import RouteDetailPanel from './supply-chain/components/RouteDetailPanel.jsx';
import StrategicInsightPanel from './supply-chain/components/StrategicInsightPanel.jsx';

// Demo event map — key → DEMO_EVENTS entry
const DEMO_EVENT_MAP = {
  cyclone:    DEMO_EVENTS[0],
  conflict:   DEMO_EVENTS[1],
  blockage:   DEMO_EVENTS[2],
  strike:     DEMO_EVENTS[3],
  earthquake: DEMO_EVENTS[4],
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

  // Build + validate graph on mount
  useEffect(() => {
    const g = buildGraph(PORTS, ROUTES, CHOKEPOINTS);
    const { valid, errors } = validateGraph(g);
    if (!valid) console.warn('[ChainFlowX] Graph issues:', errors);
    else        console.log('[ChainFlowX] Graph validated — all nodes and edges intact');
    setGraph(g);
    setGraphValid(valid);
  }, []);

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
    if (isLoading) return;
    if (!intelligenceOn && scene.key !== 'reset') return;

    if (scene.key === 'reset') {
      setActiveScene(null);
      handleEventTrigger(null);
    } else {
      setActiveScene(scene.n);
      const evt = DEMO_EVENT_MAP[scene.key];
      if (evt) handleEventTrigger(evt);
    }
  };

  // Demo dropdown handler (kept for keyboard shortcut fallback)
  const handleDemoSelect = (e) => {
    const val = e.target.value;
    e.target.value = '';
    if (!val) return;
    if (val === 'reset') { handleEventTrigger(null); setActiveScene(null); return; }
    const sceneMap = { cyclone: 2, blockage: 3, strike: 4, conflict: 5, earthquake: null };
    setActiveScene(sceneMap[val] ?? null);
    const evt = DEMO_EVENT_MAP[val];
    if (evt) handleEventTrigger(evt);
  };

  const handleGenerateInsight = async () => {
    if (!eventState) return;
    setInsightLoading(true);
    try {
      const insight = await synthesizeStrategicInsight(eventState);
      setEventState(prev => ({ ...prev, strategicInsight: insight }));
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
            GEMMA4·E4B
          </span>
          <span className="ai-pill ai-pill--blue">
            <span className="pill-dot" style={{ background: '#00d4ff' }} />
            QWEN3·8B
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
            onClick={() => setMapMode(p => p === '3d' ? '2d' : '3d')}
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

      {/* ── Main dashboard ──────────────────────────────────────────────── */}
      <main className="dashboard">

        {/* ── Left panel — scene buttons ── */}
        <aside className="left-panel">

          {/* Scene trigger buttons */}
          <div className="scene-section-label">Demo Scenarios</div>
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

          {/* Route detail — only when no active event */}
          {selectedRoute && !showRouteInRight && (
            <div className="route-detail-wrapper">
              <div className="route-detail-header">
                <span className="route-detail-label">Route Detail</span>
                <button
                  className="route-close-btn"
                  onClick={() => setSelectedRoute(null)}
                >×</button>
              </div>
              <RouteDetailPanel
                route={selectedRoute}
                altRoute={eventState?.altRoutes?.[selectedRoute.id]}
                onClose={() => setSelectedRoute(null)}
              />
            </div>
          )}

          {/* Stats block at bottom when idle */}
          {!selectedRoute && !eventState && (
            <div className="left-empty-state">
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
                Select a scenario above to begin analysis
              </div>
            </div>
          )}
        </aside>

        {/* ── Globe center ── */}
        <section className="globe-section">
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
        </section>

        {/* ── Right intelligence panel ── */}
        <aside className="right-panel">
          {showRouteInRight ? (
            <div className="route-detail-wrapper" style={{ padding: 0, borderTop: 'none' }}>
              <div className="route-detail-header" style={{ marginBottom: 8 }}>
                <span className="route-detail-label">Route Analysis</span>
                <button
                  className="route-close-btn"
                  onClick={() => setSelectedRoute(null)}
                >×</button>
              </div>
              <RouteDetailPanel
                route={selectedRoute}
                altRoute={eventState?.altRoutes?.[selectedRoute.id]}
                onClose={() => setSelectedRoute(null)}
              />
            </div>
          ) : (
            <>
              <RippleScorePanel rippleScore={eventState?.rippleScore} />
              <DNAMatchPanel dnaMatch={eventState?.dnaMatch?.[0]} />
              {eventState?.rippleScore && (
                <IndustryCascadePanel industryCascade={eventState?.industryCascade} />
              )}
              <StrategicInsightPanel
                eventState={eventState}
                onGenerateInsight={handleGenerateInsight}
                insightLoading={insightLoading}
              />
            </>
          )}
        </aside>
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
