# ChainFlowX Wiki Index
_Initialized: 2026-04-19 | Total pages: 13 | Last scan: 2026-04-19 | Last session: 2026-04-19 | App dir: ChainFlowX_App/_

## Overview
- [[wiki/overview]] — project synthesis, stack, 6-layer pipeline, entry points

## Modules
- [[wiki/modules/ai]] — Gemma4-E4B classify, Qwen3-8B synthesis, DNA matching, industry cascade
- [[wiki/modules/engine]] — runPipeline, rippleScore, altRouteCalc, disruptionMatcher, positionTracker
- [[wiki/modules/data]] — routes, ports, chokepoints, DNA fingerprints, live event feed, transport simulation
- [[wiki/modules/components]] — React UI: globe, panels, news ticker, layer controls
- [[wiki/modules/graph]] — buildGraph, validateGraph, propagateRipple (BFS)

## Routes
_None yet — no server-side routes (SPA)._

## Schemas
- [[wiki/schemas/route]] — Route object (18 routes: 15 maritime + 3 air)
- [[wiki/schemas/event-state]] — EventState object produced by runPipeline

## Environment
- [[wiki/env/config]] — VITE_GEMMA_URL, VITE_QWEN_URL, VITE_AISSTREAM_KEY, VITE_API_BASE

## Patterns & Conventions
- [[wiki/patterns/pipeline]] — always-fallback pattern, dual-confidence classification, chokepoint normalization, naming conventions

## Workflows
_None yet — run WIKI SCAN for CI/CD if added._

## Testing
_None yet — one test file found: `ai/__tests__/llmGuard.test.js`._

## Decisions
- [[wiki/decisions/two-model-llm]] — why Gemma (classify) + Qwen (synthesis) as separate models
- [[wiki/decisions/pipeline-design]] — 6-layer sequential pipeline rationale

## Sources (ingested)
_None yet — drop files in raw/ and run WIKI INGEST._
