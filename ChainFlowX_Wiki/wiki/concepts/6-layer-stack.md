# Concept: 6-Layer Intelligence Stack

ChainFlowX's core architecture — each layer feeds the next via `runPipeline()` in `stateManager.js`.

## Pipeline (strict async sequence — Fix #9)
```
Event → [L3 Classify] → [L0 BFS Graph] → [L1 Risk Score] → [L2 Ripple Score] → [L4 DNA + Industry] → state
                                                                                      ↓
                                                                         [L5 Qwen3 — on demand only]
```

## Layer Summary
| Layer | Name | Key Output |
|-------|------|------------|
| L0 | Dependency Graph | `affectedRoutes[]` via BFS (max 3 hops, null-safe) |
| L1 | Risk Engine | `riskScores{}`, `altRoutes{}` with dynamic congestion modifier |
| L2 | Correlation + Ripple Score™ | `rippleScore` object + `cascadeAlerts[]` |
| L3 | Gemma 4 E4B | `classified` — eventType, severity, entities, chokepoint |
| L4 | DNA + Industry Cascade | `dnaMatch`, `industryCascade[]` (cascade-depth gated) |
| L5 | Qwen3:8B | `strategicInsight` — analysis, forecast, rerouting, cost |

## Safety Gate
If `supplyChainRelevance < 0.3` after L3 → pipeline stops. Saves compute, avoids noise.

## Graph Validation
`validateGraph()` runs at startup — checks all 6 required chokepoint nodes, no dangling edges, no isolated critical nodes. Falls back to static demo data if validation fails.
