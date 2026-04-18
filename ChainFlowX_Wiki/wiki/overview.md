# ChainFlowX — Overview
_Last updated: 2026-04-19 | Verified against code: 2026-04-19_

## Identity
- Name: ChainFlowX V2
- Description: Real-time AI-powered supply chain disruption monitoring — tracks live news/events, runs a 6-layer analysis pipeline, and renders results on a 3D globe
- Stack: React 18 + Vite 5, Tailwind CSS, globe.gl + Three.js (3D), deck.gl + MapLibre (2D), Ollama via ngrok (Gemma4-E4B + Qwen3-8B)
- Repo: C:/Users/Aswin/Documents/Code/Dev/ChainFlowX/ChainFlowX_V2

## Entry points
- `src/main.jsx` — React root mount
- `src/App.jsx` — root component; owns all global state, wires pipeline, renders layout
- `index.html` / `vite.config.js` — build config

## Architecture summary
Single-page React app. No backend (all logic runs in browser). LLMs accessed via OpenAI-compatible API over ngrok tunnels.

**Data flow:**
1. `liveEventFeed.js` polls GDELT + RSS feeds every 90 s → produces articles
2. App auto-triggers the first relevant article into `runPipeline()` (stateManager)
3. `runPipeline()` runs the 6-layer pipeline → returns `eventState`
4. `eventState` drives all UI panels (Globe, RippleScore, DNA, IndustryCascade, etc.)
5. User can click news items or manually trigger events
6. Layer 5 (Qwen3 strategic insight) is on-demand only — user clicks "Generate Insight"

**6-layer pipeline (stateManager.runPipeline):**
- Layer 0 — BFS graph ripple propagation (`propagateRipple`)
- Layer 1 — Route risk scoring (`calculateRouteRisk`, `matchRoutesToEvent`)
- Layer 2 — Ripple score + cascade alerts (`calculateRippleScore`, `detectCascadeAlerts`)
- Layer 3 — Gemma4-E4B event classification (async LLM, falls back to keyword classifier)
- Layer 4 — DNA fingerprint match + industry cascade (`matchDNA`, `getIndustryCascade`)
- Layer 5 — Qwen3-8B strategic synthesis (on-demand, `synthesizeStrategicInsight`)

## Pages / navigation
- **Dashboard** — globe + metrics panels + right sidebar (news feed + event trigger)
- **Routes** — globe top + full route list table
- **Intelligence** — full-screen live news feed

## Key decisions
- [[wiki/decisions/two-model-llm]] — why Gemma for classify + Qwen for synthesis
- [[wiki/decisions/pipeline-design]] — 6-layer pipeline rationale

## Open questions
- AIS live tracking (`VITE_AISSTREAM_KEY`) is wired but not yet used — vessels are simulated
