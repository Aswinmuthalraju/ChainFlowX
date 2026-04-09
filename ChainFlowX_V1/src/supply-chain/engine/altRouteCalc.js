// A static map to give basic alternartives for every route 
export const ROUTE_ALTERNATIVES = {
  'SH-CHN-001': { alt: 'SH-SGP-CHN-001', days: 4, costPerContainer: 200 },
  'ROT-SIN-001': { alt: 'via Cape of Good Hope', days: 14, costPerContainer: 1200 },
  'SH-ROT-001': { alt: 'via Cape of Good Hope', days: 14, costPerContainer: 1200 },
  'LA-SH-001': { alt: 'Air Freight', days: -10, costPerContainer: 5000 },
  'DUB-MUM-001': { alt: 'Overland Pipeline', days: 2, costPerContainer: 50 },
  'SIN-TOK-001': { alt: 'via Pacific outer ring', days: 3, costPerContainer: 300 },
  'SH-LA-001': { alt: 'via Panama/East Coast', days: 10, costPerContainer: 800 },
  'ROT-NYC-001': { alt: 'Air Freight', days: -6, costPerContainer: 4000 },
  'BUS-ROT-001': { alt: 'via Cape of Good Hope', days: 14, costPerContainer: 1200 },
  'MUM-ROT-001': { alt: 'via Cape of Good Hope', days: 14, costPerContainer: 1100 },
  'SHA-SIN-001': { alt: 'via Outer Sea', days: 2, costPerContainer: 150 },
  'JED-ROT-001': { alt: 'via Cape of Good Hope', days: 14, costPerContainer: 1200 },
  'SHA-BUS-001': { alt: 'Air Freight', days: -1, costPerContainer: 800 },
  'SIN-ROT-001': { alt: 'via Cape of Good Hope', days: 14, costPerContainer: 1200 },
  'LA-ROT-001': { alt: 'via Suez westbound', days: 19, costPerContainer: 1500 },
  'CPT-ROT-001': { alt: 'Air Freight', days: -14, costPerContainer: 6000 },
  'HOU-ROT-001': { alt: 'via Transatlantic', days: 5, costPerContainer: 500 },
  'SHA-CPT-001': { alt: 'via Outer Sea', days: 4, costPerContainer: 400 }
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
