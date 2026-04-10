/**
 * Permanent 18 global trade corridors for globe fallback when app routes are empty.
 * Shape matches main ROUTES (from/to with lat/lng) for path rendering + labels.
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
  row('CFX-DEF-001', 'Shanghai → Rotterdam', 'Shanghai', 31.2304, 121.4737, 'Rotterdam', 51.9244, 4.4777, 'electronics'),
  row('CFX-DEF-002', 'Singapore → Dubai', 'Singapore', 1.3521, 103.8198, 'Dubai', 25.2048, 55.2708, 'oil'),
  row('CFX-DEF-003', 'Chennai → Hamburg', 'Chennai', 13.0827, 80.2707, 'Hamburg', 53.5511, 9.9937, 'bulk'),
  row('CFX-DEF-004', 'Busan → Los Angeles', 'Busan', 35.0985, 129.0233, 'Los Angeles', 34.0522, -118.2437, 'automotive'),
  row('CFX-DEF-005', 'Hong Kong → Antwerp', 'Hong Kong', 22.2793, 114.1633, 'Antwerp', 51.2194, 4.4025, 'consumer_goods'),
  row('CFX-DEF-006', 'Colombo → Singapore', 'Colombo', 6.9271, 79.8612, 'Singapore', 1.3521, 103.8198, 'bulk'),
  row('CFX-DEF-007', 'Dubai → Rotterdam', 'Dubai', 25.2048, 55.2708, 'Rotterdam', 51.9244, 4.4777, 'oil'),
  row('CFX-DEF-008', 'Panama → Los Angeles', 'Panama Canal', 9.082, -79.5871, 'Los Angeles', 34.0522, -118.2437, 'grain'),
  row('CFX-DEF-009', 'Suez → Hamburg', 'Suez', 30.0173, 32.5499, 'Hamburg', 53.5511, 9.9937, 'consumer_goods'),
  row('CFX-DEF-010', 'Malacca → Shanghai', 'Strait of Malacca', 2.6058, 101.7038, 'Shanghai', 31.2304, 121.4737, 'electronics'),
  row('CFX-DEF-011', 'Singapore → Busan', 'Singapore', 1.3521, 103.8198, 'Busan', 35.0985, 129.0233, 'semiconductors'),
  row('CFX-DEF-012', 'Rotterdam → New York', 'Rotterdam', 51.9244, 4.4777, 'New York', 40.7128, -74.006, 'pharmaceuticals'),
  row('CFX-DEF-013', 'Antwerp → Dubai', 'Antwerp', 51.2194, 4.4025, 'Dubai', 25.2048, 55.2708, 'consumer_goods'),
  row('CFX-DEF-014', 'Shanghai → Chennai', 'Shanghai', 31.2304, 121.4737, 'Chennai', 13.0827, 80.2707, 'electronics'),
  row('CFX-DEF-015', 'Los Angeles → Tokyo', 'Los Angeles', 34.0522, -118.2437, 'Tokyo', 35.6762, 139.6503, 'automotive'),
  row('CFX-DEF-016', 'Busan → Hamburg', 'Busan', 35.0985, 129.0233, 'Hamburg', 53.5511, 9.9937, 'automotive'),
  row('CFX-DEF-017', 'Colombo → Dubai', 'Colombo', 6.9271, 79.8612, 'Dubai', 25.2048, 55.2708, 'bulk'),
  row('CFX-DEF-018', 'Panama → Rotterdam', 'Panama Canal', 9.082, -79.5871, 'Rotterdam', 51.9244, 4.4777, 'grain'),
];
