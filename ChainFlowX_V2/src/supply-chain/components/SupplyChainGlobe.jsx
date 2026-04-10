import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'globe.gl';
import { VESSEL_COLORS } from '../data/transportMaritime.js';
import { DEFAULT_18_ROUTES } from '../data/default18Routes.js';

// ── 2D flat map (SVG equirectangular radar display) ──────────────────────────
function FlatMap2D({ routes, chokepoints, eventState, onRouteSelect, selectedRoute }) {
  const W = 1000,
    H = 500;

  const toX = (lng) => ((lng + 180) / 360) * W;
  const toY = (lat) => ((90 - lat) / 180) * H;

  const arcColor = (status) => {
    if (status === 'critical') return '#ff3b3b';
    if (status === 'severe') return '#ff6b35';
    if (status === 'warning') return '#ffb800';
    return '#44cc88';
  };

  const arcOpacity = (status) =>
    status === 'critical' ? 0.95 : status === 'severe' ? 0.8 : status === 'warning' ? 0.7 : 0.5;

  const arcStroke = (status) => (status === 'critical' ? 2.5 : status === 'warning' ? 1.8 : 1.2);

  // Handles anti-meridian crossing: splits arc into two segments when the
  // shortest-path longitude delta wraps past ±180°.
  const arcPath = (from, to) => {
    const x1 = toX(from.lng);
    const y1 = toY(from.lat);
    const x2 = toX(to.lng);
    const y2 = toY(to.lat);

    let dLng = to.lng - from.lng;
    if (dLng > 180) dLng -= 360;
    if (dLng < -180) dLng += 360;

    const x2eff = x1 + (dLng / 360) * W;

    if (x2eff < 0 || x2eff > W) {
      // Route crosses the anti-meridian — draw two segments
      const isRight = x2eff > W;
      const xEdge1 = isRight ? W : 0;
      const xEdge2 = isRight ? 0 : W;
      const frac = Math.abs((xEdge1 - x1) / (x2eff - x1));
      const yMid = y1 + (y2 - y1) * frac;
      const cx1 = (x1 + xEdge1) / 2;
      const cy1 = (y1 + yMid) / 2 - Math.abs(xEdge1 - x1) * 0.15;
      const cx2 = (xEdge2 + x2) / 2;
      const cy2 = (yMid + y2) / 2 - Math.abs(x2 - xEdge2) * 0.15;
      return `M ${x1} ${y1} Q ${cx1} ${cy1} ${xEdge1} ${yMid} M ${xEdge2} ${yMid} Q ${cx2} ${cy2} ${x2} ${y2}`;
    }

    const cx = (x1 + x2eff) / 2;
    const dy = Math.abs(x2eff - x1) * 0.18;
    const cy = (y1 + y2) / 2 - dy;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2eff} ${y2}`;
  };

  // Convert [[lng, lat], ...] to SVG polygon points string
  const toPts = (coords) =>
    coords.map(([lng, lat]) => `${toX(lng).toFixed(1)},${toY(lat).toFixed(1)}`).join(' ');

  // Simplified continent polygons as [lng, lat] pairs
  const CONTINENTS = [
    // North America
    [[-165,60],[-130,55],[-124,48],[-117,33],[-110,23],[-83,10],[-77,8],[-80,26],[-75,36],[-70,42],[-60,46],[-52,47],[-60,63],[-80,70],[-100,73],[-140,70],[-165,60]],
    // South America
    [[-77,8],[-60,11],[-50,5],[-35,-5],[-38,-23],[-50,-30],[-58,-38],[-67,-56],[-75,-40],[-80,-5],[-77,8]],
    // Europe
    [[-9,39],[-5,57],[5,58],[15,69],[25,71],[28,65],[30,60],[37,55],[35,45],[28,41],[26,40],[10,37],[16,38],[2,43],[-2,44],[-9,39]],
    // Africa
    [[-13,36],[10,37],[25,31],[35,30],[51,12],[40,-10],[34,-35],[18,-35],[15,-30],[2,4],[-15,9],[-17,15],[-13,36]],
    // Asia (mainland + Russia)
    [[26,40],[37,37],[45,30],[56,24],[68,24],[80,8],[92,22],[105,11],[109,12],[120,24],[122,38],[128,38],[130,50],[140,50],[132,72],[100,70],[75,50],[55,55],[37,55],[30,60],[26,40]],
    // Australia
    [[113,-22],[130,-12],[145,-15],[150,-38],[130,-37],[114,-34],[113,-22]],
    // Greenland
    [[-55,75],[-20,72],[-18,77],[-35,83],[-55,82],[-55,75]],
  ];

  const latLines = [-60, -30, 0, 30, 60];
  const lngLines = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: '100%', display: 'block', background: '#060a0f' }}
    >
      <rect x="0" y="0" width={W} height={H} fill="#050b12" />

      {/* Continent silhouettes */}
      <g opacity={0.18} fill="#3d5c6e" stroke="#5a7a8a" strokeWidth="0.5">
        {CONTINENTS.map((pts, i) => (
          <polygon key={i} points={toPts(pts)} />
        ))}
      </g>

      {latLines.map((lat, i) => {
        const y = toY(lat);
        return i % 2 === 0 ? (
          <rect key={`band${lat}`} x={0} y={y - 41.7} width={W} height={83.3} fill="rgba(14,22,35,0.4)" />
        ) : null;
      })}

      {latLines.map((lat) => (
        <line key={`lat${lat}`} x1={0} y1={toY(lat)} x2={W} y2={toY(lat)} stroke="#1e2d3d" strokeWidth="0.5" />
      ))}
      <line x1={0} y1={toY(0)} x2={W} y2={toY(0)} stroke="#1e2d3d" strokeWidth="1" />
      {lngLines.map((lng) => (
        <line key={`lng${lng}`} x1={toX(lng)} y1={0} x2={toX(lng)} y2={H} stroke="#1e2d3d" strokeWidth="0.5" />
      ))}
      <line x1={toX(0)} y1={0} x2={toX(0)} y2={H} stroke="#1e2d3d" strokeWidth="1" />

      {latLines.map((lat) => (
        <text key={`llbl${lat}`} x={4} y={toY(lat) - 2} fill="#1e2d3d" fontSize="8" fontFamily="Space Mono, monospace">
          {lat > 0 ? `${lat}N` : lat < 0 ? `${Math.abs(lat)}S` : 'EQ'}
        </text>
      ))}

      {routes &&
        routes.map((route) => {
          const routeEnd = route.currentPosition || route.to;
          const isSelected = selectedRoute?.id === route.id;
          return (
          <g key={route.id} style={{ cursor: 'pointer' }} onClick={() => onRouteSelect && onRouteSelect(route)}>
            {isSelected && (
              <path
                d={arcPath(route.from, routeEnd)}
                fill="none"
                stroke="rgba(0,255,255,0.85)"
                strokeWidth={arcStroke(route.status) + 5}
                strokeOpacity={0.35}
                style={{ animation: 'routePulse2d 1.4s ease-in-out infinite' }}
              />
            )}
            {(route.status === 'critical' || route.status === 'severe') && (
              <path
                d={arcPath(route.from, routeEnd)}
                fill="none"
                stroke={arcColor(route.status)}
                strokeWidth={arcStroke(route.status) + 3}
                strokeOpacity={0.12}
              />
            )}
            <path
              d={arcPath(route.from, routeEnd)}
              fill="none"
              stroke={isSelected ? '#00ffff' : arcColor(route.status)}
              strokeWidth={isSelected ? arcStroke(route.status) + 1.4 : arcStroke(route.status)}
              strokeOpacity={isSelected ? 1 : arcOpacity(route.status)}
              strokeLinecap="round"
              style={isSelected ? { filter: 'drop-shadow(0 0 4px rgba(0,255,255,0.9))' } : undefined}
            />

            {route.currentPosition && (
              <circle
                cx={toX(route.currentPosition.lng)}
                cy={toY(route.currentPosition.lat)}
                r={route.type === 'air' ? 2.2 : 2.8}
                fill={route.type === 'air' ? '#ff9500' : '#00ffff'}
                opacity={0.9}
              />
            )}
          </g>
          );
        })}

      {routes &&
        routes
          .map((route) => [route.from, route.to])
          .flat()
          .filter((p, i, arr) => arr.findIndex((q) => q.name === p.name) === i)
          .map((port) => (
            <circle
              key={port.name}
              cx={toX(port.lng)}
              cy={toY(port.lat)}
              r={2.5}
              fill="#1e2d3d"
              stroke="#00d4ff"
              strokeWidth={0.7}
              opacity={0.8}
            />
          ))}

      {chokepoints &&
        chokepoints.map((cp) => {
          const isAffected = eventState?.classified?.nearestChokepoint === cp.id;
          const cx = toX(cp.lng),
            cy = toY(cp.lat);
          return (
            <g key={cp.id}>
              {isAffected && (
                <>
                  <circle cx={cx} cy={cy} r={10} fill="none" stroke="#ff3b3b" strokeWidth="0.5" opacity="0.3" />
                  <circle cx={cx} cy={cy} r={6} fill="none" stroke="#ff3b3b" strokeWidth="0.5" opacity="0.5" />
                </>
              )}
              <circle cx={cx} cy={cy} r={isAffected ? 4.5 : 3} fill={isAffected ? '#ff3b3b' : '#00d4ff'} opacity={0.85} />
              <text
                x={cx + 6}
                y={cy + 3}
                fill={isAffected ? '#ff3b3b' : '#5a7a8a'}
                fontSize="7"
                fontFamily="Space Mono, monospace"
              >
                {cp.name.length > 22 ? `${cp.name.slice(0, 20)}…` : cp.name}
              </text>
            </g>
          );
        })}

      <text x={4} y={H - 4} fill="#1e2d3d" fontSize="7" fontFamily="Space Mono, monospace">
        CHAINFLOWX · EQUIRECTANGULAR · 2D MODE
      </text>
    </svg>
  );
}

const CHOKEPOINT_VIEWS = {
  MALACCA: { lat: 2, lng: 104, alt: 2.2 },
  SUEZ: { lat: 30, lng: 32, alt: 2.0 },
  HORMUZ: { lat: 26, lng: 56, alt: 2.0 },
  PANAMA: { lat: 9, lng: -80, alt: 2.0 },
  BAB_EL: { lat: 12, lng: 43, alt: 2.2 },
  RED_SEA: { lat: 20, lng: 38, alt: 2.5 },
  TAIWAN: { lat: 24, lng: 121, alt: 2.0 },
};

function getChokepointView(id) {
  if (!id) return null;
  const key = id.toUpperCase().replace(/[^A-Z]/g, '_');
  return CHOKEPOINT_VIEWS[key] ?? null;
}

function corridorToCoords(corridor) {
  const pts = [corridor.from, ...(corridor.waypoints || []), corridor.to];
  return pts.map((p) => [p.lat, p.lng]);
}

const SupplyChainGlobe = forwardRef(function SupplyChainGlobe(
  {
    routes,
    chokepoints,
    eventState,
    onRouteSelect,
    selectedRoute = null,
    mapMode,
    eventRings = [],
    onGlobeUserInteract,
    liveVessels = [],
    liveAircraft = [],
    visibleRail = [],
    visiblePipelines = [],
    airRoutes = [],
    onGlobeInitError,
  },
  ref,
) {
  const containerRef = useRef();
  const globeRef = useRef();
  const [globeReady, setGlobeReady] = useState(0);
  const [globeInitFailed, setGlobeInitFailed] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const onInteractRef = useRef(onGlobeUserInteract);
  const onGlobeErrorRef = useRef(onGlobeInitError);
  useEffect(() => {
    onInteractRef.current = onGlobeUserInteract;
  }, [onGlobeUserInteract]);
  useEffect(() => {
    onGlobeErrorRef.current = onGlobeInitError;
  }, [onGlobeInitError]);

  const displayRoutes = useMemo(() => {
    if (routes && routes.length > 0) return routes;
    return DEFAULT_18_ROUTES;
  }, [routes]);

  const arcRoutesForGlobe = useMemo(() => {
    const dr = displayRoutes || [];
    const airOnly = (airRoutes || []).filter((a) => !dr.some((r) => r.id === a.id));
    return [...dr, ...airOnly];
  }, [displayRoutes, airRoutes]);

  const selectedRouteId = selectedRoute?.id ?? null;

  useEffect(() => {
    console.log('[ChainFlowX] Display routes:', displayRoutes.length, 'Chokepoints:', chokepoints?.length ?? 0);
  }, [displayRoutes.length, chokepoints?.length]);

  useImperativeHandle(
    ref,
    () => ({
      pointOfView: (pov, ms) => globeRef.current?.pointOfView(pov, ms),
      controls: () => globeRef.current?.controls(),
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let globe = null;
    const onPointer = () => onInteractRef.current?.();

    try {
      globe = Globe()(container);
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      console.log('[ChainFlowX] Globe initialized', w, '×', h);

      globe
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#4466cc')
        .atmosphereAltitude(0.18)
        .backgroundColor('rgba(0,0,0,0)')
        .showGraticules(false)
        .width(w)
        .height(h);

      globe.pointOfView({ lat: 10, lng: 80, altitude: 2.2 }, 0);

      const controls = globe.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0;
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.zoomSpeed = 1.4;
        controls.minDistance = 101;
        controls.maxDistance = 600;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
      }

      container.addEventListener('mousedown', onPointer);
      container.addEventListener('touchstart', onPointer, { passive: true });

      globeRef.current = globe;
      setGlobeInitFailed(false);
      setGlobeReady((n) => n + 1);

      const canvas = container.querySelector('canvas');
      console.log('[ChainFlowX] Globe canvas present:', !!canvas, canvas?.width, '×', canvas?.height);
    } catch (err) {
      console.error('[ChainFlowX] Globe failed:', err);
      setGlobeInitFailed(true);
      onGlobeErrorRef.current?.();
      return () => {};
    }

    return () => {
      container.removeEventListener('mousedown', onPointer);
      container.removeEventListener('touchstart', onPointer);
      try {
        const renderer = globe?.renderer?.();
        if (renderer) renderer.dispose();
      } catch (_) {
        /* ignore */
      }
      if (globe?._destructor) globe._destructor();
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const allRoutes = arcRoutesForGlobe;
    if (!globeRef.current || !allRoutes.length) return;
    const globe = globeRef.current;

    globe
      .arcsData(allRoutes)
      .arcStartLat((d) => d.from.lat)
      .arcStartLng((d) => d.from.lng)
      .arcEndLat((d) => (d.type === 'air' ? d.to.lat : d.currentPosition?.lat ?? d.to.lat))
      .arcEndLng((d) => (d.type === 'air' ? d.to.lng : d.currentPosition?.lng ?? d.to.lng))
      .arcColor((d) => {
        const selected = selectedRouteId != null && d.id === selectedRouteId;
        if (selected) return ['rgba(0,212,255,0.22)', 'rgba(0,255,255,0.95)', 'rgba(0,212,255,0.22)'];
        if (d.type === 'air') return ['rgba(255,149,0,0.05)', 'rgba(255,149,0,0.95)', 'rgba(255,149,0,0.05)'];
        if (d.status === 'critical') return ['rgba(255,59,59,0.08)', 'rgba(255,59,59,0.9)', 'rgba(255,59,59,0.08)'];
        if (d.status === 'severe') return ['rgba(255,107,53,0.08)', 'rgba(255,107,53,0.85)', 'rgba(255,107,53,0.08)'];
        if (d.status === 'warning') return ['rgba(255,184,0,0.06)', 'rgba(255,184,0,0.8)', 'rgba(255,184,0,0.06)'];
        return ['rgba(68,204,136,0.04)', 'rgba(68,204,136,0.6)', 'rgba(68,204,136,0.04)'];
      })
      .arcAltitudeAutoScale((d) => (d.type === 'air' ? 0.22 : 0.3))
      .arcStroke((d) => {
        const selected = selectedRouteId != null && d.id === selectedRouteId;
        if (selected) return d.type === 'air' ? 0.85 : 1.05;
        return d.type === 'air' ? 0.45 : d.status === 'critical' ? 0.9 : d.status === 'warning' ? 0.6 : 0.4;
      })
      .arcDashLength((d) => (d.type === 'air' ? 0.65 : 0.9))
      .arcDashGap((d) => (d.type === 'air' ? 6 : 4))
      .arcDashAnimateTime((d) => {
        const selected = selectedRouteId != null && d.id === selectedRouteId;
        if (selected) return d.type === 'air' ? 2200 : 1100;
        return d.type === 'air' ? 7000 : d.status === 'critical' ? 1800 : d.status === 'warning' ? 3500 : 5000;
      })
      .onArcClick((arc) => onRouteSelect && onRouteSelect(arc))
      .arcLabel(
        (d) => `
        <div style="background:#0b1118;border:1px solid ${d.type === 'air' ? '#ff9500' : '#1e2d3d'};padding:6px 10px;border-radius:2px;font-family:'Space Mono',monospace;font-size:10px;color:#e8f4f8">
          <div style="color:${d.type === 'air' ? '#ffb35c' : '#00d4ff'};font-weight:700;margin-bottom:3px">${d.type === 'air' ? '✈️ Air Cargo' : d.from.name + ' → ' + d.to.name}</div>
          <div style="color:#5a7a8a">${d.type === 'air' ? `Planned air route · ${d.commodity || 'cargo'}` : `Risk: ${d.currentRisk?.toFixed(0) ?? d.baseRisk}/100 · ${d.commodity}`}</div>
        </div>
      `,
      );
  }, [arcRoutesForGlobe, onRouteSelect, globeReady, selectedRouteId]);

  useEffect(() => {
    if (!globeRef.current) return;
    const globe = globeRef.current;

    const allStaticPaths = [
      ...(visiblePipelines || []).map((p) => ({
        ...p,
        layerType: 'pipeline',
        coords: corridorToCoords(p),
      })),
      ...(visibleRail || []).map((r) => ({
        ...r,
        layerType: 'rail',
        coords: corridorToCoords(r),
      })),
    ];

    globe
      .pathsData(allStaticPaths)
      .pathPoints((d) => d.coords)
      .pathPointLat((pt) => pt[0])
      .pathPointLng((pt) => pt[1])
      .pathPointAlt(0.004)
      .pathColor((d) => {
        if (d.layerType === 'pipeline') {
          return d.status === 'blocked'
            ? 'rgba(255,0,0,0.8)'
            : d.status === 'warning'
              ? 'rgba(255,100,0,0.6)'
              : 'rgba(255,68,0,0.35)';
        }
        if (d.layerType === 'rail') {
          return d.status === 'warning' ? 'rgba(255,180,0,0.7)' : 'rgba(255,153,0,0.4)';
        }
        return 'rgba(68,204,136,0.4)';
      })
      .pathStroke((d) => {
        if (d.layerType === 'pipeline') return 0.6;
        if (d.layerType === 'rail') return 0.8;
        return 1.2;
      })
      .pathDashLength((d) => {
        if (d.layerType === 'pipeline') return 1.0;
        if (d.layerType === 'rail') return 0.05;
        return 0.02;
      })
      .pathDashGap((d) => {
        if (d.layerType === 'pipeline') return 0.0;
        if (d.layerType === 'rail') return 0.03;
        return 0.008;
      })
      .pathDashAnimateTime((d) => {
        if (d.layerType === 'pipeline') return 0;
        if (d.layerType === 'rail') return 200000;
        return 100000;
      });
  }, [visibleRail, visiblePipelines, globeReady]);

  useEffect(() => {
    if (!globeRef.current || !chokepoints) return;
    const globe = globeRef.current;
    const affectedId = eventState?.classified?.nearestChokepoint;

    globe.pointsData([]);

    const chokeRing =
      affectedId != null
        ? chokepoints.filter((cp) => cp.id === affectedId).map((cp) => ({ ...cp, kind: 'choke', severity: 1 }))
        : [];

    const evRing = (eventRings || []).map((r) => ({
      lat: r.lat,
      lng: r.lng,
      id: r.id,
      severity: typeof r.severity === 'number' ? r.severity : 0.65,
      kind: 'event',
    }));

    const ringsMerged = [...evRing, ...chokeRing];

    globe
      .ringsData(ringsMerged)
      .ringLat((d) => d.lat)
      .ringLng((d) => d.lng)
      .ringColor((d) => (d.kind === 'event' ? (d.severity > 0.7 ? '#ff2222' : '#ffaa00') : '#ff3b3b'))
      .ringMaxRadius((d) => (d.kind === 'event' ? 4 : 4))
      .ringPropagationSpeed((d) => (d.kind === 'event' ? 2.5 : 2))
      .ringRepeatPeriod((d) => (d.kind === 'event' ? 800 : 1200));
  }, [chokepoints, eventState, eventRings, globeReady]);

  useEffect(() => {
    if (!globeRef.current || mapMode === '2d') {
      if (globeRef.current) globeRef.current.htmlElementsData([]);
      return;
    }
    if (!chokepoints) return;

    const globe = globeRef.current;
    const affectedId = eventState?.classified?.nearestChokepoint;

    const chokeEls = chokepoints.map((cp) => ({
      type: 'chokepoint',
      id: cp.id,
      lat: cp.lat,
      lng: cp.lng,
      name: cp.name,
      tradeShare: cp.tradeSharePercent ?? cp.tradeSharePct ?? 0,
      isAlert: affectedId === cp.id,
    }));

    const vesselEls = (liveVessels || []).map((v) => ({
      ...v,
      type: 'vessel',
      keyId: `v-${v.mmsi}`,
      lat: v.lat,
      lng: v.lng,
    }));

    const routeVesselEls = (displayRoutes || [])
      .filter((route) => route.currentPosition && route.type === 'maritime')
      .map((route) => ({
        type: 'route_vessel',
        keyId: `rv-${route.id}`,
        lat: route.currentPosition.lat,
        lng: route.currentPosition.lng,
        route,
      }));

    const airEls = (liveAircraft || []).map((a) => ({
      ...a,
      type: 'aircraft',
      keyId: `a-${a.icao24}`,
      lat: a.lat,
      lng: a.lng,
    }));

    const pipeEls = (visiblePipelines || []).map((p) => ({
      type: 'pipeline_mid',
      keyId: `pm-${p.id}`,
      lat: (p.from.lat + p.to.lat) / 2,
      lng: (p.from.lng + p.to.lng) / 2,
      name: p.name,
      commodity: p.commodity || p.type,
      pipeStatus: p.status,
    }));

    const railEls = (visibleRail || []).map((r) => ({
      type: 'rail_mid',
      keyId: `rm-${r.id}`,
      lat: (r.from.lat + r.to.lat) / 2,
      lng: (r.from.lng + r.to.lng) / 2,
      name: r.name,
      commodity: r.commodity,
    }));

    const allHtmlPoints = [...chokeEls, ...vesselEls, ...routeVesselEls, ...airEls, ...pipeEls, ...railEls];

    globe
      .htmlElementsData(allHtmlPoints)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.03)
      .htmlElement((d) => {
        const el = document.createElement('div');

        if (d.type === 'chokepoint') {
          el.style.cssText = `
            width: 10px; height: 10px; border-radius: 50%;
            background: ${d.isAlert ? '#ff2222' : '#00ffff'};
            box-shadow: 0 0 ${d.isAlert ? '12px #ff2222' : '8px #00ffff'};
            border: 1px solid ${d.isAlert ? '#ff4444' : '#00ffff'};
            cursor: pointer; pointer-events: auto;
            ${d.isAlert ? 'animation: chokePulse 1.5s ease-in-out infinite;' : ''}
          `;
          el.title = `${d.name} | ${d.tradeShare}% global trade`;
          return el;
        }

        if (d.type === 'vessel') {
          el.innerHTML = '🚢';
          el.style.cssText = `
            font-size: 9px; line-height: 1; cursor: pointer;
            pointer-events: auto; user-select: none;
            opacity: ${d.simulated ? 0.6 : 0.9};
          `;
          const spd = d.sog != null ? `${d.sog.toFixed(1)} kn` : d.speed != null ? `${d.speed.toFixed(1)} kn` : '?';
          el.title = `🚢 ${d.name || d.mmsi} | ${spd}`;
          el.onclick = (ev) => {
            ev.stopPropagation();
            setSelectedTransport({
              type: 'vessel',
              icon: '🚢',
              name: d.name || d.mmsi || 'Unknown Vessel',
              id: d.mmsi || 'N/A',
              speed: spd,
              route: d.label || 'Route-tracked shipment',
              lat: d.lat,
              lng: d.lng,
            });
          };
          return el;
        }

        if (d.type === 'aircraft') {
          el.innerHTML = '✈️';
          el.style.cssText = `
            font-size: 10px; line-height: 1; cursor: pointer;
            pointer-events: auto; user-select: none;
            opacity: ${d.simulated ? 0.6 : 0.9};
          `;
          const spd = d.velocity != null ? `${d.velocity.toFixed(0)} m/s` : d.speed != null ? `${d.speed.toFixed(0)} kn` : '?';
          const fl = d.altitude != null ? `FL${Math.round(d.altitude / 30.48)}` : '—';
          el.title = `✈️ ${d.callsign || d.icao24 || 'Cargo'} | ${spd} | ${fl}`;
          el.onclick = (ev) => {
            ev.stopPropagation();
            setSelectedTransport({
              type: 'aircraft',
              icon: '✈️',
              name: d.callsign || 'Cargo Flight',
              id: d.icao24 || 'N/A',
              speed: spd,
              flightLevel: fl,
              route: d.label || 'Air-cargo corridor',
              lat: d.lat,
              lng: d.lng,
            });
          };
          return el;
        }

        if (d.type === 'route_vessel') {
          el.innerHTML = '●';
          el.style.cssText = `
            font-size: 9px; line-height: 1; cursor: pointer;
            pointer-events: auto; user-select: none;
            color: #00ffff; text-shadow: 0 0 6px #00ffff;
          `;
          el.title = `${d.route.name} | ${Math.round((d.route.currentPosition?.fraction || 0) * 100)}% complete`;
          el.onclick = (ev) => {
            ev.stopPropagation();
            onRouteSelect && onRouteSelect(d.route);
          };
          return el;
        }

        if (d.type === 'pipeline_mid') {
          el.innerHTML = '🛢️';
          el.style.cssText = `
            font-size: 9px; line-height: 1; cursor: default;
            pointer-events: auto; user-select: none; opacity: 0.85;
          `;
          el.title = `🛢️ ${d.name} (${(d.commodity || '').toUpperCase()}) — ${d.pipeStatus}`;
          return el;
        }

        if (d.type === 'rail_mid') {
          el.innerHTML = '🚂';
          el.style.cssText = `
            font-size: 9px; line-height: 1; cursor: default;
            pointer-events: auto; user-select: none; opacity: 0.85;
          `;
          el.title = `🚂 ${d.name} | ${d.commodity}`;
          return el;
        }

        return el;
      });
  }, [chokepoints, eventState, liveVessels, liveAircraft, mapMode, globeReady, visiblePipelines, visibleRail, displayRoutes, onRouteSelect]);

  useEffect(() => {
    if (!globeRef.current) return;
    const affectedId = eventState?.classified?.nearestChokepoint;
    if (!affectedId) return;
    const view = getChokepointView(affectedId);
    if (!view) return;
    const t = setTimeout(() => {
      globeRef.current?.pointOfView({ lat: view.lat, lng: view.lng, altitude: view.alt }, 1400);
    }, 300);
    return () => clearTimeout(t);
  }, [eventState?.classified?.nearestChokepoint, globeReady]);

  useEffect(() => {
    if (mapMode === '2d') setSelectedTransport(null);
  }, [mapMode]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;

    const resizeGlobe = () => {
      if (!containerRef.current || !globeRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      globeRef.current.width(rect.width);
      globeRef.current.height(rect.height);
    };

    const observer = new ResizeObserver(() => {
      resizeGlobe();
    });

    observer.observe(containerRef.current);
    resizeGlobe();

    return () => observer.disconnect();
  }, [globeReady]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        flex: 1,
        background: '#060a0f',
      }}
    >
      {globeInitFailed && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '10px 16px',
            background: 'rgba(11,17,24,0.95)',
            border: '1px solid rgba(255,184,0,0.45)',
            color: '#ffb800',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            maxWidth: 'min(420px, 92vw)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          Globe unavailable — fallback to 2D mode
        </div>
      )}

      {mapMode === '2d' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          <FlatMap2D
            routes={displayRoutes}
            chokepoints={chokepoints}
            eventState={eventState}
            onRouteSelect={onRouteSelect}
            selectedRoute={selectedRoute}
          />
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          minHeight: 0,
          zIndex: 1,
          opacity: mapMode === '2d' ? 0 : 1,
          pointerEvents: mapMode === '2d' ? 'none' : 'auto',
          transition: 'opacity 0.3s',
        }}
      />

      {selectedTransport && (
        <div
          style={{
            position: 'absolute',
            left: 12,
            bottom: 28,
            zIndex: 18,
            width: 'min(320px, calc(100% - 24px))',
            background: 'rgba(11,17,24,0.95)',
            border: '1px solid rgba(0,212,255,0.35)',
            borderRadius: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            color: '#c8deea',
            padding: '10px 12px',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ color: '#00d4ff', fontSize: '11px' }}>
              {selectedTransport.icon} {selectedTransport.name}
            </div>
            <button
              type="button"
              onClick={() => setSelectedTransport(null)}
              style={{
                border: '1px solid #1e2d3d',
                background: '#0f1822',
                color: '#8ab0c7',
                cursor: 'pointer',
                borderRadius: '2px',
                fontSize: '10px',
                padding: '2px 6px',
                fontFamily: "'Space Mono', monospace",
              }}
            >
              Close
            </button>
          </div>
          <div>ID: {selectedTransport.id}</div>
          {selectedTransport.flightLevel && <div>Altitude: {selectedTransport.flightLevel}</div>}
          <div>Speed: {selectedTransport.speed}</div>
          <div>Route: {selectedTransport.route}</div>
          <div>
            Position: {selectedTransport.lat?.toFixed?.(2) ?? selectedTransport.lat}, {selectedTransport.lng?.toFixed?.(2) ?? selectedTransport.lng}
          </div>
        </div>
      )}

      {eventState?.raw && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(11,17,24,0.92)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: '2px',
            padding: '5px 14px',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            color: '#00d4ff',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: 10,
            maxWidth: '78%',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {eventState.raw.headline}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 28,
          right: 12,
          background: 'rgba(11,17,24,0.88)',
          border: '1px solid #1e2d3d',
          borderRadius: '2px',
          padding: '8px 12px',
          fontFamily: "'Space Mono', monospace",
          fontSize: '9px',
          color: '#5a7a8a',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <div style={{ color: '#1e2d3d', marginBottom: 5, letterSpacing: '0.15em', fontSize: '8px' }}>ROUTE STATUS</div>
        {[
          { color: '#44cc88', label: 'NORMAL' },
          { color: '#ffb800', label: 'WARNING' },
          { color: '#ff6b35', label: 'SEVERE' },
          { color: '#ff3b3b', label: 'CRITICAL' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 20, height: 1.5, background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SupplyChainGlobe;
