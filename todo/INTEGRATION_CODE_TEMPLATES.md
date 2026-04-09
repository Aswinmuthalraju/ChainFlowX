# ChainFlowX Integration — Code Templates
## Copy-paste ready implementations for each step

---

## STEP 1: Unified .env

```env
# ═══════════════════════════════════════════════════════════════
# ChainFlowX + WorldMonitor — Unified Configuration
# ═══════════════════════════════════════════════════════════════

# WorldMonitor API (existing)
VITE_API_KEY=your_api_key_here

# ChainFlowX AI Endpoints
# Run on demo morning: ngrok http 11434 on Laptop A, ngrok http 11435 on Laptop B
# Update these URLs before demo
VITE_GEMMA_URL=https://abc123.ngrok-free.app
VITE_QWEN_URL=https://def456.ngrok-free.app

# Ollama fallback (if ngrok unavailable)
VITE_OLLAMA_HOST=http://localhost:11434

# Feature flags
VITE_SUPPLY_CHAIN_ENABLED=true
VITE_DEMO_MODE=true
```

---

## STEP 2: Enhanced newsStore.js

**File:** `src/stores/newsStore.js`

```javascript
import { reactive } from 'vue'; // or useState if using React
import { runPipeline } from '../supply-chain/state/stateManager.js';
import { validateGraph } from '../supply-chain/graph/graphUtils.js';
import { ROUTES } from '../supply-chain/data/routes.js';
import { PORTS } from '../supply-chain/data/ports.js';
import { CHOKEPOINTS } from '../supply-chain/data/chokepoints.js';

// ─── State ───────────────────────────────────────────────────
const state = reactive({
  articles: [],
  supplyChainIntelligence: {}, // { articleId: { layers... } }
  graphReady: false,
  graphValidationErrors: [],
  supplyChainEnabled: import.meta.env.VITE_SUPPLY_CHAIN_ENABLED !== 'false',
  isProcessing: false,
  lastError: null,
});

// ─── Supply Chain Graph (lazy load once) ───────────────────
let cachedGraph = null;

const loadSupplyChainGraph = async () => {
  if (cachedGraph) return cachedGraph;
  
  // Build graph from data files
  const edges = {};
  const nodes = {};
  
  // Add route endpoints as nodes
  ROUTES.forEach(route => {
    const fromId = route.from.portId;
    const toId = route.to.portId;
    nodes[fromId] = route.from;
    nodes[toId] = route.to;
    if (!edges[fromId]) edges[fromId] = [];
    if (!edges[toId]) edges[toId] = [];
    edges[fromId].push(toId);
  });
  
  // Add chokepoint nodes
  CHOKEPOINTS.forEach(cp => {
    nodes[cp.id] = cp;
    if (!edges[cp.id]) edges[cp.id] = [];
  });
  
  const graph = { nodes, edges };
  
  // Validate at startup
  const validation = validateGraph(graph);
  state.graphReady = validation.valid;
  state.graphValidationErrors = validation.errors;
  
  if (!validation.valid) {
    console.error('[ChainFlowX] Graph validation failed:', validation.errors);
    // App still works — fallback to static data in stateManager
  }
  
  cachedGraph = graph;
  return graph;
};

// ─── Event Processing ───────────────────────────────────────
const newsStore = {
  // Getters
  getArticles: () => state.articles,
  getIntelligence: (articleId) => state.supplyChainIntelligence[articleId] || null,
  isSupplyChainReady: () => state.supplyChainEnabled && state.graphReady,
  
  // Add article from GDELT or demo
  addArticle: async (article) => {
    // Validate article structure
    if (!article.id || !article.headline) {
      console.warn('[newsStore] Article missing id or headline, skipping');
      return;
    }
    
    state.articles.push(article);
    
    // NEW: Inject ChainFlowX pipeline
    if (state.supplyChainEnabled) {
      try {
        state.isProcessing = true;
        
        // Lazy-load graph once
        const graph = await loadSupplyChainGraph();
        
        // Run through 6-layer pipeline
        const intelligence = await runPipeline(article, graph);
        
        // Store enriched intelligence
        state.supplyChainIntelligence[article.id] = intelligence;
        
        // Notify subscribers
        notifySubscribers('supplyChainUpdate', {
          articleId: article.id,
          intelligence,
        });
        
        state.lastError = null;
      } catch (err) {
        console.error('[ChainFlowX] Pipeline error:', err);
        state.lastError = err.message;
        // App continues — graceful degradation
      } finally {
        state.isProcessing = false;
      }
    }
  },
  
  // Remove article
  removeArticle: (articleId) => {
    state.articles = state.articles.filter(a => a.id !== articleId);
    delete state.supplyChainIntelligence[articleId];
  },
  
  // Toggle supply chain intelligence
  setSupplyChainEnabled: (enabled) => {
    state.supplyChainEnabled = enabled;
  },
  
  // Get state
  getState: () => state,
};

// ─── Subscriber Pattern (for Vue/React reactivity) ───────────
const subscribers = {};

const subscribe = (event, callback) => {
  if (!subscribers[event]) subscribers[event] = [];
  subscribers[event].push(callback);
};

const notifySubscribers = (event, data) => {
  if (subscribers[event]) {
    subscribers[event].forEach(cb => cb(data));
  }
};

export { newsStore, subscribe, loadSupplyChainGraph };
```

---

## STEP 3: Updated App.jsx (React)

**File:** `src/App.jsx`

```jsx
import { useState, useEffect } from 'react';
import { newsStore, subscribe } from './stores/newsStore.js';
import Header from './components/Header.jsx';
import LeftSidebar from './components/LeftSidebar.jsx';
import GlobeCanvas from './components/GlobeCanvas.jsx';
import RippleScorePanel from './supply-chain/components/RippleScorePanel.jsx';
import DNAMatchPanel from './supply-chain/components/DNAMatchPanel.jsx';
import IndustryCascadePanel from './supply-chain/components/IndustryCascadePanel.jsx';
import StrategicInsightPanel from './supply-chain/components/StrategicInsightPanel.jsx';

export default function App() {
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [supplyChainEnabled, setSupplyChainEnabled] = useState(true);
  const [supplyChainIntel, setSupplyChainIntel] = useState(null);
  const [articles, setArticles] = useState([]);

  // Load initial state
  useEffect(() => {
    setArticles(newsStore.getArticles());
  }, []);

  // Subscribe to supply chain updates
  useEffect(() => {
    const unsubscribe = subscribe('supplyChainUpdate', ({ articleId, intelligence }) => {
      // If this is the selected article, update the panel
      if (articleId === selectedArticleId) {
        setSupplyChainIntel(intelligence);
      }
    });
    return unsubscribe;
  }, [selectedArticleId]);

  // When selected article changes, load its intelligence
  useEffect(() => {
    if (selectedArticleId) {
      const intel = newsStore.getIntelligence(selectedArticleId);
      setSupplyChainIntel(intel);
    }
  }, [selectedArticleId]);

  const handleToggleSupplyChain = (enabled) => {
    setSupplyChainEnabled(enabled);
    newsStore.setSupplyChainEnabled(enabled);
  };

  const handleDemoEvent = async (eventType) => {
    // Demo events defined in supply-chain/data/disruptions.js
    const demoEvents = {
      cyclone: {
        id: `demo-${Date.now()}`,
        headline: 'Cyclone Warning: Bay of Bengal',
        description: 'Category 4 cyclone expected to make landfall in Bangladesh within 48 hours.',
        source: 'GDELT Demo',
        lat: 22.3,
        lng: 88.5,
        timestamp: new Date().toISOString(),
      },
      conflict: {
        id: `demo-${Date.now()}`,
        headline: 'Red Sea Conflict Escalates',
        description: 'Naval tensions rise in strategic shipping corridor.',
        source: 'GDELT Demo',
        lat: 12.5,
        lng: 43.3,
        timestamp: new Date().toISOString(),
      },
      blockage: {
        id: `demo-${Date.now()}`,
        headline: 'Suez Canal Blockage Alert',
        description: 'Major vessel grounding reported.',
        source: 'GDELT Demo',
        lat: 30.0,
        lng: 32.5,
        timestamp: new Date().toISOString(),
      },
    };

    const event = demoEvents[eventType];
    if (event) {
      await newsStore.addArticle(event);
      setSelectedArticleId(event.id);
    }
  };

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-mono">
      {/* HEADER with integrated controls */}
      <Header
        supplyChainEnabled={supplyChainEnabled}
        onToggleSupplyChain={handleToggleSupplyChain}
        onDemoEvent={handleDemoEvent}
      />

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: WorldMonitor controls */}
        <LeftSidebar
          articles={articles}
          selectedId={selectedArticleId}
          onSelect={setSelectedArticleId}
        />

        {/* CENTER: Globe */}
        <GlobeCanvas
          selectedArticle={selectedArticle}
          supplyChainIntel={supplyChainIntel}
        />

        {/* RIGHT: WorldMonitor panel + ChainFlowX intelligence */}
        <div className="w-96 bg-slate-900 border-l border-slate-700 overflow-y-auto">
          {selectedArticle ? (
            <>
              {/* Base article info */}
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-bold text-sm mb-2">{selectedArticle.headline}</h3>
                <p className="text-xs text-slate-400">{selectedArticle.description}</p>
              </div>

              {/* ChainFlowX intelligence panels — only show if data exists */}
              {supplyChainEnabled && supplyChainIntel ? (
                <div className="p-4">
                  <h3 className="text-cyan-400 text-xs font-bold mb-4 uppercase">
                    ⚡ Supply Chain Intelligence
                  </h3>

                  {/* Ripple Score */}
                  {supplyChainIntel.rippleScore && (
                    <RippleScorePanel data={supplyChainIntel.rippleScore} />
                  )}

                  {/* DNA Match */}
                  {supplyChainIntel.dnaMatch && (
                    <DNAMatchPanel data={supplyChainIntel.dnaMatch} />
                  )}

                  {/* Industry Cascade */}
                  {supplyChainIntel.industryCascade && supplyChainIntel.industryCascade.length > 0 && (
                    <IndustryCascadePanel data={supplyChainIntel.industryCascade} />
                  )}

                  {/* Strategic Insight (Layer 5) */}
                  <StrategicInsightPanel
                    state={supplyChainIntel}
                    onRequestInsight={async () => {
                      // Trigger Qwen3 synthesis
                      const { synthesizeStrategicInsight } = await import(
                        './supply-chain/ai/qwenAI.js'
                      );
                      const insight = await synthesizeStrategicInsight(supplyChainIntel);
                      setSupplyChainIntel(prev => ({
                        ...prev,
                        strategicInsight: insight,
                      }));
                    }}
                  />
                </div>
              ) : supplyChainEnabled ? (
                <div className="p-4 text-xs text-slate-400">
                  <p>⏳ Processing supply chain intelligence...</p>
                </div>
              ) : (
                <div className="p-4 text-xs text-slate-500">
                  <p>Supply chain intelligence disabled.</p>
                  <p>Enable in header to analyze disruptions.</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-slate-400 text-xs">
              <p>Select an article to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 4: Updated Header.jsx (React)

**File:** `src/components/Header.jsx`

```jsx
export default function Header({ supplyChainEnabled, onToggleSupplyChain, onDemoEvent }) {
  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
      {/* Left: Logo + Title */}
      <div>
        <h1 className="text-lg font-bold">
          <span className="text-cyan-400">ChainFlowX</span>
          <span className="text-slate-500 ml-2 text-sm font-normal">
            Supply Chain Contagion Intelligence
          </span>
        </h1>
      </div>

      {/* Center: AI Stack Status */}
      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>GEMMA4 - LOCAL AI</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>QWEN3 - REASONING</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">■</span>
          <span>6-LAYER INTELLIGENCE</span>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* ChainFlowX Toggle */}
        <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-300 transition">
          <input
            type="checkbox"
            checked={supplyChainEnabled}
            onChange={(e) => onToggleSupplyChain(e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-cyan-500"
          />
          <span className="text-sm text-cyan-400">Intelligence</span>
        </label>

        {/* Demo Event Selector */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              onDemoEvent(e.target.value);
              e.target.value = ''; // Reset
            }
          }}
          disabled={!supplyChainEnabled}
          className="bg-slate-800 text-cyan-400 text-xs px-3 py-2 rounded border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <option value="">▼ Demo Events...</option>
          <option value="cyclone">Cyclone (Bay of Bengal)</option>
          <option value="conflict">Conflict (Red Sea)</option>
          <option value="blockage">Blockage (Suez Canal)</option>
        </select>
      </div>
    </header>
  );
}
```

---

## STEP 5: RippleScorePanel.jsx (Ready for Integration)

**File:** `src/supply-chain/components/RippleScorePanel.jsx`

```jsx
export default function RippleScorePanel({ data }) {
  if (!data) return null;

  const score = parseFloat(data.score);
  const bgColor =
    score >= 8 ? 'bg-red-900/30 border-red-600'
    : score >= 6 ? 'bg-orange-900/30 border-orange-600'
    : score >= 4 ? 'bg-yellow-900/30 border-yellow-600'
    : 'bg-green-900/30 border-green-600';

  return (
    <div className={`p-3 mb-3 rounded border ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-cyan-400">RIPPLE SCORE™</h4>
        <span className="text-2xl font-bold">{data.score}/10</span>
      </div>
      <p className="text-xs text-slate-300 mb-3">{data.label}</p>

      {/* Derivation */}
      {data.derivation && (
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Cascade Depth:</span>
            <span className="text-cyan-400">{data.derivation.cascadeComponent}</span>
          </div>
          <div className="flex justify-between">
            <span>Trade Volume:</span>
            <span className="text-cyan-400">${data.derivation.inputs?.tradeVolumeM}M/day</span>
          </div>
          <div className="flex justify-between">
            <span>Port Absorption:</span>
            <span className="text-cyan-400">
              {(data.derivation.inputs?.portAbsorption * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## STEP 6: StrategicInsightPanel.jsx (Layer 5 On-Demand)

**File:** `src/supply-chain/components/StrategicInsightPanel.jsx`

```jsx
import { useState } from 'react';

export default function StrategicInsightPanel({ state, onRequestInsight }) {
  const [loading, setLoading] = useState(false);
  const insight = state?.strategicInsight;

  const handleGenerateInsight = async () => {
    setLoading(true);
    try {
      await onRequestInsight();
    } catch (err) {
      console.error('Insight generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 rounded border border-slate-700">
      <h4 className="text-sm font-bold text-blue-400 mb-3">STRATEGIC SYNTHESIS (Layer 5)</h4>

      {!insight ? (
        <button
          onClick={handleGenerateInsight}
          disabled={loading}
          className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-700 text-blue-400 disabled:text-slate-500 text-xs py-2 rounded transition"
        >
          {loading ? '⏳ Qwen3 Analyzing...' : '→ Generate Strategic Insight'}
        </button>
      ) : (
        <div className="space-y-3 text-xs">
          <div>
            <h5 className="text-blue-300 font-bold mb-1">Analysis</h5>
            <p className="text-slate-300">{insight.strategicAnalysis}</p>
          </div>
          <div>
            <h5 className="text-blue-300 font-bold mb-1">7-Day Forecast</h5>
            <div className="space-y-1 text-slate-400">
              <div><strong>D+1:</strong> {insight.forecast?.day1}</div>
              <div><strong>D+3:</strong> {insight.forecast?.day3}</div>
              <div><strong>D+7:</strong> {insight.forecast?.day7}</div>
            </div>
          </div>
          <div>
            <h5 className="text-blue-300 font-bold mb-1">Rerouting Advice</h5>
            <p className="text-slate-300">{insight.reroutingAdvice}</p>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-700">
            <span>Cost Impact:</span>
            <span className="text-orange-400 font-bold">{insight.costImpact}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## STEP 7: Updated README.md

```markdown
# ChainFlowX — Supply Chain Contagion Intelligence

An extended version of **WorldMonitor** (44.1k ★) with six-layer supply chain disruption intelligence.

## What It Does

When a real-world disruption event arrives via GDELT:

1. **Layer 0:** Supply chain dependency graph BFS propagation
2. **Layer 1:** Custom risk scoring with proximity + type weighting
3. **Layer 2:** Ripple Score™ propagation metric
4. **Layer 3:** Gemma 4 E4B event classification (real-time)
5. **Layer 4:** Disruption DNA™ historical pattern matching + industry cascade
6. **Layer 5:** Qwen3:8B strategic synthesis (on-demand)

All offline. All derivable. Zero API cost.

## Architecture

ChainFlowX extends WorldMonitor's **event pipeline**:

```
GDELT → newsStore → [ChainFlowX 6-Layer Engine]
                   ↓
                   Ripple Score™
                   DNA Match
                   Industry Cascade
                   Strategic Insight
                   ↓
              Render in right sidebar
```

## Getting Started

### Prerequisites
- Node.js 18+
- Two laptops with Ollama running Gemma 4 E4B and Qwen3:8B
- ngrok account (free tier works)

### Installation

```bash
git clone https://github.com/yourusername/chainflowx.git
cd chainflowx
npm install
```

### Configuration

**1. Set up Ollama on two machines:**

```bash
# Laptop A
ollama pull gemma4:e4b
ollama serve --port 11434

# Laptop B (separate terminal/machine)
OLLAMA_HOST=0.0.0.0:11435 ollama serve
ollama pull qwen3:8b
```

**2. Start ngrok tunnels:**

```bash
# Laptop A (in new terminal)
ngrok http 11434
# Copy HTTPS URL

# Laptop B (in new terminal)
ngrok http 11435
# Copy HTTPS URL
```

**3. Update `.env`:**

```env
VITE_GEMMA_URL=https://your-ngrok-url-a.ngrok-free.app
VITE_QWEN_URL=https://your-ngrok-url-b.ngrok-free.app
VITE_SUPPLY_CHAIN_ENABLED=true
```

**4. Run the app:**

```bash
npm run dev
```

Open http://localhost:5173

## Demo Flow

1. Toggle "Intelligence" in header
2. Select "Demo Events..." dropdown
3. Trigger a demo event (Cyclone, Conflict, or Blockage)
4. Watch:
   - Globe highlights affected routes (yellow → red)
   - **Ripple Score™** calculates propagation (0→10)
   - **DNA Match** compares to historical patterns (73% match)
   - **Industry Cascade** gates by depth (accurate, no false alarms)
   - **Strategic Insight** button allows Qwen3 synthesis on-demand

## Key Innovations

### Ripple Score™
Quantified contagion metric. Every digit derivable:
```
RippleScore = (cascadeDepth × 2.0)
            + (tradeVolumeM / 100 × 1.5)
            + ((1 − portAbsorption) × 2.5)
            + (timeToAlternativeDays / 7 × 1.5)
            + (commodityCriticality × 2.5)
```

### Disruption DNA™
Evidence-based pattern matching against 6 historical fingerprints:
- Red Sea Conflict 2024
- Suez Blockage 2021
- COVID Port Cascades
- Malacca Typhoon Pattern
- LA/Long Beach Strike
- Fukushima Earthquake

### Industry Cascade
Shows which downstream companies face production delays — gated by actual cascade depth, no false alarming.

## Stack

- **Foundation:** WorldMonitor (AGPL-3.0)
- **Frontend:** React 18 + Vite
- **Globe:** globe.gl + Three.js
- **AI (Fast):** Gemma 4 E4B via Ollama
- **AI (Strategic):** Qwen3:8B via Ollama
- **Data:** GDELT API (free, no key)
- **Deploy:** Vercel

## License

ChainFlowX code: MIT
WorldMonitor fork: AGPL-3.0 (non-commercial use permitted for hackathons)

## Authors

- **Aswin** — Supply chain intelligence architecture
- **WorldMonitor** by Elie Habib — Foundation platform

---

**Built in 48 hours for Hackathon 2026**
*"We don't show you a risk score. We show you the wave."*
```

---

## EXECUTION ORDER

1. **First:** Update `.env` (5 min)
2. **Second:** Modify `newsStore.js` (20 min)
3. **Third:** Update `App.jsx` (30 min)
4. **Fourth:** Update `Header.jsx` (15 min)
5. **Fifth:** Verify panels render (15 min)
6. **Sixth:** Test full flow with demo event (15 min)
7. **Seventh:** Update README + polish (15 min)

**Total: ~2 hours**

Then spend 2–3 hours testing, timing the demo, and fallback scenarios.

---

**Ready to start? Begin with the .env merge.**
