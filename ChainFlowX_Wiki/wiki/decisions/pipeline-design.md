# Decision: 6-Layer Pipeline Design
_Date: 2026-04-19 | Status: accepted_

## Context
Supply chain disruption analysis requires multiple analytical passes on a single event. The order matters: geo match must happen before risk scoring; ripple depth must be known before scoring; DNA match needs classified event type.

## Decision
Sequential 6-layer pipeline in `stateManager.runPipeline()`:
- Layer 0: BFS graph ripple (pure compute, instant)
- Layer 1: Route match + risk score (pure compute)
- Layer 2: Ripple score + cascade alerts (pure compute)
- Layer 3: Gemma LLM classification (async, can overlap with keyword in dual-confidence pattern)
- Layer 4: DNA + industry cascade (pure compute, needs classified event)
- Layer 5: Qwen strategic synthesis (async, on-demand only — not in pipeline)

## Consequences
- Layers 0–2 + 4 are deterministic and fast — results appear instantly with keyword fallback
- Layer 3 upgrades classification quality asynchronously
- Layer 5 deliberately excluded from auto-pipeline to avoid blocking UI on slow LLM
- Pipeline regression test case embedded in stateManager.js comments
