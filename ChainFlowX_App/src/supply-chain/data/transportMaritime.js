/**
 * Maritime vessel tracking — AISStream WebSocket (browser may be unsupported; falls back to simulation).
 */

import { ROUTES as APP_ROUTES } from './routes.js';

export const MARITIME_BOUNDING_BOXES = [
  [[0.5, 100.0], [5.5, 106.0]],
  [[29.5, 31.5], [31.5, 33.5]],
  [[12.0, 42.0], [16.0, 45.0]],
  [[25.0, 55.5], [27.5, 57.5]],
  [[8.5, -80.5], [10.0, -78.5]],
  [[22.0, 119.5], [25.5, 121.5]],
  [[-36.0, 17.0], [-33.0, 21.0]],
  [[35.5, -6.5], [36.5, -5.0]],
  [[30.0, 121.0], [32.0, 123.0]],
  [[51.5, 3.5], [52.5, 5.5]],
  [[1.0, 103.5], [2.0, 105.0]],
];

export const classifyVesselType = (shipType) => {
  const t = shipType == null ? -1 : Number(shipType);
  if (t >= 70 && t <= 79) return 'cargo';
  if (t >= 80 && t <= 89) return 'tanker';
  if (t >= 40 && t <= 49) return 'highspeed';
  if (t === 30) return 'fishing';
  if (t >= 60 && t <= 69) return 'passenger';
  return 'other';
};

export const VESSEL_COLORS = {
  cargo: '#00ffcc',
  tanker: '#ffaa00',
  highspeed: '#ffffff',
  passenger: '#aaaaff',
  fishing: '#88ff88',
  other: '#4488ff',
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function wrapLng(a, b, t) {
  const d = b - a;
  if (Math.abs(d) > 180) {
    const bb = b + (b < a ? 360 : -360);
    let x = lerp(a, bb, t);
    while (x > 180) x -= 360;
    while (x < -180) x += 360;
    return x;
  }
  return lerp(a, b, t);
}

function parsePositionReport(json) {
  const pr =
    json?.Message?.PositionReport ||
    json?.Message?.StandardClassBPositionReport ||
    json?.Message?.ExtendedClassBPositionReport;
  if (!pr) return null;

  const meta = json.Metadata || {};
  let lat = meta.Latitude ?? pr.Latitude ?? pr.lat;
  let lng = meta.Longitude ?? pr.Longitude ?? pr.lon ?? pr.lng;
  if (lat == null || lng == null) return null;

  const mmsi = pr.UserID ?? pr.Mmsi ?? meta.MMSI ?? meta.ShipMMSI;
  if (mmsi == null) return null;

  const cog = pr.Cog != null ? Number(pr.Cog) : pr.CourseOverGround != null ? Number(pr.CourseOverGround) : null;
  const sogRaw = pr.Sog != null ? Number(pr.Sog) : pr.SpeedOverGround != null ? Number(pr.SpeedOverGround) : null;
  const sogKts = sogRaw != null ? sogRaw / 10 : null;
  const hdg = pr.TrueHeading != null && pr.TrueHeading !== 511 ? Number(pr.TrueHeading) : cog ?? 0;
  const shipType =
    pr.ShipType != null
      ? Number(pr.ShipType)
      : meta.ShipType != null
        ? Number(meta.ShipType)
        : pr.TypeOfCargo != null
          ? Number(pr.TypeOfCargo)
          : null;
  const st = classifyVesselType(shipType);
  const name = (meta.ShipName || pr.Name || `MMSI ${mmsi}`).trim();

  return {
    type: 'vessel',
    mmsi: String(mmsi),
    name,
    lat: Number(lat),
    lng: Number(lng),
    heading: Number.isFinite(hdg) ? hdg : 0,
    speed: sogKts != null && Number.isFinite(sogKts) ? sogKts : null,
    vesselType: st,
    simulated: false,
  };
}

function startSimulatedVesselLoop(onVesselUpdate, onStatusChange) {
  let t0 = 0;
  getSimulatedVesselsInner(undefined, t0).forEach((v) => onVesselUpdate?.(v));
  const timerId = window.setInterval(() => {
    t0 += 1;
    const vessels = getSimulatedVesselsInner(undefined, t0);
    vessels.forEach((v) => onVesselUpdate?.(v));
  }, 4000);
  onStatusChange?.('vessels', 'simulated');
  return timerId;
}

export const getSimulatedVessels = (routes, phase = 0) => getSimulatedVesselsInner(routes, phase);

function getSimulatedVesselsInner(routes, phase = 0) {
  const src = routes?.length ? routes : APP_ROUTES;
  const list = src.filter((r) => r?.from && r?.to);
  if (!list.length) {
    return [
      {
        type: 'vessel',
        mmsi: 'sim-0',
        name: 'SIM · Pacific',
        lat: 30,
        lng: -150,
        heading: 45,
        speed: 14,
        vesselType: 'cargo',
        simulated: true,
      },
    ];
  }
  const out = [];
  let i = 0;
  for (const r of list) {
    const n = 2 + (i % 2);
    for (let k = 0; k < n; k++) {
      const u = (((phase * 0.07 + i * 0.19 + k * 0.31) % 1) + 1) % 1;
      const lat = lerp(r.from.lat, r.to.lat, u);
      const lng = wrapLng(r.from.lng, r.to.lng, u);
      const heading = ((i * 47 + k * 23 + phase * 9) % 360) + 0;
      out.push({
        type: 'vessel',
        mmsi: `sim-${r.id}-${k}`,
        name: `${r.name} · sim`,
        lat,
        lng,
        heading,
        speed: 10 + (i % 8),
        vesselType: ['cargo', 'tanker', 'cargo'][k % 3],
        simulated: true,
      });
    }
    i += 1;
  }
  return out;
}

export const startVesselTracking = (onVesselUpdate, onStatusChange) => {
  const ref = {
    kind: 'ws',
    ws: null,
    timerId: null,
    subTimer: null,
    cancel: () => {},
  };

  const key = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_AISSTREAM_KEY : '';
  if (!key) {
    ref.kind = 'sim';
    ref.timerId = startSimulatedVesselLoop(onVesselUpdate, onStatusChange);
    onStatusChange?.('vessels', 'no_key');
    return ref;
  }

  const goSim = () => {
    if (ref.timerId != null) return;
    try {
      ref.ws?.close();
    } catch (_) {
      /* ignore */
    }
    ref.ws = null;
    ref.kind = 'sim';
    ref.timerId = startSimulatedVesselLoop(onVesselUpdate, onStatusChange);
    onStatusChange?.('vessels', 'fallback_sim');
  };

  let ws;
  try {
    ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    ref.ws = ws;
  } catch (_) {
    ref.kind = 'sim';
    ref.timerId = startSimulatedVesselLoop(onVesselUpdate, onStatusChange);
    return ref;
  }

  ref.subTimer = window.setTimeout(() => {
    onStatusChange?.('vessels', 'subscribe_timeout');
    goSim();
  }, 8000);

  ws.onopen = () => {
    try {
      ws.send(
        JSON.stringify({
          APIKey: key,
          BoundingBoxes: MARITIME_BOUNDING_BOXES,
          FilterMessageTypes: ['PositionReport'],
        }),
      );
      window.clearTimeout(ref.subTimer);
      ref.subTimer = null;
      onStatusChange?.('vessels', 'connected');
    } catch (_) {
      window.clearTimeout(ref.subTimer);
      ref.subTimer = null;
      goSim();
    }
  };

  ws.onmessage = (ev) => {
    try {
      const json = JSON.parse(ev.data);
      const vessel = parsePositionReport(json);
      if (vessel) onVesselUpdate?.(vessel);
    } catch (_) {
      /* ignore */
    }
  };

  ws.onerror = () => {
    window.clearTimeout(ref.subTimer);
    ref.subTimer = null;
    onStatusChange?.('vessels', 'ws_error');
    goSim();
  };

  ws.onclose = () => {
    window.clearTimeout(ref.subTimer);
    ref.subTimer = null;
    onStatusChange?.('vessels', 'ws_closed');
  };

  return ref;
};

export const stopVesselTracking = (wsRef) => {
  if (!wsRef) return;
  if (wsRef.subTimer) window.clearTimeout(wsRef.subTimer);
  if (wsRef.timerId != null) window.clearInterval(wsRef.timerId);
  if (wsRef.ws) {
    try {
      wsRef.ws.close();
    } catch (_) {
      /* ignore */
    }
  }
};
