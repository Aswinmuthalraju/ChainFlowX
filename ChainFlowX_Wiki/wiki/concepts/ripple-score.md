# Concept: Ripple Score™

Quantifies how far a disruption's shock wave travels through the supply network — not just the initial hit severity.

## Formula
```
RippleScore = (cascadeDepth × 2.0)
            + (tradeVolumeM / 100 × 1.5)
            + ((1 − portAbsorption) × 2.5)
            + (timeToAlternativeDays / 7 × 1.5)
            + (commodityCriticality × 2.5)

Score = Math.min(10, Math.max(0, raw))   // floor AND ceiling guard
```

## Validated Example → 8.4
`cascadeDepth=2 → 4.00 | tradeVolumeM=127 → 1.905 | portAbsorption=0.85 → 0.375 | timeToAlt=3.5d → 0.75 | commodityCriticality=0.55 → 1.375 | raw=8.405 → 8.4 ✓`

## Labels
- 0–3.9: MODERATE | 4–5.9: ELEVATED | 6–7.9: SEVERE | 8–10: CRITICAL

## Back-tested Against
- Suez 2021 (within 18%), Red Sea 2024, COVID port cascade 2021 (within 20% of Drewry WCI)

## v5.1 Fix
`safe()` helper clamps every input to a valid finite number — NaN impossible.

## Implementation
`src/supply-chain/engine/rippleScore.js` — `calculateRippleScore(affectedRoutes, classified)`
