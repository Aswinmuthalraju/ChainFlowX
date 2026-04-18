import React from 'react';

const LAYERS = [
  { key: 'vessels',   emoji: '🚢', label: 'Ship Cargo (AIS)',  dotColor: '#00bfff' },
  { key: 'aircraft',  emoji: '✈️',  label: 'Air Cargo',         dotColor: '#ff9500' },
  { key: 'pipelines', emoji: '🛢️', label: 'Pipelines',          dotColor: '#ff4500' },
  { key: 'rail',      emoji: '🚂', label: 'Rail Corridors',     dotColor: '#7fff00' },
];

export default function LayerControl({ layerVisibility, onToggle, vesselCount = 0, aircraftCount = 0 }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 15,
        background: 'rgba(5,11,18,0.92)',
        border: '1px solid rgba(0,212,255,0.18)',
        borderRadius: 3,
        padding: '8px 10px',
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        minWidth: 196,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        userSelect: 'none',
      }}
    >
      <div style={{ color: '#5a7a8a', letterSpacing: '0.12em', marginBottom: 7, fontSize: 8 }}>
        TRANSPORT LAYERS
      </div>

      {LAYERS.map(({ key, emoji, label, dotColor }) => {
        const on = layerVisibility?.[key] !== false;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key, !on)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 0',
              color: on ? '#e8f4f8' : '#3a4a5a',
              fontSize: 10,
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <span style={{ color: on ? dotColor : '#3a4a5a', fontSize: 8 }}>●</span>
            <span style={{ fontSize: 13 }}>{emoji}</span>
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ color: on ? dotColor : '#3a4a5a', fontSize: 8 }}>{on ? 'ON' : 'OFF'}</span>
          </button>
        );
      })}

      {(layerVisibility?.vessels !== false || layerVisibility?.aircraft !== false) && (
        <div
          style={{
            marginTop: 7,
            borderTop: '1px solid rgba(0,212,255,0.1)',
            paddingTop: 6,
            color: '#5a7a8a',
            fontSize: 9,
          }}
        >
          {layerVisibility?.vessels !== false && (
            <span>Ships live: {vesselCount}&nbsp;&nbsp;</span>
          )}
          {layerVisibility?.aircraft !== false && (
            <span>Aircraft: {aircraftCount}</span>
          )}
        </div>
      )}
    </div>
  );
}
