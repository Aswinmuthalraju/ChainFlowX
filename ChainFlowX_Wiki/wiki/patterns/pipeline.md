# Patterns: Pipeline & AI Integration
_Last updated: 2026-04-19_

## The "always fallback" pattern
Every LLM call has a deterministic non-LLM fallback. No pipeline step can fail the app.
- Gemma unavailable → `keywordClassifierFallback()` (regex-based)
- Qwen unavailable → `templateSynthesisFallback()` (template strings from eventState data)
- JSON parse fails → same fallback
- HTTP error → same fallback

## Dual-confidence classification
`runPipeline` runs keyword classify first (instant), then awaits LLM classify. Whichever has higher `.confidence` wins. This ensures instant partial results while LLM responds.

## Chokepoint normalization
All raw LLM output for `nearestChokepoint` passes through `normalizeChokepointToGraphId()`.
Human names ("Suez Canal", "Hormuz") → canonical `CHKPT-*` IDs via regex alias table.
Falls back to geo inference (nearest within 2000km) if name unrecognized.

## Naming conventions
- Route IDs: `ORIGIN-DEST-TYPE` (e.g. `SH-ROT-001`, `HOR-ROT-OIL`, `SH-FRA-AIR`)
- Chokepoint IDs: `CHKPT-NAME` (all caps)
- Event types (lowercase): `cyclone`, `conflict`, `strike`, `earthquake`, `sanctions`, `blockage`, `other`
- Risk status (lowercase): `normal`, `warning`, `severe`, `critical`

## State management
No Redux/Zustand. All state lives in `App.jsx` with `useState`. Event pipeline state passed as props. `useRef` used for values that callbacks need without re-render (isLoading, intelligenceOn, pipelineHandler).

## Anti-patterns to avoid
- Do NOT call `runPipeline` directly from components — always via `handleEventTrigger` in App.jsx
- Do NOT add `runPipeline` to useEffect dependency arrays — use ref pattern (`pipelineHandlerRef`)
- Do NOT build the graph more than once — it's built in a single `useEffect([], [])` on mount
