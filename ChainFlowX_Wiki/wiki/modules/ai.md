# Module: AI
_Last updated: 2026-04-24 | Verified against code: 2026-04-24 | Architecture: Single OpenAI-compatible LLM_

## Purpose
LLM integration + AI algorithms for event classification, strategic synthesis, DNA fingerprint matching, and industry cascade analysis.

## Location
`src/supply-chain/ai/`

## Key files
- `llmClient.js` — **SHARED**: Unified OpenAI-compatible LLM client with config normalization, request/response handling, 3-retry logic, 30s timeout, JSON parsing hardening. Abstracts endpoint/auth from model-specific layers.
- `llmClassify.js` — Layer 3: classifies headlines via configurable LLM model (default: `gemma4:e4b`). In-memory cache (200 entries, FNV hash key). Falls back to `keywordClassifierFallback` on any failure. Uses `llmClient.js`.
- `llmSynthesize.js` — Layer 5: generates strategic insight briefing via configurable LLM model (default: `qwen3:8b`). Falls back to `templateSynthesisFallback` on any failure. Uses `llmClient.js`.
- `dnaMatching.js` — `matchDNA(classified, fingerprints)` — scores each fingerprint via weighted sim (type 40%, severity 30%, chokepoint 20%, region 10%). Type mismatch halves score.
- `industryCascade.js` — `getIndustryCascade(chokepointId, rippleRaw, cascadeDepth)` — maps chokepoint → affected industries/companies
- `aiUtils.js` — `safeParseAIJSON(text, fallback)` — strips `<think>` blocks, robustly parses LLM JSON
- `llmMemory.js` — rolling conversation context (last N turns) for LLM calls
- `promptLab.js` — prompt development/testing utilities

## Exports / public API
- `classifyEvent(headline, description)` → classified object — used by stateManager Layer 3
- `synthesizeStrategicInsight(eventState)` → insight object — called on-demand from App.jsx
- `matchDNA(classified, fingerprints)` → sorted array of fingerprint matches
- `getIndustryCascade(chokepointId, rippleRaw, cascadeDepth)` → array of `{sector, companies, daysToRisk}`
- `keywordClassifierFallback(headline, description)` — exported from llmClassify, used by stateManager

## Dependencies
- External: none (fetch API only)
- Internal: `data/dnaFingerprints.js`, `ai/aiUtils.js`, `ai/llmMemory.js`

## Shared LLM Client Pattern (llmClient.js)
Unified client used by both `llmClassify.js` and `llmSynthesize.js`. Features:
- **Config normalization**: Reads `VITE_LLM_BASE_URL`, `VITE_LLM_API_KEY`, `VITE_LLM_CLASSIFY_MODEL`, `VITE_LLM_SYNTHESIZE_MODEL` from env
- **OpenAI-compatible abstraction**: Works with any provider (Ollama, LM Studio, OpenAI, Claude API, etc.)
- **Request/response handling**: Injects API key (if present), normalizes base URL (removes trailing slash)
- **3-retry logic with exponential backoff**: Handles transient network errors
- **30s timeout**: Prevents hanging requests
- **JSON parsing hardening**: Strips `<think>` blocks, safely parses malformed responses
- **Eliminates 40+ lines of duplicated code** that existed in separate Gemma/Qwen modules

## Patterns used
- All LLM calls have a deterministic fallback — no pipeline failure on LLM timeout/error
- `<think>` tags stripped from LLM output before JSON parse (supports long-chain models)
- `response_format: { type: 'json_object' }` requested from LLM; fallback to keyword/template
- LLM memory context injected into prompts via `llmMemory.getContext()` / `llmMemory.getSummary()`
- Model names (classify vs. synthesize) configurable per environment — same client, different endpoints

## Provider Setup
**Local (Ollama, LM Studio)**:
```
VITE_LLM_BASE_URL=http://localhost:11434
VITE_LLM_API_KEY=
VITE_LLM_CLASSIFY_MODEL=llama3.1:8b
VITE_LLM_SYNTHESIZE_MODEL=llama3.1:8b
```

**Cloud (OpenAI, Claude API)**:
```
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_API_KEY=sk-...
VITE_LLM_CLASSIFY_MODEL=gpt-4-turbo
VITE_LLM_SYNTHESIZE_MODEL=gpt-4-turbo
```

## Known gotchas
- Missing `VITE_LLM_BASE_URL` → silent fallback to keyword/template, no crash
- Base URL with trailing slash is normalized (removed) automatically
- Empty `VITE_LLM_API_KEY` is valid (for local/self-hosted endpoints that don't require auth)
- All retries are **synchronous exponential backoff** (no async delays)
