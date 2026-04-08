# Token Optimization Rules

> These rules exist to prevent context-window bloat. Read this file ONLY when a rule
> in CLAUDE.md is ambiguous — NOT on every operation.

## Rule 1 — index.md first
Always open `index.md` before navigating the wiki. The index is the map; scanning
files blindly wastes tokens finding things the index already locates.

## Rule 2 — Max 3 wiki files open at once
Hold at most 3 wiki files in context simultaneously. Exceptions: LINT passes and
full overview rebuilds that require a complete picture. In those cases open all
needed files in one pass, then close them.

## Rule 3 — Write tight
No filler sentences. If a fact is covered in another page, cross-link to it instead
of restating it. Repetition multiplies token cost every time those pages load.

## Rule 4 — Summarize sources, never transcribe
Source pages contain key takeaways only — max 20 lines per source page. Do not copy
paragraphs verbatim; paraphrase the insight.

## Rule 5 — Minimal footprint per operation
Touch only the pages directly affected by the current operation. A one-fact INGEST
should update one or two pages plus log.md — nothing else.

## Rule 6 — One-line entries
Log entries: exactly one line. Index entries: exactly one line. No multi-line blocks,
no sub-bullets, no prose in log or index entries.

## Rule 7 — LINT is read-only
During LINT, output findings as a checklist and stop. Do not auto-apply fixes.
Wait for explicit user approval before changing any file.
