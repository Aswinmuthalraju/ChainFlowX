# Source: ChainFlowX Master Solution v5.1
_Ingested: 2026-04-09 | Lines: 1290_

## Key Facts
- Hackathon project, April 9–10 2026, built solo by Aswin
- Foundation: WorldMonitor fork (AGPL-3.0, 44.1k stars) — handles globe, news pipeline, Ollama wiring, Vercel deploy
- 6 intelligence layers on top of WorldMonitor for supply chain contagion modeling
- AI: Gemma 4 E4B (Laptop A, Layer 3 — classification) + Qwen3:8B (Laptop B, Layer 5 — synthesis), both via ngrok tunnels, 100% local, $0 API cost
- 18 shipping routes, 6 strategic chokepoints, BFS cascade up to 3 hops
- v5.1 hardened: 10 critical engineering fixes (NaN guards, schema validation, pipeline sequencing, DNA penalty, cascade gating, safe JSON parser, graph validator)

## Novel Differentiators
- **Ripple Score™**: quantified cascade propagation formula, back-tested vs. Suez 2021, Red Sea 2024, COVID 2021
- **Disruption DNA™**: 6 historical fingerprints, weighted feature similarity (type 40%, severity 30%, chokepoint 20%, region 10%) + type-mismatch 0.5× penalty
- **Industry Cascade**: downstream sector/company risk gated by both cascade depth AND Ripple Score — no false alarming

## Stack
React 18 + Vite + JS, globe.gl + Three.js, deck.gl + MapLibre, Tailwind CSS, GDELT API, Vercel

## Source
`ChainFlowX_Wiki/raw/ChainFlowX-Master-Solution-v5.1.md`
