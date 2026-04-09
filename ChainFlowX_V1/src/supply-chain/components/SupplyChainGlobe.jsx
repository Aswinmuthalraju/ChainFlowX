import React, { useRef, useEffect } from 'react';
import Globe from 'globe.gl';

// ── 2D flat map (SVG equirectangular radar display) ──────────────────────────
function FlatMap2D({ routes, chokepoints, eventState, onRouteSelect }) {
  const W = 1000, H = 500;

  const toX = (lng) => ((lng + 180) / 360) * W;
  const toY = (lat) => ((90 - lat) / 180) * H;

  const arcColor = (status) => {
    if (status === 'critical') return '#ff3b3b';
    if (status === 'severe')   return '#ff6b35';
    if (status === 'warning')  return '#ffb800';
    return '#44cc88';
  };

  const arcOpacity = (status) =>
    status === 'critical' ? 0.95 : status === 'severe' ? 0.8 : status === 'warning' ? 0.7 : 0.5;

  const arcStroke = (status) =>
    status === 'critical' ? 2.5 : status === 'warning' ? 1.8 : 1.2;

  const arcPath = (from, to) => {
    const x1 = toX(from.lng), y1 = toY(from.lat);
    const x2 = toX(to.lng),   y2 = toY(to.lat);
    const cx  = (x1 + x2) / 2;
    const dy  = Math.abs(x2 - x1) * 0.18;
    const cy  = (y1 + y2) / 2 - dy;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  const latLines = [-60, -30, 0, 30, 60];
  const lngLines = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: '100%', display: 'block', background: '#060a0f' }}
    >
      <rect x="0" y="0" width={W} height={H} fill="#060a0f" />

      {latLines.map((lat, i) => {
        const y = toY(lat);
        return i % 2 === 0
          ? <rect key={`band${lat}`} x={0} y={y - 41.7} width={W} height={83.3} fill="rgba(14,22,35,0.4)" />
          : null;
      })}

      {latLines.map(lat => (
        <line key={`lat${lat}`} x1={0} y1={toY(lat)} x2={W} y2={toY(lat)} stroke="#1e2d3d" strokeWidth="0.5" />
      ))}
      <line x1={0} y1={toY(0)} x2={W} y2={toY(0)} stroke="#1e2d3d" strokeWidth="1" />
      {lngLines.map(lng => (
        <line key={`lng${lng}`} x1={toX(lng)} y1={0} x2={toX(lng)} y2={H} stroke="#1e2d3d" strokeWidth="0.5" />
      ))}
      <line x1={toX(0)} y1={0} x2={toX(0)} y2={H} stroke="#1e2d3d" strokeWidth="1" />

      {latLines.map(lat => (
        <text key={`llbl${lat}`} x={4} y={toY(lat) - 2} fill="#1e2d3d" fontSize="8" fontFamily="Space Mono, monospace">
          {lat > 0 ? `${lat}N` : lat < 0 ? `${Math.abs(lat)}S` : 'EQ'}
        </text>
      ))}

      {routes && routes.map(route => (
        <g key={route.id} style={{ cursor: 'pointer' }} onClick={() => onRouteSelect && onRouteSelect(route)}>
          {(route.status === 'critical' || route.status === 'severe') && (
            <path d={arcPath(route.from, route.to)} fill="none" stroke={arcColor(route.status)} strokeWidth={arcStroke(route.status) + 3} strokeOpacity={0.12} />
          )}
          <path
            d={arcPath(route.from, route.to)}
            fill="none"
            stroke={arcColor(route.status)}
            strokeWidth={arcStroke(route.status)}
            strokeOpacity={arcOpacity(route.status)}
            strokeLinecap="round"
          />
        </g>
      ))}

      {routes && routes.map(route => [route.from, route.to]).flat().filter((p, i, arr) =>
        arr.findIndex(q => q.name === p.name) === i
      ).map(port => (
        <circle key={port.name} cx={toX(port.lng)} cy={toY(port.lat)} r={2.5} fill="#1e2d3d" stroke="#00d4ff" strokeWidth={0.7} opacity={0.8} />
      ))}

      {chokepoints && chokepoints.map(cp => {
        const isAffected = eventState?.classified?.nearestChokepoint === cp.id;
        const cx = toX(cp.lng), cy = toY(cp.lat);
        return (
          <g key={cp.id}>
            {isAffected && (
              <>
                <circle cx={cx} cy={cy} r={10} fill="none" stroke="#ff3b3b" strokeWidth="0.5" opacity="0.3" />
                <circle cx={cx} cy={cy} r={6}  fill="none" stroke="#ff3b3b" strokeWidth="0.5" opacity="0.5" />
              </>
            )}
            <circle cx={cx} cy={cy} r={isAffected ? 4.5 : 3} fill={isAffected ? '#ff3b3b' : '#00d4ff'} opacity={0.85} />
            <text x={cx + 6} y={cy + 3} fill={isAffected ? '#ff3b3b' : '#5a7a8a'} fontSize="7" fontFamily="Space Mono, monospace">
              {cp.id}
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

// ── Chokepoint view coordinates for auto-focus ───────────────────────────────
const CHOKEPOINT_VIEWS = {
  MALACCA:  { lat: 2,   lng: 104, alt: 2.2 },
  SUEZ:     { lat: 30,  lng: 32,  alt: 2.0 },
  HORMUZ:   { lat: 26,  lng: 56,  alt: 2.0 },
  PANAMA:   { lat: 9,   lng: -80, alt: 2.0 },
  BAB_EL:   { lat: 12,  lng: 43,  alt: 2.2 },
  RED_SEA:  { lat: 20,  lng: 38,  alt: 2.5 },
  TAIWAN:   { lat: 24,  lng: 121, alt: 2.0 },
};

function getChokepointView(id) {
  if (!id) return null;
  const key = id.toUpperCase().replace(/[^A-Z]/g, '_');
  return CHOKEPOINT_VIEWS[key] ?? null;
}

// ── 3D Globe (globe.gl — WorldMonitor texture + config) ─────────────────────
export default function SupplyChainGlobe({ routes, chokepoints, eventState, onRouteSelect, mapMode }) {
  const containerRef = useRef();
  const globeRef     = useRef();

  // ── Initialize globe ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const globe = Globe()(containerRef.current);

    globe
      // WorldMonitor textures (local — no CDN dependency)
      .globeImageUrl('/textures/earth-topo-bathy.jpg')
      .backgroundImageUrl('/textures/night-sky.png')
      // WorldMonitor atmosphere config
      .atmosphereColor('#4466cc')
      .atmosphereAltitude(0.18)
      .backgroundColor('rgba(0,0,0,0)')
      .showGraticules(false)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight);

    // WorldMonitor orbit controls
    const controls = globe.controls();
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 0.3;
    controls.enablePan       = false;
    controls.enableZoom      = true;
    controls.zoomSpeed       = 1.4;
    controls.minDistance     = 101;
    controls.maxDistance     = 600;
    controls.enableDamping   = true;

    // Apply water/specular texture to globe material
    try {
      const material = globe.globeMaterial();
      if (material && window.THREE) {
        const loader = new window.THREE.TextureLoader();
        loader.load('/textures/earth-water.png', (tex) => {
          material.specularMap = tex;
          material.specular = new window.THREE.Color('#555577');
          material.needsUpdate = true;
        });
      }
    } catch (_) { /* ignore if THREE not exposed */ }

    globeRef.current = globe;
    return () => { if (globe._destructor) globe._destructor(); };
  }, []);

  // ── Update arcs (WorldMonitor-style 3-stop gradient + altitudeAutoScale) ──
  useEffect(() => {
    if (!globeRef.current || !routes) return;
    const globe = globeRef.current;

    globe
      .arcsData(routes)
      .arcStartLat(d => d.from.lat)
      .arcStartLng(d => d.from.lng)
      .arcEndLat(d => d.to.lat)
      .arcEndLng(d => d.to.lng)
      .arcColor(d => {
        if (d.status === 'critical') return ['rgba(255,59,59,0.08)',  'rgba(255,59,59,0.9)',  'rgba(255,59,59,0.08)'];
        if (d.status === 'severe')   return ['rgba(255,107,53,0.08)', 'rgba(255,107,53,0.85)','rgba(255,107,53,0.08)'];
        if (d.status === 'warning')  return ['rgba(255,184,0,0.06)',  'rgba(255,184,0,0.8)',  'rgba(255,184,0,0.06)'];
        return ['rgba(68,204,136,0.04)', 'rgba(68,204,136,0.6)', 'rgba(68,204,136,0.04)'];
      })
      .arcAltitudeAutoScale(0.3)
      .arcStroke(d => d.status === 'critical' ? 0.9 : d.status === 'warning' ? 0.6 : 0.4)
      .arcDashLength(0.9)
      .arcDashGap(4)
      .arcDashAnimateTime(d =>
        d.status === 'critical' ? 1800 : d.status === 'warning' ? 3500 : 5000
      )
      .onArcClick(arc => onRouteSelect && onRouteSelect(arc))
      .arcLabel(d => `
        <div style="background:#0b1118;border:1px solid #1e2d3d;padding:6px 10px;border-radius:2px;font-family:'Space Mono',monospace;font-size:10px;color:#e8f4f8">
          <div style="color:#00d4ff;font-weight:700;margin-bottom:3px">${d.from.name} → ${d.to.name}</div>
          <div style="color:#5a7a8a">Risk: ${d.currentRisk?.toFixed(0) ?? d.baseRisk}/100 · ${d.commodity}</div>
        </div>
      `);
  }, [routes, onRouteSelect]);

  // ── Update chokepoints + rings for affected ones ──────────────────────────
  useEffect(() => {
    if (!globeRef.current || !chokepoints) return;
    const globe = globeRef.current;
    const affectedId = eventState?.classified?.nearestChokepoint;

    globe
      .pointsData(chokepoints)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor(d => d.id === affectedId ? '#ff3b3b' : '#00d4ff')
      .pointAltitude(0.02)
      .pointRadius(d => d.id === affectedId ? 1.6 : 0.7)
      .pointLabel(d => `
        <div style="background:#0b1118;border:1px solid #1e2d3d;padding:5px 9px;border-radius:2px;font-family:'Space Mono',monospace;font-size:10px">
          <div style="color:#00d4ff;font-weight:700">${d.name}</div>
          <div style="color:#5a7a8a">${d.tradeSharePct}% world trade</div>
        </div>
      `);

    // Pulsing rings for the affected chokepoint
    const ringsData = affectedId
      ? chokepoints.filter(cp => cp.id === affectedId)
      : [];

    globe
      .ringsData(ringsData)
      .ringLat('lat')
      .ringLng('lng')
      .ringColor(() => '#ff3b3b')
      .ringMaxRadius(4)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1200);
  }, [chokepoints, eventState]);

  // ── Auto-fly to affected chokepoint on event change ───────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const affectedId = eventState?.classified?.nearestChokepoint;
    if (!affectedId) return;
    const view = getChokepointView(affectedId);
    if (!view) return;
    // Brief delay so globe finishes rendering the new data first
    const t = setTimeout(() => {
      globeRef.current?.pointOfView({ lat: view.lat, lng: view.lng, altitude: view.alt }, 1400);
    }, 300);
    return () => clearTimeout(t);
  }, [eventState?.classified?.nearestChokepoint]);

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (globeRef.current && containerRef.current) {
        globeRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#060a0f' }}>

      {/* 2D flat map */}
      {mapMode === '2d' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          <FlatMap2D routes={routes} chokepoints={chokepoints} eventState={eventState} onRouteSelect={onRouteSelect} />
        </div>
      )}

      {/* 3D globe — always warm; hidden in 2D mode */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: mapMode === '2d' ? 0 : 1,
          pointerEvents: mapMode === '2d' ? 'none' : 'auto',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Event headline overlay */}
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

      {/* Route status legend */}
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
}
