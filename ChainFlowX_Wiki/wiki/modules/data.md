# Module: Data
_Last updated: 2026-04-27 | Verified against code: 2026-04-27_

## Purpose
Static reference data (routes, ports, chokepoints, DNA fingerprints) + live feed ingestion (GDELT, RSS) + transport simulation.

## Location
`src/supply-chain/data/`

## Key files
- `routes.js` — 18 routes (`ROUTES` array) with waypoints, chokepoint IDs, commodity, trade volume, port absorption. See [[wiki/schemas/route]]
- `default18Routes.js` — canonical default snapshot of the 18 routes
- `ports.js` — `PORTS` — port nodes with lat/lng used to build the graph
- `chokepoints.js` — `CHOKEPOINTS` — 6 strategic chokepoints (Malacca, Suez, Hormuz, Panama, Bab el-Mandeb, Cape)
- `dnaFingerprints.js` — `DNA_FINGERPRINTS` — historical disruption patterns used by `matchDNA`
- `liveEventFeed.js` — `startLiveEventFeed({onArticlesUpdate, onPipelineEvent, pollIntervalMs})` — polls GDELT + RSS every 90s; circuit breaker (threshold 3, cooldown 10m)
- `newsKeywordClassifier.js` — `keywordClassify(headline, description)` — fast keyword-based event classification
- `rssFeedConfig.js` — `RSS_FEEDS` — list of RSS feed URLs for live news
- `simulateTransportOnRoutes.js` — `generateShipsOnRoutes`, `generateAircraftOnRoutes`, `advanceSimulatedTransport` — simulated vessel/aircraft positions
- `transportAir.js`, `transportMaritime.js`, `transportRail.js`, `transportPipeline.js` — static corridor data per transport mode
- `transportLayerManager.js` — manages which transport layers are active

## GDELT query rotation
10 rotating queries covering: shipping disruption, Suez, Malacca, Red Sea, Panama, Hormuz, trade sanctions, cargo seized, port strike, earthquake/typhoon

## Signal TTL constants
critical=6h, high=2h, medium=30m, low=15m, info=5m

## Known gotchas
- Transport vessels are **simulated** — AIS stream key was removed
- `liveEventFeed.js` has a circuit breaker: 3 consecutive feed failures → 10m cooldown
- `routes.js` uses `interpolateAlongGreatCircle` / `interpolateAlongWaypoints` for arc rendering
- Route IDs follow pattern: `SH-ROT-001` (maritime), `SH-FRA-AIR` (air)
