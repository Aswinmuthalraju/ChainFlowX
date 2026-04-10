import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { buildGraph, validateGraph } from './supply-chain/graph/graphUtils.js';
import { runPipeline, haversineKm } from './supply-chain/state/stateManager.js';
import { synthesizeStrategicInsight } from './supply-chain/ai/qwenAI.js';
import { PORTS } from './supply-chain/data/ports.js';
import { ROUTES } from './supply-chain/data/routes.js';
import { CHOKEPOINTS } from './supply-chain/data/chokepoints.js';
import { startLiveEventFeed, liveArticleToPipelineEvent } from './supply-chain/data/liveEventFeed.js';
import { positionTracker } from './supply-chain/engine/positionTracker.js';
import { RAIL_CORRIDORS } from './supply-chain/data/transportRail.js';
import { PIPELINE_CORRIDORS } from './supply-chain/data/transportPipeline.js';
import {
  getTransportSimulationRoutes,
  generateShipsOnRoutes,
  generateAircraftOnRoutes,
  advanceSimulatedTransport,
} from './supply-chain/data/simulateTransportOnRoutes.js';

import SupplyChainGlobe from './supply-chain/components/SupplyChainGlobe.jsx';
import LayerControl from './supply-chain/components/LayerControl.jsx';
import RippleScorePanel from './supply-chain/components/RippleScorePanel.jsx';
import DNAMatchPanel from './supply-chain/components/DNAMatchPanel.jsx';
import IndustryCascadePanel from './supply-chain/components/IndustryCascadePanel.jsx';
import RouteDetailPanel from './supply-chain/components/RouteDetailPanel.jsx';
import StrategicInsightPanel from './supply-chain/components/StrategicInsightPanel.jsx';
import SupplyChainMonitor from './supply-chain/components/SupplyChainMonitor.jsx';
import StrategicRiskOverview from './supply-chain/components/StrategicRiskOverview.jsx';
import LiveNewsTicker from './supply-chain/components/LiveNewsTicker.jsx';
import HeaderBar from './supply-chain/components/HeaderBar.jsx';
import TickerBar from './supply-chain/components/TickerBar.jsx';
import RoutesPage from './supply-chain/components/RoutesPage.jsx';
import IntelligenceFeed from './supply-chain/components/IntelligenceFeed.jsx';

function findNearestRoute(routes, lat, lng) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  let best = null;
  let bestD = Infinity;
  for (const r of routes) {
    const d = Math.min(
      haversineKm(lat, lng, r.from.lat, r.from.lng),
      haversineKm(lat, lng, r.to.lat, r.to.lng),
    );
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  if (best && bestD <= 1200) return best;
  return null;
}

function routeArcMidpoint(route) {
  if (!route?.from || !route?.to) return null;
  const lat = (route.from.lat + route.to.lat) / 2;
  let dLon = route.to.lng - route.from.lng;
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  let lng = route.from.lng + dLon / 2;
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return { lat, lng };
}

export default function App() {
  const [graph, setGraph] = useState(null);
  const [routes, setRoutes] = useState(ROUTES);
  const [activePage, setActivePage] = useState('dashboard');
  const [eventState, setEventState] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [graphValid, setGraphValid] = useState(false);
  const [mapMode, setMapMode] = useState('3d');
  const [intelligenceOn, setIntelligenceOn] = useState(true);
  const [liveArticles, setLiveArticles] = useState([]);
  const [feedUpdatedAt, setFeedUpdatedAt] = useState(0);
  const [globeRings, setGlobeRings] = useState([]);
  const [liveVessels, setLiveVessels] = useState([]);
  const [liveAircraft, setLiveAircraft] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({
    vessels: true,
    aircraft: true,
    rail: true,
    pipelines: true,
  });
  const [globeUnavailable, setGlobeUnavailable] = useState(false);

  // V1 Layout States
  const [sidebarWidth, setSidebarWidth] = useState(30);
  const [globeHeight, setGlobeHeight] = useState(450);
  const [isResizingH, setIsResizingH] = useState(false);
  const [isResizingV, setIsResizingV] = useState(false);

  const isLoadingRef = useRef(false);
  const intelligenceRef = useRef(intelligenceOn);
  const autoTriggeredUrlsRef = useRef(new Set());
  const pipelineHandlerRef = useRef(null);
  const globeRef = useRef(null);
  const lastGlobeInteractRef = useRef(0);
  const didAutoInitRef = useRef(false);
  const autoInitPendingRef = useRef(false);
  const transportRoutes = useMemo(() => getTransportSimulationRoutes(ROUTES), []);
  const airRoutes = useMemo(() => transportRoutes.filter((route) => route.type === 'air'), [transportRoutes]);
  const transportRouteMap = useMemo(() => {
    const map = new Map();
    transportRoutes.forEach((route) => map.set(route.id, route));
    return map;
  }, [transportRoutes]);

  const selectedRoute = useMemo(
    () => (selectedRouteId ? routes.find((r) => r.id === selectedRouteId) ?? null : null),
    [routes, selectedRouteId],
  );

  useEffect(() => {
    positionTracker.setRoutes(ROUTES);
    const unsubscribe = positionTracker.subscribe((trackedRoutes) => {
      const trackedMap = new Map(trackedRoutes.map((route) => [route.id, route]));
      setRoutes((prev) =>
        prev.map((route) => {
          const tracked = trackedMap.get(route.id);
          if (!tracked) return route;
          return {
            ...route,
            currentPosition: tracked.currentPosition,
            status: tracked.status === 'arrived' ? tracked.status : route.status,
          };
        }),
      );
    });
    positionTracker.start();

    return () => {
      unsubscribe();
      positionTracker.stop();
    };
  }, []);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    intelligenceRef.current = intelligenceOn;
  }, [intelligenceOn]);

  useEffect(() => {
    const g = buildGraph(PORTS, ROUTES, CHOKEPOINTS);
    const { valid, errors } = validateGraph(g);
    if (!valid) console.warn('[ChainFlowX] Graph issues:', errors);
    else console.log('[ChainFlowX] Graph validated');
    setGraph(g);
    setGraphValid(valid);
  }, []);

  useEffect(() => {
    // Demo-focused fallback: keep transport on monitored routes only.
    setLiveVessels(generateShipsOnRoutes(transportRoutes));
    setLiveAircraft(generateAircraftOnRoutes(transportRoutes));
  }, [transportRoutes]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveVessels((prev) => advanceSimulatedTransport(prev, transportRouteMap));
      setLiveAircraft((prev) => advanceSimulatedTransport(prev, transportRouteMap));
    }, 7000);

    return () => window.clearInterval(interval);
  }, [transportRouteMap]);

  const addGlobeRing = useCallback((ev) => {
    const id = String(ev?.id || ev?.url || "ring-" + Date.now());
    const sev = typeof ev?.severity === 'number' ? ev.severity : 0.65;
    const lat = ev?.lat;
    const lng = ev?.lng;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (lat === 0 && lng === 0) return;
    setGlobeRings((prev) => [...prev.filter((r) => r.id !== id), { id, lat, lng, severity: sev }]);
    window.setTimeout(() => {
      setGlobeRings((p) => p.filter((r) => r.id !== id));
    }, 8000);
  }, []);

  const handleGlobeFocus = useCallback((lat, lng) => {
    if (Date.now() - lastGlobeInteractRef.current < 30000) return;
    if (lat == null || lng == null || (lat === 0 && lng === 0)) return;
    globeRef.current?.pointOfView({ lat, lng, altitude: 1.8 }, 1500);
  }, []);

  const handleGlobeUserInteract = useCallback(() => {
    lastGlobeInteractRef.current = Date.now();
  }, []);

  const handleRouteSelect = useCallback((route) => {
    if (route == null) {
      setSelectedRouteId(null);
      return;
    }
    if (!route?.id) return;

    setSelectedRouteId(route.id);

    const inGlobe = new Set([
      ...routes.map((r) => r.id),
      ...airRoutes.filter((r) => !routes.some((x) => x.id === r.id)).map((r) => r.id),
    ]);
    if (!inGlobe.has(route.id)) {
      console.warn('Selected route missing:', route.id);
    }

    if (route.from && route.to) {
      const mid = routeArcMidpoint(route);
      if (mid) {
        globeRef.current?.pointOfView({ lat: mid.lat, lng: mid.lng, altitude: 1.75 }, 1200);
      }
    }
  }, [routes, airRoutes]);

  const handleEventTrigger = useCallback(
    async (event) => {
      if (!graph) return;
      if (!event) {
        didAutoInitRef.current = false;
        autoInitPendingRef.current = false;
        setEventState(null);
        setRoutes(ROUTES.map((r) => ({ ...r, currentRisk: r.baseRisk, status: 'normal' })));
        setSelectedRouteId(null);
        setGlobeRings([]);
        lastGlobeInteractRef.current = 0;
        return;
      }
      if (!intelligenceRef.current) {
        autoInitPendingRef.current = false;
        return;
      }
      if (autoInitPendingRef.current) {
        didAutoInitRef.current = true;
        autoInitPendingRef.current = false;
      }
      addGlobeRing(event);
      setIsLoading(true);
      try {
        const state = await runPipeline(event, graph);
        if (import.meta.env.DEV) {
          console.log('Cascade stored in dashboard state:', state.industryCascade);
        }
        setEventState(state);
        setRoutes((prev) =>
          prev.map((r) => ({
            ...r,
            currentRisk: state.riskScores?.[r.id] ?? r.baseRisk,
            status: getRiskStatus(state.riskScores?.[r.id] ?? r.baseRisk),
          })),
        );
        const near = findNearestRoute(ROUTES, event.lat, event.lng);
        if (near?.id) {
          setSelectedRouteId(near.id);
          if (near.from && near.to) {
            const mid = routeArcMidpoint(near);
            if (mid) globeRef.current?.pointOfView({ lat: mid.lat, lng: mid.lng, altitude: 1.75 }, 1200);
          }
        }
      } catch (err) {
        didAutoInitRef.current = false;
        console.error('[ChainFlowX] Pipeline error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [graph, addGlobeRing],
  );

  useEffect(() => {
    pipelineHandlerRef.current = handleEventTrigger;
  }, [handleEventTrigger]);

  useEffect(() => {
    if (!graph || !intelligenceOn || isLoading || eventState) return;
    if (!liveArticles.length || didAutoInitRef.current) return;
    const first =
      liveArticles.find(
        (a) => (a.displayRelevance ?? a.keyword?.supplyChainRelevance ?? 0) >= 0.35,
      ) || liveArticles[0];
    autoInitPendingRef.current = true;
    void handleEventTrigger(liveArticleToPipelineEvent(first));
  }, [graph, intelligenceOn, isLoading, eventState, liveArticles, handleEventTrigger]);


  useEffect(() => {
    if (!graph) return;

    const { stop } = startLiveEventFeed({
      onArticlesUpdate: (arts) => {
        setLiveArticles(arts);
        setFeedUpdatedAt(Date.now());
      },
      triggeredUrls: autoTriggeredUrlsRef.current,
      pollIntervalMs: 90000,
      onPipelineEvent: (ev) => {
        if (!intelligenceRef.current || isLoadingRef.current) return;
        pipelineHandlerRef.current?.(ev);
      },
    });

    return () => stop();
  }, [graph, addGlobeRing]);

  const handleGenerateInsight = async () => {
    if (!eventState) return;
    setInsightLoading(true);
    try {
      const insight = await synthesizeStrategicInsight(eventState);
      setEventState((prev) => ({ ...prev, strategicInsight: insight }));
    } finally {
      setInsightLoading(false);
    }
  };

  // V1 Resizer Logic
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

  const showRouteInRight = !!(eventState && selectedRoute);

  const bannerHeadline = eventState?.raw?.headline ?? '';
  const rippleRaw = eventState?.rippleScore?.raw ?? null;
  const rippleLabel = eventState?.rippleScore?.label ?? '';

  const activeDna =
    eventState?.raw?.url && eventState?.dnaMatch?.[0]
      ? { articleUrl: eventState.raw.url, dna: eventState.dnaMatch[0] }
      : null;

  const alertCount = eventState?.cascadeAlerts?.length ?? 0;

  const visibleVessels = layerVisibility.vessels ? liveVessels : [];
  const visibleAircraft = layerVisibility.aircraft ? liveAircraft : [];
  const visibleRail = layerVisibility.rail ? RAIL_CORRIDORS : [];
  const visiblePipelines = layerVisibility.pipelines ? PIPELINE_CORRIDORS : [];

  return (
    <div className="app-container wm-app-root">
      {/* V1 Layout Header injected with V2 HeaderBar */}
      <div style={{ zIndex: 50, position: 'relative' }}>
        <HeaderBar
          routeCount={ROUTES.length}
          rippleIndex={rippleRaw}
          alertCount={alertCount}
          isLive
          graphValid={graphValid}
          mapMode={mapMode}
          onMapModeToggle={() => setMapMode((p) => (p === '3d' ? '2d' : '3d'))}
          isLoading={isLoading}
          eventHeadline={bannerHeadline}
        />
      </div>

      <div className="tagline-bar">
        <span className="tagline-text">
          "We don't show you a risk score — we show you the wave."
        </span>
      </div>

      {eventState && (
        <div className="event-banner">
          <span className="event-banner-label">ACTIVE EVENT</span>
          <span className="event-banner-headline">
            {bannerHeadline.length > 90 ? bannerHeadline.substring(0, 90) + '…' : bannerHeadline}
          </span>
          {rippleRaw != null && (
            <span
              className="event-banner-score"
              style={{
                color: rippleRaw >= 8 ? '#ff3b3b' : rippleRaw >= 6 ? '#ff6b35' : rippleRaw >= 4 ? '#ffb800' : '#00ff88',
              }}
            >
              RIPPLE {eventState.rippleScore?.score} · {rippleLabel}
            </span>
          )}
          {eventState.classified?.eventType && (
            <span className="event-banner-type">{eventState.classified.eventType.toUpperCase()}</span>
          )}
        </div>
      )}

      <div className="cfx-top-nav">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'routes', label: 'Routes' },
          { id: 'intelligence', label: 'Intelligence' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activePage === tab.id ? 'is-active' : ''}
            onClick={() => setActivePage(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activePage === 'routes' && (
        <>
          <div
            className="routes-tab-globe-wrap globe-container"
            style={{
              flex: '0 0 420px',
              position: 'relative',
              width: '100%',
              minHeight: 200,
              maxHeight: 'min(420px, 38vh)',
            }}
          >
            {graph && (
              <>
                <SupplyChainGlobe
                  ref={globeRef}
                  routes={routes}
                  chokepoints={CHOKEPOINTS}
                  eventState={eventState}
                  onRouteSelect={handleRouteSelect}
                  selectedRouteId={selectedRouteId}
                  selectedRoute={selectedRoute}
                  mapMode={mapMode}
                  eventRings={globeRings}
                  onGlobeUserInteract={handleGlobeUserInteract}
                  onGlobeInitError={() => {
                    setGlobeUnavailable(true);
                    setMapMode('2d');
                  }}
                  liveVessels={visibleVessels}
                  liveAircraft={visibleAircraft}
                  visibleRail={visibleRail}
                  visiblePipelines={visiblePipelines}
                  airRoutes={airRoutes}
                />
                <LayerControl
                  layerVisibility={layerVisibility}
                  onToggle={(layerName, enabled) =>
                    setLayerVisibility((prev) => ({ ...prev, [layerName]: enabled }))
                  }
                  vesselCount={liveVessels.length}
                  aircraftCount={liveAircraft.length}
                />
              </>
            )}
          </div>
          <RoutesPage
            routes={routes}
            selectedRouteId={selectedRouteId}
            onRouteSelect={handleRouteSelect}
            liveVessels={liveVessels}
          />
        </>
      )}

      {activePage === 'intelligence' && (
        <IntelligenceFeed
          liveEvents={liveArticles}
          feedUpdatedAt={feedUpdatedAt}
          onRouteSelect={handleRouteSelect}
          onOpenRoutes={() => setActivePage('routes')}
        />
      )}

      {/* V1 Main Dashboard Grid */}
      {activePage === 'dashboard' && (
      <main className="dashboard-container" style={{ paddingBottom: '32px' }}>
        {/* Left Section (Globe + Metrics) */}
        <div className="left-section" style={{ flex: 1, minWidth: 0 }}>
          <div
            className="globe-container"
            style={{ flex: `0 0 ${globeHeight}px`, position: 'relative', width: '100%', minHeight: 0 }}
          >
            {graph && (
              <SupplyChainGlobe
                ref={globeRef}
                routes={routes}
                chokepoints={CHOKEPOINTS}
                eventState={eventState}
                onRouteSelect={handleRouteSelect}
                selectedRouteId={selectedRouteId}
                selectedRoute={selectedRoute}
                mapMode={mapMode}
                eventRings={globeRings}
                onGlobeUserInteract={handleGlobeUserInteract}
                onGlobeInitError={() => {
                  setGlobeUnavailable(true);
                  setMapMode('2d');
                }}
                liveVessels={visibleVessels}
                liveAircraft={visibleAircraft}
                visibleRail={visibleRail}
                visiblePipelines={visiblePipelines}
                airRoutes={airRoutes}
              />
            )}

            {globeUnavailable && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 52,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 25,
                  padding: '8px 14px',
                  background: 'rgba(11,17,24,0.95)',
                  border: '1px solid rgba(255,184,0,0.4)',
                  color: '#ffb800',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  pointerEvents: 'none',
                }}
              >
                Globe unavailable — fallback to 2D mode
              </div>
            )}

            <LayerControl
              layerVisibility={layerVisibility}
              onToggle={(layerName, enabled) =>
                setLayerVisibility((prev) => ({ ...prev, [layerName]: enabled }))
              }
              vesselCount={liveVessels.length}
              aircraftCount={liveAircraft.length}
            />

            {isLoading && (
              <>
                <div className="pipeline-progress" style={{ bottom: 32 }}>
                  <div className="pipeline-progress-fill" />
                </div>
                <div className="loading-text-overlay" style={{ bottom: 44 }}>
                  ANALYZING SUPPLY CHAIN · 6-LAYER PIPELINE
                </div>
              </>
            )}

            <div className="globe-status-bar wm-globe-status-bar" style={{ bottom: 10 }}>
              <span>GDELT + RSS · LIVE</span>
              <span className="status-sep">·</span>
              <span style={{ color: graphValid ? '#00ff88' : '#ff3b3b' }}>GRAPH {graphValid ? 'OK' : 'ERR'}</span>
              <span className="status-sep">·</span>
              <span style={{ color: eventState ? '#00d4ff' : 'var(--muted)' }}>
                {eventState ? 'PIPELINE ACTIVE' : 'MONITORING'}
              </span>
              <span className="status-sep">·</span>
              <span>
                {ROUTES.length} ROUTES · {CHOKEPOINTS.length} CHOKE · {liveArticles.length} FEED
              </span>
            </div>
          </div>

          <div className={`resizer-vertical ${isResizingV ? 'resizing' : ''}`} onMouseDown={startResizingV} />

          <div className="bottom-metrics-scroll" style={{ flex: 1 }}>
            <div className="dashboard-row">
              <RippleScorePanel rippleScore={eventState?.rippleScore} />
              <DNAMatchPanel dnaMatch={eventState?.dnaMatch?.[0]} />
            </div>

            <div className="dashboard-row dashboard-row--bottom">
              <IndustryCascadePanel industryCascade={eventState?.industryCascade} />
              {selectedRoute ? (
                <div className="panel">
                  <div className="route-detail-header" style={{ marginBottom: 8 }}>
                    <span className="route-detail-label">Strategic Risk Overview</span>
                    <button className="route-close-btn" onClick={() => setSelectedRouteId(null)}>
                      ×
                    </button>
                  </div>
                  <RouteDetailPanel
                    route={selectedRoute}
                    altRoute={eventState?.altRoutes?.[selectedRoute.id]}
                    onClose={() => setSelectedRouteId(null)}
                  />
                </div>
              ) : (
                <div className="wm-intelligence-panel">
                  <StrategicRiskOverview
                    eventState={eventState}
                    articles={liveArticles}
                    feedUpdatedAt={feedUpdatedAt}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`resizer-horizontal ${isResizingH ? 'resizing' : ''}`} onMouseDown={startResizingH} />

        {/* Right Sidebar (Live Ticker + AI Integration) */}
        <div className="right-sidebar" style={{ width: `${sidebarWidth}%`, flex: 'none' }}>
          <div className="ai-panel">
            <button
              type="button"
              className="trigger-btn"
              onClick={() => handleEventTrigger(null)}
              disabled={isLoading}
              style={{ width: '100%', marginBottom: 10 }}
            >
              <span className="scene-num">RESET</span>
              <span className="scene-label-text">Clear active event</span>
            </button>
            <StrategicInsightPanel
              eventState={eventState}
              onGenerateInsight={handleGenerateInsight}
              insightLoading={insightLoading}
            />
          </div>

          <div className="live-feed-panel">
            <div className="scene-section-label">Live Threat Intelligence</div>
            <div className="live-feed-panel-body">
              <LiveNewsTicker
                articles={liveArticles}
                feedUpdatedAt={feedUpdatedAt}
                maxItems={50}
                activeDnaMatch={activeDna}
                onGlobeFocus={(lat, lng) => handleGlobeFocus(lat, lng)}
                onEventSelect={(ev) => {
                  if (!intelligenceOn || isLoading) return;
                  handleEventTrigger(ev);
                }}
              />
            </div>
          </div>

          <div className="supply-chain-panel">
            <SupplyChainMonitor
              eventState={eventState}
              articles={liveArticles}
              feedUpdatedAt={feedUpdatedAt}
            />
          </div>
        </div>
      </main>
      )}

      <TickerBar articles={liveArticles} />
    </div>
  );
}

function getRiskStatus(score) {
  if (score >= 86) return 'critical';
  if (score >= 61) return 'severe';
  if (score >= 31) return 'warning';
  return 'normal';
}
