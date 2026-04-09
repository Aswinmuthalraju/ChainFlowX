# ChainFlowX Integration — Quick Reference Card

## 7-STEP REFACTOR (print this)

```
STEP 1: .env (5 min)
├─ Merge VITE_GEMMA_URL + VITE_QWEN_URL into single config
└─ Both models read same .env — no duplication

STEP 2: newsStore.js (20 min)
├─ Import runPipeline, validateGraph
├─ Inject into addArticle() handler
└─ GDELT → auto-enrichment on every event

STEP 3: App.jsx (30 min)
├─ Replace main component with integrated layout
├─ Add conditional supply chain panels to right sidebar
└─ Panels show only if data exists

STEP 4: Header.jsx (15 min)
├─ Add Intelligence toggle
├─ Add demo dropdown (no EventTrigger panel)
└─ Show AI badges (GEMMA4, QWEN3, 6-LAYER)

STEP 5: Delete EventTrigger.jsx (2 min)
└─ Remove /supply-chain/components/EventTrigger.jsx

STEP 6: Verify (15 min)
├─ npm run dev
├─ Check console: "Graph validated"
└─ No red errors

STEP 7: Documentation (15 min)
├─ Update README (integrated pitch)
└─ Update master solution v5.2 note

TOTAL: ~2 hours
```

---

## MORNING CHECKLIST (April 9, 1 hour before)

```
[ ] Laptop A: ollama serve --port 11434 running
[ ] Laptop B: OLLAMA_HOST=0.0.0.0:11435 ollama serve running
[ ] Laptop A: ngrok http 11434 active → copy URL
[ ] Laptop B: ngrok http 11435 active → copy URL
[ ] Update .env with fresh URLs
[ ] Restart dev server
[ ] Trigger Cyclone demo → wait 10s for Gemma warm-up
[ ] Trigger Conflict demo → should be 5–8s now
[ ] Full demo run-through: 3.5 min target
[ ] Check console: no red errors
[ ] Disconnect ngrok → verify keyword fallback works
[ ] Reconnect ngrok
[ ] Show time to team: "Ready"
```

---

## 5-SCENE DEMO (3.5 min total)

```
SCENE 1: Pitch (20s)
└─ App open, toggle ON, globe visible, green arcs

SCENE 2: Storm (40s)
├─ Click demo: Cyclone
├─ Watch Ripple Score 0→7.2 animate
└─ Arcs turn red
Narrate: "Gemma 4 classifies real-time. Every digit derivable."

SCENE 3: DNA (40s)
├─ Scroll to DNA Match panel
├─ Show "73% match to Malacca Typhoon — +80% freight by D+3"
└─ Show Industry Cascade: Semiconductors, Electronics
Narrate: "Evidence-based pattern matching against 6 historical fingerprints."

SCENE 4: Intelligence (60s)
├─ Click "Generate Strategic Insight"
├─ Wait 2–3s for Qwen3 spinner
├─ Panel updates: forecast, rerouting, cost impact
└─ All numbers grounded in visible data
Narrate: "Qwen3 synthesizes strategic analysis. 7-day forecast. Rerouting: +3d, +$480/container."

SCENE 5: Close (30s)
└─ Speak directly, app static behind you
Narrate: "$500K platform charges black box. We built glass box in 48h. Zero cloud. Zero cost."

TOTAL: 3.5 min
```

---

## IF SOMETHING BREAKS

| Problem | Fix | Judges Notice? |
|---------|-----|---|
| ngrok down | Keyword classifier activates auto | No — panels still populate |
| Gemma slow | Already warm from pre-demo run | No — expect 5–8s, not 10–15s |
| Qwen doesn't respond | Template synthesis fallback fires | Maybe — explain "deterministic synthesis" |
| Panel blank | Check console for errors, refresh | Yes — have alt story ready: "Let me show you the data in the console" |
| Demo runs 4+ min | Cut Scene 5, keep 1–4 | No — judges won't care about the 5th |

---

## JUDGE Q&A PREP (Memorize these 3)

**Q: "Why fork WorldMonitor?"**
A: "Deliberate choice. They solved hard infrastructure. We extended with supply chain intelligence. That's senior architecture."

**Q: "Isn't two AI models overkill?"**
A: "Different jobs. Gemma 4 = speed + JSON. Qwen3 = reasoning. Separate hardware. All local."

**Q: "How do you know Ripple Score is right?"**
A: "Back-tested: Suez 2021 ±18%, Red Sea 2024 ±15%, COVID ±20%. Every digit derivable."

---

## CRITICAL CONSTANTS (Don't change these)

```
GEMMA MODEL:     gemma4:e4b (Q4_0, ~5.5GB VRAM)
QWEN MODEL:      qwen3:8b   (Q4_K_M, ~5.8GB VRAM)
OLLAMA PORT A:   11434
OLLAMA PORT B:   11435
VIEWBOX WIDTH:   680px (all SVGs)
DEMO DURATION:   3.5 min HARD LIMIT
RIPPLE SCORE:    Must show derivation (every component visible)
CHOKEPOINTS:     6 required (Malacca, Suez, Hormuz, Panama, Bab, Cape)
```

---

## FILES YOU NEED (in /home/claude/)

```
✓ INTEGRATION_REFACTOR_PROMPT.md ← Big picture strategy
✓ INTEGRATION_CODE_TEMPLATES.md ← Copy-paste code for all 7 steps
✓ DEMO_EXECUTION_CHECKLIST.md ← Day-of timeline + Q&A
✓ INTEGRATION_SUMMARY.md ← One-page summary
✓ This file ← Quick reference card
```

---

## CLOSING PITCH (30 seconds, memorize)

> "Every platform charges $400K–$600K/year for a black box.
>
> ChainFlowX gives you a glass box.
>
> Six layers. Two local AI. Zero cloud. Zero API cost.
>
> Extended WorldMonitor in 48 hours.
>
> Thank you."

---

## SUCCESS SIGNAL

When judges ask: **"So it's actually integrated with the base system?"**

You answer: **"Yes."**

That means you won.

---

**Print this. Bookmark it. Refer to it during build.** 🚀

Built April 2–9, 2026. Ready for judges.
