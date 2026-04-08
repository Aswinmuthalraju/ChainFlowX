# Entity: ChainFlowX

- **Type**: Hackathon project / supply chain intelligence platform
- **Version**: v5.1 (Stability Hardened)
- **Built by**: Aswin (solo), April 9–10, 2026
- **Tagline**: "We don't show you a risk score. We show you the wave."
- **Foundation**: Fork of WorldMonitor (AGPL-3.0)
- **Purpose**: Supply chain contagion engine — models disruption shock waves through a dependency graph, not a reaction dashboard

## Core Layers
| Layer | Role |
|-------|------|
| L0 | Dependency graph — 18 routes, 6 chokepoints, BFS up to 3 hops |
| L1 | Risk engine — `baseRisk + Σ(severity × proximity × typeFactor)` |
| L2 | Correlation engine + Ripple Score™ |
| L3 | Gemma 4 E4B — fast classification, entity extraction, severity scoring |
| L4 | Disruption DNA™ matching + cascade-depth-gated industry cascade |
| L5 | Qwen3:8B — strategic synthesis, 7-day forecast, rerouting advice (on-demand only) |

## Key Files
- `src/supply-chain/state/stateManager.js` — pipeline entry point (`runPipeline`)
- `src/supply-chain/graph/dependencyGraph.js` — BFS propagation
- `src/supply-chain/engine/rippleScore.js` — Ripple Score™ formula
- `src/supply-chain/ai/dnaMatching.js` — Disruption DNA™ matching
- `src/supply-chain/ai/industryCascade.js` — industry cascade gating
- `src/supply-chain/ai/gemmaAI.js` — Gemma 4 integration + keyword fallback
- `src/supply-chain/ai/qwenAI.js` — Qwen3 integration + template fallback
- `src/supply-chain/ai/aiUtils.js` — `safeParseAIJSON()`

## Competition Position
Resilinc ($500K/yr) and Everstream ($400K/yr) give black-box scores. ChainFlowX gives glass-box derivable scores at $0 API cost.
