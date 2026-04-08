# Entity: Qwen3:8B

- **Role**: Layer 5 — Strategic Synthesis (on-demand only)
- **Hardware**: Laptop B (8GB VRAM), ~5.8GB at Q4_K_M
- **Ollama tag**: `qwen3:8b`
- **Endpoint**: `VITE_QWEN_URL` (ngrok tunnel on port 11435)
- **License**: Apache 2.0 (Alibaba)

## Jobs
Receives full enriched `eventState` from Layers 0–4. Outputs:
- Strategic analysis (2–3 sentences)
- 7-day forecast (day1 / day3 / day7)
- Rerouting advice
- Cost impact ($/container with confidence interval)
- Urgency: IMMEDIATE | HIGH | MODERATE

## Fallback
`templateSynthesisFallback` — deterministic output derived entirely from graph + DNA data. App fully functional with both AI models offline.

## Notes
- 80+ tokens/sec at Q4_K_M
- Native `/think` reasoning mode enabled (`options: { think: true }`)
- Highest HumanEval score of any sub-8B model (76+)
- Called on user demand only — cost-controlled, premium-feeling in demo
