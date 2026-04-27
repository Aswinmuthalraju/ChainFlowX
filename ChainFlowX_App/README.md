# ChainFlowX

ChainFlowX is a supply chain disruption intelligence system that models how shocks move through 18 global shipping and air cargo routes. It combines graph-based risk scoring, live news ingestion, Disruption DNA matching, and on-demand LLM synthesis into a six-layer pipeline with deterministic fallbacks. Built as a solo portfolio project, it demonstrates how 3D visualization, live monitoring, and structured analysis can coexist in one app without depending on a single model path.

## What it does

- Visualizes 18 global supply chain routes on an interactive 3D globe
- Ingests live news from GDELT and RSS feeds, then turns relevant stories into pipeline events
- Runs a six-layer analysis flow for each disruption event: BFS propagation, geo-risk scoring, Ripple Score calculation, LLM-assisted classification, Disruption DNA matching, and on-demand strategic synthesis
- Quantifies cascade severity with a Ripple Score from 0 to 10, with each component traceable to its input
- Matches current events against historical disruption fingerprints such as Suez 2021, Red Sea 2024, COVID cascades, Malacca typhoons, LA/Long Beach strikes, and Fukushima
- Suggests alternative routes with congestion-adjusted cost and delay estimates
- Keeps working when the LLM endpoint is unavailable by falling back to deterministic classification and template synthesis

## Architecture

The pipeline is sequential and deterministic first:

| Layer | Responsibility | Type |
|-------|----------------|------|
| 0 | BFS propagation through the port and chokepoint dependency graph | deterministic |
| 1 | Geo-proximity route matching and per-route risk scoring | deterministic |
| 2 | Ripple Score calculation and cascade alert detection | deterministic |
| 3 | Event classification: type, severity, entities, relevance | LLM + keyword fallback |
| 4 | Disruption DNA fingerprint matching and industry cascade | deterministic |
| 5 | Strategic synthesis: 7-day forecast, rerouting advice, action items | LLM + template fallback |

Layers 3 and 5 share a single OpenAI-compatible endpoint. Any compatible provider works, including local Ollama or another self-hosted API. If no endpoint is configured, the app stays functional through deterministic fallbacks.

## Run locally

Prerequisites:
- Node.js 18 or later
- Optional: an OpenAI-compatible LLM endpoint for layers 3 and 5

```bash
git clone https://github.com/Aswinmuthalraju/ChainFlowX
cd ChainFlowX/ChainFlowX_App
npm install
cp .env.example .env
npm run dev
```

Open the app in the browser, wait for the live feed to hydrate, and click a live item in the ticker to run the pipeline. Without an LLM endpoint configured, layers 3 and 5 fall back to deterministic behavior.

## Configuration

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_LLM_BASE_URL` | OpenAI-compatible endpoint, such as `http://localhost:11434` | no |
| `VITE_LLM_API_KEY` | Bearer token for endpoints that require auth | no |
| `VITE_LLM_CLASSIFY_MODEL` | Model name for layer 3 classification | no |
| `VITE_LLM_SYNTHESIZE_MODEL` | Model name for layer 5 synthesis | no |
| `VITE_API_BASE` | Optional prefix for the live news proxy | no |

All variables are optional. If they are missing, the app uses defaults or deterministic fallbacks.

## Project structure

```text
ChainFlowX_App/
├── api/
│   ├── gdelt-doc.js
│   ├── opensky.js
│   └── rss-proxy.js
├── docs/
│   └── screenshots/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── supply-chain/
│       ├── ai/
│       ├── components/
│       ├── data/
│       ├── engine/
│       ├── geo/
│       ├── graph/
│       └── state/
├── ChainFlowX_Wiki/
└── .env.example
```

## Built with

React 18, Vite, Tailwind CSS, globe.gl, deck.gl, MapLibre, and an OpenAI-compatible LLM endpoint.

## License

Licensed under AGPL-3.0.
