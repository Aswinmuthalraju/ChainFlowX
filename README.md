# ChainFlowX

ChainFlowX is a realtime supply chain intelligence dashboard built for disruption analysis. It ingests live events, classifies risk, propagates impact through a dependency graph, and outputs rerouting guidance with cost and delay implications.

---

## What it does

- **Live event ingestion** — RSS feeds + GDELT news, classified in real time
- **Ripple Score™** — proprietary cascade risk score (0–10) propagated across the supply chain graph via BFS
- **Disruption DNA™** — matches live events against a fingerprint library of historical disruptions to predict downstream impact
- **Single OpenAI-compatible AI endpoint** — separate classify/synthesize models behind one client with retry, timeout, and strict JSON parsing
- **Alternative route calculator** — computes rerouting options with cost delta and delay estimates
- **Industry cascade** — maps chokepoint exposure to affected industry sectors and companies
- **3D globe** — interactive globe showing routes, chokepoints, and transport overlays

---

## 6-Layer Pipeline

| Layer | Name | What it does |
|-------|------|-------------|
| 1 | Event Ingest | RSS + GDELT fetch, dedup, rate-limit |
| 2 | Graph Build | Port/route dependency graph, validated on startup |
| 3 | AI Classify | LLM classify model → eventType, severity, chokepoint, confidence |
| 4 | Ripple Score™ | BFS cascade through graph, outputs 0–10 score + label |
| 5 | AI Synthesize | LLM synthesize model → strategic briefing, forecast D+1/3/7, cost impact |
| 6 | UI Render | 3D globe + panels update reactively from pipeline state |

Both AI layers have deterministic fallbacks, so the app remains functional even when the LLM endpoint is unavailable.

---

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Globe**: globe.gl (Three.js)
- **AI**: Any OpenAI-compatible endpoint (local or hosted)
- **Live data**: OpenSky (aircraft), GDELT + RSS (news)
- **API proxies**: Vite dev server middleware (RSS, GDELT); Vercel serverless in production

---

## Setup

### Prerequisites

- Node.js 18+
- Optional local model host (for example Ollama or LM Studio)

### 1. Install dependencies

```bash
cd ChainFlowX_App
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# OpenAI-compatible base URL (local or hosted)
VITE_LLM_BASE_URL=http://localhost:11434

# Optional key when required by your endpoint
VITE_LLM_API_KEY=

# Model used for event classification
VITE_LLM_CLASSIFY_MODEL=gemma4:e4b

# Model used for strategic synthesis
VITE_LLM_SYNTHESIZE_MODEL=qwen3:8b
```

You can point both model keys at the same host and run different models by name.

### 3. Start

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### 4. Build for production

```bash
npm run build
```

Deploy the `dist/` folder and mirror the same environment variables in your hosting platform.

---

## Project structure

```
ChainFlowX_App/
├── src/
│   ├── App.jsx                    # Root — pipeline orchestration, state
│   ├── supply-chain/
│   │   ├── ai/                    # AI layer — llmClient, llmClassify, llmSynthesize, DNA matching
│   │   ├── engine/                # Ripple Score, alt route calc, disruption matcher
│   │   ├── data/                  # Routes, ports, chokepoints, live feeds, transport simulation
│   │   ├── graph/                 # Dependency graph build + BFS propagation
│   │   ├── geo/                   # Great-circle arc interpolation
│   │   ├── state/                 # Pipeline state manager
│   │   └── components/            # React UI — globe, panels, ticker, controls
│   └── stubs/                     # three/webgpu + three/tsl shims for globe.gl
├── api/                           # Vercel serverless functions (RSS proxy, GDELT, OpenSky)
├── .env.example                   # Environment template
└── vite.config.js                 # Dev server + proxy config
```

---

## Routes covered

18 routes: 15 maritime + 3 air. Key chokepoints monitored: Strait of Malacca, Suez Canal, Strait of Hormuz, Bab el-Mandeb, Panama Canal, Cape of Good Hope, Taiwan Strait.

---

## License

AGPL-3.0 (see LICENSE).
