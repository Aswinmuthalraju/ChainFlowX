import React from 'react';
import { LAYER_CONFIG } from '../data/transportLayerManager.js';

export default function LayerToggle({ layerVisibility, onToggle }) {
  const keys = ['vessels', 'aircraft', 'rail', 'pipelines'];

  return (
    <div className="cfx-layer-toggle transport-overlay">
      <div className="cfx-layer-toggle-title">TRANSPORT LAYERS</div>
      {keys.map((key) => {
        const cfg = LAYER_CONFIG[key];
        if (!cfg) return null;
        const on = layerVisibility[key] !== false;
        return (
          <button
            key={key}
            type="button"
            className={`cfx-layer-row ${on ? 'cfx-layer-row--on' : ''}`}
            onClick={() => onToggle(key, !on)}
          >
            <span className="cfx-layer-dot" style={{ color: cfg.color }}>
              ●
            </span>
            <span className="cfx-layer-icon" aria-hidden>
              {cfg.icon}
            </span>
            <span className="cfx-layer-label">{cfg.label}</span>
            <span className="cfx-layer-state">{on ? 'ON' : 'OFF'}</span>
          </button>
        );
      })}
    </div>
  );
}
