import React, { useState } from 'react';
import StrategicInsightPanel from './StrategicInsightPanel.jsx';
import { llmMemory } from '../ai/llmMemory.js';

export default function EventTrigger({
  eventState,
  onGenerateInsight,
  insightLoading,
  onReset,
  isLoading = false,
}) {
  const [labRunning, setLabRunning] = useState(false);
  const [, setMemoryVersion] = useState(0);
  const eventCount = llmMemory.eventCount;
  const sessionId = llmMemory.sessionId;

  const handleClearMemory = () => {
    llmMemory.clear();
    setMemoryVersion((version) => version + 1);
  };

  const handlePromptLab = async () => {
    setLabRunning(true);
    try {
      const { runPromptLab } = await import('../ai/promptLab.js');
      const result = await runPromptLab();
      console.table(result.allResults);
      alert(`Winner: ${result.winner} (${result.winningScore.toFixed(1)}/100)\nCheck console for details.`);
    } finally {
      setLabRunning(false);
    }
  };

  return (
    <div className="ai-panel">
      <button
        type="button"
        className="trigger-btn"
        onClick={onReset}
        disabled={isLoading}
        style={{ width: '100%', marginBottom: 10 }}
      >
        <span className="scene-num">RESET</span>
        <span className="scene-label-text">Clear active event</span>
      </button>

      <div className="text-xs text-gray-500 mt-2">
        AI Memory: {eventCount} events · Session {sessionId.slice(0, 8)}
        <button
          type="button"
          onClick={handleClearMemory}
          className="ml-2 text-red-400 hover:text-red-300"
        >
          Clear
        </button>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={handlePromptLab}
          disabled={labRunning}
          className="text-xs text-purple-400 border border-purple-800 px-2 py-1 rounded hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {labRunning ? 'Running Prompt Lab...' : 'Prompt Lab'}
        </button>
      )}

      <StrategicInsightPanel
        eventState={eventState}
        onGenerateInsight={onGenerateInsight}
        insightLoading={insightLoading}
      />
    </div>
  );
}