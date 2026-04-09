import React from 'react';
import { DEMO_EVENTS } from '../data/disruptions.js';

export default function EventTrigger({ onEventTrigger, isLoading }) {
  return (
    <div className="panel event-trigger-panel">
      <h2 className="panel-title">LIVE EVENT SIMULATOR</h2>
      <div className="event-list">
        {DEMO_EVENTS.map(evt => (
          <button
            key={evt.id}
            onClick={() => onEventTrigger(evt)}
            disabled={isLoading}
            className={`event-btn event-btn--${evt.type}`}
          >
            <span className="icon"></span> {evt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
