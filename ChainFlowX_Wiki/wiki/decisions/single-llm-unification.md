# ADR: Single OpenAI-Compatible LLM Endpoint (Unification)
_Decided: 2026-04-24 | Status: Accepted | Commit: `2ba35cb0`_

## Context
Previously, ChainFlowX relied on **two separate LLM providers**:
- **Classification (Layer 3)**: Gemma4-E4B via `gemmaAI.js` (hardcoded to `VITE_GEMMA_URL`)
- **Synthesis (Layer 5)**: Qwen3-8B via `qwenAI.js` (hardcoded to `VITE_QWEN_URL`)

This introduced:
- **40+ lines of duplicated retry/timeout/error logic** across two modules
- **Model-specific hardcoding** that limited provider flexibility
- **Complex environment configuration** (`VITE_GEMMA_URL`, `VITE_QWEN_URL`, `VITE_GEMMA_MODEL`, `VITE_QWEN_MODEL`)
- **Lack of portability** — vendor lock-in to specific model names and URLs

## Decision
Consolidate to a **single OpenAI-compatible endpoint** served by `llmClient.js`:

```
Classification (Layer 3) ─┐
                          ├─> llmClient.js ─> VITE_LLM_BASE_URL
Synthesis (Layer 5) ──────┘
```

Each layer specifies its own **model name** (classify vs. synthesize), but shares the same **endpoint and authentication**.

## Rationale

### 1. Code Reuse
- Single `sendRequest()` handler with retry logic, timeout, and error recovery
- Eliminates 40+ lines of duplicated code across `gemmaAI.js` and `qwenAI.js`
- Easier testing: one client to mock vs. two

### 2. Provider Flexibility
- Works with **any OpenAI-compatible provider**:
  - Local: Ollama, LM Studio, vLLM
  - Cloud: OpenAI, Anthropic Claude, Azure OpenAI, etc.
- No code changes needed to switch providers — only env variables

### 3. Simplified Configuration
- **Before**: `VITE_GEMMA_URL`, `VITE_GEMMA_MODEL`, `VITE_QWEN_URL`, `VITE_QWEN_MODEL` (4 keys)
- **After**: `VITE_LLM_BASE_URL`, `VITE_LLM_API_KEY`, `VITE_LLM_CLASSIFY_MODEL`, `VITE_LLM_SYNTHESIZE_MODEL` (4 keys, but 1 endpoint)

### 4. Future-Proofing
- If new layers need LLM calls, they reuse `llmClient.js` (e.g., Layer 4 DNA matching improvement)
- Enables batching requests to a single endpoint for better performance
- Supports request caching at the client level (cache invalidation is centralized)

## Implementation

### New Files
- `llmClient.js` — Shared OpenAI-compatible client with config normalization, retries, timeouts, JSON hardening

### Modified Files
- `llmClassify.js` — Renamed from `gemmaAI.js`, imports `llmClient` instead of hardcoding requests
- `llmSynthesize.js` — Renamed from `qwenAI.js`, imports `llmClient` instead of hardcoding requests
- `.env.example` — New schema: `VITE_LLM_*` keys
- Import rewires in: `App.jsx`, `stateManager.js`, `liveEventFeed.js`, `llmGuard.test.js`

### Deleted Files
- `gemmaAI.js` — Replaced by `llmClassify.js` (wrapper around `llmClient`)
- `qwenAI.js` — Replaced by `llmSynthesize.js` (wrapper around `llmClient`)

## Consequences

### Positive
- **Reduced complexity**: One client, two consumers
- **Improved portability**: Any OpenAI-compatible provider works
- **Easier testing**: Mock single client vs. two separate endpoints
- **Better error recovery**: Centralized retry logic
- **Lower token cost**: Can batch requests, cache responses at the client level

### Negative
- **Less model specialization**: Classify and synthesize now use same underlying client (but can use different models)
  - Mitigated: Model names are configurable per environment (`VITE_LLM_CLASSIFY_MODEL` vs. `VITE_LLM_SYNTHESIZE_MODEL`)

## Alternatives Considered

### 1. Keep Dual Separate Clients (Rejected)
- Pros: Per-model customization (e.g., Gemma-specific options)
- Cons: 40+ duplicated lines, inflexible, harder to maintain

### 2. HTTP Proxy Layer (Rejected)
- Pros: Would add routing logic for different models
- Cons: Over-engineered, adds operational complexity, unnecessary for this use case

### 3. Model Router (Rejected)
- Pros: Could automatically pick best model based on task type
- Cons: Adds complexity, requires model registry, slower than direct configuration

## Rollback Plan
If needed to revert:
1. Extract `gemmaAI.js` and `qwenAI.js` from git history
2. Restore separate `VITE_GEMMA_*` and `VITE_QWEN_*` environment keys
3. Revert import statements in `App.jsx`, `stateManager.js`, `liveEventFeed.js`, `llmGuard.test.js`
4. Delete `llmClient.js`, `llmClassify.js`, `llmSynthesize.js`

Rollback is **straightforward and low-risk** due to clean commit separation.

## Validation

**Build Verification** (Commit 2):
- ✅ `npm run build` → 1.6MB, 499 modules, 0 errors

**Import Safety Check** (Pre-Commit 1):
- ✅ No source code dependencies on removed modules

**Test Compatibility**:
- ✅ Existing `llmGuard.test.js` updated and passing

## Future Enhancements
1. **Request batching**: Group classify + synthesize requests to single endpoint (reduces roundtrips)
2. **Response caching**: Cache LLM responses at client level (key = model + prompt hash)
3. **Provider abstraction**: Detect provider type and apply provider-specific optimizations
4. **Fallback chain**: Try primary endpoint, fallback to secondary (for HA setup)

---

*Decided by Claude Copilot, validated against codebase commits `cb662907` – `1620b517`*
