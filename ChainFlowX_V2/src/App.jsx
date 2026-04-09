import { useState, useEffect, useRef, useCallback } from 'react';
import { buildGraph, validateGraph } from './supply-chain/graph/graphUtils.js';
import { runPipeline, haversineKm } from './supply-chain/state/stateManager.js';
import { synthesizeStrategicInsight } from './supply-chain/ai/qwenAI.js';
import { PORTS } from './supply-chain/data/ports.js';
import { ROUTES } from './supply-chain/data/routes.js';
import { CHOKEPOINTS } from './supply-chain/data/chokepoints.js';
import { startLiveEventFeed, liveArticleToPipelineEvent } from './supply-chain/data/liveEventFeed.js';
import {
  startAllTransportTracking,
  stopAllTransportTracking,
} from './supply-chain/data/transportLayerManager.js';
import { RAIL_CORRIDORS } from './supply-chain/data/transportRail.js';
import { PIPELINE_CORRIDORS } from './supply-chain/data/transportPipeline.js';

import SupplyChainGlobe from './supply-chain/components/SupplyChainGlobe.jsx';
import LayerToggle from './supply-chain/components/LayerToggle.jsx';
import RippleScorePanel from './supply-chain/components/RippleScorePanel.jsx';
import DNAMatchPanel from './supply-chain/components/DNAMatchPanel.jsx';
import IndustryCascadePanel from './supply-chain/components/IndustryCascadePanel.jsx';
import RouteDetailPanel from './supply-chain/components/RouteDetailPanel.jsx';
import StrategicInsightPanel from './supply-chain/components/StrategicInsightPanel.jsx';
import SupplyChainMonitor from './supply-chain/components/SupplyChainMonitor.jsx';
import StrategicRiskOverview from './supply-chain/components/StrategicRiskOverview.jsx';
import LiveNewsTicker from './supply-chain/components/LiveNewsTicker.jsx';
import FeedStatusPanel from './supply-chain/components/FeedStatusPanel.jsx';
import HeaderBar from './supply-chain/components/HeaderBar.jsx';
import TickerBar from './supply-chain/components/TickerBar.jsx';

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

export default function App() {
  const [graph, setGraph] = useState(null);
  const [routes, setRoutes] = useState(ROUTES);
  const [eventState, setEventState] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
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

  const isLoadingRef = useRef(false);
  const intelligenceRef = useRef(intelligenceOn);
  const autoTriggeredUrlsRef = useRef(new Set());
  const pipelineHandlerRef = useRef(null);
  const globeRef = useRef(null);
  const lastGlobeInteractRef = useRef(0);
  const trackingRefs = useRef({});
  /** After a successful auto-started pipeline, blocks duplicate auto-fire on RSS refresh. */
  const didAutoInitRef = useRef(false);
  /** Set only by the auto-select effect so handleEventTrigger can commit didAutoInit after guards. */
  const autoInitPendingRef = useRef(false);

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
    else console.log('[ChainFlowX] Graph validated — all nodes and edges intact');
    setGraph(g);
    setGraphValid(valid);
  }, []);

  const addGlobeRing = useCallback((ev) => {
    const id = String(ev?.id || ev?.url || `ring-${Date.now()}`);
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

  const handleEventTrigger = useCallback(
    async (event) => {
      if (!graph) return;

      if (!event) {
        didAutoInitRef.current = false;
        autoInitPendingRef.current = false;
        setEventState(null);
        setRoutes(ROUTES.map((r) => ({ ...r, currentRisk: r.baseRisk, status: 'normal' })));
        setSelectedRoute(null);
        setGlobeRings([]);
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
        setEventState(state);
        setRoutes((prev) =>
          prev.map((r) => ({
            ...r,
            currentRisk: state.riskScores?.[r.id] ?? r.baseRisk,
            status: getRiskStatus(state.riskScores?.[r.id] ?? r.baseRisk),
          })),
        );
        const near = findNearestRoute(ROUTES, event.lat, event.lng);
        if (near) setSelectedRoute(near);
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
    const refs = startAllTransportTracking({
      onVesselUpdate: (vessel) =>
        setLiveVessels((prev) => {
          const idx = prev.findIndex((v) => v.mmsi === vessel.mmsi);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = vessel;
            return next;
          }
          return [...prev, vessel].slice(-200);
        }),
      onAircraftUpdate: (aircraft) =>
        setLiveAircraft((prev) => {
          const idx = prev.findIndex((a) => a.icao24 === aircraft.icao24);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = aircraft;
            return next;
          }
          return [...prev, aircraft].slice(-100);
        }),
      onStatusChange: () => {},
    });
    trackingRefs.current = refs;

    return () => stopAllTransportTracking(trackingRefs.current);
  }, []);

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

  const overlayTop = eventState ? 80 : 50;

  return (
    <div className="app-container wm-app-root">
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, width: '100%' }}>
        <HeaderBar
          routeCount={ROUTES.length}
          rippleIndex={rippleRaw}
          alertCount={alertCount}
          isLive
          graphValid={graphValid}
          intelligenceOn={intelligenceOn}
          onIntelligenceToggle={setIntelligenceOn}
          mapMode={mapMode}
          onMapModeToggle={() => setMapMode((p) => (p === '3d' ? '2d' : '3d'))}
          isLoading={isLoading}
          eventHeadline={bannerHeadline}
        />
      </div>

      {eventState && (
        <div className="event-banner" style={{ position: 'fixed', top: 44, left: 0, right: 0, zIndex: 45 }}>
          <span className="event-banner-label">ACTIVE EVENT</span>
          <span className="event-banner-headline">
            {bannerHeadline.length > 90 ? `${bannerHeadline.substring(0, 90)}…` : bannerHeadline}
          </span>
          {rippleRaw != null && (
            <span
              className="event-banner-score"
              style={{
                color:
                  rippleRaw >= 8 ? '#ff3b3b' : rippleRaw >= 6 ? '#ff6b35' : rippleRaw >= 4 ? '#ffb800' : '#00ff88',
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

      <div
        className="cfx-globe-backdrop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'auto',
        }}
      >
        {graph && (
          <SupplyChainGlobe
            ref={globeRef}
            routes={routes}
            chokepoints={CHOKEPOINTS}
            eventState={eventState}
            onRouteSelect={setSelectedRoute}
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
          />
        )}

        {globeUnavailable && (
          <div
            style={{
              position: 'fixed',
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

        <LayerToggle
          layerVisibility={layerVisibility}
          onToggle={(layerName, enabled) =>
            setLayerVisibility((prev) => ({ ...prev, [layerName]: enabled }))
          }
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

        <div className="globe-status-bar wm-globe-status-bar" style={{ bottom: 32 }}>
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

      <div
        className="cfx-overlay-news"
        style={{
          position: 'absolute',
          top: overlayTop,
          left: 0,
          width: 320,
          height: 'calc(100vh - 90px)',
          zIndex: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(11, 17, 24, 0.92)',
          borderRight: '1px solid rgba(0, 255, 255, 0.12)',
          pointerEvents: 'auto',
        }}
      >
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

      <aside
        className="cfx-overlay-intel"
        style={{
          position: 'absolute',
          top: overlayTop,
          right: 0,
          width: 280,
          height: 'calc(100vh - 90px)',
          zIndex: 12,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0, 10, 20, 0.94)',
          borderLeft: '1px solid rgba(0, 255, 255, 0.15)',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        <div className="wm-intelligence-panel" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <button
            type="button"
            className="trigger-btn"
            onClick={() => handleEventTrigger(null)}
            disabled={isLoading}
            style={{ width: '100%', marginBottom: 8 }}
          >
            <span className="scene-num">RESET</span>
            <span className="scene-label-text">Clear active event</span>
          </button>

          {showRouteInRight ? (
            <div className="route-detail-wrapper" style={{ padding: 0, borderTop: 'none' }}>
              <div className="route-detail-header" style={{ marginBottom: 8 }}>
                <span className="route-detail-label">Route Analysis</span>
                <button type="button" className="route-close-btn" onClick={() => setSelectedRoute(null)}>
                  ×
                </button>
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
              <SupplyChainMonitor eventState={eventState} articles={liveArticles} />
              <StrategicRiskOverview eventState={eventState} articles={liveArticles} />
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
        </div>
      </aside>

      <TickerBar articles={liveArticles} />
      <FeedStatusPanel />
    </div>
  );
}

function getRiskStatus(score) {
  if (score >= 86) return 'critical';
  if (score >= 61) return 'severe';
  if (score >= 31) return 'warning';
  return 'normal';
}
