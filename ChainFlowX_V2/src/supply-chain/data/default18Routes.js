/**
 * Permanent 18 global trade corridors for globe fallback when app routes are empty.
 * Shape matches main ROUTES (from/to with lat/lng) for arc rendering + labels.
 */

function row(id, name, fromName, startLat, startLng, toName, endLat, endLng, commodity = 'consumer_goods') {
  return {
    id,
    name,
    from: { name: fromName, lat: startLat, lng: startLng },
    to: { name: toName, lat: endLat, lng: endLng },
    startLat,
    startLng,
    endLat,
    endLng,
    type: 'maritime',
    commodity,
    normalTransitDays: 18,
    baseRisk: 22,
    currentRisk: 22,
    rippleScore: null,
    status: 'normal',
    riskLevel: 'normal',
    tradeVolumeM: 100,
    portAbsorptionCapacity: 0.82,
    chokepoint: null,
    chokepointId: null,
    graphEdges: [],
    dnaMatch: null,
    alternatives: [],
  };
}

export const DEFAULT_18_ROUTES = [
  row('CFX-DEF-001', 'Shanghai → Rotterdam', 'Shanghai', 31.23, 121.47, 'Rotterdam', 51.92, 4.47, 'electronics'),
  row('CFX-DEF-002', 'Singapore → Dubai', 'Singapore', 1.28, 103.85, 'Dubai', 25.27, 55.29, 'oil'),
  row('CFX-DEF-003', 'Chennai → Hamburg', 'Chennai', 13.08, 80.27, 'Hamburg', 53.55, 9.99, 'bulk'),
  row('CFX-DEF-004', 'Busan → Los Angeles', 'Busan', 35.1, 129.04, 'Los Angeles', 33.74, -118.26, 'automotive'),
  row('CFX-DEF-005', 'Hong Kong → Antwerp', 'Hong Kong', 22.31, 114.17, 'Antwerp', 51.22, 4.4, 'consumer_goods'),
  row('CFX-DEF-006', 'Colombo → Singapore', 'Colombo', 6.93, 79.85, 'Singapore', 1.28, 103.85, 'bulk'),
  row('CFX-DEF-007', 'Dubai → Rotterdam', 'Dubai', 25.27, 55.29, 'Rotterdam', 51.92, 4.47, 'oil'),
  row('CFX-DEF-008', 'Panama → Los Angeles', 'Panama Canal', 9.08, -79.68, 'Los Angeles', 33.74, -118.26, 'grain'),
  row('CFX-DEF-009', 'Suez → Hamburg', 'Suez', 30.42, 32.35, 'Hamburg', 53.55, 9.99, 'consumer_goods'),
  row('CFX-DEF-010', 'Malacca → Shanghai', 'Strait of Malacca', 1.26, 103.82, 'Shanghai', 31.23, 121.47, 'electronics'),
  row('CFX-DEF-011', 'Singapore → Busan', 'Singapore', 1.28, 103.85, 'Busan', 35.1, 129.04, 'semiconductors'),
  row('CFX-DEF-012', 'Rotterdam → New York', 'Rotterdam', 51.92, 4.47, 'New York', 40.71, -74.0, 'pharmaceuticals'),
  row('CFX-DEF-013', 'Antwerp → Dubai', 'Antwerp', 51.22, 4.4, 'Dubai', 25.27, 55.29, 'consumer_goods'),
  row('CFX-DEF-014', 'Shanghai → Chennai', 'Shanghai', 31.23, 121.47, 'Chennai', 13.08, 80.27, 'electronics'),
  row('CFX-DEF-015', 'Los Angeles → Tokyo', 'Los Angeles', 33.74, -118.26, 'Tokyo', 35.44, 139.63, 'automotive'),
  row('CFX-DEF-016', 'Busan → Hamburg', 'Busan', 35.1, 129.04, 'Hamburg', 53.55, 9.99, 'automotive'),
  row('CFX-DEF-017', 'Colombo → Dubai', 'Colombo', 6.93, 79.85, 'Dubai', 25.27, 55.29, 'bulk'),
  row('CFX-DEF-018', 'Panama → Rotterdam', 'Panama Canal', 9.08, -79.68, 'Rotterdam', 51.92, 4.47, 'grain'),
];
