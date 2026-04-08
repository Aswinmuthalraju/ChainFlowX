# Entity: Gemma 4 E4B

- **Role**: Layer 3 — Fast Event Intelligence
- **Hardware**: Laptop A (8GB VRAM), ~5.5GB usage at Q4_0
- **Ollama tag**: `gemma4:e4b`
- **Endpoint**: `VITE_GEMMA_URL` (ngrok tunnel on port 11434)
- **License**: Apache 2.0
- **Released**: April 2, 2026

## Jobs
1. Event classification (cyclone | conflict | strike | earthquake | sanctions | blockage | other)
2. Entity extraction (ports, countries, chokepoints)
3. Severity scoring (0.0–1.0)
4. Supply chain relevance score (0.0–1.0)

## Fallback
Keyword classifier (`keywordClassifierFallback`) — always returns complete valid schema object. Activated when ngrok drops or JSON parse fails.

## Notes
- Beats Gemma 3 27B on structured JSON at 6× smaller active parameters
- Native function calling, 128K context
- DNA matching is Layer 4's job — Layer 3 only classifies
