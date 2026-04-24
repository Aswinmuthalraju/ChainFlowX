# ChainFlowX Cleanup Audit

Date: 2026-04-24
Scope: `ChainFlowX_App/` only (code truth over wiki)
Mode: Read-only audit, no cleanup changes applied

## 2.1 WorldMonitor Residue Inventory

### A) Direct residue in active app surface (`src/`, `public/`, `docs/`, root config)

| Path | Type | Finding | Recommendation |
|---|---|---|---|
| `src/index.css` | branding comment | `WorldMonitor-style shell` comment | rewrite |
| `src/supply-chain/components/IntelligenceFeed.jsx` | branding UI copy | "Live WorldMonitor stream" text | rewrite |
| `src/supply-chain/data/liveCargoTraffic.js` | branding comment | "reuses WorldMonitor-aligned feeds" | rewrite (or delete file if dead) |
| `src/supply-chain/data/liveEventFeed.js` | branding comment | "WorldMonitor-style" merge comment | rewrite |

### B) `newsStore` check

- Search result: no `newsStore` files, imports, or references found in `ChainFlowX_App/**`.
- Load-bearing status: none found.
- Recommendation: keep as `not applicable` in this codebase snapshot.

### C) Files in `src/` outside `src/supply-chain/`

| Path | Type | Finding | Recommendation |
|---|---|---|---|
| `src/App.jsx` | load-bearing | main orchestration entrypoint | keep |
| `src/main.jsx` | load-bearing | React mount entry | keep |
| `src/index.css` | load-bearing | global app styles | keep (rewrite residue comments only) |
| `src/stubs/three-webgpu.js` | load-bearing | referenced by `vite.config.js` alias | keep |
| `src/stubs/three-tsl.js` | load-bearing | referenced by `vite.config.js` alias | keep |

### D) Candidate dead code / unreferenced files (in current app)

| Path | Type | Finding | Recommendation |
|---|---|---|---|
| `src/supply-chain/ai/openaiCompat.js` | dead import | no in-repo imports/usages found | delete (or subsume into new `llmClient.js`) |
| `src/supply-chain/ai/newsFeed.js` | dead import | no in-repo imports/usages found | delete if still unused after refactor |
| `src/supply-chain/data/liveCargoTraffic.js` | dead import | no in-repo imports/usages found | delete if not intentionally reserved |
| `src/supply-chain/components/FeedStatusPanel.jsx` | dead component | no in-repo imports/usages found | delete if not planned |
| `src/supply-chain/components/LayerToggle.jsx` | dead component | no in-repo imports/usages found | delete if superseded by `LayerControl.jsx` |
| `src/supply-chain/components/PredictionsPanel.jsx` | dead component | no in-repo imports/usages found | delete if superseded |
| `src/supply-chain/components/TransportLayers.jsx` | dead component | no in-repo imports/usages found | delete if superseded |

### E) Root-level docs/metadata inventory (portfolio-facing)

| Path | Type | Finding | Recommendation |
|---|---|---|---|
| `README.md` at app root | doc | missing | create new README from scratch |
| `LICENSE*` at app root | legal | missing | add `licenses/LICENSE-AGPL-3.0` + top-level `LICENSE` copy/symlink strategy |
| `ATTRIBUTION.md`/`FORK_OF.md`/`ORIGIN.md` at app root | doc | not found | no action |
| `.gitignore` at app root | config | missing | add/align during cleanup phase |

### F) Large fork residue subtree

| Path | Type | Finding | Recommendation |
|---|---|---|---|
| `worldmonitor/` (nested under `ChainFlowX_App/`) | fork residue / separate project | extensive WorldMonitor code/docs/tests/TS stack; not part of current ChainFlowX app runtime path | flag for explicit approval before deletion/move (outside explicit kill list) |

Notes:
- This subtree contains heavy WorldMonitor branding and hundreds of TS files/tests; see §2.5 and hard-constraint note.

---

## 2.2 Dual-LLM Residue Inventory

### Env var / model residue

| Path | Finding |
|---|---|
| `.env.example` | `VITE_GEMMA_URL`, `VITE_GEMMA_MODEL`, `VITE_QWEN_URL`, `VITE_QWEN_MODEL`, plus Gemma/Qwen comments and `11434` assumptions |
| `.env` | same dual-schema variables present |
| `src/supply-chain/ai/gemmaAI.js` | uses `VITE_GEMMA_*`, default `gemma4:e4b`, Gemma-specific logs/messages |
| `src/supply-chain/ai/qwenAI.js` | uses `VITE_QWEN_*`, default `qwen3:8b`, Qwen-specific logs/messages |
| `src/supply-chain/ai/__tests__/llmGuard.test.js` | references `VITE_GEMMA_URL`, imports `gemmaAI.js` |

### Imports and hardcoded model names

| Path | Finding |
|---|---|
| `src/supply-chain/state/stateManager.js` | imports from `../ai/gemmaAI.js`; comment references Layer 5 Qwen |
| `src/supply-chain/data/liveEventFeed.js` | imports `classifyEvent` from `../ai/gemmaAI.js` |
| `src/App.jsx` | imports `synthesizeStrategicInsight` from `./supply-chain/ai/qwenAI.js` |
| `src/supply-chain/components/StrategicInsightPanel.jsx` | user-facing Qwen naming (`Qwen3`, `QWEN3 LIVE`, etc.) |

### OpenAI-compatible duplication candidate

| Path | Finding | Recommendation |
|---|---|---|
| `src/supply-chain/ai/openaiCompat.js` | minimal URL helper only; not currently consumed | either delete as dead or fold into new shared `llmClient.js` |

### ngrok / Laptop A/B / OLLAMA_HOST phrases

- In active app surface (`src/`, app root): no Laptop A/B phrases found.
- `ngrok` wording is primarily present in wiki/docs, not active app code.
- `OLLAMA_HOST` not found in active app source; appears in nested `worldmonitor/` project.

---

## 2.3 Layer-0-through-4 Verification (v5.1 contract)

| File | Status | Drift note |
|---|---|---|
| `src/supply-chain/state/stateManager.js` | YES | `runPipeline`, validator, geo inference, and sequence are present; only model-specific import naming drift (`gemmaAI.js`) and a Qwen label comment |
| `src/supply-chain/graph/dependencyGraph.js` | YES | BFS + depth-zero guard (`impactFactor`) + null guards present |
| `src/supply-chain/graph/graphUtils.js` | YES | `buildGraph` and `validateGraph` present with chokepoint/edge checks |
| `src/supply-chain/engine/rippleScore.js` | YES | NaN-safe input sanitation + clamp floor/ceiling implemented |
| `src/supply-chain/engine/altRouteCalc.js` | YES | congestion modifier logic present (`rs` tier multipliers) |
| `src/supply-chain/ai/dnaMatching.js` | YES | type-mismatch penalty present (`rawSim *= 0.5`) |
| `src/supply-chain/ai/industryCascade.js` | YES | cascade-depth gates present (`minCascadeDepth`), plus ripple-score gating |
| `src/supply-chain/ai/aiUtils.js` | YES | `safeParseAIJSON` implements 3 parse recovery strategies |

Action from this section:
- No v5.1 corrective diff is required before cleanup. These centerpiece files should remain unchanged except import renames needed by single-LLM refactor.

---

## 2.4 Dependency Audit

### `package.json`

- Current:
  - `name`: `chainflowx` (already correct)
  - `version`: `1.0.0` (already correct)
  - no `author`, no `description`, no `repository`
  - scripts: `dev`, `build`, `preview`; no `test`, no `lint`
- Dependencies appear aligned to active app runtime (`react`, `vite`, `tailwind`, `globe.gl`, `deck.gl`, `three`, `maplibre-gl`).
- No obvious WorldMonitor-only dependency in this app package file.

Recommendation:
- Add portfolio metadata fields (`description`, `author`, `repository`) and add/verify `test` script if tests are intended to run from this package.

### `vite.config.js`, `tailwind.config.js`, `postcss.config.js`

- No references to deleted/missing paths detected.
- `vite.config.js` aliases `src/stubs/three-webgpu.js` and `src/stubs/three-tsl.js`; both files exist.

### `vercel.json`

- Looks valid for SPA deployment (`buildCommand`, `outputDirectory`, rewrite to `index.html`).
- No WorldMonitor-specific env/routes in this file.

### `.env.example`

- Does **not** match single-LLM target schema.
- Uses dual Gemma/Qwen schema and includes `VITE_API_BASE` and `VITE_AISSTREAM_KEY`.

### `VITE_API_BASE` usage check

- **Used** in `src/supply-chain/data/liveEventFeed.js` as optional API prefix resolver.
- Conclusion: not dead in current code snapshot.

### `VITE_AISSTREAM_KEY` usage check

- Wired in `src/supply-chain/data/transportMaritime.js` and `src/supply-chain/components/TransportLayers.jsx`.
- In this app snapshot, `TransportLayers.jsx` is currently unreferenced, but `transportMaritime.js` still reads the key.

---

## 2.5 Test Surface

Wiki expectation: one test file `ai/__tests__/llmGuard.test.js`.

Reality:
- In active ChainFlowX app source: confirmed exactly one test file:
  - `src/supply-chain/ai/__tests__/llmGuard.test.js`
- Additional many test/spec files exist under nested `worldmonitor/` subtree (separate project residue).

---

## Additional Audit Flags (for cleanup planning)

1) Hard-constraint TS scan
- `ChainFlowX_App/src/**`: no `.ts`/`.tsx` files.
- `ChainFlowX_App/worldmonitor/**`: hundreds of `.ts`/`.tsx` files present (separate subtree).
- Flagged because cleanup spec says any TS presence should be surfaced.

2) Dist artifacts contain stale strings
- `dist/assets/*` contains compiled references to Gemma/Qwen/WorldMonitor text.
- Recommendation: treat as build artifact; avoid auditing brand residue in `dist/` as source-of-truth.

3) Missing app-root README/LICENSE/.gitignore
- These are currently absent in `ChainFlowX_App/` and must be created/standardized in cleanup phase.

---

## Approval Gate

Audit phase complete. No cleanup edits applied yet.

If approved, cleanup phase will:
- perform single-LLM refactor with shared `llmClient.js`
- remove/rename dual-model files and imports
- rewrite README and env schema
- scrub branding copy/comments
- handle legal/docs structure
- update wiki and generate `cleanup-summary.md`

Potentially destructive operation requiring explicit acknowledgement before execution:
- any removal/move decision for the large nested `worldmonitor/` subtree (outside explicit kill list).
