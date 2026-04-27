# Module: AI
_Last updated: 2026-04-27 | Verified against code: 2026-04-27 | Architecture: Single OpenAI-compatible LLM_

## Purpose
LLM integration + AI algorithms for event classification, strategic synthesis, DNA fingerprint matching, and industry cascade analysis.

## Location
`src/supply-chain/ai/`

## Key files
- `llmClient.js` — **SHARED**: Unified OpenAI-compatible LLM client. Config normalization, 3-retry exponential backoff, 15s timeout, JSON parsing hardening, 300-entry FIFO response cache. Exports: `getLLMConfig`, `buildPromptHash`, `requestLLMJSON`.
- `llmClassify.js` — Layer 3: classifies headlines via configurable LLM model. Separate 200-entry in-memory cache (FNV hash of headline+description). Falls back to `keywordClassifierFallback` on any failure. Pushes turns to `llmMemory` with `layer='classify'`.
- `llmSynthesize.js` — Layer 5: generates strategic insight briefing. Cache key includes eventType, rippleScore, nearestChokepoint, region, dnaMatch name, allAlts count, affectedRoutes count, and model — avoids cross-event collisions. Uses `llmMemory.getContext(4, 'synthesize')` for layer-scoped history. Falls back to `templateSynthesisFallback`.
- `llmMemory.js` — rolling conversation context (last 8 turns × 2 = 16 entries). `push(role, content, layer)` tags each turn with a layer. `getContext(maxTurns, layer?)` filters by layer when specified. `getSummary()` appends to classify prompts only.
- `dnaMatching.js` — `matchDNA(classified, fingerprints)` — scores each fingerprint via weighted sim (type 40%, severity 30%, chokepoint 20%, region 10%). Type mismatch halves score.
- `industryCascade.js` — `getIndustryCascade(chokepointId, rippleRaw, cascadeDepth)` — maps chokepoint → affected industries/companies
- `aiUtils.js` — `safeParseAIJSON(text, fallback)` — strips `<think>` blocks, robustly parses LLM JSON

## Exports / public API
- `classifyEvent(headline, description)` → classified object — used by stateManager Layer 3
- `synthesizeStrategicInsight(eventState)` → insight object — called on-demand from App.jsx
- `matchDNA(classified, fingerprints)` → sorted array of fingerprint matches
- `getIndustryCascade(chokepointId, rippleRaw, cascadeDepth)` → array of `{sector, companies, daysToRisk}`
- `keywordClassifierFallback(headline, description)` — exported from llmClassify, used by stateManager

## Dependencies
- External: none (fetch API only)
- Internal: `data/dnaFingerprints.js`, `ai/aiUtils.js`, `ai/llmMemory.js`

## llmMemory layer isolation
`llmMemory` uses a single shared buffer but tags every push with a `layer` string. `getContext(maxTurns, layer)` filters the buffer to that layer — so `synthesize` calls only see prior synthesis turns, not classify turns. Without the layer filter, classify turns (up to 16 entries after a feed tick) would flood the synthesis context.

## Shared LLM Client Pattern (llmClient.js)
Unified client used by both `llmClassify.js` and `llmSynthesize.js`. Features:
- **Config normalization**: Reads `VITE_LLM_BASE_URL`, `VITE_LLM_API_KEY`, `VITE_LLM_CLASSIFY_MODEL`, `VITE_LLM_SYNTHESIZE_MODEL` from env
- **OpenAI-compatible abstraction**: Works with any provider (Ollama, LM Studio, OpenAI, Claude API, etc.)
- **3-retry logic with exponential backoff**: 250ms base, doubles each attempt
- **Timeout**: `fetchWithTimeout` via AbortController
- **FIFO cache**: 300-entry Map; explicit `cacheKey` overrides default messages-hash key
- **JSON parsing hardening**: Strips `<think>` blocks, safely parses malformed responses

## Synthesis cache key (llmSynthesize.js)
Key encodes 8 discriminators to prevent cross-event collision:
```
eventType | score | nearestChokepoint | region | dnaMatch[0].name | allAlts.length | affectedRoutes.length | model
```

## Patterns used
- All LLM calls have a deterministic fallback — no pipeline failure on LLM timeout/error
- `<think>` tags stripped from LLM output before JSON parse (supports chain-of-thought models)
- `response_format: { type: 'json_object' }` requested from LLM; fallback to keyword/template
- Layer-scoped memory: classify writes `layer='classify'`, synthesize reads with `layer='synthesize'`
- Model names (classify vs. synthesize) configurable per environment — same client, different models

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
- Base URL is auto-normalized: trailing slash removed, `/v1` appended if missing
- Empty `VITE_LLM_API_KEY` is valid (local endpoints that don't require auth)
- `llmClient.js` RESPONSE_CACHE is session-lived (no TTL); page reload clears it
- `classifyEvent` has its own separate CLASSIFY_CACHE (not shared with llmClient cache)
