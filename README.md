# ChainFlowX

Real-time global supply chain intelligence platform. Monitors 18 trade routes across maritime and air corridors, classifies live disruption events, and propagates risk scores across a dependency graph to surface actionable routing decisions.

---

## What it does

- **Live event ingestion** — RSS feeds + GDELT news, classified in real time
- **Ripple Score™** — proprietary cascade risk score (0–10) propagated across the supply chain graph via BFS
- **Disruption DNA™** — matches live events against a fingerprint library of historical disruptions to predict downstream impact
- **Dual local AI** — Gemma 4 E4B classifies events (Layer 3); Qwen3:8B synthesizes strategic decisions (Layer 5)
- **Alternative route calculator** — computes rerouting options with cost delta and delay estimates
- **Industry cascade** — maps chokepoint exposure to affected industry sectors and companies
- **3D globe** — interactive globe showing live routes, chokepoints, AIS vessel positions, and cargo aircraft

---

## 6-Layer Pipeline

| Layer | Name | What it does |
|-------|------|-------------|
| 1 | Event Ingest | RSS + GDELT fetch, dedup, rate-limit |
| 2 | Graph Build | Port/route dependency graph, validated on startup |
| 3 | AI Classify | Gemma 4 E4B → eventType, severity, chokepoint, confidence |
| 4 | Ripple Score™ | BFS cascade through graph, outputs 0–10 score + label |
| 5 | AI Synthesize | Qwen3:8B → strategic briefing, forecast D+1/3/7, cost impact |
| 6 | UI Render | 3D globe + panels update reactively from pipeline state |

Both AI layers have keyword/template fallbacks — the app is fully functional without Ollama running.

---

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Globe**: globe.gl (Three.js)
- **AI**: Ollama (local) — Gemma 4 E4B + Qwen3:8B
- **Live data**: AISstream.io (ship tracking), OpenSky (aircraft), GDELT + RSS (news)
- **API proxies**: Vite dev server middleware (RSS, GDELT); Vercel serverless in production

---

## Setup

### Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) installed and running locally

### 1. Pull AI models

```bash
ollama pull gemma4:e4b
ollama pull qwen3:8b
```

### 2. Install dependencies

```bash
cd ChainFlowX_App
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Point to your local Ollama instance (default port 11434)
VITE_GEMMA_URL=http://localhost:11434
VITE_GEMMA_MODEL=gemma4:e4b

VITE_QWEN_URL=http://localhost:11434
VITE_QWEN_MODEL=qwen3:8b

# Optional — free key from aisstream.io for live ship tracking
VITE_AISSTREAM_KEY=your_key_here
```

If both models run on a single Ollama instance (default), both URLs point to `http://localhost:11434`. To run them on separate machines, set each URL to that machine's IP.

### 4. Start

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### 5. Build for production

```bash
npm run build
```

Deploy the `dist/` folder. Set the same env vars in your hosting platform (Vercel, Render, etc.). Ollama must be reachable from your deployment environment.

---

## Project structure

```
ChainFlowX_App/
├── src/
│   ├── App.jsx                    # Root — pipeline orchestration, state
│   ├── supply-chain/
│   │   ├── ai/                    # AI layer — gemmaAI, qwenAI, DNA matching, industry cascade
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

Private — all rights reserved.
