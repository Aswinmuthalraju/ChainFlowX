# ChainFlowX Integration Refactor — Complete Prompt
## From Sibling Project → Vertical Intelligence Layer
### Target: Real integration with WorldMonitor's event pipeline

---

## CURRENT PROBLEM

Right now:
- ChainFlowX lives in `/supply-chain/` as a mostly self-contained folder
- `EventTrigger.jsx` is a demo button panel — it manually calls `runPipeline()`
- The 3D globe is rendered separately in `SupplyChainGlobe.jsx`
- WorldMonitor's **existing GDELT event pipeline** is untouched
- Judges see: "They forked a project and built something next to it"

**What we want judges to see:** "They extended a 44k-star production system by injecting supply chain intelligence into its core event processing pipeline."

---

## THE INTEGRATION STRATEGY

### 1. **Inject Into WorldMonitor's Event Handler**
**Goal:** When WorldMonitor receives a GDELT event, it automatically routes through ChainFlowX layers.

**Current WorldMonitor flow:**
```
GDELT API → newsStore → GlobeComponent → Visualize
```

**New ChainFlowX-enhanced flow:**
```
GDELT API → newsStore → [INJECT: runPipeline()] 
          → SupplyChainIntelligence (L0-L6) 
          → enrich with Ripple Score, DNA match, industry cascade
          → GlobeComponent + SupplyChainPanels → Visualize
```

**Key:** ChainFlowX hooks run **inside** WorldMonitor's event pipeline, not parallel to it.

---

### 2. **Reuse WorldMonitor's Ollama Integration**
**Current state:** Both WorldMonitor and ChainFlowX have Ollama connections.

**Goal:** Single Ollama setup, shared .env for both ngrok URLs.

**Action:**
- WorldMonitor already has `.env` with API keys, Ollama host
- Add `VITE_GEMMA_URL` and `VITE_QWEN_URL` to the **same .env** (not duplicated)
- `gemmaAI.js` and `qwenAI.js` read from `import.meta.env` (same as WorldMonitor does)
- Both models appear in WorldMonitor's "AI Stack" badge at top-right

---

### 3. **Replace EventTrigger.jsx with Real Event Integration**
**Current:** Demo buttons that manually trigger events.

**New approach:** 
- Remove the separate demo panel
- Use WorldMonitor's **existing GDELT event stream**
- Add a toggle: "Enable ChainFlowX Intelligence" ← turns on the 6-layer pipeline
- Each real news event from GDELT automatically flows through supply chain analysis
- Demo events are still available via a subtle dropdown in WorldMonitor's header

**Result:** Judges see **live news → real-time supply chain intelligence**, not a separate demo interface.

---

### 4. **Integrate SupplyChainPanels Into Globe Layout**
**Current:** Separate `SupplyChainGlobe.jsx` component.

**New approach:**
- The globe stays as the center canvas (reuse WorldMonitor's globe.gl renderer)
- Right sidebar shows:
  - Ripple Score panel (when event selected)
  - DNA Match panel
  - Industry Cascade panel
  - Strategic Insight panel (Layer 5)
- Left sidebar keeps existing WorldMonitor controls
- **Seamless:** Panels only show when supply chain data exists (after `runPipeline()`)

---

## CONCRETE REFACTORING STEPS

### STEP 1: Merge .env and Ollama Config
**File:** `.env` (root)

```env
# WorldMonitor existing config
VITE_API_KEY=...

# ChainFlowX AI endpoints (NEW — ngrok tunnels to local Ollama)
VITE_GEMMA_URL=https://abc123.ngrok-free.app
VITE_QWEN_URL=https://def456.ngrok-free.app

# Ollama fallback (local, if no ngrok)
VITE_OLLAMA_HOST=http://localhost:11434
```

**Result:** Single source of truth for both WorldMonitor and ChainFlowX.

---

### STEP 2: Inject ChainFlowX Into WorldMonitor's News Handler
**File:** `src/stores/newsStore.js` (or equivalent WorldMonitor store)

**Current structure:**
```javascript
const newsStore = {
  articles: [],
  addArticle: (article) => {
    newsStore.articles.push(article);
    // Maybe trigger some visualization update
  }
}
```

**New structure:**
```javascript
import { runPipeline } from '../supply-chain/state/stateManager.js';
import { validateGraph } from '../supply-chain/graph/graphUtils.js';

const supplyChainEnabled = true;  // Toggle for demo

const newsStore = {
  articles: [],
  supplyChainIntelligence: {},  // NEW: enriched data from ChainFlowX
  
  addArticle: async (article) => {
    newsStore.articles.push(article);
    
    // NEW: If ChainFlowX enabled, run through 6-layer pipeline
    if (supplyChainEnabled && article.relevance > 0.4) {
      try {
        const graph = await loadSupplyChainGraph();  // Lazy load once
        const scIntelligence = await runPipeline(article, graph);
        
        // Attach to article so panels can access it
        newsStore.supplyChainIntelligence[article.id] = scIntelligence;
        
        // Notify UI that intelligence is ready
        notifySubscribers('supplyChainUpdate', { article, intelligence: scIntelligence });
      } catch (err) {
        console.warn('[ChainFlowX] Pipeline failed, proceeding with base article:', err);
        // App continues — graceful degradation
      }
    }
  }
}
```

**Effect:** Every GDELT article automatically gets supply chain intelligence if enabled.

---

### STEP 3: Delete EventTrigger.jsx, Add Event Source Toggle
**File:** Remove `src/supply-chain/components/EventTrigger.jsx`

**File:** `src/components/Header.jsx` (or WorldMonitor's header component)

**Add a toggle:**
```jsx
<div className="flex items-center gap-4">
  {/* Existing WorldMonitor controls */}
  
  {/* NEW: ChainFlowX toggle */}
  <label className="flex items-center gap-2 cursor-pointer">
    <input 
      type="checkbox" 
      checked={supplyChainEnabled}
      onChange={(e) => {
        setSupplyChainEnabled(e.target.checked);
        // Optionally trigger demo cascade if enabled
      }}
      className="w-4 h-4"
    />
    <span className="text-sm text-cyan-400">ChainFlowX Intelligence</span>
  </label>

  {/* Demo event selector — subtle dropdown, not a full panel */}
  <select 
    onChange={(e) => triggerDemoEvent(e.target.value)}
    className="bg-slate-900 text-cyan-400 text-xs px-2 py-1 rounded"
    disabled={!supplyChainEnabled}
  >
    <option value="">Demo Events...</option>
    <option value="cyclone">Cyclone (Bay of Bengal)</option>
    <option value="conflict">Conflict (Red Sea)</option>
    <option value="blockage">Port Blockage (Suez)</option>
  </select>
</div>
```

**Key:** Demo events are optional, not the main interface.

---

### STEP 4: Integrate SupplyChain Panels Into Layout
**File:** `src/App.jsx` (or WorldMonitor's main layout)

**Current structure:**
```jsx
<div className="flex">
  <LeftSidebar />
  <GlobeCanvas />
  <RightSidebar />
</div>
```

**New structure:**
```jsx
import { useSupplyChainIntelligence } from './supply-chain/hooks/useIntelligence.js';
import RippleScorePanel from './supply-chain/components/RippleScorePanel.jsx';
import DNAMatchPanel from './supply-chain/components/DNAMatchPanel.jsx';
import IndustryCascadePanel from './supply-chain/components/IndustryCascadePanel.jsx';
import StrategicInsightPanel from './supply-chain/components/StrategicInsightPanel.jsx';

export default function App() {
  const selectedArticle = useSelectedArticle();
  const supplyChainIntel = useSupplyChainIntelligence(selectedArticle?.id);
  
  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* LEFT: WorldMonitor controls */}
      <LeftSidebar />
      
      {/* CENTER: Globe (unchanged) */}
      <GlobeCanvas />
      
      {/* RIGHT: WorldMonitor base + ChainFlowX panels */}
      <div className="w-96 overflow-y-auto border-l border-slate-700">
        {/* Existing WorldMonitor right panel */}
        <WorldMonitorPanel article={selectedArticle} />
        
        {/* NEW: ChainFlowX intelligence panels — only show if data exists */}
        {supplyChainIntel && (
          <>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-cyan-400 text-sm font-bold px-4 mb-3">
                SUPPLY CHAIN INTELLIGENCE
              </h3>
              
              <RippleScorePanel data={supplyChainIntel.rippleScore} />
              <DNAMatchPanel data={supplyChainIntel.dnaMatch} />
              <IndustryCascadePanel data={supplyChainIntel.industryCascade} />
              
              {/* Layer 5 — on-demand synthesis */}
              <StrategicInsightPanel 
                state={supplyChainIntel}
                onGenerateInsight={async () => {
                  const insight = await synthesizeStrategicInsight(supplyChainIntel);
                  updateIntelligence({ ...supplyChainIntel, strategicInsight: insight });
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

**Effect:** Supply chain panels appear contextually when data is available.

---

### STEP 5: Update Header Badge to Show "6 Layers"
**File:** `src/components/Header.jsx`

**Add:**
```jsx
<div className="flex items-center gap-3 text-xs font-mono">
  <span className="text-green-400">● GEMMA4 - LOCAL AI</span>
  <span className="text-blue-400">● QWEN3 - REASONING</span>
  <span className="text-cyan-400">■ 6-LAYER INTELLIGENCE</span>
  <span className="text-slate-500">✓ Graph Validated</span>
</div>
```

**Effect:** Judges see the full stack upfront — this is an *extended* system, not a demo addon.

---

### STEP 6: Update Project Structure (Reflect Integration)
**New folder layout:**

```
chainflowx/  (forked WorldMonitor with ChainFlowX layers)
├── src/
│   ├── [WorldMonitor files — untouched core]
│   ├── stores/
│   │   └── newsStore.js              ← MODIFIED: inject runPipeline()
│   ├── components/
│   │   ├── Header.jsx                ← MODIFIED: add toggle + demo dropdown
│   │   ├── [WorldMonitor components]
│   │   └── GlobeCanvas.jsx           ← UNCHANGED: reuse WorldMonitor
│   │
│   └── supply-chain/                 ← VERTICAL LAYER (unchanged internally)
│       ├── data/
│       ├── graph/
│       ├── engine/
│       ├── ai/
│       ├── state/
│       └── components/               ← Now integrated into right sidebar
│           ├── RippleScorePanel.jsx
│           ├── DNAMatchPanel.jsx
│           ├── IndustryCascadePanel.jsx
│           ├── StrategicInsightPanel.jsx
│           └── [removed: EventTrigger.jsx]
│
├── .env                              ← UNIFIED: VITE_GEMMA_URL + VITE_QWEN_URL
└── vercel.json
```

---

### STEP 7: Update README & Pitch
**File:** `README.md`

**Old pitch:**
> "ChainFlowX — an AI-powered supply chain disruption predictor built on WorldMonitor"

**New pitch:**
> "ChainFlowX — extended WorldMonitor with 6-layer supply chain intelligence. When GDELT detects a disruption, our contagion engine automatically propagates the shock wave through 18 shipping routes, calculates a Ripple Score™, matches against historical Disruption DNA™, and delivers industry cascade forecasts — all local, all derivable, zero API cost."

---

## WHAT CHANGES FOR THE DEMO

### Before (Separated):
1. Open app
2. Click "Live Event Simulator" panel
3. Manually select demo event
4. See result

### After (Integrated):
1. Open app
2. Toggle "ChainFlowX Intelligence" in header
3. Real GDELT event streams in (or select demo from dropdown)
4. Watch supply chain panels populate automatically
5. Same intelligence, but **visually embedded in the system** — not a separate panel

**Judge sees:** "This is WorldMonitor + supply chain layer, not two separate tools."

---

## IMPLEMENTATION CHECKLIST

- [ ] Merge `.env` — single Ollama/ngrok config
- [ ] Modify `newsStore.js` — inject `runPipeline()` into event handler
- [ ] Update `App.jsx` — add conditional supply chain panels to right sidebar
- [ ] Update `Header.jsx` — add ChainFlowX toggle + demo event dropdown
- [ ] Delete `EventTrigger.jsx`
- [ ] Verify `validateGraph()` runs at app startup (check console)
- [ ] Test full flow: enable toggle → trigger demo event → panels populate
- [ ] Update README with integrated pitch
- [ ] Test fallbacks: disconnect ngrok → keyword classifier activates
- [ ] Time the full demo (~3.5 min)

---

## EXPECTED RESULT

**Before:** "We built a supply chain project on top of WorldMonitor's infrastructure"

**After:** "We extended WorldMonitor's core event pipeline with supply chain intelligence — 6 layers, 2 local AI models, zero API cost, built in 48 hours"

**Judge response:** "Oh — so it's actually *integrated* with the base system?" → "Yes."

That's the difference between "great hackathon project" and "this team understands system architecture."

---

## TIME ESTIMATE
- Merge .env: 5 min
- Modify newsStore + App.jsx: 30 min
- Update Header + remove EventTrigger: 15 min
- Test + integrate panels: 20 min
- Documentation: 10 min

**Total: ~1.5 hours**

**Then:** 2 hours of refinement, demo timing, fallback testing.

---

**Ready to execute?** Start with STEP 1 (merge .env), then STEP 2 (newsStore injection). The rest follows naturally.
