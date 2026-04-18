# Module: AI
_Last updated: 2026-04-19 | Verified against code: 2026-04-19_

## Purpose
LLM integration + AI algorithms for event classification, strategic synthesis, DNA fingerprint matching, and industry cascade analysis.

## Location
`src/supply-chain/ai/`

## Key files
- `gemmaAI.js` — Layer 3: classifies headlines via Gemma4-E4B (OpenAI-compat API). In-memory cache (200 entries, FNV hash key). Falls back to `keywordClassifierFallback` on any failure.
- `qwenAI.js` — Layer 5: generates strategic insight briefing via Qwen3-8B. Falls back to `templateSynthesisFallback` on any failure.
- `dnaMatching.js` — `matchDNA(classified, fingerprints)` — scores each fingerprint via weighted sim (type 40%, severity 30%, chokepoint 20%, region 10%). Type mismatch halves score.
- `industryCascade.js` — `getIndustryCascade(chokepointId, rippleRaw, cascadeDepth)` — maps chokepoint → affected industries/companies
- `aiUtils.js` — `safeParseAIJSON(text, fallback)` — strips `<think>` blocks, robustly parses LLM JSON
- `llmMemory.js` — rolling conversation context (last N turns per model) for Gemma + Qwen calls
- `newsFeed.js` — news aggregation utilities
- `openaiCompat.js` — shared OpenAI-compatible fetch wrapper
- `promptLab.js` — prompt development/testing utilities

## Exports / public API
- `classifyEvent(headline, description)` → classified object — used by stateManager Layer 3
- `synthesizeStrategicInsight(eventState)` → insight object — called on-demand from App.jsx
- `matchDNA(classified, fingerprints)` → sorted array of fingerprint matches
- `getIndustryCascade(chokepointId, rippleRaw, cascadeDepth)` → array of `{sector, companies, daysToRisk}`
- `keywordClassifierFallback(headline, description)` — exported from gemmaAI, used by stateManager

## Dependencies
- External: none (fetch API only)
- Internal: `data/dnaFingerprints.js`, `ai/aiUtils.js`, `ai/llmMemory.js`

## Patterns used
- All LLM calls have a deterministic fallback — no pipeline failure on LLM timeout/error
- `<think>` tags stripped from Qwen output before JSON parse
- `response_format: { type: 'json_object' }` requested from Qwen; Gemma relies on prompt instruction
- LLM memory context injected into prompts via `llmMemory.getContext(4)` / `llmMemory.getSummary()`

## Known gotchas
- Both models served via ngrok tunnels (Laptop A = Gemma, Laptop B = Qwen) — URLs must be in `.env`
- `VITE_GEMMA_URL` / `VITE_QWEN_URL` missing → silent fallback, no crash
- Qwen `think: false` passed in `options` to disable chain-of-thought tokens
