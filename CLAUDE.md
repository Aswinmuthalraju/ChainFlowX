# ChainFlowX — Claude Code Session Rules

## Always-on rules (every session, no exceptions)
1. Read `ChainFlowX_Wiki/index.md` FIRST on every operation. Never scan wiki blindly.
2. Max 3 wiki files open at once. Exception: LINT and full overview rebuilds only.
3. Write tight. No filler. Cross-link instead of duplicating content.
4. Summarize sources — never transcribe. Key takeaways only, max 20 lines per source page.
5. Touch only pages directly affected by the current operation.
6. Log entries = exactly one line. Index entries = exactly one line. No exceptions.
7. NEVER auto-fix during LINT. Output findings as checklist, wait for user approval.

If any rule is ambiguous, read `ChainFlowX_Wiki/token-rules.md`.
Do NOT open that file on every operation — only when genuinely uncertain.

## Wiki integration
- Read `ChainFlowX_Wiki/index.md` at session start. Never scan the wiki blindly.
- Open at most 3 wiki pages relevant to today's task.
- Load context silently — no narration.
- Touch only wiki pages directly affected by changes.
- Cross-link instead of duplicating content across pages.
- On session end (if code or decisions changed): write delta to affected wiki pages + append to log.

## Wiki structure
- `ChainFlowX_Wiki/index.md` — master map, read first
- `ChainFlowX_Wiki/raw/` — drop files here for WIKI INGEST
- `ChainFlowX_Wiki/wiki/overview.md` — stack, goals, architecture summary
- `ChainFlowX_Wiki/wiki/modules/` — one page per feature area
- `ChainFlowX_Wiki/wiki/routes/` — API/page routes
- `ChainFlowX_Wiki/wiki/schemas/` — data models, DB tables
- `ChainFlowX_Wiki/wiki/env/` — config keys (no secret values)
- `ChainFlowX_Wiki/wiki/patterns/` — coding conventions, naming rules
- `ChainFlowX_Wiki/wiki/workflows/` — CI/CD, deploy, release process
- `ChainFlowX_Wiki/wiki/testing/` — test strategy, coverage, patterns
- `ChainFlowX_Wiki/wiki/decisions/` — why things were built the way they are
