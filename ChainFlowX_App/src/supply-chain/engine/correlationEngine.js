export function detectCascadeAlerts(affectedRoutes, riskScores, chokepoints, rippleScoreResult, routesList) {
  const alerts = [];
  
  if (rippleScoreResult && rippleScoreResult >= 8.0) {
      alerts.push({
          type: 'Network Collapse Risk',
          message: 'Network-wide cascade risk detected. Ripple Score exceeds 8.0 threshold.',
          severity: 'CRITICAL',
          affectedNodes: []
      });
  }
  
  // Chokepoint saturation alert
  const chokepointCounts = {};
  affectedRoutes.forEach(r => {
      if (riskScores[r.id] > 60) {
          const cpIds = r.chokepointIds?.length
              ? r.chokepointIds
              : r.chokepointId
                  ? [r.chokepointId]
                  : [];
          cpIds.forEach((cpId) => {
              chokepointCounts[cpId] = (chokepointCounts[cpId] || 0) + 1;
          });
      }
  });
  
  for (const [cpId, count] of Object.entries(chokepointCounts)) {
      if (count >= 2) {
          alerts.push({
              type: 'Saturation Alert',
              message: `Multiple critical routes detected passing through ${cpId}. Chokepoint saturation likely.`,
              severity: 'HIGH',
              affectedNodes: [cpId]
          });
      }
  }
  
  // Port overflow imminent
  routesList?.forEach(r => {
      // simulate port absorption decay under stress
      // If it's a critical route, port absorption at 'to' port shrinks
      if (riskScores[r.id] > 80 && r.portAbsorptionCapacity < 0.8) {
          // just an arbitrary trigger for the alert
          const simulatedAbsorption = r.portAbsorptionCapacity - (rippleScoreResult * 0.05);
          if (simulatedAbsorption < 0.3) {
              alerts.push({
                  type: 'Port Overflow',
                  message: `Port overflow imminent at ${r.to.name}. Absorption capacity collapsed to ${(simulatedAbsorption*100).toFixed(1)}%.`,
                  severity: 'HIGH',
                  affectedNodes: [r.to.portId]
              });
          }
      }
  });
  
  return alerts;
}
