# Module: Engine
_Last updated: 2026-04-19 | Verified against code: 2026-04-19_

## Purpose
Core analysis pipeline — risk scoring, ripple propagation, cascade detection, alt-route calculation, position tracking.

## Location
`src/supply-chain/engine/` + `src/supply-chain/state/stateManager.js`

## Key files
- `stateManager.js` — `runPipeline(event, graph)` — orchestrates all 6 layers; also exports `haversineKm`, `inferNearestChokepoint`, `normalizeChokepointToGraphId`, `validateAndNormalizeClassification`
- `rippleScore.js` — `calculateRippleScore(cascadeDepth, tradeVolumeM, portAbsorption, timeToAlt, commodity)` — weighted formula → score 0–10 + label
- `correlationEngine.js` — `detectCascadeAlerts(affectedRoutes, riskScores, chokepoints, rippleRaw, routes)` → alerts array
- `disruptionMatcher.js` — `matchRoutesToEvent(routes, event)` — geo proximity filter (maritime 800km, other 400km)
- `altRouteCalc.js` — `calcAltRoute(routeId, classified, rippleRaw)` — static alt-route map + cost/delay multipliers
- `riskScoring.js` — `calculateRouteRisk(affectedRoutes, classified, allRoutes)` → `{routeId: score}` map
- `positionTracker.js` — pub/sub tracker for simulated vessel positions along routes

## Exports / public API
- `runPipeline(event, graph)` → `eventState` object (see [[wiki/schemas/event-state]])
- `haversineKm(lat1, lon1, lat2, lon2)` → distance in km
- `normalizeChokepointToGraphId(rawValue, lat, lng)` → `CHKPT-*` id

## Ripple Score formula
```
score = (cascadeDepth × 2.0)
      + (tradeVolumeM / 100 × 1.5)
      + ((1 − portAbsorption) × 2.5)
      + (timeToAlternativeDays / 7 × 1.5)
      + (commodityCriticality × 2.5)
```
Clamped 0–10. Labels: MODERATE (<4), ELEVATED (4–6), SEVERE (6–8), CRITICAL (≥8).

## Commodity criticality weights
semiconductors/pharmaceuticals = 1.0, oil = 0.9, electronics = 0.85, automotive = 0.8, chemicals = 0.7, grain = 0.6, consumer_goods = 0.55, bulk = 0.3

## Alt route cost/delay multipliers
- Ripple 4–7 → cost ×1.10, delay ×1.05, note: "Moderate congestion"
- Ripple ≥7 → cost ×1.25, delay ×1.15, note: "Severe congestion"
- Severity >0.7 → additional delay ×1.10

## Risk status thresholds (App.jsx `getRiskStatus`)
- ≥86 = critical, ≥61 = severe, ≥31 = warning, else = normal

## Known gotchas
- `normalizeChokepointToGraphId` aliases human names ("Suez Canal") to `CHKPT-*` IDs — LLM raw output passes through here
- `runPipeline` gates on `supplyChainRelevance ≥ 0.35`; live auto-trigger filters at 0.60
- Layer 5 (Qwen synthesis) is NOT called from `runPipeline` — on-demand only from UI
- Pipeline regression reference test case documented at top of stateManager.js
