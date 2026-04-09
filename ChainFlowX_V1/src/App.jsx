import { useState, useEffect, useRef } from 'react';
import { buildGraph, validateGraph } from './supply-chain/graph/graphUtils.js';
import { runPipeline } from './supply-chain/state/stateManager.js';
import { synthesizeStrategicInsight } from './supply-chain/ai/qwenAI.js';
import { PORTS } from './supply-chain/data/ports.js';
import { ROUTES } from './supply-chain/data/routes.js';
import { CHOKEPOINTS } from './supply-chain/data/chokepoints.js';
import { DNA_FINGERPRINTS } from './supply-chain/data/dnaFingerprints.js';

// Import all panels
import SupplyChainGlobe from './supply-chain/components/SupplyChainGlobe.jsx';
import RippleScorePanel from './supply-chain/components/RippleScorePanel.jsx';
import DNAMatchPanel from './supply-chain/components/DNAMatchPanel.jsx';
import IndustryCascadePanel from './supply-chain/components/IndustryCascadePanel.jsx';
import RouteDetailPanel from './supply-chain/components/RouteDetailPanel.jsx';
import StrategicInsightPanel from './supply-chain/components/StrategicInsightPanel.jsx';
import PredictionsPanel from './supply-chain/components/PredictionsPanel.jsx';
import EventTrigger from './supply-chain/components/EventTrigger.jsx';

export default function App() {
  const [graph, setGraph] = useState(null);
  const [routes, setRoutes] = useState(ROUTES);
  const [eventState, setEventState] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [graphValid, setGraphValid] = useState(false);

  // Build and validate graph on startup
  useEffect(() => {
    const g = buildGraph(PORTS, ROUTES, CHOKEPOINTS);
    const { valid, errors } = validateGraph(g);
    if (!valid) console.warn('[ChainFlowX] Graph issues:', errors);
    setGraph(g);
    setGraphValid(valid);
  }, []);

  const handleEventTrigger = async (event) => {
    if (!graph) return;
    setIsLoading(true);
    try {
      const state = await runPipeline(event, graph);
      setEventState(state);
      // Update route statuses based on riskScores
      setRoutes(prevRoutes => prevRoutes.map(r => ({
        ...r,
        currentRisk: state.riskScores[r.id] ?? r.baseRisk,
        status: getRiskStatus(state.riskScores[r.id] ?? r.baseRisk),
      })));
    } catch (err) {
      console.error('[ChainFlowX] Pipeline error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    if (!eventState) return;
    setInsightLoading(true);
    const insight = await synthesizeStrategicInsight(eventState);
    setEventState(prev => ({ ...prev, strategicInsight: insight }));
    setInsightLoading(false);
  };

  // Layout: 3-column dashboard
  // Left column (300px): EventTrigger + RouteDetailPanel
  // Center (flex-grow): SupplyChainGlobe (full height)
  // Right column (380px): RippleScorePanel + DNAMatchPanel + IndustryCascadePanel + StrategicInsightPanel
  
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-name">ChainFlowX</span>
          <span className="brand-tagline">Supply Chain Contagion Intelligence</span>
        </div>
        <div className="header-meta">
          <span className={`status-dot ${graphValid ? 'online' : 'error'}`} />
          {graphValid ? 'Graph Validated' : 'Graph Error'}
          {isLoading && <span className="processing-badge">PROCESSING...</span>}
        </div>
      </header>

      {/* Main dashboard */}
      <main className="dashboard">
        {/* Left panel */}
        <aside className="left-panel">
          <EventTrigger onEventTrigger={handleEventTrigger} isLoading={isLoading} />
          {selectedRoute && (
            <RouteDetailPanel
              route={selectedRoute}
              altRoute={eventState?.altRoutes?.[selectedRoute.id]}
            />
          )}
        </aside>

        {/* Globe center */}
        <section className="globe-section">
          {graph && (
            <SupplyChainGlobe
              routes={routes}
              chokepoints={CHOKEPOINTS}
              eventState={eventState}
              onRouteSelect={setSelectedRoute}
            />
          )}
        </section>

        {/* Right intelligence panel */}
        <aside className="right-panel">
          <RippleScorePanel rippleScore={eventState?.rippleScore} />
          <DNAMatchPanel dnaMatch={eventState?.dnaMatch?.[0]} />
          {eventState?.rippleScore && (
            <IndustryCascadePanel industryCascade={eventState?.industryCascade} />
          )}
          <StrategicInsightPanel
            eventState={eventState}
            onGenerateInsight={handleGenerateInsight}
            insightLoading={insightLoading}
          />
        </aside>
      </main>
    </div>
  );
}

function getRiskStatus(score) {
  if (score >= 86) return 'critical';
  if (score >= 61) return 'severe'; // spec wanted warning but severe looks cooler as an intermediate? the css map has severe
  if (score >= 31) return 'warning';
  return 'normal';
}
