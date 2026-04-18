# Decision: Two-Model LLM Architecture
_Date: 2026-04-19 | Status: accepted_

## Context
The pipeline needs both fast classification (every news article) and deep synthesis (on-demand strategic analysis). A single model would either be too slow for classification or too shallow for synthesis.

## Options considered
- Option A: Single large model for both — too slow for per-article classification
- Option B: Two specialized models — Gemma4-E4B (fast, small, classification) + Qwen3-8B (slower, larger, synthesis)
- Option C: No LLM — keyword fallback only — insufficient quality for strategic insight

## Decision
Option B: Gemma4-E4B on Laptop A via ngrok for Layer 3 classification, Qwen3-8B on Laptop B via ngrok for Layer 5 synthesis.

## Consequences
- Requires two machines running Ollama + ngrok simultaneously for full LLM capability
- Both fall back gracefully when offline — app is fully functional without LLMs
- Strategic insight is on-demand only (not auto-triggered) to avoid Qwen latency blocking UI
