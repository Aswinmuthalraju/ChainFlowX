# Concept: Industry Cascade Panel

Downstream sector and company production risk, gated by cascade depth AND Ripple Score. No false alarming on minor events.

## Gating Logic (v5.1 Fix #7)
Each industry entry has `minCascadeDepth` AND `minRippleScore` thresholds. Both must be met for the sector to appear.

## Chokepoint → Industry Mapping (examples)
| Chokepoint | Sector | Min Cascade | Min Ripple | Days to Risk |
|------------|--------|-------------|------------|--------------|
| Malacca | Semiconductors (TSMC, Samsung) | 2 | 5 | 3 |
| Suez | Consumer Goods (Unilever, IKEA) | 1 | 4 | 4 |
| Hormuz | Oil & Gas (Shell, BP) | 1 | 3 | 2 |
| Panama | US East Coast (Amazon, Walmart) | 1 | 4 | 5 |
| Bab el-Mandeb | European Imports (H&M, Zara) | 1 | 4 | 3 |
| Cape of Good Hope | All Suez-Dependent | 3 | 7 | 7 |

## Risk Levels
scoreValue ≥ 8 → CRITICAL | ≥ 6 → HIGH | else → MODERATE

## Implementation
`src/supply-chain/ai/industryCascade.js` — `getIndustryCascade(chokepoint, rippleScoreResult)`
