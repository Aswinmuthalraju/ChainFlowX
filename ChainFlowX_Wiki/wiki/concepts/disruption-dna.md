# Concept: Disruption DNA™

Evidence-based pattern matching against 6 real historical supply chain disruption fingerprints.

## Weighted Similarity Formula
- Type match: 40%
- Severity delta: 30%
- Chokepoint match: 20%
- Region match: 10%
- **v5.1 fix**: If type doesn't match → `similarity *= 0.5` (prevents false high-similarity across categories)

## Confidence Tiers
- ≥80%: High Confidence — historical precedent is strong
- ≥60%: Medium Confidence — treat as leading indicator
- <60%: Low Confidence — signal detected, pattern weak

## 6 Historical Fingerprints
| Event | Type | Key Outcome |
|-------|------|-------------|
| Red Sea Conflict 2024 | conflict | Freight +200% by D+3 (Drewry WCI) |
| Suez Blockage 2021 | blockage | 400 ships queued, global reroute |
| COVID Port Cascades 2021 | closure | 12-port cascade, container crisis |
| Malacca Typhoon Pattern | cyclone | Singapore surge, Taiwan energy risk |
| LA/Long Beach Strike 2002 | strike | Air freight +80%, federal intervention |
| Fukushima Earthquake 2011 | earthquake | Auto halt, semiconductor shortage |

## Implementation
`src/supply-chain/ai/dnaMatching.js` — `matchDNA(classified, DNA_FINGERPRINTS)`
Fingerprint data: `src/supply-chain/data/dnaFingerprints.js`
