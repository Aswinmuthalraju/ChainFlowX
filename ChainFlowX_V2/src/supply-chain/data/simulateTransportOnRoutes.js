const DEMO_AIR_CARGO_ROUTES = [
  {
    id: 'AIR-SH-DXB-001',
    type: 'air',
    commodity: 'electronics',
    from: { name: 'Shanghai', lat: 31.23, lng: 121.47 },
    to: { name: 'Dubai', lat: 25.2, lng: 55.27 },
  },
  {
    id: 'AIR-FRA-SIN-001',
    type: 'air',
    commodity: 'pharma',
    from: { name: 'Frankfurt', lat: 50.04, lng: 8.56 },
    to: { name: 'Singapore', lat: 1.36, lng: 103.99 },
  },
  {
    id: 'AIR-MEM-TYO-001',
    type: 'air',
    commodity: 'courier/express',
    from: { name: 'Memphis', lat: 35.04, lng: -89.98 },
    to: { name: 'Tokyo', lat: 35.68, lng: 139.76 },
  },
  {
    id: 'AIR-HKG-LAX-001',
    type: 'air',
    commodity: 'high-value electronics',
    from: { name: 'Hong Kong', lat: 22.32, lng: 114.17 },
    to: { name: 'Los Angeles', lat: 34.05, lng: -118.24 },
  },
  {
    id: 'AIR-AMS-ORD-001',
    commodity: 'express mixed cargo',
    from: { name: 'Delhi', lat: 28.56, lng: 77.1 },
    to: { name: 'Sydney', lat: -33.94, lng: 151.18 },
  },
];

const lerp = (a, b, t) => a + (b - a) * t;

const CHOKEPOINT_WAYPOINTS = {
  'CHKPT-MALACCA': [{ lat: 1.2, lng: 103.8 }],
  'CHKPT-SUEZ': [{ lat: 30.0, lng: 32.5 }],
  'CHKPT-HORMUZ': [{ lat: 26.5, lng: 56.5 }],
  'CHKPT-PANAMA': [{ lat: 9.1, lng: -79.7 }],
  'CHKPT-BAB': [{ lat: 12.5, lng: 43.3 }],
  'CHKPT-CAPE': [{ lat: -34.4, lng: 18.5 }],
};

const MARITIME_ROUTE_WAYPOINTS = {
  'ROT-SIN-001': [

    { lat: 36.0, lng: -5.3 },
    { lat: 30.2, lng: 32.3 },
    { lat: 12.7, lng: 43.3 },
    { lat: 6.0, lng: 72.0 },
    { lat: 1.26, lng: 103.84 },
  ],
  'SH-ROT-001': [
    { lat: 22.0, lng: 113.8 },
    { lat: 1.26, lng: 103.84 },
    { lat: 6.0, lng: 72.0 },
    { lat: 12.7, lng: 43.3 },
    { lat: 30.2, lng: 32.3 },
    { lat: 36.0, lng: -5.3 },
  ],
  'HKG-HAM-001': [
    { lat: 22.0, lng: 113.8 },
    { lat: 1.26, lng: 103.84 },
    { lat: 6.0, lng: 72.0 },
    { lat: 12.7, lng: 43.3 },
    { lat: 30.2, lng: 32.3 },
    { lat: 36.0, lng: -5.3 },
  ],
  'MUM-ROT-001': [
    { lat: 15.0, lng: 67.0 },
    { lat: 12.7, lng: 43.3 },
    { lat: 30.2, lng: 32.3 },
    { lat: 36.0, lng: -5.3 },
  ],
  'SIN-ROT-001': [
    { lat: 1.26, lng: 103.84 },
    { lat: 6.0, lng: 72.0 },
    { lat: 12.7, lng: 43.3 },
    { lat: 30.2, lng: 32.3 },
    { lat: 36.0, lng: -5.3 },
  ],
  'SH-SIN-001': [
    { lat: 25.0, lng: 118.0 },
    { lat: 18.0, lng: 114.0 },
    { lat: 10.0, lng: 109.0 },
    { lat: 1.26, lng: 103.84 },
  ],
  'BUS-SH-001': [
    { lat: 34.8, lng: 126.0 },
    { lat: 33.4, lng: 124.0 },
    { lat: 32.0, lng: 122.0 },
  ],
  'DUB-LB-001': [
    { lat: 30.2, lng: 32.3 },
    { lat: 12.7, lng: 43.3 },
    { lat: 6.0, lng: 72.0 },
    { lat: 9.0, lng: -79.58 },
    { lat: 20.0, lng: -105.0 },
    { lat: 33.75, lng: -118.2168 },
  ],
  'HOR-ROT-OIL': [
    { lat: 15.0, lng: 64.0 },
    { lat: 12.7, lng: 43.3 },
    { lat: 30.2, lng: 32.3 },
    { lat: 36.0, lng: -5.3 },
  ],
  'HOR-SIN-LNG': [
    { lat: 18.0, lng: 64.0 },
    { lat: 6.0, lng: 72.0 },
    { lat: 1.26, lng: 103.84 },
  ],
  'PAN-NYC-001': [
    { lat: 18.0, lng: -75.0 },
    { lat: 25.0, lng: -72.0 },
    { lat: 32.0, lng: -74.0 },
  ],
  'LB-SH-EMPTY': [
    { lat: 30.0, lng: -130.0 },
    { lat: 32.0, lng: -150.0 },
    { lat: 33.0, lng: 170.0 },
    { lat: 30.0, lng: 150.0 },
  ],
  'BAB-ROT-001': [
    { lat: 18.0, lng: 43.0 },
    { lat: 30.2, lng: 32.3 },
    { lat: 36.0, lng: -5.3 },
  ],
  'CAPE-ALT-001': [
    { lat: -5.0, lng: 48.0 },
    { lat: -18.0, lng: 42.0 },
    { lat: -30.0, lng: 28.0 },
    { lat: -34.35, lng: 18.5 },
  ],
  'LA-ROT-001': [
    { lat: 22.0, lng: -118.0 },
    { lat: 9.0, lng: -79.58 },
    { lat: 24.0, lng: -70.0 },
  ],
  'SHA-CPT-001': [
    { lat: 1.26, lng: 103.84 },
    { lat: -12.0, lng: 80.0 },
    { lat: -25.0, lng: 45.0 },
  ],
};

function normalizeLng(lng) {
  let value = lng;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function interpolateGeo(a, b, t) {
  let lngDelta = b.lng - a.lng;
  if (lngDelta > 180) lngDelta -= 360;
  if (lngDelta < -180) lngDelta += 360;
  return {
    lat: lerp(a.lat, b.lat, t),
    lng: normalizeLng(a.lng + lngDelta * t),
  };
}

function getRoutePath(route) {
  const basePath = [route.from, ...(route.waypoints || []), route.to].map((pt) => ({ lat: pt.lat, lng: pt.lng }));
  if (route.type !== 'maritime') return basePath;

  const routeSpecific = MARITIME_ROUTE_WAYPOINTS[route.id] || [];
  const chokepointHints = CHOKEPOINT_WAYPOINTS[route.chokepointId] || [];
  const full = [route.from, ...routeSpecific, ...chokepointHints, route.to].map((pt) => ({ lat: pt.lat, lng: pt.lng }));

  const deduped = [];
  for (const pt of full) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.abs(prev.lat - pt.lat) > 0.001 || Math.abs(prev.lng - pt.lng) > 0.001) {
      deduped.push(pt);
    }
  }
  return deduped.length >= 2 ? deduped : basePath;
}

function pointOnPath(path, t) {
  if (!path || path.length < 2) return path?.[0] || { lat: 0, lng: 0 };

  const segments = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const len = haversineKm(path[i], path[i + 1]);
    segments.push(len);
    total += len;
  }

  const target = total * t;
  let acc = 0;
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    if (acc + seg >= target) {
      const localT = seg === 0 ? 0 : (target - acc) / seg;
      return interpolateGeo(path[i], path[i + 1], localT);
    }
    acc += seg;
  }

  return path[path.length - 1];
}

function ensureAirRoutes(routes) {
  const hasAir = routes.some((route) => route.type === 'air');
  return hasAir ? routes : [...routes, ...DEMO_AIR_CARGO_ROUTES];
}

export function getTransportSimulationRoutes(routes) {
  return ensureAirRoutes(routes);
}

export function generateShipsOnRoutes(routes) {
  const ships = [];
  routes.forEach((route) => {
    if (route.type !== 'maritime') return;
    const path = getRoutePath(route);
    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i += 1) {
      const t = (i + 1) / (count + 1);
      const pos = pointOnPath(path, t);
      ships.push({
        type: 'vessel',
        simulated: true,
        routeId: route.id,
        mmsi: `${route.id}-ship-${i}`,
        name: `${route.commodity || 'Cargo'} Vessel`,
        lat: pos.lat,
        lng: pos.lng,
        label: `🚢 ${route.commodity || 'cargo'} | ${route.from.name} -> ${route.to.name}`,
        path,
        t,
        speed: 0.00025 + Math.random() * 0.0005,
      });
    }
  });
  return ships;
}

export function generateAircraftOnRoutes(routes) {
  const aircraft = [];
  routes.forEach((route) => {
    if (route.type !== 'air') return;
    const path = getRoutePath(route);
    const count = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < count; i += 1) {
      const t = (i + 1) / (count + 1);
      const pos = pointOnPath(path, t);
      aircraft.push({
        type: 'aircraft',
        simulated: true,
        routeId: route.id,
        icao24: `${route.id}-air-${i}`,
        callsign: `AIR-${route.id.slice(-3)}${i}`,
        lat: pos.lat,
        lng: pos.lng,
        label: `✈️ Air Cargo | ${route.from.name} -> ${route.to.name}`,
        path,
        t,
        speed: 0.0012 + Math.random() * 0.0018,
        altitude: 10668 + Math.round(Math.random() * 3000),
        velocity: 225 + Math.round(Math.random() * 45),
      });
    }
  });
  return aircraft;
}

export function advanceSimulatedTransport(points, routesById) {
  return points.map((point) => {
    const route = routesById.get(point.routeId);
    if (!route) return point;
    const path = point.path || getRoutePath(route);
    const newT = point.t + point.speed;
    const t = newT > 1 ? 0 : newT;
    const pos = pointOnPath(path, t);
    return {
      ...point,
      path,
      t,
      lat: pos.lat,
      lng: pos.lng,
    };
  });
}
