# ChainFlowX — Overview
_Last updated: 2026-04-27 | Verified against code: 2026-04-27_

## Identity
- Name: ChainFlowX
- Description: Real-time AI-powered supply chain disruption monitoring — tracks live news/events, runs a 6-layer analysis pipeline, and renders results on a 3D globe
- Stack: React 18 + Vite 5, Tailwind CSS, globe.gl + Three.js (3D), deck.gl + MapLibre (2D), single OpenAI-compatible LLM endpoint (Ollama, LM Studio, OpenAI, Claude API, etc.)
- Repo: C:/Users/Aswin/Documents/Code/Dev/ChainFlowX/ChainFlowX_App

## Entry points
- `src/main.jsx` — React root mount
- `src/App.jsx` — root component; owns all global state, wires pipeline, renders layout
- `index.html` / `vite.config.js` — build config

## Architecture summary
Single-page React app. No backend (all logic runs in browser). LLMs accessed via any OpenAI-compatible API endpoint.

**Data flow:**
1. `liveEventFeed.js` polls GDELT + RSS feeds every 90s → produces articles
2. App auto-triggers the first relevant article into `runPipeline()` (stateManager)
3. `runPipeline()` runs the 6-layer pipeline → returns `eventState`
4. `eventState` drives all UI panels (Globe, RippleScore, DNA, IndustryCascade, etc.)
5. User can click news items or manually trigger events
6. Layer 5 (strategic insight) is on-demand only — user clicks "Generate Insight"

**6-layer pipeline (stateManager.runPipeline):**
- Layer 0 — BFS graph ripple propagation (`propagateRipple`)
- Layer 1 — Route risk scoring (`calculateRouteRisk`, `matchRoutesToEvent`)
- Layer 2 — Ripple score + cascade alerts (`calculateRippleScore`, `detectCascadeAlerts`)
- Layer 3 — LLM event classification (async, falls back to keyword classifier)
- Layer 4 — DNA fingerprint match + industry cascade (`matchDNA`, `getIndustryCascade`)
- Layer 5 — LLM strategic synthesis (on-demand, `synthesizeStrategicInsight`)

## Pages / navigation
- **Dashboard** — globe + metrics panels + right sidebar (news feed + event trigger)
- **Routes** — globe top + full route list table
- **Intelligence** — full-screen live news feed

## Key decisions
- [[wiki/decisions/single-llm-unification]] — unified single OpenAI-compatible endpoint (supersedes two-model-llm)
- [[wiki/decisions/two-model-llm]] — LEGACY: historical dual-model rationale (superseded)
- [[wiki/decisions/pipeline-design]] — 6-layer pipeline rationale

## Open questions
- AIS live tracking (`VITE_AISSTREAM_KEY` was removed) — vessels are simulated
