function haversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const CHOKEPOINT_COORDS = {
  'CHKPT-MALACCA': { lat: 1.2, lng: 103.8 },
  'CHKPT-SUEZ': { lat: 30.0, lng: 32.5 },
  'CHKPT-HORMUZ': { lat: 26.5, lng: 56.5 },
  'CHKPT-PANAMA': { lat: 9.1, lng: -79.7 },
  'CHKPT-BAB': { lat: 12.5, lng: 43.3 },
  'CHKPT-CAPE': { lat: -34.4, lng: 18.5 },
};

function routeProbePoints(route) {
  const points = [route.from, route.to, ...(route.waypoints || [])];

  const cpIds = route.chokepointIds?.length
    ? route.chokepointIds
    : route.chokepointId
      ? [route.chokepointId]
      : [];

  for (const cpId of cpIds) {
    const cp = CHOKEPOINT_COORDS[cpId];
    if (cp) points.push(cp);
  }

  return points.filter((p) => p?.lat != null && p?.lng != null);
}

export function matchRoutesToEvent(routes, event) {
  if (!event || event.lat == null || event.lng == null) {
      return [];
  }
  
  return routes.filter(route => {
    const radius = route.type === 'maritime' ? 800 : 400;

    let minDistance = Infinity;
    for (const p of routeProbePoints(route)) {
      minDistance = Math.min(minDistance, haversineKm(event.lat, event.lng, p.lat, p.lng));
      if (minDistance <= radius) return true;
    }

    return false;
  });
}
