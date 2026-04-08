# Entity: WorldMonitor

- **Type**: Open-source project (foundation / fork base)
- **Stars**: 44.1k
- **License**: AGPL-3.0 (non-commercial hackathon use permitted)
- **Author**: Elie Habib
- **Role in ChainFlowX**: Provides globe rendering, news pipeline (GDELT), Ollama wiring, Vercel deployment config

## What ChainFlowX Uses
- globe.gl 3D globe with arc API
- deck.gl + MapLibre GL 2D map
- Vercel deploy (`vercel.json` pre-configured)
- GDELT news ingestion pipeline

## What ChainFlowX Adds
All supply chain intelligence in `src/supply-chain/` — architecturally decoupled from WorldMonitor core. WorldMonitor files left untouched.
