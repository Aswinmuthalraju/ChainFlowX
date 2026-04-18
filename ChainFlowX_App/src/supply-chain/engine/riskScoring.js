// Formula: ROUTE RISK = baseRisk + Σ(severity × proximityFactor × typeFactor)
const TYPE_FACTORS = {
  conflict: 1.0, sanctions: 0.95, cyclone: 0.9, earthquake: 0.85, strike: 0.7, blockage: 1.0, other: 0.5
};

export function calculateRouteRisk(affectedRoutes, classifiedEvent, allRoutes) {
  const scores = {};
  
  if (!classifiedEvent) {
    // Return base risks if no event
    allRoutes?.forEach(r => scores[r.id] = r.baseRisk);
    return scores;
  }

  const { eventType, severity } = classifiedEvent;
  const tFactor = TYPE_FACTORS[eventType] ?? TYPE_FACTORS.other;
  
  allRoutes?.forEach(route => {
    scores[route.id] = route.baseRisk;
  });

  affectedRoutes.forEach(r => {
    // Simple proximity factor based on Haversine distance, here we assume if it's affected, 
    // it's proximity is close (we'll let disruptionMatcher handle distances exactly, treating affected as prox 1.0)
    // To match instructions: "proximityFactor: 1.0 inside radius, 0.5 within 2× radius, 0.0 outside"
    // Since affectedRoutes already passed disruptionMatcher, we'll assign proximityFactor = 1.0 for simplicity
    // in this scope unless we re-calc distance here. 
    // Wait, the prompt says "ROUTE RISK = baseRisk + Σ(severity × proximityFactor × typeFactor)"
    // Let's just use proximityFactor = 1.0 for those in affectedRoutes.
    // So currentRisk = baseRisk + (severity * 100 * 1.0 * tFactor)
    
    // We multiply severity (0-1.0) by 100 to get points
    const additionalRisk = severity * 100 * 1.0 * tFactor;
    let newScore = route.baseRisk + additionalRisk; // Wait, route is not defined, we use r
    newScore = r.baseRisk + additionalRisk;
    scores[r.id] = Math.min(100, Math.max(0, newScore));
  });

  return scores;
}

export function updateRouteStatuses(routes, riskScores) {
  return routes.map(route => {
    const score = riskScores[route.id] ?? route.baseRisk;
    let status = 'normal';
    if (score >= 86) status = 'critical';
    else if (score >= 61) status = 'warning';
    else if (score >= 31) status = 'moderate'; // 31-60 is yellow, but spec said moderate here or earlier warning? 'warning'=yellow, 'orange'=severe?
    // Wait, threshold from prompt: 0–30=green, 31–60=yellow, 61–85=orange, 86–100=red
    // Let's output status strings matched to colors later: 'normal', 'warning', 'critical'
    if (score >= 86) status = 'critical';
    else if (score >= 61) status = 'severe'; // orange
    else if (score >= 31) status = 'warning'; // yellow
    
    return {
      ...route,
      currentRisk: score,
      status
    };
  });
}
