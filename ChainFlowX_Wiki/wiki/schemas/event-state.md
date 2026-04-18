# Schema: EventState
_Last updated: 2026-04-19 | Verified against code: 2026-04-19_

## Source
`src/supply-chain/state/stateManager.js` — `createEventState()`, populated by `runPipeline()`

## Fields
| Field | Type | Set by | Notes |
|-------|------|--------|-------|
| `raw` | object | App.jsx | Original event: `{headline, description, lat, lng, url, ...}` |
| `classified` | object | Layer 3 | `{eventType, severity, nearestChokepoint, region, supplyChainRelevance, confidence, entities, estimatedDuration}` |
| `affectedRoutes` | Route[] | Layer 1 | Routes within geo radius of event |
| `riskScores` | `{routeId: number}` | Layer 1 | 0–100 per route |
| `altRoutes` | `{routeId: AltRoute}` | Layer 1 | `{recommended, delayDays, costDelta, congestionNote, summary}` |
| `rippleScore` | object | Layer 2 | `{score, raw, label, derivation}` |
| `cascadeAlerts` | Alert[] | Layer 2 | `{type, message, severity, affectedNodes}` |
| `dnaMatch` | Fingerprint[] | Layer 4 | Sorted by similarity desc |
| `industryCascade` | Industry[] | Layer 4 | `{sector, companies, daysToRisk}` |
| `strategicInsight` | object | Layer 5 | `{strategicAnalysis, forecast, reroutingAdvice, alternativeRoutes, costImpact, urgency, actionItems}` — null until user triggers |

## Valid eventType values
`cyclone`, `conflict`, `strike`, `earthquake`, `sanctions`, `blockage`, `other`

## Valid chokepoint IDs
`CHKPT-MALACCA`, `CHKPT-SUEZ`, `CHKPT-HORMUZ`, `CHKPT-PANAMA`, `CHKPT-BAB`, `CHKPT-CAPE`
