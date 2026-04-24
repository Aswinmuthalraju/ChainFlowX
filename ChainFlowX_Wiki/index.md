# ChainFlowX Wiki Index
_Initialized: 2026-04-19 | Updated: 2026-04-24 | Total pages: 14 | App dir: ChainFlowX_App/_

## Overview
- [[wiki/overview]] — project synthesis, stack, 6-layer pipeline, entry points

## Modules
- [[wiki/modules/ai]] — **NEW**: Single OpenAI-compatible LLM client, classify/synthesize models, DNA matching, industry cascade
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
- [[wiki/env/config]] — **UPDATED**: VITE_LLM_BASE_URL, VITE_LLM_API_KEY, VITE_LLM_CLASSIFY_MODEL, VITE_LLM_SYNTHESIZE_MODEL (unified single endpoint)

## Patterns & Conventions
- [[wiki/patterns/pipeline]] — always-fallback pattern, dual-confidence classification, chokepoint normalization, naming conventions

## Workflows
_None yet — run WIKI SCAN for CI/CD if added._

## Testing
_One test file: `ai/__tests__/llmGuard.test.js` (updated for single-LLM client)._

## Decisions
- [[wiki/decisions/single-llm-unification]] — **NEW**: Why unified OpenAI-compatible endpoint vs. dual separate models (Commit 2ba35cb0)
- [[wiki/decisions/two-model-llm]] — **LEGACY**: Historical decision to use Gemma + Qwen (superseded by single-llm-unification)
- [[wiki/decisions/pipeline-design]] — 6-layer sequential pipeline rationale

## Sources (ingested)
_None yet — drop files in raw/ and run WIKI INGEST._
