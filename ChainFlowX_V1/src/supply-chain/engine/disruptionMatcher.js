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

export function matchRoutesToEvent(routes, event) {
  if (!event || event.lat == null || event.lng == null) {
      return [];
  }
  
  return routes.filter(route => {
    const radius = route.type === 'maritime' ? 800 : 400;
    
    let minDistance = Infinity;
    
    // Check endpoints
    minDistance = Math.min(minDistance, haversineKm(event.lat, event.lng, route.from.lat, route.from.lng));
    minDistance = Math.min(minDistance, haversineKm(event.lat, event.lng, route.to.lat, route.to.lng));
    
    // Assume if the route goes through a chokepoint and the event is near that chokepoint, it's affected.
    // We would need chokepoint coordinates. Since we don't have them here, we just use from/to. 
    // In practice, we should check distance to intermediate nodes if coords were on the route object. 
    // Wait, the stateManager will infer nearestChokepoint from event.lat/lng and pass it in classified.
    
    return minDistance <= radius; 
  });
}
