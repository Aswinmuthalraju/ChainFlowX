// A static map to give basic alternartives for every route 
export const ROUTE_ALTERNATIVES = {
    'SH-ROT-001': { alt: 'CAPE-ALT-001', days: 14, costPerContainer: 1200 },
    'SH-CHN-001': { alt: 'SH-SIN-001', days: 2, costPerContainer: 220 },
    'SIN-ROT-001': { alt: 'CAPE-ALT-001', days: 14, costPerContainer: 1200 },
    'DUB-LB-001': { alt: 'CAPE-ALT-001', days: 11, costPerContainer: 1450 },
    'HKG-HAM-001': { alt: 'CAPE-ALT-001', days: 13, costPerContainer: 1250 },
    'TOK-NYC-001': { alt: 'PAN-NYC-001', days: 5, costPerContainer: 950 },
    'SIN-LA-001': { alt: 'BUS-SH-001', days: 3, costPerContainer: 430 },
    'SH-SIN-001': { alt: 'BUS-SH-001', days: 1, costPerContainer: 190 },
    'BUS-SH-001': { alt: 'SH-SIN-001', days: 1, costPerContainer: 120 },
    'HOR-ROT-OIL': { alt: 'CAPE-ALT-001', days: 14, costPerContainer: 2100 },
    'HOR-SIN-LNG': { alt: 'SH-SIN-001', days: 2, costPerContainer: 320 },
    'PAN-NYC-001': { alt: 'TOK-NYC-001', days: 4, costPerContainer: 520 },
    'LB-SH-EMPTY': { alt: 'SIN-LA-001', days: 3, costPerContainer: 260 },
    'BAB-ROT-001': { alt: 'CAPE-ALT-001', days: 12, costPerContainer: 1600 },
    'CAPE-ALT-001': { alt: 'BAB-ROT-001', days: 6, costPerContainer: 800 },
    'SH-FRA-AIR': { alt: 'SIN-LHR-AIR', days: 0, costPerContainer: 2800 },
    'HKG-LAX-AIR': { alt: 'SH-FRA-AIR', days: 0, costPerContainer: 2400 },
    'SIN-LHR-AIR': { alt: 'SH-FRA-AIR', days: 0, costPerContainer: 2300 }
};

export function calcAltRoute(routeId, classifiedEvent, rippleScoreResult) {
  const baseAlt = ROUTE_ALTERNATIVES[routeId] || { alt: 'General Reroute', days: 5, costPerContainer: 500 };
  
  let costMult = 1.0;
  let delayMult = 1.0;
  let congestionNote = null;
  
  if (rippleScoreResult != null) {
      const rs = rippleScoreResult;
      // CRITICAL FIX #5
      if (rs >= 4 && rs < 7) {
          costMult = 1.10;
          delayMult = 1.05;
          congestionNote = 'Moderate network congestion expected.';
      } else if (rs >= 7) {
          costMult = 1.25;
          delayMult = 1.15;
          congestionNote = 'Severe regional congestion at alternative hubs.';
      }
  }
  
  if (classifiedEvent && classifiedEvent.severity > 0.7) {
      delayMult *= 1.10;
  }
  
  const delayDays = Math.round(baseAlt.days > 0 ? baseAlt.days * delayMult : baseAlt.days);
  const costDelta = Math.round(baseAlt.costPerContainer * costMult);
  
  return {
      recommended: baseAlt.alt,
      primaryRoute: routeId,
      delayDays,
      costDelta,
      costPerContainer: costDelta,
      congestionNote,
      summary: `Use ${baseAlt.alt}. Expected delay: ${delayDays > 0 ? '+' : ''}${delayDays} days. Est cost impact: +$${costDelta}/container`
  };
}
