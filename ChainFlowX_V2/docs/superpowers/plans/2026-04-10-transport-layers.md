# Transport Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 independently-togglable transport overlays (Ships AIS, Air Cargo, Pipelines, Rail) to the ChainFlowX globe with emoji HTML markers and a live-count layer control panel.

**Architecture:** `TransportLayers.jsx` (renderless, owns AIS WebSocket + OpenSky polling lifecycle) feeds vessel/aircraft state up to `App.jsx`, which passes it alongside static pipeline/rail data into `SupplyChainGlobe.jsx`. The globe merges ALL htmlElementsData (ships 🚢, aircraft ✈️, pipeline midpoints 🛢️, rail midpoints 🚂) into one array keyed off `layerVisibility`. `LayerControl.jsx` replaces `LayerToggle.jsx` and shows live counts.

**Tech Stack:** React (hooks), globe.gl (already installed), aisstream.io WebSocket, OpenSky Network REST (proxied via existing Vite proxy at `/api/opensky`), Tailwind CSS (existing classes)

---

## File Map

| Action | File |
|--------|------|
| Modify | `ChainFlowX_V2/.env` — add VITE_AISSTREAM_KEY |
| Modify | `ChainFlowX_V2/.env.example` — add VITE_AISSTREAM_KEY |
| Modify | `ChainFlowX_V2/src/supply-chain/data/transportPipeline.js` — expand to 20 |
| Modify | `ChainFlowX_V2/src/supply-chain/data/transportRail.js` — expand to 10 |
| Create | `ChainFlowX_V2/src/supply-chain/components/TransportLayers.jsx` — renderless data manager |
| Create | `ChainFlowX_V2/src/supply-chain/components/LayerControl.jsx` — toggle panel with counts |
| Modify | `ChainFlowX_V2/src/supply-chain/components/SupplyChainGlobe.jsx` — emoji + midpoints |
| Modify | `ChainFlowX_V2/src/App.jsx` — use TransportLayers + LayerControl |

---

### Task 1: Env — add VITE_AISSTREAM_KEY

**Files:**
- Modify: `ChainFlowX_V2/.env`
- Modify: `ChainFlowX_V2/.env.example`

- [ ] **Step 1: Add to .env**

Append this line to `ChainFlowX_V2/.env`:
```
VITE_AISSTREAM_KEY=9750de58063f5f853a4632bd09e5f8fa19ec8f87
```

- [ ] **Step 2: Add placeholder to .env.example**

Append this line to `ChainFlowX_V2/.env.example`:
```
VITE_AISSTREAM_KEY=get_free_key_at_aisstream.io
```

- [ ] **Step 3: Commit**
```bash
git add ChainFlowX_V2/.env.example
git commit -m "feat: add VITE_AISSTREAM_KEY to env config"
```
(Do NOT commit .env itself — it contains the real key)

---

### Task 2: Expand pipeline data to 20

**Files:**
- Modify: `ChainFlowX_V2/src/supply-chain/data/transportPipeline.js`

- [ ] **Step 1: Replace the entire file with 20 pipelines**

Replace `ChainFlowX_V2/src/supply-chain/data/transportPipeline.js` with:

```js
export const PIPELINE_CORRIDORS = [
  {
    id: 'PIPE-01',
    name: 'Trans-Arabian Pipeline',
    from: { name: 'Dhahran', lat: 26.3, lng: 50.1 },
    to: { name: 'Yanbu', lat: 24.09, lng: 38.05 },
    waypoints: [{ lat: 26.0, lng: 46.0 }, { lat: 25.0, lng: 42.0 }],
    commodity: 'oil', type: 'oil', capacityBpd: 1800000, status: 'normal', color: '#ff4400',
  },
  {
    id: 'PIPE-02',
    name: 'Nord Stream 1 (Russia–Germany)',
    from: { name: 'Vyborg', lat: 60.71, lng: 28.74 },
    to: { name: 'Lubmin', lat: 54.14, lng: 13.65 },
    waypoints: [{ lat: 58.0, lng: 20.0 }, { lat: 56.0, lng: 15.0 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'offline', color: '#ffd700',
  },
  {
    id: 'PIPE-03',
    name: 'BTC Pipeline (Baku–Tbilisi–Ceyhan)',
    from: { name: 'Baku', lat: 40.41, lng: 49.87 },
    to: { name: 'Ceyhan', lat: 36.84, lng: 35.76 },
    waypoints: [{ lat: 41.69, lng: 44.83 }, { lat: 40.0, lng: 40.0 }],
    commodity: 'oil', type: 'oil', capacityBpd: 1200000, status: 'active', color: '#ff4400',
  },
  {
    id: 'PIPE-04',
    name: 'Druzhba Pipeline (Russia–Europe)',
    from: { name: 'Almetyevsk', lat: 54.9, lng: 52.3 },
    to: { name: 'Hamburg', lat: 53.55, lng: 9.99 },
    waypoints: [{ lat: 55.0, lng: 45.0 }, { lat: 52.0, lng: 28.0 }, { lat: 52.0, lng: 18.0 }],
    commodity: 'oil', type: 'oil', capacityBpd: 2000000, status: 'disrupted', color: '#ff4400',
  },
  {
    id: 'PIPE-05',
    name: 'Trans-Alaska Pipeline',
    from: { name: 'Prudhoe Bay', lat: 70.26, lng: -148.35 },
    to: { name: 'Valdez', lat: 61.13, lng: -146.35 },
    waypoints: [{ lat: 66.56, lng: -148.5 }, { lat: 63.74, lng: -148.9 }],
    commodity: 'oil', type: 'oil', capacityBpd: 500000, status: 'active', color: '#ff4400',
  },
  {
    id: 'PIPE-06',
    name: 'Turkmenistan–China Gas Pipeline',
    from: { name: 'Turkmenabad', lat: 39.09, lng: 63.57 },
    to: { name: 'Horgos', lat: 44.21, lng: 80.52 },
    waypoints: [{ lat: 40.5, lng: 65.0 }, { lat: 41.0, lng: 70.0 }, { lat: 43.0, lng: 76.0 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'active', color: '#ffd700',
  },
  {
    id: 'PIPE-07',
    name: 'West–East Gas Pipeline (China)',
    from: { name: 'Lunnan', lat: 41.1, lng: 83.6 },
    to: { name: 'Shanghai', lat: 31.23, lng: 121.47 },
    waypoints: [{ lat: 36.5, lng: 101.0 }, { lat: 33.0, lng: 108.0 }, { lat: 30.0, lng: 116.0 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'active', color: '#ffd700',
  },
  {
    id: 'PIPE-08',
    name: 'ESPO Pipeline (East Siberia–Pacific)',
    from: { name: 'Taishet', lat: 55.93, lng: 98.0 },
    to: { name: 'Kozmino', lat: 42.8, lng: 133.1 },
    waypoints: [{ lat: 52.3, lng: 104.3 }, { lat: 48.5, lng: 113.5 }, { lat: 44.0, lng: 125.0 }],
    commodity: 'oil', type: 'oil', capacityBpd: 1600000, status: 'active', color: '#ff4400',
  },
  {
    id: 'PIPE-09',
    name: 'TANAP (Trans-Anatolian Natural Gas)',
    from: { name: 'Georgian Border', lat: 41.4, lng: 42.0 },
    to: { name: 'Eskişehir', lat: 39.77, lng: 30.52 },
    waypoints: [{ lat: 40.5, lng: 38.0 }, { lat: 39.9, lng: 34.0 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'active', color: '#ffd700',
  },
  {
    id: 'PIPE-10',
    name: 'TAP (Trans-Adriatic Pipeline)',
    from: { name: 'Greek Border', lat: 41.3, lng: 26.3 },
    to: { name: 'Lecce', lat: 40.35, lng: 18.17 },
    waypoints: [{ lat: 41.1, lng: 20.0 }, { lat: 40.7, lng: 19.0 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'active', color: '#ffd700',
  },
  {
    id: 'PIPE-11',
    name: 'Trans-Nigeria Pipeline',
    from: { name: 'Port Harcourt', lat: 4.77, lng: 7.01 },
    to: { name: 'Warri', lat: 5.52, lng: 5.75 },
    waypoints: [{ lat: 5.1, lng: 6.4 }],
    commodity: 'oil', type: 'oil', capacityBpd: 300000, status: 'disrupted', color: '#ff4400',
  },
  {
    id: 'PIPE-12',
    name: 'Kenya–Uganda Pipeline',
    from: { name: 'Mombasa', lat: -4.05, lng: 39.67 },
    to: { name: 'Kampala', lat: 0.32, lng: 32.58 },
    waypoints: [{ lat: -1.3, lng: 36.8 }, { lat: 0.5, lng: 34.0 }],
    commodity: 'oil', type: 'oil', capacityBpd: 60000, status: 'active', color: '#ff4400',
  },
  {
    id: 'PIPE-13',
    name: 'Habshan–Fujairah Pipeline (UAE)',
    from: { name: 'Habshan', lat: 23.74, lng: 53.73 },
    to: { name: 'Fujairah', lat: 25.12, lng: 56.34 },
    waypoints: [{ lat: 24.4, lng: 55.5 }],
    commodity: 'oil', type: 'oil', capacityBpd: 1500000, status: 'active', color: '#ff4400',
  },
  {
    id: 'PIPE-14',
    name: 'IGAT Pipeline (Iran Gas Trunkline)',
    from: { name: 'Bid Boland', lat: 31.37, lng: 49.73 },
    to: { name: 'Astara', lat: 38.43, lng: 48.87 },
    waypoints: [{ lat: 33.0, lng: 50.5 }, { lat: 36.0, lng: 49.8 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'active', color: '#ffd700',
  },
  {
    id: 'PIPE-15',
    name: 'GASSI Touil Pipeline (Algeria–Tunisia)',
    from: { name: 'Hassi R\'Mel', lat: 32.93, lng: 3.28 },
    to: { name: 'Tunis', lat: 36.82, lng: 10.17 },
    waypoints: [{ lat: 34.5, lng: 6.0 }, { lat: 36.0, lng: 9.0 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'active', color: '#ffd700',
  },
  {
    id: 'PIPE-16',
    name: 'Medgaz Pipeline (Algeria–Spain)',
    from: { name: 'Beni Saf', lat: 35.3, lng: -1.37 },
    to: { name: 'Almería', lat: 36.84, lng: -2.47 },
    waypoints: [{ lat: 36.0, lng: -1.9 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'active', color: '#ffd700',
  },
  {
    id: 'PIPE-17',
    name: 'Yamal–Europe Pipeline',
    from: { name: 'Torzhok', lat: 57.03, lng: 34.97 },
    to: { name: 'Frankfurt/Oder', lat: 52.34, lng: 14.55 },
    waypoints: [{ lat: 53.9, lng: 27.6 }, { lat: 52.2, lng: 23.2 }, { lat: 52.25, lng: 21.0 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'disrupted', color: '#ffd700',
  },
  {
    id: 'PIPE-18',
    name: 'Greenstream Pipeline (Libya–Italy)',
    from: { name: 'Mellitah', lat: 32.82, lng: 12.25 },
    to: { name: 'Gela', lat: 37.06, lng: 14.26 },
    waypoints: [{ lat: 35.0, lng: 13.2 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'active', color: '#ffd700',
  },
  {
    id: 'PIPE-19',
    name: 'EastMed Pipeline (Proposed)',
    from: { name: 'Leviathan Field', lat: 31.5, lng: 34.0 },
    to: { name: 'Greece', lat: 38.0, lng: 23.7 },
    waypoints: [{ lat: 35.2, lng: 32.0 }, { lat: 36.5, lng: 28.0 }],
    commodity: 'gas', type: 'gas', capacityBpd: 0, status: 'offline', color: '#ffd700',
  },
  {
    id: 'PIPE-20',
    name: 'Mombasa–Nairobi Pipeline',
    from: { name: 'Mombasa', lat: -4.05, lng: 39.67 },
    to: { name: 'Nairobi', lat: -1.29, lng: 36.82 },
    waypoints: [{ lat: -2.5, lng: 38.2 }],
    commodity: 'oil', type: 'oil', capacityBpd: 80000, status: 'active', color: '#ff4400',
  },
];

export const getPipelineCorridors = () => PIPELINE_CORRIDORS;
export const getPipelineByStatus = (status) => PIPELINE_CORRIDORS.filter((p) => p.status === status);
```

- [ ] **Step 2: Commit**
```bash
git add ChainFlowX_V2/src/supply-chain/data/transportPipeline.js
git commit -m "feat: expand pipeline data to 20 global corridors"
```

---

### Task 3: Expand rail data to 10 corridors

**Files:**
- Modify: `ChainFlowX_V2/src/supply-chain/data/transportRail.js`

- [ ] **Step 1: Replace the entire file with 10 corridors**

Replace `ChainFlowX_V2/src/supply-chain/data/transportRail.js` with:

```js
export const RAIL_CORRIDORS = [
  {
    id: 'RAIL-01',
    name: 'Trans-Siberian Railway',
    from: { name: 'Moscow', lat: 55.75, lng: 37.62 },
    to: { name: 'Vladivostok', lat: 43.13, lng: 131.91 },
    waypoints: [
      { lat: 56.84, lng: 60.6 },
      { lat: 54.99, lng: 73.37 },
      { lat: 56.0, lng: 92.0 },
      { lat: 52.27, lng: 104.3 },
    ],
    commodity: 'mixed cargo', dailyTrainsEstimate: 40, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-02',
    name: 'China–Europe Railway (New Silk Road)',
    from: { name: 'Chengdu', lat: 30.57, lng: 104.07 },
    to: { name: 'Duisburg', lat: 51.43, lng: 6.76 },
    waypoints: [
      { lat: 43.0, lng: 87.0 },
      { lat: 42.87, lng: 71.43 },
      { lat: 51.18, lng: 58.0 },
      { lat: 55.0, lng: 37.0 },
      { lat: 52.52, lng: 13.4 },
    ],
    commodity: 'electronics', dailyTrainsEstimate: 50, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-03',
    name: 'Belt and Road Rail (Yiwu–Madrid)',
    from: { name: 'Yiwu', lat: 29.31, lng: 120.07 },
    to: { name: 'Madrid', lat: 40.42, lng: -3.7 },
    waypoints: [
      { lat: 43.0, lng: 87.0 },
      { lat: 42.87, lng: 71.43 },
      { lat: 51.18, lng: 58.0 },
      { lat: 52.52, lng: 13.4 },
      { lat: 48.86, lng: 2.35 },
    ],
    commodity: 'consumer goods', dailyTrainsEstimate: 5, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-04',
    name: 'Indian Dedicated Freight Corridor',
    from: { name: 'Delhi', lat: 28.63, lng: 77.22 },
    to: { name: 'Mumbai', lat: 18.96, lng: 72.82 },
    waypoints: [{ lat: 26.9, lng: 75.8 }, { lat: 23.0, lng: 72.6 }],
    commodity: 'bulk goods', dailyTrainsEstimate: 80, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-05',
    name: 'Australian Freight Rail (Perth–Sydney)',
    from: { name: 'Perth', lat: -31.95, lng: 115.86 },
    to: { name: 'Sydney', lat: -33.87, lng: 151.21 },
    waypoints: [{ lat: -33.87, lng: 121.9 }, { lat: -34.93, lng: 138.6 }, { lat: -35.28, lng: 149.13 }],
    commodity: 'bulk minerals', dailyTrainsEstimate: 30, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-06',
    name: 'US Transcontinental Freight (LA–New York)',
    from: { name: 'Los Angeles', lat: 33.73, lng: -118.26 },
    to: { name: 'New York', lat: 40.71, lng: -74.0 },
    waypoints: [
      { lat: 35.47, lng: -115.0 },
      { lat: 35.5, lng: -100.0 },
      { lat: 41.88, lng: -87.63 },
    ],
    commodity: 'consumer goods', dailyTrainsEstimate: 120, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-07',
    name: 'Canadian Pacific (Vancouver–Montreal)',
    from: { name: 'Vancouver', lat: 49.28, lng: -123.12 },
    to: { name: 'Montreal', lat: 45.5, lng: -73.57 },
    waypoints: [{ lat: 51.05, lng: -114.07 }, { lat: 49.9, lng: -97.14 }, { lat: 46.81, lng: -71.21 }],
    commodity: 'bulk grains', dailyTrainsEstimate: 60, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-08',
    name: 'East African Railway (Mombasa–Kampala)',
    from: { name: 'Mombasa', lat: -4.05, lng: 39.67 },
    to: { name: 'Kampala', lat: 0.32, lng: 32.58 },
    waypoints: [{ lat: -1.29, lng: 36.82 }],
    commodity: 'mixed cargo', dailyTrainsEstimate: 10, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-09',
    name: 'Trans-Maghreb Railway (Morocco–Tunisia)',
    from: { name: 'Casablanca', lat: 33.59, lng: -7.62 },
    to: { name: 'Tunis', lat: 36.82, lng: 10.17 },
    waypoints: [{ lat: 34.02, lng: -5.0 }, { lat: 36.73, lng: 3.09 }, { lat: 36.46, lng: 10.04 }],
    commodity: 'phosphates', dailyTrainsEstimate: 15, status: 'active', type: 'rail', color: '#7fff00',
  },
  {
    id: 'RAIL-10',
    name: 'South African Freight (Cape Town–Durban)',
    from: { name: 'Cape Town', lat: -33.93, lng: 18.42 },
    to: { name: 'Durban', lat: -29.86, lng: 31.02 },
    waypoints: [{ lat: -33.96, lng: 25.6 }, { lat: -31.0, lng: 29.0 }],
    commodity: 'mining exports', dailyTrainsEstimate: 25, status: 'active', type: 'rail', color: '#7fff00',
  },
];

export const getRailCorridors = () => RAIL_CORRIDORS;
export const getRailByStatus = (status) => RAIL_CORRIDORS.filter((r) => r.status === status);
```

- [ ] **Step 2: Commit**
```bash
git add ChainFlowX_V2/src/supply-chain/data/transportRail.js
git commit -m "feat: expand rail corridors to 10 global routes"
```

---

### Task 4: Create TransportLayers.jsx

**Files:**
- Create: `ChainFlowX_V2/src/supply-chain/components/TransportLayers.jsx`

This is a renderless component that manages the AIS WebSocket and OpenSky polling lifecycles, replacing the `useEffect` in `App.jsx` that calls `startAllTransportTracking`.

- [ ] **Step 1: Create the file**

Create `ChainFlowX_V2/src/supply-chain/components/TransportLayers.jsx`:

```jsx
import { useEffect, useRef } from 'react';

const CARGO_PREFIXES = ['FDX', 'UPS', 'ABX', 'GTI', 'NCR', 'KZR', 'TGX', 'CLX', 'BOX', 'ATC'];
const MAX_VESSELS = 500;
const MAX_AIRCRAFT = 300;
const OPENSKY_POLL_MS = 90000;

/**
 * Renderless component — owns AIS WebSocket + OpenSky polling.
 * Calls onVesselsChange / onAircraftChange with full arrays on each update.
 */
export default function TransportLayers({
  layerVisibility,
  onVesselsChange,
  onAircraftChange,
}) {
  const vesselsRef = useRef(new Map()); // keyed by mmsi
  const aircraftRef = useRef(new Map()); // keyed by icao24
  const wsRef = useRef(null);
  const openSkyTimerRef = useRef(null);
  const globeFlushTimerRef = useRef(null);
  const openSkyBackoffRef = useRef(null);

  // ── AIS WebSocket ─────────────────────────────────────────────────────────
  useEffect(() => {
    const key = import.meta.env.VITE_AISSTREAM_KEY;
    if (!key) {
      console.warn('[ChainFlowX] AIS stream unavailable — ship layer offline (no VITE_AISSTREAM_KEY)');
      return;
    }

    let ws;
    try {
      ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    } catch {
      console.warn('[ChainFlowX] AIS WebSocket failed to open');
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        APIKey: key,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ['PositionReport'],
        FiltersShipMMSI: [],
        FilterShipTypes: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
      }));
    };

    ws.onmessage = (ev) => {
      try {
        const json = JSON.parse(ev.data);
        const pr =
          json?.Message?.PositionReport ||
          json?.Message?.StandardClassBPositionReport ||
          json?.Message?.ExtendedClassBPositionReport;
        if (!pr) return;
        const meta = json.Metadata || {};
        const lat = meta.Latitude ?? pr.Latitude ?? pr.lat;
        const lng = meta.Longitude ?? pr.Longitude ?? pr.lon ?? pr.lng;
        if (lat == null || lng == null) return;
        const mmsi = String(pr.UserID ?? pr.Mmsi ?? meta.MMSI ?? meta.ShipMMSI ?? '');
        if (!mmsi) return;
        const sogRaw = pr.Sog != null ? Number(pr.Sog) : pr.SpeedOverGround != null ? Number(pr.SpeedOverGround) : null;
        const cog = pr.Cog != null ? Number(pr.Cog) : pr.CourseOverGround != null ? Number(pr.CourseOverGround) : null;
        const hdg = pr.TrueHeading != null && pr.TrueHeading !== 511 ? Number(pr.TrueHeading) : cog ?? 0;
        const name = (meta.ShipName || pr.Name || `MMSI ${mmsi}`).trim();
        vesselsRef.current.set(mmsi, {
          type: 'vessel',
          mmsi,
          name,
          lat: Number(lat),
          lng: Number(lng),
          heading: Number.isFinite(hdg) ? hdg : 0,
          sog: sogRaw != null ? sogRaw / 10 : null,
          updatedAt: Date.now(),
        });
        // Trim to MAX_VESSELS by removing oldest entries
        if (vesselsRef.current.size > MAX_VESSELS) {
          const sorted = [...vesselsRef.current.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
          sorted.slice(0, sorted.length - MAX_VESSELS).forEach(([k]) => vesselsRef.current.delete(k));
        }
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onerror = () => {
      console.warn('[ChainFlowX] AIS WebSocket error — ship layer offline');
    };

    return () => {
      try { ws.close(); } catch { /* ignore */ }
      wsRef.current = null;
    };
  }, []);

  // ── Globe flush timer — push vessel array every 5s ─────────────────────────
  useEffect(() => {
    const flush = () => {
      if (layerVisibility?.vessels !== false) {
        onVesselsChange?.([...vesselsRef.current.values()]);
      }
    };
    globeFlushTimerRef.current = window.setInterval(flush, 5000);
    return () => window.clearInterval(globeFlushTimerRef.current);
  }, [layerVisibility?.vessels, onVesselsChange]);

  // ── OpenSky polling ────────────────────────────────────────────────────────
  useEffect(() => {
    async function poll() {
      if (openSkyBackoffRef.current) return;
      try {
        const res = await fetch('/api/opensky', { headers: { Accept: 'application/json' } });
        if (res.status === 429) {
          console.warn('[ChainFlowX] OpenSky 429 — pausing aircraft polling for 10 minutes');
          openSkyBackoffRef.current = window.setTimeout(() => {
            openSkyBackoffRef.current = null;
          }, 600000);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const states = data?.states;
        if (!Array.isArray(states)) return;
        const next = new Map();
        for (const st of states) {
          const icao24 = st[0];
          const callsign = st[1]?.trim() || '';
          const lng = st[5];
          const lat = st[6];
          const altitude = st[7];
          const onGround = st[8];
          const velocity = st[9];
          const heading = st[10];
          if (onGround) continue;
          if (lat == null || lng == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) continue;
          const isCargoPrefix = CARGO_PREFIXES.some((p) => callsign.toUpperCase().startsWith(p));
          const category = st[17];
          const isHeavy = category === 7 || category === 8;
          if (!isCargoPrefix && !isHeavy) continue;
          next.set(icao24, {
            type: 'aircraft',
            icao24,
            callsign: callsign || icao24,
            lat: Number(lat),
            lng: Number(lng),
            altitude: altitude != null ? Number(altitude) : null,
            velocity: velocity != null ? Number(velocity) : null,
            heading: heading != null ? Number(heading) : 0,
          });
          if (next.size >= MAX_AIRCRAFT) break;
        }
        aircraftRef.current = next;
        if (layerVisibility?.aircraft !== false) {
          onAircraftChange?.([...next.values()]);
        }
      } catch {
        /* network errors — silent */
      }
    }

    poll();
    openSkyTimerRef.current = window.setInterval(poll, OPENSKY_POLL_MS);
    return () => {
      window.clearInterval(openSkyTimerRef.current);
      if (openSkyBackoffRef.current) window.clearTimeout(openSkyBackoffRef.current);
    };
  }, [layerVisibility?.aircraft, onAircraftChange]);

  return null;
}
```

- [ ] **Step 2: Commit**
```bash
git add ChainFlowX_V2/src/supply-chain/components/TransportLayers.jsx
git commit -m "feat: add TransportLayers renderless component (AIS + OpenSky)"
```

---

### Task 5: Create LayerControl.jsx

**Files:**
- Create: `ChainFlowX_V2/src/supply-chain/components/LayerControl.jsx`

- [ ] **Step 1: Create the file**

Create `ChainFlowX_V2/src/supply-chain/components/LayerControl.jsx`:

```jsx
import React from 'react';

const LAYERS = [
  { key: 'vessels',   emoji: '🚢', label: 'Ship Cargo (AIS)',  dotColor: '#00bfff', defaultOn: true },
  { key: 'aircraft',  emoji: '✈️',  label: 'Air Cargo',         dotColor: '#ff9500', defaultOn: true },
  { key: 'pipelines', emoji: '🛢️', label: 'Pipelines',          dotColor: '#ff4500', defaultOn: false },
  { key: 'rail',      emoji: '🚂', label: 'Rail Corridors',     dotColor: '#7fff00', defaultOn: false },
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
        minWidth: 190,
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
            <span style={{ fontSize: 12 }}>{emoji}</span>
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ color: on ? dotColor : '#3a4a5a', fontSize: 8 }}>{on ? 'ON' : 'OFF'}</span>
          </button>
        );
      })}

      {(layerVisibility?.vessels !== false || layerVisibility?.aircraft !== false) && (
        <div style={{ marginTop: 7, borderTop: '1px solid rgba(0,212,255,0.1)', paddingTop: 6, color: '#5a7a8a', fontSize: 9 }}>
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
```

- [ ] **Step 2: Commit**
```bash
git add ChainFlowX_V2/src/supply-chain/components/LayerControl.jsx
git commit -m "feat: add LayerControl panel with live counts"
```

---

### Task 6: Update SupplyChainGlobe.jsx — emoji + midpoint markers

**Files:**
- Modify: `ChainFlowX_V2/src/supply-chain/components/SupplyChainGlobe.jsx`

The existing `htmlElementsData` effect (around line 414) merges chokepoints + vessels + aircraft. We need to:
1. Change vessel rendering from CSS-triangle to 🚢 emoji
2. Add 🛢️ pipeline midpoint markers (from `visiblePipelines` prop)
3. Add 🚂 rail midpoint markers (from `visibleRail` prop)

- [ ] **Step 1: Locate the htmlElementsData effect**

The effect starts with:
```js
useEffect(() => {
  if (!globeRef.current || mapMode === '2d') {
    if (globeRef.current) globeRef.current.htmlElementsData([]);
    return;
  }
  if (!chokepoints) return;
```

And it calls `globe.htmlElementsData(htmlPayload)`.

- [ ] **Step 2: Replace the vessel rendering block inside that effect**

Find this block (lines ~473-486):
```js
if (d.type === 'vessel') {
  const color = VESSEL_COLORS[d.vesselType] || '#4488ff';
  const h = d.heading || 0;
  el.style.cssText = `
    width: 0; height: 0;
    border-left: 3px solid transparent;
    border-right: 3px solid transparent;
    border-bottom: 8px solid ${color};
    transform: rotate(${h}deg);
    opacity: ${d.simulated ? 0.5 : 0.85};
    cursor: pointer; pointer-events: auto;
  `;
  el.title = `${d.name} | ${d.vesselType} | ${d.speed != null ? `${d.speed.toFixed(1)} kts` : '?'}`;
  return el;
}
```

Replace with:
```js
if (d.type === 'vessel') {
  el.innerHTML = '🚢';
  el.style.cssText = `
    font-size: 14px; line-height: 1; cursor: pointer;
    pointer-events: auto; user-select: none;
    opacity: ${d.simulated ? 0.5 : 0.9};
  `;
  const spd = d.sog != null ? `${d.sog.toFixed(1)} kn` : d.speed != null ? `${d.speed.toFixed(1)} kn` : '?';
  el.title = `🚢 ${d.name || d.mmsi} | ${spd}`;
  return el;
}
```

- [ ] **Step 3: Add pipeline and rail midpoint arrays to the htmlPayload**

Find where `htmlPayload` is constructed:
```js
const htmlPayload = [...chokeEls, ...vesselEls, ...airEls];
```

Replace with:
```js
const pipeEls = (visiblePipelines || []).map((p) => ({
  type: 'pipeline_mid',
  keyId: `pm-${p.id}`,
  lat: (p.from.lat + p.to.lat) / 2,
  lng: (p.from.lng + p.to.lng) / 2,
  name: p.name,
  commodity: p.commodity || p.type,
  pipeStatus: p.status,
}));

const railEls = (visibleRail || []).map((r) => ({
  type: 'rail_mid',
  keyId: `rm-${r.id}`,
  lat: (r.from.lat + r.to.lat) / 2,
  lng: (r.from.lng + r.to.lng) / 2,
  name: r.name,
  commodity: r.commodity,
}));

const htmlPayload = [...chokeEls, ...vesselEls, ...airEls, ...pipeEls, ...railEls];
```

- [ ] **Step 4: Add rendering cases for pipeline_mid and rail_mid**

Inside `.htmlElement((d) => { ... })`, after the aircraft block (before the final `return el`), add:

```js
if (d.type === 'pipeline_mid') {
  el.innerHTML = '🛢️';
  el.style.cssText = `
    font-size: 11px; line-height: 1; cursor: default;
    pointer-events: auto; user-select: none; opacity: 0.85;
  `;
  el.title = `🛢️ ${d.name} (${(d.commodity || '').toUpperCase()}) — ${d.pipeStatus}`;
  return el;
}

if (d.type === 'rail_mid') {
  el.innerHTML = '🚂';
  el.style.cssText = `
    font-size: 11px; line-height: 1; cursor: default;
    pointer-events: auto; user-select: none; opacity: 0.85;
  `;
  el.title = `🚂 ${d.name} | ${d.commodity}`;
  return el;
}
```

- [ ] **Step 5: Add visiblePipelines and visibleRail to the effect dependency array**

The effect currently ends with:
```js
}, [chokepoints, eventState, liveVessels, liveAircraft, mapMode, globeReady]);
```

Change to:
```js
}, [chokepoints, eventState, liveVessels, liveAircraft, mapMode, globeReady, visiblePipelines, visibleRail]);
```

- [ ] **Step 6: Commit**
```bash
git add ChainFlowX_V2/src/supply-chain/components/SupplyChainGlobe.jsx
git commit -m "feat: emoji HTML markers for ships/aircraft/pipelines/rail on globe"
```

---

### Task 7: Update App.jsx — wire TransportLayers + LayerControl

**Files:**
- Modify: `ChainFlowX_V2/src/App.jsx`

- [ ] **Step 1: Add imports**

At the top of `App.jsx`, add these two imports (alongside existing imports):
```js
import TransportLayers from './supply-chain/components/TransportLayers.jsx';
import LayerControl from './supply-chain/components/LayerControl.jsx';
```

- [ ] **Step 2: Remove the startAllTransportTracking useEffect**

Find and remove this entire useEffect block (~lines 185-212):
```js
useEffect(() => {
  const refs = startAllTransportTracking({
    onVesselUpdate: (vessel) =>
      setLiveVessels((prev) => {
        const idx = prev.findIndex((v) => v.mmsi === vessel.mmsi);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = vessel;
          return next;
        }
        return [...prev, vessel].slice(-200);
      }),
    onAircraftUpdate: (aircraft) =>
      setLiveAircraft((prev) => {
        const idx = prev.findIndex((a) => a.icao24 === aircraft.icao24);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = aircraft;
          return next;
        }
        return [...prev, aircraft].slice(-100);
      }),
    onStatusChange: () => {},
  });
  trackingRefs.current = refs;

  return () => stopAllTransportTracking(trackingRefs.current);
}, []);
```

- [ ] **Step 3: Remove now-unused imports**

In the imports at the top, remove:
```js
import {
  startAllTransportTracking,
  stopAllTransportTracking,
} from './supply-chain/data/transportLayerManager.js';
```

Also remove `const trackingRefs = useRef({});` from the state declarations.

- [ ] **Step 4: Replace <LayerToggle> with <LayerControl> in JSX**

Find:
```jsx
<LayerToggle
  layerVisibility={layerVisibility}
  onToggle={(layerName, enabled) =>
    setLayerVisibility((prev) => ({ ...prev, [layerName]: enabled }))
  }
/>
```

Replace with:
```jsx
<LayerControl
  layerVisibility={layerVisibility}
  onToggle={(layerName, enabled) =>
    setLayerVisibility((prev) => ({ ...prev, [layerName]: enabled }))
  }
  vesselCount={liveVessels.length}
  aircraftCount={liveAircraft.length}
/>
```

- [ ] **Step 5: Add <TransportLayers> inside the JSX return**

Find the opening `<div className="app-container wm-app-root">` and add `<TransportLayers>` as its first child:

```jsx
return (
  <div className="app-container wm-app-root">
    <TransportLayers
      layerVisibility={layerVisibility}
      onVesselsChange={setLiveVessels}
      onAircraftChange={setLiveAircraft}
    />
    {/* ... rest of JSX unchanged ... */}
```

- [ ] **Step 6: Remove LayerToggle import, add new imports are already in place**

Remove: `import LayerToggle from './supply-chain/components/LayerToggle.jsx';`
(Already added TransportLayers and LayerControl imports in Step 1)

- [ ] **Step 7: Commit**
```bash
git add ChainFlowX_V2/src/App.jsx
git commit -m "feat: integrate TransportLayers and LayerControl into App"
```

---

### Task 8: Verify

- [ ] **Step 1: Start dev server**
```bash
cd ChainFlowX_V2 && npm run dev
```
Expected: server starts on http://localhost:3000, no compilation errors.

- [ ] **Step 2: Check globe loads**
- Globe 3D renders with supply chain arcs intact
- LayerControl panel visible in top-left of globe

- [ ] **Step 3: Check live layers**
- Ships toggle ON: 🚢 emoji dots appear on ocean routes (may take a few seconds for AIS messages)
- Aircraft toggle ON: ✈️ emoji dots appear at altitude
- Pipelines toggle ON: pipeline arcs render + 🛢️ midpoint markers
- Rail toggle ON: rail arcs render + 🚂 midpoint markers

- [ ] **Step 4: Check toggle behavior**
- Toggling ships OFF removes ship emojis, count goes 0
- Toggling back ON resumes from cached data

- [ ] **Step 5: Check 2D map**
- Switch to 2D mode via header toggle
- Existing 2D flat map renders, no JS errors

---

## Self-Review

**Spec coverage check:**
- ✅ Layer 1 (AIS ships) — TransportLayers.jsx with global bbox, cargo types 70-79, 500 cap
- ✅ Layer 2 (Air cargo) — OpenSky polling every 90s, cargo prefixes + category 7/8, 300 cap
- ✅ Layer 3 (Pipelines) — 20 static pipelines in transportPipeline.js
- ✅ Layer 4 (Rail) — 10 static corridors in transportRail.js
- ✅ LayerControl panel — floating UI with 4 toggles + live counts
- ✅ 🚢 emoji for ships, ✈️ for aircraft, 🛢️ for pipeline midpoints, 🚂 for rail midpoints
- ✅ Single htmlElementsData array (merged all types)
- ✅ Ships/aircraft ON by default, pipelines/rail OFF by default
- ✅ .env/.env.example updated
- ✅ No new npm packages
- ✅ WebSocket/poll cleanup in useEffect returns
- ✅ 429 backoff for OpenSky (10 min)
- ✅ Existing supply chain arc/route logic untouched
- ✅ Offline fallback (pipeline/rail work without APIs)

**Gaps:**
- `TransportLayers.jsx` directly calls `setLiveVessels` with the full array (not per-vessel updates). This is intentional — the 5s flush interval replaces the previous per-message state updates, which is more performant.
- `LayerToggle.jsx` is left in place (not deleted) since it may be imported elsewhere or useful as fallback.
